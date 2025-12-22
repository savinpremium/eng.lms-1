
import React, { useState } from 'react';
import { Page, Grade, Student } from '../types';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { CheckCircle, ArrowRight, ShieldCheck, QrCode, Lock, Printer, UserCheck } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: Page) => void;
  onLoginSuccess: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    grade: 'Grade 6' as Grade,
    parentName: '',
    contact: ''
  });
  const [registeredStudent, setRegisteredStudent] = useState<Student | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const year = new Date().getFullYear();
    const id = `STU-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newStudent: Student = {
      ...formData,
      id,
      lastPaymentMonth: `${year}-01`,
      registrationDate: new Date().toISOString().split('T')[0]
    };
    await storageService.saveStudent(newStudent);
    setRegisteredStudent(newStudent);
    setLoading(false);
    audioService.playSuccess();
  };

  const handlePrintID = () => {
    if (!registeredStudent) return;
    const printEl = document.getElementById('print-section');
    if (!printEl) return;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${registeredStudent.id}`;

    printEl.innerHTML = `
      <div style="width: 85.6mm; height: 53.98mm; padding: 0; font-family: 'Inter', sans-serif; color: white; background: #020617; border-radius: 3.18mm; overflow: hidden; display: flex; position: relative; box-sizing: border-box; -webkit-print-color-adjust: exact;">
        <div style="position: absolute; top: -15mm; right: -15mm; width: 45mm; height: 45mm; background: #2563eb; opacity: 0.2; border-radius: 50%;"></div>
        <div style="position: absolute; bottom: -10mm; left: -10mm; width: 30mm; height: 30mm; background: #2563eb; opacity: 0.1; border-radius: 50%;"></div>
        
        <div style="flex: 0 0 34mm; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 2px solid #1e293b; z-index: 10;">
          <img src="${qrUrl}" style="width: 26mm; height: 26mm; margin-bottom: 2mm;" />
          <div style="color: #020617; font-size: 6.5pt; font-weight: 900; letter-spacing: 1px; background: #f1f5f9; padding: 1mm 3mm; border-radius: 1mm;">GATE ID</div>
        </div>
        
        <div style="flex: 1; padding: 5mm 7mm; display: flex; flex-direction: column; justify-content: space-between; z-index: 10;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h1 style="font-size: 11pt; font-weight: 900; color: #3b82f6; margin: 0; text-transform: uppercase; letter-spacing: -0.5px; line-height: 1;">Excellence English</h1>
              <p style="font-size: 5pt; letter-spacing: 2px; font-weight: 800; color: #64748b; margin: 1mm 0 0 0; text-transform: uppercase;">Professional Network</p>
            </div>
            <div style="width: 6mm; height: 6mm; background: #2563eb; border-radius: 1.5mm; display: flex; align-items: center; justify-content: center;">
               <div style="width: 2.5mm; height: 2.5mm; border: 1.5px solid white; border-radius: 50%;"></div>
            </div>
          </div>
          
          <div style="margin: 2mm 0;">
            <p style="font-size: 5pt; font-weight: 900; color: #3b82f6; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Authorized Student</p>
            <h2 style="font-size: 14pt; font-weight: 900; margin: 0.5mm 0; color: #f8fafc; text-transform: uppercase; line-height: 1.1; letter-spacing: -0.5px;">${registeredStudent.name}</h2>
            <p style="font-size: 9.5pt; font-weight: 900; color: #3b82f6; margin: 0.5mm 0; font-family: monospace; letter-spacing: 1px;">${registeredStudent.id}</p>
          </div>
          
          <div style="display: flex; gap: 6mm; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 2.5mm;">
            <div>
              <p style="font-size: 4pt; font-weight: 900; color: #475569; margin: 0; text-transform: uppercase;">Grade Level</p>
              <p style="font-size: 8.5pt; font-weight: 900; margin: 0;">${registeredStudent.grade}</p>
            </div>
            <div>
              <p style="font-size: 4pt; font-weight: 900; color: #475569; margin: 0; text-transform: uppercase;">Session</p>
              <p style="font-size: 8.5pt; font-weight: 900; margin: 0;">2025/26</p>
            </div>
            <div style="margin-left: auto; text-align: right;">
               <p style="font-size: 4pt; font-weight: 900; color: #475569; margin: 0; text-transform: uppercase;">Security</p>
               <p style="font-size: 7.5pt; font-weight: 900; margin: 0; color: #fbbf24; letter-spacing: 1px;">VERIFIED</p>
            </div>
          </div>
        </div>
        
        <div style="position: absolute; bottom: 0; left: 34mm; right: 0; height: 1.5mm; background: linear-gradient(90deg, #2563eb, #3b82f6);"></div>
      </div>
    `;
    window.print();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === 'Iresha1978' && loginForm.password === 'Iresha1978') {
      onLoginSuccess();
    } else {
      audioService.playError();
    }
  };

  return (
    <div className="relative">
      <nav className="flex justify-between items-center py-6 mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <span className="font-black text-2xl tracking-tighter uppercase text-blue-500">EngLMS</span>
        </div>
        <div className="flex gap-4">
          <button onClick={() => onNavigate(Page.PORTAL)} className="hidden md:flex items-center gap-2 px-6 py-2 rounded-full border border-slate-700 font-bold hover:bg-slate-800 transition-all text-xs uppercase tracking-widest">
            <QrCode size={18} />
            Portal
          </button>
          <button onClick={() => setShowLogin(true)} className="px-6 py-2 rounded-full bg-slate-800 font-bold hover:bg-slate-700 transition-all text-xs uppercase tracking-widest">
            Staff Access
          </button>
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="animate-in fade-in slide-in-from-left-8 duration-700">
          <p className="text-blue-500 font-black tracking-widest uppercase text-sm mb-4">Excellence English Sri Lanka</p>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6 italic">ADVANCED <br /> <span className="text-slate-800" style={{ WebkitTextStroke: '2px #1e293b' }}>LEARNING</span></h1>
          <p className="text-xl md:text-3xl font-bold text-slate-400 mb-8 leading-relaxed">ශ්‍රී ලංකාවේ ප්‍රමුඛතම ඉංග්‍රීසි අධ්‍යාපන ජාලය. <br /><span className="text-lg text-slate-500 font-medium">Smart PVC ID Systems & AI Powered Management.</span></p>
          
          <div className="flex items-center gap-8 mt-12 grayscale opacity-40">
             <div className="flex flex-col items-center"><ShieldCheck size={36}/><span className="text-[10px] font-black mt-2 tracking-widest uppercase">SECURE</span></div>
             <div className="flex flex-col items-center"><QrCode size={36}/><span className="text-[10px] font-black mt-2 tracking-widest uppercase">SMART</span></div>
             <div className="flex flex-col items-center"><UserCheck size={36}/><span className="text-[10px] font-black mt-2 tracking-widest uppercase">VERIFIED</span></div>
          </div>
        </div>

        <div className="bg-slate-900/50 p-8 md:p-12 rounded-[4rem] border border-slate-800 shadow-3xl shadow-blue-900/10 transition-all duration-500 animate-in zoom-in-95">
          {!registeredStudent ? (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tight uppercase italic mb-1">Direct Intake</h2>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Register for the 2025 Academic Cycle</p>
              </div>
              <div className="space-y-4">
                <input required placeholder="Student Full Name" className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-6 py-5 focus:outline-none focus:border-blue-600 transition-all font-bold" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-6 py-5 focus:outline-none focus:border-blue-600 transition-all appearance-none font-bold" value={formData.grade} onChange={(e) => setFormData({...formData, grade: e.target.value as Grade})}>
                    <option>Grade 6</option><option>Grade 7</option><option>Grade 8</option><option>Grade 9</option><option>O/L</option><option>A/L</option>
                  </select>
                  <input required placeholder="WhatsApp (07XXXXXXXX)" className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-6 py-5 focus:outline-none focus:border-blue-600 transition-all font-bold" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} />
                </div>
                <input required placeholder="Parent / Guardian Name" className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-6 py-5 focus:outline-none focus:border-blue-600 transition-all font-bold" value={formData.parentName} onChange={(e) => setFormData({...formData, parentName: e.target.value})} />
              </div>
              <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-[2.5rem] flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-xl shadow-blue-600/20 uppercase tracking-tighter text-xl">
                {loading ? 'PROCESSING...' : 'GENERATE IDENTITY'}
                {!loading && <ArrowRight size={20} />}
              </button>
            </form>
          ) : (
            <div className="text-center py-4 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <CheckCircle size={56} />
              </div>
              <h2 className="text-4xl font-black mb-2 tracking-tight uppercase italic">Provisioned</h2>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mb-10">Institutional Credentials Generated</p>
              
              <div className="bg-slate-950 p-10 rounded-[4rem] border border-blue-900/50 mb-10 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-bl-[5rem]"></div>
                <p className="text-[10px] tracking-[0.5em] font-black text-slate-500 mb-2 uppercase">Personnel ID</p>
                <p className="text-6xl font-black text-blue-500 tracking-tighter mb-8">{registeredStudent.id}</p>
                
                <div className="bg-white p-5 rounded-[2.5rem] inline-block shadow-2xl">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${registeredStudent.id}`} 
                    alt="QR" 
                    className="w-32 h-32"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={handlePrintID}
                  className="w-full bg-blue-600 text-white font-black py-5 rounded-[2.5rem] hover:bg-blue-500 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 uppercase text-xs tracking-[0.2em]"
                >
                  <Printer size={18} />
                  Print PVC Card
                </button>
                <button 
                  onClick={() => onNavigate(Page.PORTAL)}
                  className="w-full bg-slate-800 text-white font-black py-5 rounded-[2.5rem] hover:bg-slate-700 transition-all uppercase text-xs tracking-[0.2em]"
                >
                  Access Portal
                </button>
              </div>
              <button onClick={() => setRegisteredStudent(null)} className="mt-12 text-slate-600 font-bold text-[10px] uppercase tracking-[0.4em] hover:text-white transition-all">Submit Another Application</button>
            </div>
          )}
        </div>
      </div>

      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80">
          <div className="bg-slate-900 w-full max-w-md p-10 rounded-[4rem] border border-slate-800 shadow-3xl text-center space-y-8 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-blue-600/10 text-blue-500 rounded-full flex items-center justify-center mx-auto shadow-inner"><Lock size={40} /></div>
            <div>
              <h4 className="text-3xl font-black tracking-tighter uppercase italic leading-none mb-2">Internal Console</h4>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Authority Credentials Required</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 focus:outline-none focus:border-blue-600 font-bold" placeholder="Personnel ID" value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} />
              <input type="password" autoFocus className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 focus:outline-none focus:border-blue-600 font-bold" placeholder="Access Key" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} />
              <button className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-tighter text-xl shadow-xl shadow-blue-600/10 hover:bg-blue-500 transition-all">AUTHORIZE SESSION</button>
              <button type="button" onClick={() => setShowLogin(false)} className="text-slate-600 font-bold uppercase text-[10px] tracking-widest mt-6 hover:text-white transition-all">TERMINATE REQUEST</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
