
import React, { useState, useEffect } from 'react';
import { Page, AuthState, Tier, Institution } from './types';
import LandingPage from './pages/LandingPage';
import SuperAdminDesk from './pages/SuperAdminDesk';
import Dashboard from './pages/Dashboard';
import StudentRegistry from './pages/StudentRegistry';
import AttendanceGate from './pages/AttendanceGate';
import PaymentDesk from './pages/PaymentDesk';
import AIMessenger from './pages/AIMessenger';
import Enrollment from './pages/Enrollment';
import StudentPortal from './pages/StudentPortal';
import ClassAttendance from './pages/ClassAttendance';
import ClassGroups from './pages/ClassGroups';
import StudentResults from './pages/StudentResults';
import LearningMaterials from './pages/LearningMaterials';
import CommLogs from './pages/CommLogs';
import ScheduleDesk from './pages/ScheduleDesk';
import Sidebar from './components/Sidebar';
import { storageService } from './services/storageService';
import { Wifi, WifiOff, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LANDING);
  const [isConnected, setIsConnected] = useState(true);
  const [auth, setAuth] = useState<AuthState>({
    role: 'NONE',
    institutionId: null
  });

  useEffect(() => {
    return storageService.onConnectionChange(setIsConnected);
  }, []);

  const handleLogin = async (type: 'SUPER' | 'INST' | 'STUDENT', data: any) => {
    if (type === 'SUPER') {
      setAuth({ role: 'SUPER_ADMIN', institutionId: null });
      setCurrentPage(Page.SUPER_ADMIN);
    } else if (type === 'INST') {
      const inst = data as Institution;
      setAuth({ 
        role: 'INSTITUTE', 
        institutionId: inst.id, 
        institutionName: inst.name,
        tier: inst.tier 
      });
      setCurrentPage(Page.DASHBOARD);
    } else if (type === 'STUDENT') {
      const inst = data as Institution;
      setAuth({ 
        role: 'STUDENT', 
        institutionId: inst.id, 
        institutionName: inst.name 
      });
      setCurrentPage(Page.PORTAL);
    }
  };

  const logout = () => {
    setAuth({ role: 'NONE', institutionId: null });
    setCurrentPage(Page.LANDING);
  };

  const showSidebar = auth.role !== 'NONE' && auth.role !== 'STUDENT' && currentPage !== Page.LANDING;

  const renderPage = () => {
    const instId = auth.institutionId!;
    const instName = auth.institutionName;

    switch (currentPage) {
      case Page.LANDING:
        return <LandingPage onLogin={handleLogin} />;
      case Page.SUPER_ADMIN:
        return <SuperAdminDesk />;
      case Page.DASHBOARD:
        return <Dashboard institutionId={instId} onNavigate={setCurrentPage} />;
      case Page.STUDENTS:
        return <StudentRegistry institutionId={instId} institutionName={instName} onNavigate={setCurrentPage} />;
      case Page.ATTENDANCE:
        return <AttendanceGate institutionId={instId} />;
      case Page.PAYMENTS:
        return <PaymentDesk institutionId={instId} institutionName={instName} />;
      case Page.MESSENGER:
        return auth.tier !== 'Lite' ? <AIMessenger institutionId={instId} /> : <div className="p-20 text-center font-black uppercase text-slate-800">Platinum Feature Only</div>;
      case Page.ENROLLMENT:
        return <Enrollment institutionId={instId} institutionName={instName} onComplete={() => setCurrentPage(Page.STUDENTS)} />;
      case Page.PORTAL:
        return <StudentPortal institutionId={instId} onBack={logout} />;
      case Page.CLASS_ATTENDANCE:
        return <ClassAttendance institutionId={instId} />;
      case Page.GROUPS:
        return <ClassGroups institutionId={instId} />;
      case Page.EXAMS:
        return <StudentResults institutionId={instId} />;
      case Page.MATERIALS:
        return <LearningMaterials institutionId={instId} />;
      case Page.COMM_HUB:
        return <CommLogs institutionId={instId} />;
      case Page.SCHEDULE:
        return <ScheduleDesk institutionId={instId} />;
      default:
        return <LandingPage onLogin={handleLogin} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row overflow-x-hidden">
      <div className="fixed top-4 right-4 z-[60] flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl border border-slate-800 px-4 py-2 rounded-full shadow-2xl">
        {isConnected ? <Wifi size={14} className="text-emerald-500" /> : <WifiOff size={14} className="text-rose-500" />}
        <span className={`text-[9px] font-black uppercase tracking-widest ${isConnected ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isConnected ? 'Online' : 'Offline'}
        </span>
      </div>

      {showSidebar && (
        <Sidebar 
          activePage={currentPage} 
          onNavigate={setCurrentPage} 
          onLogout={logout} 
          tier={auth.tier}
          institutionName={auth.institutionName}
          role={auth.role}
        />
      )}
      
      <main className="flex-1 flex flex-col p-4 md:p-8">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
