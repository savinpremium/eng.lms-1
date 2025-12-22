
import React, { useState, useEffect } from 'react';
import { Page, AuthState } from './types';
import LandingPage from './pages/LandingPage';
import StudentPortal from './pages/StudentPortal';
import Dashboard from './pages/Dashboard';
import StudentRegistry from './pages/StudentRegistry';
import AttendanceGate from './pages/AttendanceGate';
import ClassAttendance from './pages/ClassAttendance';
import PaymentDesk from './pages/PaymentDesk';
import AIMessenger from './pages/AIMessenger';
import Enrollment from './pages/Enrollment';
import StudentResults from './pages/StudentResults';
import LearningMaterials from './pages/LearningMaterials';
import CommLogs from './pages/CommLogs';
import ScheduleDesk from './pages/ScheduleDesk';
import ClassGroups from './pages/ClassGroups';
import Sidebar from './components/Sidebar';
import { storageService } from './services/storageService';
import { Wifi, WifiOff } from 'lucide-react';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LANDING);
  const [isConnected, setIsConnected] = useState(true);
  const [auth, setAuth] = useState<AuthState>({
    isStaff: false,
    staffId: null,
    otp: null,
    otpExpiry: null
  });

  useEffect(() => {
    return storageService.onConnectionChange(setIsConnected);
  }, []);

  const navigate = (page: Page) => {
    const staffPages = [
      Page.DASHBOARD, 
      Page.STUDENTS, 
      Page.ATTENDANCE, 
      Page.CLASS_ATTENDANCE,
      Page.PAYMENTS, 
      Page.MESSENGER,
      Page.ENROLLMENT,
      Page.EXAMS,
      Page.MATERIALS,
      Page.COMM_HUB,
      Page.SCHEDULE,
      Page.GROUPS
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
    Page.CLASS_ATTENDANCE,
    Page.PAYMENTS, 
    Page.MESSENGER,
    Page.ENROLLMENT,
    Page.EXAMS,
    Page.MATERIALS,
    Page.COMM_HUB,
    Page.SCHEDULE,
    Page.GROUPS
  ].includes(currentPage) && auth.isStaff;

  const renderPage = () => {
    switch (currentPage) {
      case Page.LANDING:
        return <LandingPage onNavigate={navigate} onLoginSuccess={handleLoginSuccess} />;
      case Page.PORTAL:
        return <StudentPortal onBack={() => navigate(Page.LANDING)} />;
      case Page.DASHBOARD:
        return <Dashboard onNavigate={navigate} />;
      case Page.STUDENTS:
        return <StudentRegistry onNavigate={navigate} />;
      case Page.ATTENDANCE:
        return <AttendanceGate />;
      case Page.CLASS_ATTENDANCE:
        return <ClassAttendance />;
      case Page.PAYMENTS:
        return <PaymentDesk />;
      case Page.MESSENGER:
        return <AIMessenger />;
      case Page.ENROLLMENT:
        return <Enrollment onComplete={() => navigate(Page.STUDENTS)} />;
      case Page.EXAMS:
        return <StudentResults />;
      case Page.MATERIALS:
        return <LearningMaterials />;
      case Page.COMM_HUB:
        return <CommLogs />;
      case Page.SCHEDULE:
        return <ScheduleDesk />;
      case Page.GROUPS:
        return <ClassGroups />;
      default:
        return <LandingPage onNavigate={navigate} onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row overflow-x-hidden relative">
      <div className="fixed top-4 right-4 z-[60] flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl border border-slate-800 px-4 py-2 rounded-full shadow-2xl">
        {isConnected ? (
          <>
            <Wifi size={14} className="text-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">Online</span>
          </>
        ) : (
          <>
            <WifiOff size={14} className="text-rose-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-rose-500/80">Offline</span>
          </>
        )}
      </div>

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

      <div id="print-section" className="hidden"></div>
    </div>
  );
};

export default App;
