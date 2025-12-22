
import React, { useMemo, useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { Users, TrendingUp, Calendar, AlertCircle, ShieldEllipsis } from 'lucide-react';
import { Student, AttendanceRecord, PaymentRecord } from '../types';

const Dashboard: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [otp, setOtp] = useState<string | null>(null);

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
    // Also listen for real-time student updates
    return storageService.listenStudents(setStudents);
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a => a.date === today).length;
    const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);
    const pendingCount = students.filter(s => s.lastPaymentMonth < today.slice(0, 7)).length;

    return [
      { label: 'Total Personnel', value: students.length, icon: Users, color: 'text-blue-500' },
      { label: 'Gate Entries (Today)', value: todayAttendance, icon: Calendar, color: 'text-emerald-500' },
      { label: 'Net Revenue', value: `LKR ${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-amber-500' },
      { label: 'Pending Overdue', value: pendingCount, icon: AlertCircle, color: 'text-rose-500' },
    ];
  }, [students, attendance, payments]);

  const chartData = useMemo(() => {
    const grades = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'O/L', 'A/L'];
    return grades.map(g => ({
      name: g,
      count: students.filter(s => s.grade === g).length
    }));
  }, [students]);

  const handleGenerateOTP = async () => {
    const code = await storageService.generateOTP();
    setOtp(code);
    setTimeout(() => setOtp(null), 300000); 
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none">Monitor Station</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.5em] mt-3">Institutional Vital Analytics & Security Terminal</p>
        </div>
        
        <div className="bg-slate-900 border-2 border-slate-800 p-8 rounded-[4rem] flex items-center gap-10 shadow-3xl shadow-blue-900/10">
          <div>
            <p className="text-[10px] font-black tracking-[0.5em] uppercase text-slate-600 mb-2">Gate Passcode</p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        {stats.map((stat, idx) => (
          <div key={stat.label} className="bg-slate-900/50 border border-slate-800 p-10 rounded-[4rem] shadow-2xl group hover:border-blue-500/30 transition-all">
            <div className={`w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform ${stat.color}`}>
              <stat.icon size={28} />
            </div>
            <p className="text-[10px] font-black tracking-[0.5em] uppercase text-slate-600 mb-2">{stat.label}</p>
            <p className="text-5xl font-black tracking-tighter italic">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Distribution Chart */}
      <div className="bg-slate-900/30 border-2 border-slate-800 p-12 rounded-[5.5rem] shadow-3xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
        <h3 className="text-3xl font-black mb-12 tracking-tight uppercase italic leading-none">Personnel Distribution</h3>
        <div className="h-[450px] w-full min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#475569', fontWeight: '900', fontSize: 10, letterSpacing: '2px' }} 
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
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
                itemStyle={{ fontWeight: '900', textTransform: 'uppercase', color: '#3b82f6' }}
              />
              <Bar dataKey="count" radius={[24, 24, 24, 24]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563eb' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
