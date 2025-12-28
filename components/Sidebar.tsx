
import React from 'react';
import { Page } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  ScanQrCode, 
  CreditCard, 
  MessageSquare, 
  LogOut,
  ShieldCheck,
  UserPlus,
  BookOpenCheck,
  GraduationCap,
  LibraryBig,
  History,
  Layers,
  Globe,
  Calendar
} from 'lucide-react';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  tier?: string;
  institutionName?: string;
  role?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, onLogout, tier, institutionName, role }) => {
  // Menu items for regular institutions
  const instituteItems = [
    { page: Page.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
    { page: Page.PAYMENTS, icon: CreditCard, label: 'Payments' },
    { page: Page.REGISTRATION, icon: UserPlus, label: 'Register' },
    { page: Page.STUDENTS, icon: Users, label: 'Students' },
    { page: Page.ATTENDANCE, icon: ScanQrCode, label: 'Attendance' },
    { page: Page.CLASS_ATTENDANCE, icon: BookOpenCheck, label: 'Monthly Logs' },
    { page: Page.GROUPS, icon: Layers, label: 'Batches' },
    { page: Page.SCHEDULE, icon: Calendar, label: 'Schedule' },
    { page: Page.MESSENGER, icon: MessageSquare, label: 'AI Message' },
    { page: Page.EXAMS, icon: GraduationCap, label: 'Assessment' },
    { page: Page.MATERIALS, icon: LibraryBig, label: 'Assets' },
    { page: Page.COMM_HUB, icon: History, label: 'Audit Log' },
  ];

  // Menu items for Super Admin
  const superAdminItems = [
    { page: Page.SUPER_ADMIN, icon: Globe, label: 'Network HQ' },
  ];

  const menuItems = role === 'SUPER_ADMIN' ? superAdminItems : instituteItems;

  return (
    <aside className="w-full md:w-72 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 flex flex-col h-auto md:h-screen sticky top-0 z-40">
      <div className="p-6 md:p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <ShieldCheck className="text-white" size={24} />
        </div>
        <div>
          <h1 className="font-black text-xl tracking-tighter uppercase leading-none text-white">SmartClass<span className="text-blue-500">.lk</span></h1>
          <p className="text-[9px] tracking-[0.2em] font-bold text-slate-500 uppercase mt-1">
            {role === 'SUPER_ADMIN' ? 'Network' : (institutionName || 'Academy Console')}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className={`w-full flex items-center gap-4 px-6 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm ${
              activePage === item.page 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 translate-x-1' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <item.icon size={18} strokeWidth={activePage === item.page ? 3 : 2} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-6 py-4 text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all font-bold"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
