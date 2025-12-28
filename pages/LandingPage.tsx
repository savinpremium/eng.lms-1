
import React, { useState } from 'react';
import { Institution } from '../types';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { ShieldCheck, ArrowRight, Loader2, Lock, Building, GraduationCap, Sparkles, UserCheck, Globe, MapPin } from 'lucide-react';

interface LandingPageProps {
  onLogin: (type: 'SUPER' | 'INST' | 'STUDENT', data?: any) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [instId, setInstId] = useState('');
  const [searchingInst, setSearchingInst] = useState(false);
  const [foundInst, setFoundInst] = useState<Institution | null>(null);
  
  const [showStaffLogin, setShowStaffLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleSearchInst = async () => {
    const cleanId = instId.trim();
    if (!cleanId) return;
    setSearchingInst(true);
    try {
      const inst = await storageService.getInstitution(cleanId);
      if (inst) {
        setFoundInst(inst);
        audioService.playSuccess();
      } else {
        audioService.playError();
        setLoginError("Class ID not found. Please verify.");
      }
    } catch (e) {
      setLoginError("Connection issue. Please retry.");
    } finally {
      setSearchingInst(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    const email = loginForm.email.trim();
    const password = loginForm.password.trim();

    const isSuperAdmin = 
      (email === 'savinpremium.lk@gmail.com' && password === 'Savin123') ||
      (email === 'Iresha1978' && password === 'Iresha1978');

    if (isSuperAdmin) {
      onLogin('SUPER');
      return;
    }

    try {
      const inst = await storageService.validateInstituteLogin(email, password);
      if (inst) {
        onLogin('INST', inst);
      } else {
        audioService.playError();
        setLoginError("Invalid credentials.");
      }
    } catch (err: any) {
      audioService.playError();
      setLoginError(err.message || "Auth error.");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-950 selection:bg-blue-500/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
      </div>

      <nav className="relative w-full max-w-7xl mx-auto p-8 flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl">
            <ShieldCheck className="text-white" size={28} />
          </div>
          <span className="font-black text-2xl tracking-tighter uppercase text-white">SmartClass<span className="text-blue-600">.lk</span></span>
        </div>
        <button 
          onClick={() => setShowStaffLogin(true)} 
          className="group flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-2xl font-black text-[10px] tracking-widest uppercase text-slate-300 hover:text-white border border-white/10 transition-all active:scale-95"
        >
          <UserCheck size={14} />
          Management
        </button>
      </nav>

      <main className="flex-1 flex flex-col justify-center items-center px-6 py-20 relative z-10">
        {!foundInst ? (
          <div className="max-w-2xl w-full text-center space-y-16 animate-in fade-in zoom-in-95 duration-700">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full">
                <Sparkles size={12} className="text-blue-400" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Class Network</span>
              </div>
              <h1 className="text-7xl md:text-9xl font-black tracking-tighter uppercase italic text-white leading-[0.85]">
                Find Your <br/>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">Class</span>
              </h1>
              <p className="text-slate-500 font-bold uppercase tracking-[0.5em] text-[10px] max-w-md mx-auto leading-relaxed">
                Connect to your specialized educational hub using your unique Class identifier
              </p>
            </div>

            <div className="relative group max-w-sm mx-auto w-full">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[3rem] blur opacity-20 transition duration-1000 group-hover:opacity-40"></div>
              <div className="relative bg-slate-900 rounded-[2.5rem] p-2 flex flex-col gap-2">
                <input 
                  placeholder="CLASS ID"
                  className="w-full bg-transparent border-none rounded-[2rem] px-8 py-6 text-2xl font-black tracking-tight focus:outline-none text-white text-center placeholder:text-slate-800 uppercase"
                  value={instId}
                  onChange={(e) => setInstId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchInst()}
                />
                <button 
                  onClick={handleSearchInst}
                  disabled={searchingInst || !instId.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-6 rounded-[2rem] flex items-center justify-center gap-4 transition-all shadow-xl uppercase text-lg border-b-8 border-blue-800 active:translate-y-1 active:border-b-0"
                >
                  {searchingInst ? <Loader2 className="animate-spin" /> : "ACCESS"}
                  {!searchingInst && <ArrowRight />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center animate-in slide-in-from-bottom-12 duration-1000">
            <div className="space-y-10 text-center lg:text-left">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] flex items-center justify-center shadow-3xl mx-auto lg:mx-0">
                <Building className="text-white" size={48} />
              </div>
              <div className="space-y-4">
                <h2 className="text-6xl md:text-7xl font-black italic uppercase leading-[0.9] tracking-tighter text-white">
                  Welcome to <br/>
                  <span className="text-blue-500">{foundInst.name}</span>
                </h2>
                <div className="flex items-center justify-center lg:justify-start gap-3 text-slate-500 font-bold uppercase tracking-widest text-xs">
                  <MapPin size={14} className="text-blue-600" />
                  {foundInst.location}
                </div>
              </div>
              <button 
                onClick={() => setFoundInst(null)} 
                className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 hover:text-white transition-all pt-6"
              >
                <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                Switch Class
              </button>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-600/20 to-transparent blur-2xl rounded-full"></div>
              <div className="relative bg-slate-900/40 backdrop-blur-2xl p-12 rounded-[4rem] border border-white/5 shadow-3xl space-y-8 text-center">
                <div className="space-y-4">
                  <button 
                    onClick={() => onLogin('STUDENT', foundInst)}
                    className="group w-full bg-slate-950 hover:bg-slate-900 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-widest text-lg flex items-center justify-center gap-5 border border-white/5 transition-all shadow-inner overflow-hidden relative"
                  >
                    <GraduationCap size={28} />
                    Student Portal
                  </button>
                  <div className="relative py-4 flex items-center gap-4">
                     <div className="flex-1 h-px bg-slate-800"></div>
                     <span className="text-[9px] font-black uppercase text-slate-700 tracking-[0.4em]">Official Node</span>
                     <div className="flex-1 h-px bg-slate-800"></div>
                  </div>
                  <button 
                    onClick={() => {
                      alert("Registration is handled by the Academic Office.");
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-widest text-lg transition-all shadow-2xl border-b-8 border-blue-800 active:translate-y-1 active:border-b-0"
                  >
                    Register
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="relative w-full p-10 text-center z-10">
        <p className="text-slate-800 font-black uppercase text-[10px] tracking-[0.8em]">Powered by EngLMS Systems</p>
      </footer>

      {showStaffLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="bg-slate-900 w-full max-w-sm p-12 rounded-[4rem] border border-white/5 shadow-3xl space-y-10 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] flex items-center justify-center mx-auto border border-blue-500/20">
                <Lock className="text-blue-500" size={32} />
              </div>
              <h4 className="text-3xl font-black tracking-tighter uppercase italic text-white leading-none">Management</h4>
            </div>
            
            <form onSubmit={handleStaffLogin} className="space-y-4">
              <input 
                type="text" 
                required 
                placeholder="USERNAME / EMAIL" 
                className="w-full bg-slate-950 border border-white/5 rounded-3xl px-8 py-5 font-black text-xs uppercase text-white shadow-inner focus:border-blue-600 transition-all outline-none"
                value={loginForm.email}
                onChange={e => setLoginForm({...loginForm, email: e.target.value})}
              />
              <input 
                type="password" 
                required 
                placeholder="PASSKEY" 
                className="w-full bg-slate-950 border border-white/5 rounded-3xl px-8 py-5 font-black text-xs uppercase text-white shadow-inner focus:border-blue-600 transition-all outline-none"
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
              />
              {loginError && <p className="text-rose-500 text-[10px] font-black uppercase text-center mt-2">{loginError}</p>}
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl border-b-4 border-blue-800 active:translate-y-1 active:border-b-0 transition-all mt-4">
                AUTHORIZE
              </button>
              <button type="button" onClick={() => setShowStaffLogin(false)} className="w-full text-slate-600 font-black uppercase text-[9px] tracking-[0.4em] mt-4">Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
