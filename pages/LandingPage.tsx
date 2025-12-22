
import React, { useState, useEffect } from 'react';
import { Page, Grade, Student } from '../types';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { CheckCircle, ArrowRight, ShieldCheck, Lock, UserCheck, Loader2, X, MessageSquare, BookOpen } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: Page) => void;
  onLoginSuccess: (isDemo: boolean) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    grade: 'Grade 1' as Grade,
    parentName: '',
    contact: ''
  });
  const [registeredStudent, setRegisteredStudent] = useState<Student | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const manualSeen = localStorage.getItem('englms_manual_seen');
    if (!manualSeen && !registeredStudent) {
      setShowManual(true);
    }
  }, [registeredStudent]);

  const closeManual = () => {
    setShowManual(false);
    localStorage.setItem('englms_manual_seen', 'true');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const prevDate = new Date(year, month - 1);
    const lastPaid = `${prevDate.getFullYear()}-${(prevDate.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const id = `STU-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newStudent: Student = {
      ...formData,
      id,
      lastPaymentMonth: lastPaid,
      registrationDate: now.toISOString().split('T')[0]
    };
    await storageService.saveStudent(newStudent);
    setRegisteredStudent(newStudent);
    setLoading(false);
    audioService.playSuccess();
  };

  const handleShareWhatsApp = () => {
    if (!registeredStudent) return;
    const phone = registeredStudent.contact.replace(/\D/g, '');
    const waPhone = phone.startsWith('0') ? '94' + phone.substring(1) : phone;
    const text = encodeURIComponent(`Hello ${registeredStudent.parentName}, your child ${registeredStudent.name} is now registered at Excellence English. Assigned Student ID: ${registeredStudent.id}. Welcome!`);
    window.open(`https://wa.me/${waPhone}?text=${text}`, '_blank');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === 'Iresha1978' && loginForm.password === 'Iresha1978') {
      onLoginSuccess(false);
    } else if (loginForm.username === 'Log123' && loginForm.password === 'Log123') {
      onLoginSuccess(true);
    } else {
      audioService.playError();
    }
  };

  const grades: Grade[] = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11'];

  return (
    <div className="relative">
      <nav className="flex justify-between items-center py-4 md:py-6 mb-8 md:mb-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck className="text-white" size={20} />
          </div>
          <span className="font-black text-xl md:text-2xl tracking-tighter uppercase text-blue-500">EngLMS</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onNavigate(Page.PORTAL)} className="px-4 py-2 rounded-full border border-slate-700 font-bold hover:bg-slate-800 transition-all text-xs uppercase tracking-widest">
            Portal
          </button>
          <button onClick={() => setShowLogin(true)} className="px-4 py-2 rounded-full bg-slate-800 font-bold hover:bg-slate-700 transition-all text-xs uppercase tracking-widest text-white">
            Staff Login
          </button>
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        <div className="animate-in fade-in slide-in-from-left-8 duration-700 text-center lg:text-left">
          <p className="text-blue-500 font-black tracking-widest uppercase text-xs md:text-sm mb-4">Excellence English Sri Lanka</p>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter leading-none mb-6 italic uppercase">Modern <br /> <span className="text-slate-800" style={{ WebkitTextStroke: '1.5px #1e293b' }}>Learning</span></h1>
          <p className="text-base md:text-xl font-bold text-slate-400 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">ශ්‍රී ලංකාවේ ප්‍රමුඛතම ඉංග්‍රීසි අධ්‍යාපන පද්ධතිය. <br /><span className="text-sm md:text-base text-slate-500 font-medium italic">Empowered by AI and Digital Identity.</span></p>
          
          <div className="flex justify-center lg:justify-start items-center gap-6 mt-8 grayscale opacity-30">
             <div className="flex flex-col items-center"><ShieldCheck size={24}/><span className="text-[8px] font-black mt-2 tracking-widest uppercase text-slate-400">SECURE</span></div>
             <div className="flex flex-col items-center"><UserCheck size={24}/><span className="text-[8px] font-black mt-2 tracking-widest uppercase text-slate-400">VERIFIED</span></div>
          </div>
        </div>

        <div className="bg-slate-900/40 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-2xl transition-all duration-500 animate-in zoom-in-95">
          {!registeredStudent ? (
            <form onSubmit={handleRegister} className="space-y-4 md:space-y-6">
              <div className="mb-4 text-white">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase italic mb-1">Enrollment</h2>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Join our academic network</p>
              </div>
              <div className="space-y-3">
                <input required placeholder="Student Full Name" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-600 transition-all font-bold text-sm text-white" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-600 transition-all appearance-none font-bold text-sm text-white" value={formData.grade} onChange={(e) => setFormData({...formData, grade: e.target.value as Grade})}>
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <input required placeholder="WhatsApp Contact" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-600 transition-all font-bold text-sm text-white" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} />
                </div>
                <input required placeholder="Guardian Name" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-600 transition-all font-bold text-sm text-white" value={formData.parentName} onChange={(e) => setFormData({...formData, parentName: e.target.value})} />
              </div>
              <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] shadow-xl shadow-blue-600/20 uppercase tracking-tighter text-lg">
                {loading ? <Loader2 className="animate-spin" size={20}/> : 'SUBMIT ENROLLMENT'}
                {!loading && <ArrowRight size={20} />}
              </button>
            </form>
          ) : (
            <div className="text-center py-4 animate-in zoom-in duration-500">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <CheckCircle size={40} />
              </div>
              <h2 className="text-2xl font-black mb-1 tracking-tight uppercase italic text-white">Enrollment Successful</h2>
              <p className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.4em] mb-10">Assigned Student Identifier</p>
              
              <div className="bg-slate-950 p-10 rounded-[2rem] border border-blue-900/30 mb-10 shadow-2xl">
                <p className="text-[9px] tracking-[0.5em] font-black text-slate-600 mb-2 uppercase">Personnel ID</p>
                <p className="text-5xl font-black text-blue-500 tracking-tighter">{registeredStudent.id}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button 
                  onClick={handleShareWhatsApp}
                  className="w-full bg-emerald-600 text-white font-black py-3 rounded-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg uppercase text-[10px] tracking-widest"
                >
                  <MessageSquare size={14} />
                  Notify WhatsApp
                </button>
                <button 
                  onClick={() => onNavigate(Page.PORTAL)}
                  className="w-full bg-slate-800 text-white font-black py-3 rounded-xl hover:bg-slate-700 transition-all uppercase text-[10px] tracking-widest"
                >
                  Student Portal
                </button>
              </div>
              <button onClick={() => setRegisteredStudent(null)} className="mt-8 text-slate-600 font-bold text-[9px] uppercase tracking-[0.4em] hover:text-white transition-all">Next Registration</button>
            </div>
          )}
        </div>
      </div>

      {showManual && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 backdrop-blur-3xl bg-slate-950/90 animate-in fade-in duration-500 overflow-y-auto" onClick={closeManual}>
          <div className="bg-slate-900 w-full max-w-lg p-6 md:p-10 rounded-3xl border border-slate-800 shadow-3xl space-y-6 md:space-y-8 animate-in zoom-in duration-300 relative overflow-hidden my-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 right-0 p-6 md:p-10 opacity-5 pointer-events-none">
              <BookOpen size={160} />
            </div>
            <button onClick={closeManual} className="absolute top-4 right-4 md:top-8 md:right-8 text-slate-500 hover:text-white transition-all z-10"><X size={32} /></button>
            <div className="text-center pt-4">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-inner"><BookOpen size={32} /></div>
              <h4 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic text-white mb-2 leading-tight">ලියාපදිංචි වීමේ මාර්ගෝපදේශය</h4>
              <p className="text-slate-500 font-bold uppercase text-[8px] md:text-[9px] tracking-widest">පහත පියවරයන් නිවැරදිව අනුගමනය කරන්න</p>
            </div>
            <div className="space-y-4 md:space-y-6 relative z-10">
              {[
                { step: '01', text: 'ශිෂ්‍යයාගේ සම්පූර්ණ නම ඉංග්‍රීසි අකුරින් පළමු කොටුවේ සටහන් කරන්න.' },
                { step: '02', text: 'ශිෂ්‍යයා දැනට ඉගෙන ගන්නා ශ්‍රේණිය සහ ක්‍රියාකාරී වට්සැප් අංකය ඇතුළත් කරන්න.' },
                { step: '03', text: 'භාරකරුගේ නම නිවැරදිව සටහන් කරන්න.' },
                { step: '04', text: 'සියලු තොරතුරු සම්පූර්ණ කිරීමෙන් පසු "SUBMIT ENROLLMENT" බොත්තම ඔබන්න.' },
                { step: '05', text: 'ලැබෙන අනන්‍ය ශිෂ්‍ය අංකය අනාගත කටයුතු සඳහා සුරැකිව තබාගන්න.' }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 md:gap-6 items-start group">
                  <span className="text-xl md:text-2xl font-black text-blue-600 italic group-hover:scale-110 transition-transform flex-shrink-0">{item.step}</span>
                  <p className="text-xs md:text-sm font-bold text-slate-300 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
            <button onClick={closeManual} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 md:py-5 rounded-2xl font-black uppercase tracking-tighter text-base md:text-lg shadow-xl shadow-blue-600/20 transition-all mt-6">මා හට උපදෙස් අවබෝධ විය</button>
          </div>
        </div>
      )}

      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80">
          <div className="bg-slate-900 w-full max-w-sm p-8 md:p-10 rounded-3xl border border-slate-800 shadow-3xl text-center space-y-6 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner"><Lock size={32} /></div>
            <div>
              <h4 className="text-2xl font-black tracking-tighter uppercase italic mb-1 text-white">Authority Login</h4>
              <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Institutional Access Only</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-3">
              <input className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold text-sm text-white" placeholder="Username" value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} />
              <input type="password" autoFocus className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-bold text-sm text-white" placeholder="Access Key" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} />
              <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-tighter text-lg shadow-xl shadow-blue-600/10 hover:bg-blue-500 transition-all mt-4">VERIFY SESSION</button>
              <button type="button" onClick={() => setShowLogin(false)} className="text-slate-600 font-bold uppercase text-[9px] tracking-widest mt-4 hover:text-white transition-all block w-full">CANCEL</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
