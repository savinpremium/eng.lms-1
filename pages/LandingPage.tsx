
import React, { useState } from 'react';
import { Page, Grade, Student } from '../types';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { CheckCircle, ArrowRight, ShieldCheck, QrCode, Lock, User } from 'lucide-react';

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
  const [loginError, setLoginError] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const year = new Date().getFullYear();
    const id = `STU-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newStudent: Student = {
      ...formData,
      id,
      lastPaymentMonth: `${year}-01`,
      registrationDate: new Date().toISOString().split('T')[0]
    };
    storageService.saveStudent(newStudent);
    setRegisteredStudent(newStudent);
    audioService.playSuccess();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === 'Iresha1978' && loginForm.password === 'Iresha1978') {
      onLoginSuccess();
    } else {
      setLoginError('Invalid credentials');
      audioService.playError();
    }
  };

  return (
    <div className="relative">
      {/* Navbar */}
      <nav className="flex justify-between items-center py-6 mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <span className="font-black text-2xl tracking-tighter uppercase">EngLMS</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => onNavigate(Page.PORTAL)}
            className="hidden md:flex items-center gap-2 px-6 py-2 rounded-full border border-slate-700 font-bold hover:bg-slate-800 transition-all"
          >
            <QrCode size={18} />
            Student Portal
          </button>
          <button 
            onClick={() => setShowLogin(true)}
            className="px-6 py-2 rounded-full bg-slate-800 font-bold hover:bg-slate-700 transition-all"
          >
            Staff Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-blue-500 font-black tracking-widest uppercase text-sm mb-4">Excellence English Institute</p>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6">
            BRIGHTER <br />
            <span className="text-slate-800 outline-text" style={{ WebkitTextStroke: '2px #1e293b' }}>FUTURES</span>
          </h1>
          <p className="text-xl md:text-3xl font-bold text-slate-400 mb-8 leading-relaxed">
            විශිෂ්ටතම ඉංග්‍රීසි අධ්‍යාපනය දැන් වඩාත් තාක්ෂණිකව. <br />
            <span className="text-lg">Digital attendance, PVC IDs, and AI alerts.</span>
          </p>
          
          <div className="space-y-4">
            {['Secure Financial Ledger', 'AI Parent Communication', 'QR ID Smart Entry'].map((f) => (
              <div key={f} className="flex items-center gap-3 text-slate-300 font-bold">
                <CheckCircle className="text-emerald-500" size={20} />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Enrollment Form */}
        <div className="bg-slate-900/50 p-8 md:p-12 rounded-[4rem] border border-slate-800 shadow-2xl shadow-blue-900/10">
          {!registeredStudent ? (
            <form onSubmit={handleRegister} className="space-y-6">
              <h2 className="text-3xl font-black tracking-tight mb-8">STUDENT ENROLLMENT</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black tracking-[0.3em] uppercase text-slate-500 mb-2">Student Name</label>
                  <input 
                    required
                    placeholder="Full Name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-6 py-4 focus:outline-none focus:border-blue-600 transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black tracking-[0.3em] uppercase text-slate-500 mb-2">Grade</label>
                    <select 
                      className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-6 py-4 focus:outline-none focus:border-blue-600 transition-all appearance-none"
                      value={formData.grade}
                      onChange={(e) => setFormData({...formData, grade: e.target.value as Grade})}
                    >
                      <option>Grade 6</option>
                      <option>Grade 7</option>
                      <option>Grade 8</option>
                      <option>Grade 9</option>
                      <option>O/L</option>
                      <option>A/L</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black tracking-[0.3em] uppercase text-slate-500 mb-2">WhatsApp</label>
                    <input 
                      required
                      placeholder="07xxxxxxxx"
                      className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-6 py-4 focus:outline-none focus:border-blue-600 transition-all"
                      value={formData.contact}
                      onChange={(e) => setFormData({...formData, contact: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black tracking-[0.3em] uppercase text-slate-500 mb-2">Parent Name</label>
                  <input 
                    required
                    placeholder="Guardian Name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-6 py-4 focus:outline-none focus:border-blue-600 transition-all"
                    value={formData.parentName}
                    onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                  />
                </div>
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-xl shadow-blue-600/20">
                PROCEED REGISTRATION
                <ArrowRight size={20} />
              </button>
            </form>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} />
              </div>
              <h2 className="text-3xl font-black mb-4 tracking-tight uppercase">Successfully Registered</h2>
              <p className="text-slate-400 font-bold mb-8">Your Student ID has been generated for 2025.</p>
              
              <div className="bg-slate-950 p-6 rounded-3xl border border-blue-900/50 mb-8">
                <p className="text-[10px] tracking-[0.4em] font-black text-slate-500 mb-1 uppercase">Official ID</p>
                <p className="text-4xl font-black text-blue-500 tracking-tighter">{registeredStudent.id}</p>
              </div>

              <button 
                onClick={() => onNavigate(Page.PORTAL)}
                className="w-full bg-white text-slate-950 font-black py-4 rounded-[2rem] hover:bg-slate-200 transition-all"
              >
                GO TO PORTAL
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80">
          <div className="bg-slate-900 w-full max-w-md p-10 rounded-[4rem] border border-slate-800 shadow-3xl text-center space-y-8 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-blue-600/10 text-blue-500 rounded-full flex items-center justify-center mx-auto">
              <Lock size={40} />
            </div>
            <div>
              <h4 className="text-3xl font-black tracking-tighter uppercase">Staff Access</h4>
              <p className="text-slate-500 font-bold italic text-sm">Restricted to authorized institute personnel.</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input 
                  className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-14 py-4 focus:outline-none focus:border-blue-600"
                  placeholder="Username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input 
                  type="password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-14 py-4 focus:outline-none focus:border-blue-600"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                />
              </div>
              {loginError && <p className="text-rose-500 font-bold text-xs">{loginError}</p>}
              <button 
                className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-tighter text-xl hover:bg-blue-500 transition-all"
              >
                AUTHORIZE
              </button>
              <button 
                type="button"
                onClick={() => setShowLogin(false)}
                className="text-slate-500 font-bold uppercase text-sm tracking-widest mt-4"
              >
                CANCEL
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
