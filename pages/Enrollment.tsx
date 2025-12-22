
import React, { useState } from 'react';
import { Grade, Student } from '../types';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { UserPlus, ArrowRight, ShieldCheck, CheckCircle, MessageSquare } from 'lucide-react';

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
    
    const id = `STU-2025-${Math.floor(1000 + Math.random() * 9000)}`;
    const newStudent: Student = {
      ...formData,
      id,
      lastPaymentMonth: '2024-12',
      registrationDate: new Date().toISOString().split('T')[0]
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
    const text = encodeURIComponent(`Hello ${successStudent.parentName}, registration confirmed at Excellence English. Student ID: ${successStudent.id}.`);
    window.open(`https://wa.me/${waPhone}?text=${text}`, '_blank');
  };

  const grades: Grade[] = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11'];

  if (successStudent) {
    return (
      <div className="max-w-3xl mx-auto space-y-12 animate-in zoom-in-95 duration-700 pb-20">
        <div className="bg-slate-900/50 p-10 md:p-16 rounded-[3rem] border border-slate-800 text-center space-y-10 shadow-3xl shadow-emerald-500/5">
          <div className="w-24 h-24 bg-emerald-500/20 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle size={56} />
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic text-white leading-none">Registration Confirmed</h2>
            <p className="text-slate-400 font-bold mt-4 uppercase text-[10px] tracking-widest">Digital Registry Updated</p>
          </div>

          <div className="bg-slate-950 p-12 rounded-[2.5rem] border border-blue-900/30 shadow-2xl flex flex-col md:flex-row items-center justify-center gap-10">
             <div className="bg-white p-4 rounded-3xl">
               <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${successStudent.id}`} alt="ID QR" className="w-32 h-32" />
             </div>
             <div className="text-left">
               <p className="text-[10px] font-black tracking-[0.5em] text-slate-600 uppercase mb-2">Personnel Identifier</p>
               <p className="text-5xl font-black text-blue-500 tracking-tighter">{successStudent.id}</p>
             </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button onClick={handleShareWhatsApp} className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded-2xl font-black flex items-center justify-center gap-4 transition-all shadow-xl uppercase text-xs border-b-4 border-emerald-800">
              <MessageSquare size={20} />
              Share Notification
            </button>
            <button onClick={onComplete} className="bg-slate-800 hover:bg-slate-700 text-white px-10 py-5 rounded-2xl font-black flex items-center justify-center gap-4 transition-all uppercase text-xs">
              Registry Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header className="animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none text-white">Register</h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.6em] text-[10px] mt-3">Institutional Provisioning Desk</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in slide-in-from-bottom-8 duration-700">
        <div className="lg:col-span-2 bg-slate-900/50 p-8 md:p-12 rounded-[3.5rem] border border-slate-800 shadow-3xl text-white">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="block text-xs font-black tracking-[0.5em] uppercase text-slate-600">Student Name</label>
                <input required className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 focus:border-blue-600 focus:outline-none font-bold text-xl shadow-inner text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-black tracking-[0.5em] uppercase text-slate-600">Grade Level</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 focus:border-blue-600 focus:outline-none font-bold text-xl shadow-inner text-white" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value as Grade})}>
                  {grades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="block text-xs font-black tracking-[0.5em] uppercase text-slate-600">WhatsApp Contact</label>
                <input required placeholder="07XXXXXXXX" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 focus:border-blue-600 focus:outline-none font-bold text-xl shadow-inner text-white" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-black tracking-[0.5em] uppercase text-slate-600">Guardian Name</label>
                <input required className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 focus:border-blue-600 focus:outline-none font-bold text-xl shadow-inner text-white" value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} />
              </div>
            </div>

            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-8 rounded-[3rem] flex items-center justify-center gap-5 transition-all shadow-2xl shadow-blue-600/20 uppercase tracking-tighter text-2xl border-b-8 border-blue-800">
              {loading ? "PROCESSING..." : "REGISTER PERSONNEL"}
              {!loading && <ArrowRight size={28} />}
            </button>
          </form>
        </div>

        <div className="space-y-10">
          <div className="bg-slate-900 border border-slate-800 p-12 rounded-[3rem] shadow-3xl relative overflow-hidden group">
            <div className="w-14 h-14 bg-blue-600/10 text-blue-500 rounded-[1.8rem] flex items-center justify-center mb-10 shadow-inner">
              <ShieldCheck size={36} />
            </div>
            <h4 className="text-2xl font-black uppercase italic text-white mb-4">Secure Audit</h4>
            <p className="text-slate-500 text-sm font-bold leading-relaxed">Identity provisioning is logged instantly in the institutional ledger.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enrollment;
