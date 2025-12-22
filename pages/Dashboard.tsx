
import React, { useMemo, useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { generateWhatsAppDraft } from '../services/geminiService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { Users, TrendingUp, Calendar, AlertCircle, ShieldEllipsis, MessageSquare, ArrowRight, Loader2, GraduationCap, LibraryBig } from 'lucide-react';
import { Student, AttendanceRecord, PaymentRecord, Grade, ResultRecord, MaterialRecord } from '../types';

const Dashboard: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [materials, setMaterials] = useState<MaterialRecord[]>([]);
  const [otp, setOtp] = useState<string | null>(null);
  const [remindingId, setRemindingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const s = await storageService.getStudents();
      const a = await storageService.getAttendance();
      const p = await storageService.getPayments();
      setStudents(s);
      setAttendance(a);
      setPayments(p);
    };
    fetchData();
    const unsubS = storageService.listenStudents(setStudents);
    const unsubR = storageService.listenResults(setResults);
    const unsubM = storageService.listenMaterials(setMaterials);
    return () => {
      unsubS();
      unsubR();
      unsubM();
    };
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a => a.date === today).length;
    const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);
    const pendingCount = students.filter(s => s.lastPaymentMonth < today.slice(0, 7)).length;

    return [
      { label: 'Academic Force', value: students.length, icon: Users, color: 'text-blue-500' },
      { label: 'Gate entries (Today)', value: todayAttendance, icon: Calendar, color: 'text-emerald-500' },
      { label: 'Assessments Logged', value: results.length, icon: GraduationCap, color: 'text-purple-500' },
      { label: 'Study Hub Assets', value: materials.length, icon: LibraryBig, color: 'text-amber-500' },
    ];
  }, [students, attendance, results, materials]);

  const pendingStudents = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return students.filter(s => s.lastPaymentMonth < currentMonth).slice(0, 5);
  }, [students]);

  const chartData = useMemo(() => {
    const grades: Grade[] = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11'];
    return grades.map(g => ({
      name: g.replace('Grade ', 'G'),
      count: students.filter(s => s.grade === g).length
    }));
  }, [students]);

  const handleGenerateOTP = async () => {
    const code = await storageService.generateOTP();
    setOtp(code);
    setTimeout(() => setOtp(null), 300000); 
  };

  const sendReminder = async (student: Student) => {
    setRemindingId(student.id);
    try {
      const draft = await generateWhatsAppDraft(student, 'payment');
      const phone = student.contact.replace(/\D/g, '');
      const waPhone = phone.startsWith('0') ? '94' + phone.substring(1) : phone;
      const encodedText = encodeURIComponent(draft);
      window.open(`https://wa.me/${waPhone}?text=${encodedText}`, '_blank');
    } catch (e) {
      console.error("Reminder failed", e);
    } finally {
      setRemindingId(null);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none text-white">Monitor Station</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.5em] mt-3">Vital Institutional Analytics & Security Console</p>
        </div>
        
        <div className="bg-slate-900 border-2 border-slate-800 p-8 rounded-[4rem] flex items-center gap-10 shadow-3xl shadow-blue-900/10">
          <div>
            <p className="text-[10px] font-black tracking-[0.5em] uppercase text-slate-600 mb-2">Personnel OTP</p>
            <p className="text-4xl font-black tracking-[0.2em] italic text-blue-500">{otp || '----'}</p>
          </div>
          <button 
            onClick={handleGenerateOTP}
            className="w-16 h-16 bg-blue-600 rounded-[1.8rem] flex items-center justify-center hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
            title="Generate Secure Access Key"
          >
            <ShieldEllipsis size={32} className="text-white" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        {stats.map((stat, idx) => (
          <div key={stat.label} className="bg-slate-900/50 border border-slate-800 p-10 rounded-[4rem] shadow-2xl group hover:border-blue-500/30 transition-all">
            <div className={`w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform ${stat.color}`}>
              <stat.icon size={28} />
            </div>
            <p className="text-[10px] font-black tracking-[0.5em] uppercase text-slate-600 mb-2">{stat.label}</p>
            <p className="text-4xl font-black tracking-tighter italic text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/30 border-2 border-slate-800 p-12 rounded-[5.5rem] shadow-3xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <h3 className="text-3xl font-black mb-12 tracking-tight uppercase italic leading-none text-white text-center md:text-left">Class Distribution</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontWeight: '900', fontSize: 10, letterSpacing: '1px' }} 
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ 
                    backgroundColor: '#020617', 
                    borderColor: '#1e293b', 
                    borderRadius: '2rem',
                    padding: '1.5rem',
                    color: 'white',
                    border: '1px solid #1e293b',
                  }}
                />
                <Bar dataKey="count" radius={[12, 12, 12, 12]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563eb' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/50 border-2 border-slate-800 p-10 rounded-[4rem] shadow-3xl animate-in slide-in-from-right-8 duration-700">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Payment Alerts</h3>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {pendingStudents.map(s => (
              <div key={s.id} className="bg-slate-950 p-6 rounded-3xl border border-slate-800/50 group hover:border-blue-500/50 transition-all shadow-inner">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight text-slate-200">{s.name}</p>
                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-0.5">Last Settled: {s.lastPaymentMonth}</p>
                  </div>
                  <button 
                    onClick={() => sendReminder(s)}
                    disabled={remindingId === s.id}
                    className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-inner"
                    title="Send WhatsApp Reminder"
                  >
                    {remindingId === s.id ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">{s.grade}</span>
                </div>
              </div>
            ))}
            {pendingStudents.length === 0 && (
              <div className="py-20 text-center opacity-20">
                <p className="font-black uppercase tracking-[0.5em] text-xs">All accounts settled</p>
              </div>
            )}
            <button className="w-full mt-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 hover:text-white transition-all">
              Comprehensive Audit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
