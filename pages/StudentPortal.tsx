
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { Student } from '../types';
import { Search, QrCode, CreditCard, ChevronLeft, MapPin } from 'lucide-react';

const StudentPortal: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [searchId, setSearchId] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [authCode, setAuthCode] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);

  const handleSearch = () => {
    const students = storageService.getStudents();
    const found = students.find(s => s.id === searchId);
    if (found) setStudent(found);
  };

  const handleOfficePay = () => {
    if (storageService.validateOTP(authCode)) {
      alert("Verification successful! Please hand the cash to the desk.");
      setShowPayModal(false);
    } else {
      alert("Invalid Authorization Code.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <header className="flex items-center gap-6">
        <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center hover:bg-slate-800">
          <ChevronLeft />
        </button>
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">Student Portal</h1>
          <p className="text-slate-500 font-bold">Check your fees and ID status.</p>
        </div>
      </header>

      {!student ? (
        <div className="bg-slate-900 p-10 rounded-[4rem] border border-slate-800 shadow-2xl">
          <label className="block text-[10px] font-black tracking-[0.4em] uppercase text-slate-500 mb-4">Enter Student ID (e.g., Stu-2025-XXXX)</label>
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              className="flex-1 bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 text-2xl font-black tracking-tight focus:outline-none focus:border-blue-600 uppercase"
              placeholder="STU-2025-..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
            <button 
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-3xl font-black tracking-tighter text-xl transition-all shadow-xl shadow-blue-600/20"
            >
              LOCATE
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in zoom-in-95 duration-300">
          <div className="bg-white text-slate-950 p-10 rounded-[4rem] shadow-2xl flex flex-col items-center text-center">
            <div className="w-48 h-48 bg-slate-100 rounded-[3rem] flex items-center justify-center mb-8 border-2 border-slate-200">
              <QrCode size={120} strokeWidth={1.5} />
            </div>
            <h2 className="text-4xl font-black tracking-tighter mb-2">{student.name}</h2>
            <p className="text-blue-600 font-black tracking-[0.3em] uppercase mb-6">{student.id}</p>
            
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-slate-50 p-4 rounded-[2rem]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade</p>
                <p className="text-xl font-black">{student.grade}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-[2rem]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Paid</p>
                <p className="text-xl font-black">{student.lastPaymentMonth}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[4rem] border border-slate-800">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black tracking-tighter uppercase">Financial Ledger</h3>
              <div className="px-4 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-black uppercase">Active Record</div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-6 bg-slate-950 rounded-[2.5rem] border border-slate-800">
                <div>
                  <p className="font-black text-lg">Tuition Settlement</p>
                  <p className="text-slate-500 text-sm font-bold">Standard Monthly Fee</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black tracking-tighter">LKR 2,500</p>
                  <button 
                    onClick={() => setShowPayModal(true)}
                    className="text-blue-500 font-bold uppercase text-xs tracking-widest hover:text-blue-400"
                  >
                    Pay at Office
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80">
          <div className="bg-slate-900 w-full max-w-md p-10 rounded-[4rem] border border-slate-800 shadow-3xl text-center space-y-8 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-blue-600/10 text-blue-500 rounded-full flex items-center justify-center mx-auto">
              <MapPin size={40} />
            </div>
            <div>
              <h4 className="text-3xl font-black tracking-tighter uppercase">Office Settlement</h4>
              <p className="text-slate-500 font-bold">Please request the 4-digit code from the desk staff to verify cash payment.</p>
            </div>
            
            <input 
              className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-6 text-4xl font-black tracking-[0.5em] text-center focus:outline-none focus:border-blue-600"
              maxLength={4}
              placeholder="0000"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
            />

            <div className="flex flex-col gap-4">
              <button 
                onClick={handleOfficePay}
                className="w-full bg-white text-slate-950 py-5 rounded-3xl font-black uppercase tracking-tighter text-xl hover:bg-slate-200"
              >
                VERIFY & PAY
              </button>
              <button 
                onClick={() => setShowPayModal(false)}
                className="text-slate-500 font-bold uppercase text-sm tracking-widest"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPortal;
