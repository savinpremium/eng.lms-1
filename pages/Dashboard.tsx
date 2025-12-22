
import React, { useMemo } from 'react';
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

const Dashboard: React.FC = () => {
  const students = storageService.getStudents();
  const attendance = storageService.getAttendance();
  const payments = storageService.getPayments();

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a => a.date === today).length;
    const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);
    const pendingCount = students.length; // Simplified for demo

    return [
      { label: 'Total Personnel', value: students.length, icon: Users, color: 'text-blue-500' },
      { label: 'Today Attendance', value: todayAttendance, icon: Calendar, color: 'text-emerald-500' },
      { label: 'Total Revenue', value: `LKR ${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-amber-500' },
      { label: 'Pending Status', value: pendingCount, icon: AlertCircle, color: 'text-rose-500' },
    ];
  }, [students, attendance, payments]);

  const chartData = useMemo(() => {
    const grades = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'O/L', 'A/L'];
    return grades.map(g => ({
      name: g,
      count: students.filter(s => s.grade === g).length
    }));
  }, [students]);

  const [otp, setOtp] = React.useState<string | null>(null);
  const handleGenerateOTP = () => {
    setOtp(storageService.generateOTP());
    setTimeout(() => setOtp(null), 300000); // Clear after 5 mins visually
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase">Executive Monitor</h1>
          <p className="text-slate-500 font-bold">Institutional health and revenue tracking.</p>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[3rem] flex items-center gap-6 shadow-2xl">
          <div>
            <p className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-500">Security Terminal</p>
            <p className="text-2xl font-black tracking-tighter">{otp || '----'}</p>
          </div>
          <button 
            onClick={handleGenerateOTP}
            className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-500 transition-all"
          >
            <ShieldEllipsis size={24} />
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-slate-900/50 border border-slate-800 p-8 rounded-[3rem] shadow-xl hover:translate-y-[-4px] transition-all">
            <div className={`w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center mb-6 shadow-inner ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-500 mb-1">{stat.label}</p>
            <p className="text-4xl font-black tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Distribution Chart */}
      <div className="bg-slate-900/30 border border-slate-800 p-10 rounded-[5rem]">
        <h3 className="text-2xl font-black mb-8 tracking-tight uppercase">Student Distribution</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontWeight: 'bold' }} 
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ 
                  backgroundColor: '#020617', 
                  borderColor: '#1e293b', 
                  borderRadius: '1rem',
                  color: 'white'
                }}
              />
              <Bar dataKey="count" radius={[20, 20, 20, 20]}>
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
