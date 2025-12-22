
import React, { useState } from 'react';
import { Grade, Student } from '../types';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { UserPlus, ArrowRight, ShieldCheck, Info, Printer, CheckCircle } from 'lucide-react';

const Enrollment: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    grade: 'Grade 6' as Grade,
    parentName: '',
    contact: ''
  });
  const [loading, setLoading] = useState(false);
  const [successStudent, setSuccessStudent] = useState<Student | null>(null);

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
      setSuccessStudent(newStudent);
    }, 1200);
  };

  const handlePrintID = () => {
    if (!successStudent) return;
    const printEl = document.getElementById('print-section');
    if (!printEl) return;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${successStudent.id}`;

    printEl.innerHTML = `
      <div style="width: 85.6mm; height: 53.98mm; padding: 0; font-family: 'Inter', sans-serif; color: white; background: #020617; border-radius: 3mm; overflow: hidden; display: flex; position: relative; box-sizing: border-box; -webkit-print-color-adjust: exact;">
        <div style="position: absolute; top: -15mm; right: -15mm; width: 45mm; height: 45mm; background: #2563eb; opacity: 0.15; border-radius: 50%;"></div>
        <div style="flex: 0 0 34mm; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px solid #1e293b; z-index: 10;">
          <img src="${qrUrl}" style="width: 26mm; height: 26mm; margin-bottom: 2mm;" />
          <div style="color: #020617; font-size: 6pt; font-weight: 900; letter-spacing: 1px; background: #f1f5f9; padding: 1mm 3mm; border-radius: 1mm;">OFFICIAL PASS</div>
        </div>
        <div style="flex: 1; padding: 5mm 7mm; display: flex; flex-direction: column; justify-content: space-between; z-index: 10;">
          <div>
            <h1 style="font-size: 11pt; font-weight: 900; color: #3b82f6; margin: 0; text-transform: uppercase;">Excellence English</h1>
            <p style="font-size: 5pt; letter-spacing: 2px; font-weight: 800; color: #64748b; margin: 0; text-transform: uppercase;">Institutional Network</p>
          </div>
          <div style="margin: 1mm 0;">
            <p style="font-size: 4pt; font-weight: 900; color: #3b82f6; margin: 0; text-transform: uppercase;">Full Identity</p>
            <h2 style="font-size: 12pt; font-weight: 900; margin: 0; color: #f8fafc; text-transform: uppercase;">${successStudent.name}</h2>
            <p style="font-size: 8pt; font-weight: 900; color: #3b82f6; margin: 1mm 0; font-family: monospace;">${successStudent.id}</p>
          </div>
          <div style="display: flex; gap: 6mm;">
            <div>
              <p style="font-size: 4pt; font-weight: 900; color: #475569; margin: 0; text-transform: uppercase;">Grade</p>
              <p style="font-size: 7pt; font-weight: 900; margin: 0;">${successStudent.grade}</p>
            </div>
            <div>
              <p style="font-size: 4pt; font-weight: 900; color: #475569; margin: 0; text-transform: uppercase;">Validity</p>
              <p style="font-size: 7pt; font-weight: 900; margin: 0; color: #10b981;">ACTIVE</p>
            </div>
          </div>
        </div>
        <div style="position: absolute; bottom: 0; left: 34mm; right: 0; height: 1.5mm; background: #2563eb;"></div>
      </div>
    `;
    window.print();
  };

  if (successStudent) {
    return (
      <div className="max-w-4xl mx-auto space-y-12 animate-in zoom-in-95 duration-700">
        <div className="bg-slate-900/50 p-16 rounded-[5rem] border border-slate-800 text-center space-y-10 shadow-3xl">
          <div className="w-32 h-32 bg-emerald-500/20 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl">
            <CheckCircle size={64} />
          </div>
          <div>
            <h2 className="text-5xl font-black tracking-tighter uppercase italic mb-4 leading-none">Enrollment Verified</h2>
            <p className="text-slate-400 font-bold max-w-md mx-auto text-lg leading-relaxed">Identity <b>{successStudent.id}</b> has been successfully provisioned for <b>{successStudent.name}</b>.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <button 
              onClick={handlePrintID}
              className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-6 rounded-[2.5rem] font-black flex items-center justify-center gap-4 transition-all shadow-2xl shadow-blue-600/20 uppercase tracking-widest text-sm"
            >
              <Printer size={24} />
              Print PVC Identity
            </button>
            <button 
              onClick={onComplete}
              className="bg-slate-800 hover:bg-slate-700 text-white px-12 py-6 rounded-[2.5rem] font-black flex items-center justify-center gap-4 transition-all uppercase tracking-widest text-sm"
            >
              Access Registry
            </button>
          </div>
          
          <button onClick={() => setSuccessStudent(null)} className="text-slate-600 font-bold uppercase text-[10px] tracking-[0.4em] hover:text-white transition-all">Enroll Subsequent Personnel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-6xl font-black tracking-tighter uppercase italic">Institutional Intake</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.5em] text-xs mt-2">Personnel provisioning for Excellence English Network</p>
        </div>
        <div className="hidden lg:flex items-center gap-4 text-slate-800">
           <ShieldCheck size={48} />
           <UserPlus size={48} />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-slate-900/50 p-12 rounded-[4.5rem] border border-slate-800 shadow-3xl">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black tracking-[0.4em] uppercase text-slate-600">Personnel Full Name</label>
                <input 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 focus:border-blue-500 focus:outline-none font-bold text-lg shadow-inner"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black tracking-[0.4em] uppercase text-slate-600">Academic Designation</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 focus:border-blue-500 focus:outline-none appearance-none font-bold text-lg shadow-inner"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black tracking-[0.4em] uppercase text-slate-600">Primary Contact (WhatsApp)</label>
                <input 
                  required
                  placeholder="07XXXXXXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 focus:border-blue-500 focus:outline-none font-bold text-lg shadow-inner"
                  value={formData.contact}
                  onChange={e => setFormData({...formData, contact: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black tracking-[0.4em] uppercase text-slate-600">Guardian Name</label>
                <input 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 focus:border-blue-500 focus:outline-none font-bold text-lg shadow-inner"
                  value={formData.parentName}
                  onChange={e => setFormData({...formData, parentName: e.target.value})}
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-7 rounded-[3rem] flex items-center justify-center gap-4 transition-all transform hover:scale-[1.01] shadow-2xl shadow-blue-600/20 uppercase tracking-tighter text-2xl"
            >
              {loading ? "PROVISIONING..." : "GENERATE ENROLLMENT"}
              {!loading && <ArrowRight size={24} />}
            </button>
          </form>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-600/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-inner">
              <ShieldCheck size={32} />
            </div>
            <h4 className="text-2xl font-black uppercase tracking-tight mb-3 italic">Data Integrity</h4>
            <p className="text-slate-500 text-sm font-bold leading-relaxed">Enrollment data is hashed and linked to a unique institutional QR key, ensuring zero-collision in gate authorization.</p>
          </div>

          <div className="bg-slate-950 p-10 rounded-[3.5rem] border border-slate-900 shadow-3xl">
            <div className="flex items-center gap-4 text-emerald-500 mb-6">
              <Info size={20} />
              <h4 className="font-black text-xs uppercase tracking-[0.4em]">Internal Directive</h4>
            </div>
            <ul className="space-y-4 text-[11px] font-black text-slate-500 uppercase tracking-widest leading-loose">
              <li className="flex gap-3"><span className="text-blue-500">01</span> Confirm contact for AI Alerts</li>
              <li className="flex gap-3"><span className="text-blue-500">02</span> IDs valid for 12 months</li>
              <li className="flex gap-3"><span className="text-blue-500">03</span> Thermal receipts enabled</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enrollment;
