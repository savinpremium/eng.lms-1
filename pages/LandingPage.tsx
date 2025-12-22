
import React, { useState } from 'react';
import { Page, Grade, Student } from '../types';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { CheckCircle, ArrowRight, ShieldCheck, QrCode } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: Page) => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    grade: 'Grade 6' as Grade,
    parentName: '',
    contact: ''
  });
  const [registeredStudent, setRegisteredStudent] = useState<Student | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `Stu-2025-${Math.floor(1000 + Math.random() * 9000)}`;
    const newStudent: Student = {
      ...formData,
      id,
      lastPaymentMonth: '2025-01',
      registrationDate: new Date().toISOString().split('T')[0]
    };
    storageService.saveStudent(newStudent);
    setRegisteredStudent(newStudent);
    audioService.playSuccess();
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
            onClick={() => { onLogin(); onNavigate(Page.DASHBOARD); }}
            className="px-6 py-2 rounded-full bg-slate-800 font-bold hover:bg-slate-700 transition-all"
          >
            Staff Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-blue-500 font-black tracking-widest uppercase text-sm mb-4">The Future of English Learning</p>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6">
            EXCELLENCE <br />
            <span className="text-slate-800 outline-text" style={{ WebkitTextStroke: '2px #1e293b' }}>ENGLISH</span>
          </h1>
          <p className="text-xl md:text-3xl font-bold text-slate-400 mb-8 leading-relaxed">
            විශිෂ්ටතම ඉංග්‍රීසි අධ්‍යාපනය දැන් වඩාත් තාක්ෂණිකව. <br />
            <span className="text-lg">Register your child for the 2025 intake today.</span>
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-3xl font-black tracking-tight mb-8">STUDENT ENROLLMENT</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black tracking-[0.3em] uppercase text-slate-500 mb-2">Student Name</label>
                  <input 
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-6 py-4 focus:outline-none focus:border-blue-600 transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black tracking-[0.3em] uppercase text-slate-500 mb-2">Academic Grade</label>
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
                  <label className="block text-[10px] font-black tracking-[0.3em] uppercase text-slate-500 mb-2">Parent Name</label>
                  <input 
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-6 py-4 focus:outline-none focus:border-blue-600 transition-all"
                    value={formData.parentName}
                    onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black tracking-[0.3em] uppercase text-slate-500 mb-2">WhatsApp Number</label>
                  <input 
                    required
                    placeholder="07x xxxxxxx"
                    className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-6 py-4 focus:outline-none focus:border-blue-600 transition-all"
                    value={formData.contact}
                    onChange={(e) => setFormData({...formData, contact: e.target.value})}
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
              <h2 className="text-3xl font-black mb-4 tracking-tight uppercase">Welcome to the Intake</h2>
              <p className="text-slate-400 font-bold mb-8">Registration Successful. Your Student ID is generated.</p>
              
              <div className="bg-slate-950 p-6 rounded-3xl border border-blue-900/50 mb-8">
                <p className="text-[10px] tracking-[0.4em] font-black text-slate-500 mb-1 uppercase">Assigned ID</p>
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
    </div>
  );
};

export default LandingPage;
