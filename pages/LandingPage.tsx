
import React, { useState } from 'react';
import { Page, Grade, Institution } from '../types';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { ShieldCheck, ArrowRight, Loader2, Lock, Building, GraduationCap, Sparkles } from 'lucide-react';

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
    if (!instId) return;
    setSearchingInst(true);
    try {
      const inst = await storageService.getInstitution(instId);
      if (inst) {
        setFoundInst(inst);
        audioService.playSuccess();
      } else {
        audioService.playError();
        alert("Institutional record not found. Please check your Campus ID.");
      }
    } catch (e) {
      alert("Network search error. Try again.");
    } finally {
      setSearchingInst(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    // Super Admin Credentials
    const isSuperAdmin = 
      (loginForm.email === 'savinpremium.lk@gmail.com' && loginForm.password === 'Savin123') ||
      (loginForm.email === 'Iresha1978' && loginForm.password === 'Iresha1978');

    if (isSuperAdmin) {
      onLogin('SUPER');
      return;
    }

    try {
      const inst = await storageService.validateInstituteLogin(loginForm.email, loginForm.password);
      if (inst) {
        onLogin('INST', inst);
      } else {
        audioService.playError();
        setLoginError("Invalid staff credentials. Note: Database entries are case-sensitive.");
      }
    } catch (err: any) {
      audioService.playError();
      setLoginError(err.message || "Authentication service unavailable.");
    }
  };

  return (
    <div className="relative min-h-[90vh] flex flex-col justify-center items-center px-6">
      <nav className="fixed top-0 left-0 right-0 p-8 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <span className="font-black text-2xl tracking-tighter uppercase text-white">SmartClass<span className="text-blue-500">.lk</span></span>
        </div>
        <button onClick={() => setShowStaffLogin(true)} className="px-6 py-3 bg-slate-900 rounded-full font-black text-[10px] tracking-widest uppercase text-slate-500 hover:text-white border border-slate-800 transition-all">
          Management Login
        </button>
      </nav>

      {!foundInst ? (
        <div className="max-w-xl w-full text-center space-y-12 animate-in fade-in zoom-in duration-700">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full mb-4">
              <Sparkles size={12} className="text-blue-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">Next-Gen Education OS</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic uppercase text-white leading-[0.85]">Find Your <br/><span className="text-blue-500">Campus</span></h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.6em] text-[10px] mt-8">Enter your Institution ID to begin</p>
          </div>

          <div className="relative group max-w-sm mx-auto">
            <input 
              placeholder="e.g. CAMPUS-ID"
              className="w-full bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] px-10 py-8 text-3xl font-black tracking-tight focus:border-blue-600 focus:outline-none text-white shadow-3xl text-center placeholder:text-slate-800"
              value={instId}
              onChange={(e) => setInstId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchInst()}
            />
            <button 
              onClick={handleSearchInst}
              disabled={searchingInst || !instId}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-[2.5rem] flex items-center justify-center gap-4 transition-all shadow-2xl shadow-blue-600/20 uppercase text-lg border-b-8 border-blue-800 active:translate-y-1 active:border-b-0"
            >
              {searchingInst ? <Loader2 className="animate-spin" /> : "ACCESS PORTAL"}
              {!searchingInst && <ArrowRight />}
            </button>
          </div>
          
          <p className="text-slate-700 font-black uppercase text-[8px] tracking-widest">Powered by SmartClass.lk Systems</p>
        </div>
      ) : (
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-in slide-in-from-bottom-12 duration-700">
          <div className="space-y-8 text-center lg:text-left">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl mb-10 mx-auto lg:mx-0">
              <Building className="text-white" size={40} />
            </div>
            <h2 className="text-6xl font-black italic uppercase leading-tight tracking-tighter text-white">Welcome to <br/><span className="text-blue-500">{foundInst.name}</span></h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{foundInst.location}</p>
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-6 opacity-30">
               {foundInst.subjects.map(s => <span key={s} className="bg-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-800">{s}</span>)}
            </div>
            <button onClick={() => setFoundInst(null)} className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-700 hover:text-white transition-all pt-10">← Change Institution</button>
          </div>

          <div className="bg-slate-900/50 p-12 rounded-[4.5rem] border border-slate-800 shadow-3xl space-y-8 text-center">
            <div className="space-y-4">
              <button 
                onClick={() => onLogin('STUDENT', foundInst)}
                className="w-full bg-slate-950 hover:bg-slate-800 text-white py-8 rounded-[3rem] font-black uppercase tracking-widest text-lg flex items-center justify-center gap-5 border border-slate-800 transition-all shadow-inner"
              >
                <GraduationCap size={28} />
                Student Portal
              </button>
              <div className="relative py-4">
                 <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                 <span className="relative bg-slate-900 px-4 text-[9px] font-black uppercase text-slate-700 tracking-widest">Registry Access</span>
              </div>
              <button 
                onClick={() => {
                  alert("Please contact your Institute Administrator to finalize enrollment or use the staff terminal.");
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-8 rounded-[3rem] font-black uppercase tracking-widest text-lg transition-all shadow-xl shadow-blue-600/20 border-b-8 border-blue-800 active:translate-y-1 active:border-b-0"
              >
                Enroll New Student
              </button>
            </div>
            <p className="text-[8px] font-black uppercase text-slate-700 tracking-[0.4em]">Official Institutional Gateway</p>
          </div>
        </div>
      )}

      {showStaffLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/90">
          <div className="bg-slate-900 w-full max-w-sm p-12 rounded-[4.5rem] border border-slate-800 shadow-3xl space-y-8 animate-in zoom-in duration-300">
            <div className="text-center">
              <Lock className="text-blue-500 mx-auto mb-6" size={48} />
              <h4 className="text-3xl font-black tracking-tighter uppercase italic text-white">Staff Authority</h4>
              <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mt-1">Institutional Credentials Required</p>
            </div>
            <form onSubmit={handleStaffLogin} className="space-y-4">
              <input 
                type="text" 
                required 
                placeholder="USERNAME / EMAIL" 
                className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 font-black text-xs uppercase text-white shadow-inner focus:border-blue-600 transition-all outline-none"
                value={loginForm.email}
                onChange={e => setLoginForm({...loginForm, email: e.target.value})}
              />
              <input 
                type="password" 
                required 
                placeholder="ACCESS PASSWORD" 
                className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 font-black text-xs uppercase text-white shadow-inner focus:border-blue-600 transition-all outline-none"
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
              />
              
              {loginError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                  <p className="text-[9px] font-black uppercase text-rose-500 text-center leading-relaxed">{loginError}</p>
                </div>
              )}

              <button className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black uppercase tracking-tighter text-lg shadow-xl shadow-blue-600/10 border-b-4 border-blue-800 mt-6 active:translate-y-1 active:border-b-0">AUTHORIZE SESSION</button>
              <button type="button" onClick={() => { setShowStaffLogin(false); setLoginError(null); }} className="w-full text-slate-600 font-black uppercase text-[9px] tracking-[0.4em] mt-6">Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
