
import React, { useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { Student, PaymentRecord } from '../types';
import { Search, Printer, CreditCard, ChevronRight, User, Hash } from 'lucide-react';

const PaymentDesk: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [lastReceipt, setLastReceipt] = useState<PaymentRecord | null>(null);

  const students = storageService.getStudents();
  
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return [];
    return students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, students]);

  const handleProcessPayment = (student: Student, month: string) => {
    const payment: PaymentRecord = {
      id: `REC-${Date.now()}`,
      studentId: student.id,
      amount: 2500, // Fixed flat fee
      month,
      method: 'Cash',
      timestamp: Date.now()
    };

    storageService.addPayment(payment);
    const updatedStudent = { ...student, lastPaymentMonth: month };
    storageService.updateStudent(updatedStudent);
    
    setSelectedStudent(updatedStudent);
    setLastReceipt(payment);
    audioService.playCash();
  };

  const handlePrint = () => {
    const printEl = document.getElementById('print-section');
    if (!printEl || !lastReceipt || !selectedStudent) return;

    printEl.innerHTML = `
      <div style="width: 80mm; padding: 10px; font-family: monospace; color: black; background: white;">
        <center>
          <h2 style="margin: 0;">EXCELLENCE ENGLISH</h2>
          <p style="margin: 5px 0;">Premium Education System</p>
          <p>----------------------------</p>
        </center>
        <p>RECEIPT: ${lastReceipt.id}</p>
        <p>DATE: ${new Date(lastReceipt.timestamp).toLocaleString()}</p>
        <p>STUDENT: ${selectedStudent.name}</p>
        <p>ID: ${selectedStudent.id}</p>
        <p>GRADE: ${selectedStudent.grade}</p>
        <p>----------------------------</p>
        <p>MONTH: ${lastReceipt.month}</p>
        <p>AMOUNT: LKR ${lastReceipt.amount.toLocaleString()}.00</p>
        <p>METHOD: ${lastReceipt.method}</p>
        <p>----------------------------</p>
        <center>
          <p>Thank you for your payment!</p>
          <p>excellenceenglish.lk</p>
        </center>
      </div>
    `;
    window.print();
  };

  // Generate list of months for payment (simplified)
  const getUnpaidMonths = (lastPaid: string) => {
    const [year, month] = lastPaid.split('-').map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return [`${nextYear}-${nextMonth.toString().padStart(2, '0')}`];
  };

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase">Executive Ledger</h1>
          <p className="text-slate-500 font-bold">Secure financial terminal for fee settlement.</p>
        </div>
      </header>

      <div className="relative group max-w-xl">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-all" size={24} />
        <input 
          placeholder="SEARCH STUDENT NAME OR ID..."
          className="w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] pl-16 pr-8 py-6 text-xl font-black tracking-tight focus:outline-none focus:border-blue-600 transition-all shadow-2xl"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        {searchTerm && filteredStudents.length > 0 && !selectedStudent && (
          <div className="absolute top-full left-0 right-0 mt-4 bg-slate-900 border border-slate-800 rounded-[3rem] p-4 shadow-3xl z-50">
            {filteredStudents.map(s => (
              <button 
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-800 rounded-3xl transition-all"
              >
                <div className="text-left">
                  <p className="font-black text-lg">{s.name}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.id}</p>
                </div>
                <ChevronRight className="text-slate-600" />
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-900/50 p-10 rounded-[4rem] border border-slate-800 space-y-8">
            <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
              <User className="text-blue-500" />
              Student Profile
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-slate-950 rounded-3xl border border-slate-800 flex items-center justify-center text-slate-500">
                  <Hash size={32} />
                </div>
                <div>
                  <p className="text-4xl font-black tracking-tighter">{selectedStudent.name}</p>
                  <p className="text-blue-500 font-bold uppercase text-xs tracking-[0.2em]">{selectedStudent.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Grade</p>
                  <p className="text-xl font-black">{selectedStudent.grade}</p>
                </div>
                <div className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-xl font-black text-emerald-500">ACTIVE</p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-950 rounded-[3rem] border border-slate-800">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Unpaid Settlements</p>
              {getUnpaidMonths(selectedStudent.lastPaymentMonth).map(month => (
                <button 
                  key={month}
                  onClick={() => handleProcessPayment(selectedStudent, month)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white p-6 rounded-[2rem] flex items-center justify-between font-black tracking-tighter transition-all"
                >
                  <span className="text-2xl uppercase">{month} TUITION</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl opacity-80">LKR 2,500</span>
                    <CreditCard size={20} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            {lastReceipt ? (
              <div className="bg-white text-slate-950 p-12 rounded-[4rem] shadow-2xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-bl-[4rem]"></div>
                <div className="relative">
                  <h4 className="text-3xl font-black tracking-tighter uppercase mb-6">Payment Success</h4>
                  
                  <div className="space-y-4 font-mono text-sm border-y border-slate-100 py-6">
                    <div className="flex justify-between"><span>RECEIPT</span> <span>{lastReceipt.id}</span></div>
                    <div className="flex justify-between"><span>STUDENT</span> <span>{selectedStudent.name}</span></div>
                    <div className="flex justify-between"><span>MONTH</span> <span>{lastReceipt.month}</span></div>
                    <div className="flex justify-between text-xl font-black"><span>TOTAL</span> <span>LKR {lastReceipt.amount.toLocaleString()}.00</span></div>
                  </div>

                  <button 
                    onClick={handlePrint}
                    className="w-full bg-slate-950 text-white mt-8 py-5 rounded-3xl flex items-center justify-center gap-3 font-black tracking-tighter hover:bg-slate-800 transition-all"
                  >
                    <Printer size={20} />
                    PRINT THERMAL RECEIPT
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-[4rem] flex flex-col items-center justify-center text-slate-700 p-12 text-center">
                <Printer size={64} className="mb-6 opacity-20" />
                <p className="text-2xl font-black uppercase tracking-tighter">Receipt Preview</p>
                <p className="font-bold opacity-40">Process a payment to generate receipt</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDesk;
