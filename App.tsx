
import React, { useState, useEffect } from 'react';
import { Page, AuthState } from './types';
import LandingPage from './pages/LandingPage';
import StudentPortal from './pages/StudentPortal';
import Dashboard from './pages/Dashboard';
import StudentRegistry from './pages/StudentRegistry';
import AttendanceGate from './pages/AttendanceGate';
import PaymentDesk from './pages/PaymentDesk';
import AIMessenger from './pages/AIMessenger';
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
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const logout = () => {
    setAuth({ isStaff: false, staffId: null, otp: null, otpExpiry: null });
    navigate(Page.LANDING);
  };

  // Sidebar visibility logic
  const showSidebar = [
    Page.DASHBOARD, 
    Page.STUDENTS, 
    Page.ATTENDANCE, 
    Page.PAYMENTS, 
    Page.MESSENGER
  ].includes(currentPage);

  const renderPage = () => {
    switch (currentPage) {
      case Page.LANDING:
        return <LandingPage onNavigate={navigate} onLogin={() => setAuth({ ...auth, isStaff: true })} />;
      case Page.PORTAL:
        return <StudentPortal onBack={() => navigate(Page.LANDING)} />;
      case Page.DASHBOARD:
        return <Dashboard />;
      case Page.STUDENTS:
        return <StudentRegistry />;
      case Page.ATTENDANCE:
        return <AttendanceGate />;
      case Page.PAYMENTS:
        return <PaymentDesk />;
      case Page.MESSENGER:
        return <AIMessenger />;
      default:
        return <LandingPage onNavigate={navigate} onLogin={() => setAuth({ ...auth, isStaff: true })} />;
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
      
      <main className={`flex-1 flex flex-col transition-all duration-300 ${showSidebar ? 'md:ml-0' : ''}`}>
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
