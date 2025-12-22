
import React, { useState } from 'react';
import { Grade, Student } from '../types';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { UserPlus, ArrowRight, ShieldCheck, Info, CheckCircle, Loader2, MessageSquare, QrCode } from 'lucide-react';

const Enrollment: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    grade: 'Grade 1' as Grade,
    parentName: '',
    contact: ''
  });
  const [loading, setLoading] = useState(false);
  const [successStudent, setSuccessStudent] = useState<Student | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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
    audioService.playSuccess();
    setLoading(false);
    setSuccessStudent(newStudent);
  };

  const handleShareWhatsApp = () => {
    if (!successStudent) return;
    const phone = successStudent.contact.replace(/\D/g, '');
    const waPhone = phone.startsWith('0') ? '94' + phone.substring(1) : phone;
    const text = encodeURIComponent(`Hello ${successStudent.parentName}, your child ${successStudent.name} is successfully enrolled at Excellence English. Student ID: ${successStudent.id}.`);
    window.open(`https://wa.me/${waPhone}?text=${text}`, '_blank');
  };

  const grades: Grade[] = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11'];

  if (successStudent) {
    return (
      <div className="max-w-3xl mx-auto space-y-12 animate-in zoom-in-95 duration-700 pb-20">
        <div className="bg-slate-900/50 p-10 md:p-16 rounded-[3rem] border border-slate-800 text-center space-y-10 shadow-3xl">
          <div className="w-24 h-24 bg-emerald-500/20 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle size={56} />
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic mb-4 leading-none text-white">Registry Updated</h2>
            <p className="text-slate-400 font-bold max-w-md mx-auto text-base md:text-lg leading-relaxed">Student <b>{successStudent.name}</b> has been provisioned.</p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-10 bg-slate-950 p-12 rounded-[2.5rem] border border-blue-900/30 shadow-2xl">
             <div className="bg-white p-4 rounded-3xl shadow-xl">
               <img 
                 src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${successStudent.id}`} 
                 alt="ID QR" 
                 className="w-32 h-32"
               />
             </div>
             <div className="text-left">
               <p className="text-[10px] font-black tracking-[0.5em] text-slate-600 uppercase mb-2">Institutional Pass Key</p>
               <p className="text-5xl font-black text-blue-500 tracking-tighter mb-4">{successStudent.id}</p>
               <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                 <ShieldCheck size={14} />
                 Cryptographic ID Active
               </div>
             </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button 
              onClick={handleShareWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded-2xl font-black flex items-center justify-center gap-4 transition-all shadow-xl uppercase tracking-widest text-xs"
            >
              <MessageSquare size={20} />
              WhatsApp Notification
            </button>
            <button 
              onClick={onComplete}
              className="bg-slate-800 hover:bg-slate-700 text-white px-10 py-5 rounded-2xl font-black flex items-center justify-center gap-4 transition-all uppercase tracking-widest text-xs"
            >
              Back to Registry
            </button>
          </div>
          
          <button onClick={() => setSuccessStudent(null)} className="text-slate-600 font-bold uppercase text-[9px] tracking-[0.5em] hover:text-white transition-all">Next Enrollment</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 md:space-y-12 pb-20">
      <header className="flex justify-between items-end animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none text-white">Enrollment</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.6em] text-[10px] mt-3">Institutional Provisioning Desk</p>
        </div>
        <div className="hidden lg:flex items-center gap-6 text-slate-800 opacity-20">
           <ShieldCheck size={56} />
           <UserPlus size={56} />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        <div className="lg:col-span-2 bg-slate-900/50 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-800 shadow-3xl text-white">
          <form onSubmit={handleSubmit} className="space-y-8 md:space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
              <div className="space-y-3">
                <label className="block text-xs font-black tracking-[0.5em] uppercase text-slate-600">Student Name</label>
                <input 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl md:rounded-2xl px-6 py-4 md:py-6 focus:border-blue-600 focus:outline-none font-bold text-lg md:text-xl shadow-inner transition-all text-white"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-black tracking-[0.5em] uppercase text-slate-600">Grade Level</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl md:rounded-2xl px-6 py-4 md:py-6 focus:border-blue-600 focus:outline-none appearance-none font-bold text-lg md:text-xl shadow-inner transition-all text-white"
                  value={formData.grade}
                  onChange={e => setFormData({...formData, grade: e.target.value as Grade})}
                >
                  {grades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
              <div className="space-y-3">
                <label className="block text-xs font-black tracking-[0.5em] uppercase text-slate-600">Contact Number</label>
                <input 
                  required
                  placeholder="07XXXXXXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl md:rounded-2xl px-6 py-4 md:py-6 focus:border-blue-600 focus:outline-none font-bold text-lg md:text-xl shadow-inner transition-all text-white"
                  value={formData.contact}
                  onChange={e => setFormData({...formData, contact: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-black tracking-[0.5em] uppercase text-slate-600">Guardian Name</label>
                <input 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl md:rounded-2xl px-6 py-4 md:py-6 focus:border-blue-600 focus:outline-none font-bold text-lg md:text-xl shadow-inner transition-all text-white"
                  value={formData.parentName}
                  onChange={e => setFormData({...formData, parentName: e.target.value})}
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 md:py-8 rounded-2xl md:rounded-[3rem] flex items-center justify-center gap-4 md:gap-5 transition-all transform hover:scale-[1.01] shadow-2xl shadow-blue-600/30 uppercase tracking-tighter text-xl md:text-2xl"
            >
              {loading ? "PROCESSING..." : "REGISTER PERSONNEL"}
              {!loading && <ArrowRight size={28} />}
            </button>
          </form>
        </div>

        <div className="space-y-8 md:space-y-10">
          <div className="bg-slate-900 border border-slate-800 p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-3xl relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-600/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div className="w-14 h-14 bg-blue-600/10 text-blue-500 rounded-xl md:rounded-[1.8rem] flex items-center justify-center mb-6 md:mb-10 shadow-inner">
              <ShieldCheck size={36} />
            </div>
            <h4 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-3 md:mb-4 italic text-white">Security Record</h4>
            <p className="text-slate-500 text-xs md:text-sm font-bold leading-relaxed">Enrollment data is assigned a permanent identifier for institutional record tracking and billing.</p>
          </div>

          <div className="bg-slate-950 p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-slate-900 shadow-3xl">
            <div className="flex items-center gap-4 text-emerald-500 mb-6 md:mb-8">
              <Info size={24} />
              <h4 className="font-black text-xs uppercase tracking-[0.4em]">Desk Policies</h4>
            </div>
            <ul className="space-y-4 text-xs font-black text-slate-500 uppercase tracking-widest leading-relaxed">
              <li className="flex gap-4"><span className="text-blue-600 font-black">01</span> ID assignment instant</li>
              <li className="flex gap-4"><span className="text-blue-600 font-black">02</span> Parent notification sent</li>
              <li className="flex gap-4"><span className="text-blue-600 font-black">03</span> Ledger updated auto</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enrollment;
