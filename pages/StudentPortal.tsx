
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { Student } from '../types';
import { Search, CreditCard, ChevronLeft, X, Loader2, User, QrCode } from 'lucide-react';
import { audioService } from '../services/audioService';

const StudentPortal: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [searchId, setSearchId] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [authCode, setAuthCode] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const verifyId = async (id: string) => {
    if (!id.trim()) return;
    setIsSearching(true);
    try {
      const studentsList = await storageService.getStudents();
      const found = studentsList.find(s => s.id.toUpperCase() === id.trim().toUpperCase());
      if (found) {
        setStudent(found);
        audioService.playSuccess();
      } else {
        audioService.playError();
        alert("Institutional record not found for this ID.");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    if (searchId) verifyId(searchId);
  };

  const handleOfficePay = async () => {
    const isValid = await storageService.validateOTP(authCode);
    if (isValid) {
      alert("Authorization Verified. Please proceed to the office desk.");
      setShowPayModal(false);
    } else {
      alert("Invalid Security Code.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 pb-20">
      <header className="flex items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <button onClick={onBack} className="w-16 h-16 rounded-[1.8rem] bg-slate-900 flex items-center justify-center hover:bg-slate-800 transition-all border border-slate-800">
          <ChevronLeft size={28}/>
        </button>
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none mb-1 text-white">Student Hub</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em]">Personal Academic Portal</p>
        </div>
      </header>

      {!student ? (
        <div className="bg-slate-900 p-12 rounded-[5rem] border border-slate-800 shadow-3xl space-y-10 animate-in zoom-in-95 duration-500">
          <div>
            <label className="block text-[10px] font-black tracking-[0.6em] uppercase text-slate-600 mb-6 text-center">Identify Yourself</label>
            <div className="flex flex-col gap-4">
              <input 
                className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-10 py-6 text-3xl font-black tracking-tight focus:outline-none focus:border-blue-600 uppercase text-center shadow-inner transition-all text-white"
                placeholder="STU-2025-XXXX"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-3xl font-black tracking-tighter text-2xl transition-all shadow-xl shadow-blue-600/20 uppercase"
              >
                {isSearching ? 'Synchronizing...' : 'Search Record'}
              </button>
            </div>
          </div>
          <div className="p-8 bg-slate-950/50 rounded-3xl border border-slate-800/50 text-center">
            <p className="text-xs font-bold text-slate-500 leading-relaxed italic">Enter the unique identifier assigned to you during enrollment to access your records and fee status.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-10 animate-in zoom-in-95 duration-500">
          <div className="bg-white text-slate-950 p-16 rounded-[5.5rem] shadow-3xl flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
            
            <div className="relative mb-10 group">
              <div className="w-48 h-48 bg-slate-50 rounded-[3rem] flex items-center justify-center border border-slate-200 shadow-inner p-4">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${student.id}`} 
                  alt="QR Pass" 
                  className="w-full h-full grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <QrCode size={24} />
              </div>
            </div>

            <h2 className="text-5xl font-black tracking-tighter mb-2 italic uppercase">{student.name}</h2>
            <div className="flex items-center gap-4 mb-10">
               <span className="text-blue-600 font-black tracking-[0.5em] uppercase text-xs">{student.id}</span>
               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 w-full">
              <div className="bg-slate-50 p-8 rounded-[2.8rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Grade</p>
                <p className="text-2xl font-black tracking-tighter">{student.grade}</p>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2.8rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Registry</p>
                <p className="text-2xl font-black text-emerald-600 uppercase italic">Verified</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border-2 border-slate-800 p-12 rounded-[5rem] shadow-3xl">
            <h3 className="text-3xl font-black tracking-tighter uppercase italic mb-10 text-white">Institutional Ledger</h3>

            <div className="p-10 bg-slate-950 rounded-[3.5rem] border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 shadow-inner text-white">
              <div className="text-center md:text-left">
                <p className="font-black text-2xl tracking-tighter uppercase">Monthly Contribution</p>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em] mt-1">Status: {student.lastPaymentMonth}</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-4xl font-black tracking-tighter italic">LKR 1,000</p>
                <button 
                  onClick={() => setShowPayModal(true)}
                  className="text-blue-500 font-black uppercase text-[10px] tracking-[0.3em] mt-4 hover:text-blue-400 transition-all flex items-center justify-center md:justify-end gap-2"
                >
                  <CreditCard size={14}/>
                  Request Settlement
                </button>
              </div>
            </div>
          </div>
          
          <button onClick={() => setStudent(null)} className="w-full py-6 text-slate-600 font-black uppercase text-[10px] tracking-[0.6em] hover:text-white transition-all">
            End Portal Session
          </button>
        </div>
      )}

      {showPayModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80">
          <div className="bg-slate-900 w-full max-w-sm p-10 rounded-[4rem] border border-slate-800 shadow-3xl space-y-8 animate-in zoom-in duration-300 text-center">
            <h4 className="text-3xl font-black tracking-tighter uppercase italic text-white">Authorization Code</h4>
            <input 
              className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 text-4xl font-black tracking-[0.4em] focus:border-blue-600 focus:outline-none text-center shadow-inner text-white"
              maxLength={4}
              placeholder="----"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value.replace(/\D/g, ''))}
            />
            <button 
              onClick={handleOfficePay}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-600/20"
            >
              Verify Code
            </button>
            <button onClick={() => setShowPayModal(false)} className="w-full text-slate-600 font-black uppercase text-[9px] tracking-widest">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPortal;
