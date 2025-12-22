
import React, { useState } from 'react';
import { Page, AuthState } from './types';
import LandingPage from './pages/LandingPage';
import StudentPortal from './pages/StudentPortal';
import Dashboard from './pages/Dashboard';
import StudentRegistry from './pages/StudentRegistry';
import AttendanceGate from './pages/AttendanceGate';
import PaymentDesk from './pages/PaymentDesk';
import AIMessenger from './pages/AIMessenger';
import Enrollment from './pages/Enrollment';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LANDING);
  const [auth, setAuth] = useState<AuthState>({
    isStaff: false,
    staffId: null,
    otp: null,
    otpExpiry: null
  });

  const navigate = (page: Page) => {
    const staffPages = [
      Page.DASHBOARD, 
      Page.STUDENTS, 
      Page.ATTENDANCE, 
      Page.PAYMENTS, 
      Page.MESSENGER,
      Page.ENROLLMENT
    ];
    if (staffPages.includes(page) && !auth.isStaff) {
      setCurrentPage(Page.LANDING);
      return;
    }
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleLoginSuccess = () => {
    setAuth({ ...auth, isStaff: true, staffId: 'Iresha1978' });
    setCurrentPage(Page.DASHBOARD);
  };

  const logout = () => {
    setAuth({ isStaff: false, staffId: null, otp: null, otpExpiry: null });
    navigate(Page.LANDING);
  };

  const showSidebar = [
    Page.DASHBOARD, 
    Page.STUDENTS, 
    Page.ATTENDANCE, 
    Page.PAYMENTS, 
    Page.MESSENGER,
    Page.ENROLLMENT
  ].includes(currentPage) && auth.isStaff;

  const renderPage = () => {
    switch (currentPage) {
      case Page.LANDING:
        return <LandingPage onNavigate={navigate} onLoginSuccess={handleLoginSuccess} />;
      case Page.PORTAL:
        return <StudentPortal onBack={() => navigate(Page.LANDING)} />;
      case Page.DASHBOARD:
        return <Dashboard />;
      case Page.STUDENTS:
        return <StudentRegistry onNavigate={navigate} />;
      case Page.ATTENDANCE:
        return <AttendanceGate />;
      case Page.PAYMENTS:
        return <PaymentDesk />;
      case Page.MESSENGER:
        return <AIMessenger />;
      case Page.ENROLLMENT:
        return <Enrollment onComplete={() => navigate(Page.STUDENTS)} />;
      default:
        return <LandingPage onNavigate={navigate} onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row overflow-x-hidden">
      {showSidebar && (
        <Sidebar 
          activePage={currentPage} 
          onNavigate={navigate} 
          onLogout={logout} 
        />
      )}
      
      <main className="flex-1 flex flex-col transition-all duration-300">
        <div className="max-w-7xl mx-auto w-full p-4 md:p-8">
          {renderPage()}
        </div>
      </main>

      {/* Global Print Container */}
      <div id="print-section" className="hidden"></div>
    </div>
  );
};

export default App;
