
import React, { useState } from 'react';
import { Grade, Student } from '../types';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { UserPlus, ArrowRight, ShieldCheck, Info } from 'lucide-react';

const Enrollment: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    grade: 'Grade 6' as Grade,
    parentName: '',
    contact: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      const year = new Date().getFullYear();
      const id = `STU-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newStudent: Student = {
        ...formData,
        id,
        lastPaymentMonth: `${year}-01`,
        registrationDate: new Date().toISOString().split('T')[0]
      };
      
      storageService.saveStudent(newStudent);
      audioService.playSuccess();
      setLoading(false);
      onComplete();
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header>
        <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">Institutional Enrollment</h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Register new personnel to the 2025 intake</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/50 p-10 rounded-[4rem] border border-slate-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-[0.3em] uppercase text-slate-500">Full Student Name</label>
                <input 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 focus:border-blue-500 focus:outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-[0.3em] uppercase text-slate-500">Academic Grade</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 focus:border-blue-500 focus:outline-none appearance-none"
                  value={formData.grade}
                  onChange={e => setFormData({...formData, grade: e.target.value as Grade})}
                >
                  <option>Grade 6</option>
                  <option>Grade 7</option>
                  <option>Grade 8</option>
                  <option>Grade 9</option>
                  <option>O/L</option>
                  <option>A/L</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-[0.3em] uppercase text-slate-500">Parent/Guardian Name</label>
                <input 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 focus:border-blue-500 focus:outline-none"
                  value={formData.parentName}
                  onChange={e => setFormData({...formData, parentName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-[0.3em] uppercase text-slate-500">WhatsApp Contact</label>
                <input 
                  required
                  placeholder="07XXXXXXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 focus:border-blue-500 focus:outline-none"
                  value={formData.contact}
                  onChange={e => setFormData({...formData, contact: e.target.value})}
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-[2.5rem] flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] shadow-xl shadow-blue-600/20"
            >
              {loading ? "PROCESSING..." : "REGISTER STUDENT"}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-xl">
            <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck size={24} />
            </div>
            <h4 className="text-xl font-black uppercase tracking-tight mb-2">ID Generation</h4>
            <p className="text-slate-500 text-sm font-bold">The system will automatically generate a unique STU-2025 sequence linked to a biometric-ready QR code.</p>
          </div>

          <div className="bg-slate-950 p-8 rounded-[3rem] border border-slate-900">
            <div className="flex items-center gap-3 text-emerald-500 mb-4">
              <Info size={18} />
              <h4 className="font-black text-xs uppercase tracking-widest">Enrollment Tips</h4>
            </div>
            <ul className="space-y-3 text-xs font-bold text-slate-400">
              <li>• Ensure names are spelled exactly as on Birth Certificates.</li>
              <li>• WhatsApp contact is critical for AI Messaging.</li>
              <li>• IDs are instantly valid for Gate Entry.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enrollment;
