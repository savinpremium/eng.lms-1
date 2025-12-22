
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
  UserPlus
} from 'lucide-react';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, onLogout }) => {
  const menuItems = [
    { page: Page.DASHBOARD, icon: LayoutDashboard, label: 'Ethics Monitor' },
    { page: Page.STUDENTS, icon: Users, label: 'Student IDs' },
    { page: Page.ENROLLMENT, icon: UserPlus, label: 'Enrollment' },
    { page: Page.ATTENDANCE, icon: ScanQrCode, label: 'QR Gate' },
    { page: Page.PAYMENTS, icon: CreditCard, label: 'Payments' },
    { page: Page.MESSENGER, icon: MessageSquare, label: 'AI Messenger' },
  ];

  return (
    <aside className="w-full md:w-72 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 flex flex-col h-auto md:h-screen sticky top-0 z-40">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <ShieldCheck className="text-white" size={24} />
        </div>
        <div>
          <h1 className="font-black text-xl tracking-tighter uppercase leading-none text-blue-500">EngLMS</h1>
          <p className="text-[10px] tracking-[0.2em] font-bold text-slate-500 uppercase">Institutional Console</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all duration-300 font-bold ${
              activePage === item.page 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 translate-x-1' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <item.icon size={20} strokeWidth={activePage === item.page ? 3 : 2} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-6 py-4 text-rose-500 hover:bg-rose-500/10 rounded-3xl transition-all font-bold"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
