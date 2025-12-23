
import React, { useState, useEffect, useRef } from 'react';
import { storageService, auth } from '../services/storageService';
import { audioService } from '../services/audioService';
import { Institution, Tier, PaymentMode, InstitutionStatus } from '../types';
import { 
  Plus, 
  ShieldCheck, 
  Mail, 
  Building, 
  Search, 
  Smartphone, 
  ArrowRight, 
  Loader2, 
  RefreshCw, 
  MapPin, 
  CreditCard, 
  FileText, 
  Fingerprint, 
  PenTool,
  CheckCircle2,
  X,
  ChevronRight,
  ShieldAlert,
  Briefcase,
  Scale,
  Settings2,
  Lock,
  Unlock,
  Trash2,
  Snowflake,
  Activity,
  // Fix: Added missing 'Layers' import
  Layers
} from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

const SuperAdminDesk: React.FC = () => {
  const [institutes, setInstitutes] = useState<Institution[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showManage, setShowManage] = useState<Institution | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [termsRead, setTermsRead] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [formData, setFormData] = useState<Omit<Institution, 'id' | 'createdAt' | 'digitalSignature' | 'termsAccepted' | 'status'>>({
    name: '',
    email: '',
    password: '',
    ownerPhone: '',
    ownerNIC: '',
    registrationNumber: '',
    address: '',
    tier: 'Lite',
    paymentMode: 'Subscription',
    subjects: ['General'],
    location: ''
  });

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    const unsub = storageService.listenInstitutions(setInstitutes);
    return () => unsub();
  }, []);

  const setupRecaptcha = () => {
    if (recaptchaVerifierRef.current) return;
    try {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => console.log("Recaptcha resolved"),
      });
    } catch (e) {
      console.error("Recaptcha error", e);
    }
  };

  const handleStartVerification = async () => {
    if (!formData.ownerPhone.startsWith('+')) {
      alert("Please enter phone number in international format (+94...)");
      return;
    }
    setIsVerifying(true);
    setupRecaptcha();
    try {
      const result = await signInWithPhoneNumber(auth, formData.ownerPhone, recaptchaVerifierRef.current!);
      setConfirmationResult(result);
      setCurrentStep(3);
      audioService.playSuccess();
    } catch (error: any) {
      alert("Verification hub error: " + error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!confirmationResult || !otpCode) return;
    setIsVerifying(true);
    try {
      await confirmationResult.confirm(otpCode);
      setCurrentStep(4);
      audioService.playSuccess();
    } catch (error: any) {
      audioService.playError();
      alert("Invalid Security Code.");
    } finally {
      setIsVerifying(false);
    }
  };

  const finalizeRegistration = async () => {
    if (!signatureData) {
      alert("Legal signature required.");
      return;
    }
    setIsVerifying(true);
    try {
      await storageService.saveInstitution({ 
        ...formData, 
        digitalSignature: signatureData,
        termsAccepted: true,
        status: 'Active',
        id: '', 
        createdAt: Date.now() 
      } as Institution);
      
      audioService.playCash();
      setShowAdd(false);
      resetForm();
    } catch (e: any) {
      alert("Deployment Error: " + e.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: InstitutionStatus) => {
    if (!confirm(`Are you sure you want to change node status to ${status}?`)) return;
    try {
      await storageService.updateInstitution(id, { status });
      setShowManage(null);
      audioService.playSuccess();
    } catch (e: any) {
      alert("Update failed: " + e.message);
    }
  };

  const handleDeleteInstitution = async (id: string) => {
    if (!confirm("CRITICAL WARNING: This will permanently delete the institution node and all associated configuration. Data destruction is irreversible. Proceed?")) return;
    try {
      await storageService.deleteInstitution(id);
      setShowManage(null);
      audioService.playError();
    } catch (e: any) {
      alert("Deletion failed: " + e.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', ownerPhone: '', ownerNIC: '', registrationNumber: '', address: '', tier: 'Lite', paymentMode: 'Subscription', subjects: ['General'], location: '' });
    setCurrentStep(1);
    setOtpCode('');
    setConfirmationResult(null);
    setSignatureData(null);
    setTermsRead(false);
  };

  // Canvas Drawing
  const getPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: any) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#020617';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) setSignatureData(canvasRef.current.toDataURL());
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureData(null);
    }
  };

  const packages = [
    { id: 'Lite', monthly: '2,500', oneTime: '25,000' },
    { id: 'Platinum', monthly: '7,500', oneTime: '75,000' },
    { id: 'Golden', monthly: '15,000', oneTime: '150,000' }
  ];

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-in fade-in duration-500 px-4">
        <div>
          <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none text-white">Network <span className="text-blue-500">HQ</span></h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.5em] mt-3 flex items-center gap-2">
            <ShieldCheck size={12} className="text-blue-500" />
            Institutional Node Management
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-6 rounded-[2.5rem] font-black text-xs tracking-widest uppercase flex items-center gap-4 transition-all shadow-3xl border-b-8 border-blue-800 active:translate-y-1 active:border-b-0">
          <Plus size={24} />
          Deploy Campus Node
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
        {institutes.map(inst => (
          <div key={inst.id} className={`bg-slate-900 border-2 p-10 rounded-[4.5rem] shadow-3xl group relative overflow-hidden h-full flex flex-col justify-between transition-all ${
            inst.status === 'Suspended' ? 'border-rose-500/50 opacity-60' : 
            inst.status === 'Frozen' ? 'border-amber-500/50' : 
            'border-slate-800 hover:border-blue-500/40'
          }`}>
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-2">
                   <span className={`text-[9px] font-black uppercase tracking-[0.3em] px-5 py-2 rounded-full border w-fit ${
                    inst.tier === 'Golden' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                    inst.tier === 'Platinum' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                    'bg-slate-500/10 text-slate-500 border-slate-500/20'
                  }`}>
                    {inst.tier} • {inst.paymentMode === 'OneTime' ? 'OWNED' : 'SUBSCRIPTION'}
                  </span>
                  <span className={`text-[7px] font-black uppercase tracking-[0.4em] px-3 py-1 rounded-full border w-fit ${
                    inst.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                    inst.status === 'Frozen' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                    'bg-rose-500/10 text-rose-500 border-rose-500/20'
                  }`}>
                    {inst.status}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-600 font-mono">ID: {inst.id}</p>
              </div>
              <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-none">{inst.name}</h3>
              <div className="space-y-4 pt-6 border-t border-slate-800/50">
                <div className="flex items-center gap-3 text-slate-500">
                  <Smartphone size={14} className="text-blue-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{inst.ownerPhone}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <FileText size={14} className="text-blue-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">BR: {inst.registrationNumber}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setShowManage(inst)} className="w-full mt-8 py-4 bg-slate-950 border border-slate-800 rounded-2xl font-black uppercase text-[9px] tracking-[0.3em] text-slate-500 hover:text-white transition-all flex items-center justify-center gap-2">
              <Settings2 size={14} />
              Manage Node Terminal
            </button>
          </div>
        ))}
      </div>

      {/* MANAGE INSTITUTION MODAL */}
      {showManage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-3xl bg-slate-950/90 overflow-y-auto">
          <div className="bg-slate-900 w-full max-w-lg rounded-[4rem] border border-slate-800 shadow-3xl p-12 space-y-10 animate-in zoom-in duration-300">
            <div className="flex justify-between items-start">
               <div>
                  <h4 className="text-3xl font-black tracking-tighter uppercase italic text-white leading-none">{showManage.name}</h4>
                  <p className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.4em] mt-2">ID: {showManage.id} • Node Control Panel</p>
               </div>
               <button onClick={() => setShowManage(null)} className="text-slate-500 hover:text-white transition-colors"><X size={28} /></button>
            </div>

            <div className="grid grid-cols-1 gap-4">
               <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 flex items-center gap-2">
                    <Activity size={12} className="text-blue-500" />
                    Network Governance
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                     <button 
                        onClick={() => handleUpdateStatus(showManage.id, showManage.status === 'Active' ? 'Suspended' : 'Active')}
                        className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                          showManage.status === 'Suspended' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white shadow-xl shadow-rose-600/20'
                        }`}
                      >
                        {showManage.status === 'Suspended' ? <Unlock size={14} /> : <Lock size={14} />}
                        {showManage.status === 'Suspended' ? 'Unsuspend' : 'Suspend'}
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(showManage.id, showManage.status === 'Frozen' ? 'Active' : 'Frozen')}
                        className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                          showManage.status === 'Frozen' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white shadow-xl shadow-amber-600/20'
                        }`}
                      >
                        {showManage.status === 'Frozen' ? <Activity size={14} /> : <Snowflake size={14} />}
                        {showManage.status === 'Frozen' ? 'Unfreeze' : 'Freeze Node'}
                      </button>
                  </div>
               </div>

               <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 flex items-center gap-2">
                    <Layers size={12} className="text-blue-500" />
                    Infrastructure Tiering
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                     {(['Lite', 'Platinum', 'Golden'] as Tier[]).map(t => (
                        <button 
                          key={t}
                          onClick={() => storageService.updateInstitution(showManage.id, { tier: t }).then(() => setShowManage(null))}
                          className={`py-3 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${showManage.tier === t ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                        >
                          {t}
                        </button>
                     ))}
                  </div>
               </div>
            </div>

            <div className="pt-6 border-t border-slate-800">
               <button 
                onClick={() => handleDeleteInstitution(showManage.id)}
                className="w-full py-5 bg-slate-950 text-rose-500 hover:bg-rose-500 hover:text-white rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all border border-rose-500/20"
               >
                 <Trash2 size={16} />
                 Permanent Node Destruction
               </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-3xl bg-slate-950/95 overflow-y-auto">
          <div className="bg-slate-900 w-full max-w-3xl rounded-[5rem] border border-slate-800 shadow-3xl flex flex-col md:flex-row overflow-hidden min-h-[650px]">
            {/* Steps Sidebar */}
            <div className="w-full md:w-64 bg-slate-950 p-12 flex flex-col justify-between border-r border-slate-800/50">
              <div className="space-y-12">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Fingerprint className="text-white" size={20} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">Legal Desk</span>
                </div>
                <div className="space-y-8">
                  {[1, 2, 3, 4].map(s => (
                    <div key={s} className={`flex items-center gap-4 transition-opacity ${currentStep >= s ? 'opacity-100' : 'opacity-20'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${currentStep === s ? 'bg-blue-600 text-white' : currentStep > s ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-500'}`}>
                        {currentStep > s ? <CheckCircle2 size={14} /> : s}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest">{s === 1 ? 'Tier' : s === 2 ? 'Identity' : s === 3 ? 'Sync' : 'Legal'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[8px] font-black uppercase text-slate-700 tracking-widest leading-relaxed">Admin Upgrade Charge: LKR 1,500 Applicable for Tier Changes.</p>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-12 flex flex-col justify-center relative bg-slate-900/40">
              <button onClick={() => { setShowAdd(false); resetForm(); }} className="absolute top-8 right-10 text-slate-500 hover:text-white transition-colors">
                <X size={28} />
              </button>
              <div id="recaptcha-container"></div>

              {currentStep === 1 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                  <div>
                    <h4 className="text-4xl font-black tracking-tighter uppercase italic text-white leading-none">Node Selection</h4>
                    <div className="flex gap-4 mt-6">
                      <button onClick={() => setFormData({...formData, paymentMode: 'Subscription'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border ${formData.paymentMode === 'Subscription' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>Subscription</button>
                      <button onClick={() => setFormData({...formData, paymentMode: 'OneTime'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border ${formData.paymentMode === 'OneTime' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>One-Time Buy</button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {packages.map(pkg => (
                      <button key={pkg.id} onClick={() => setFormData({...formData, tier: pkg.id as Tier})} className={`w-full p-6 rounded-3xl border-2 text-left flex justify-between items-center transition-all ${formData.tier === pkg.id ? 'bg-blue-600 border-blue-500 text-white shadow-2xl scale-[1.02]' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                        <div>
                          <p className="text-xl font-black uppercase italic leading-none">{pkg.id} Hub</p>
                          <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mt-2">Node Infrastructure Pack</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black leading-none uppercase">LKR {formData.paymentMode === 'OneTime' ? pkg.oneTime : pkg.monthly}</p>
                          <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mt-1">{formData.paymentMode === 'OneTime' ? 'Lifetime Access' : 'Per Month'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setCurrentStep(2)} className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 border-b-8 border-blue-800 active:translate-y-1 active:border-b-0">
                    Enter Legal Registry <ChevronRight size={18} />
                  </button>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                  <div>
                    <h4 className="text-4xl font-black tracking-tighter uppercase italic text-white leading-none">Identity File</h4>
                    <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mt-2">Enter official record details for the contract</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-4">Campus Name</label>
                      <input placeholder="OXFORD ACADEMY" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-8 py-4 font-black text-xs uppercase text-white outline-none focus:border-blue-600" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-4">Owner NIC</label>
                      <input placeholder="199XXXXXXXXX" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-8 py-4 font-black text-xs uppercase text-white outline-none focus:border-blue-600" value={formData.ownerNIC} onChange={e => setFormData({...formData, ownerNIC: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-4">BR Number</label>
                      <input placeholder="BR/1234/COL" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-8 py-4 font-black text-xs uppercase text-white outline-none focus:border-blue-600" value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-4">Phone (Intl.)</label>
                      <input placeholder="+94 77 XXX XXXX" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-8 py-4 font-black text-xs uppercase text-white outline-none focus:border-blue-600" value={formData.ownerPhone} onChange={e => setFormData({...formData, ownerPhone: e.target.value})} />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-4">Physical Address</label>
                      <textarea placeholder="STREET, CITY, REGION" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-8 py-4 font-black text-xs uppercase text-white outline-none focus:border-blue-600 h-20 resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setCurrentStep(1)} className="flex-1 py-5 bg-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-2xl">Back</button>
                    <button onClick={() => setCurrentStep(3)} className="flex-1 py-5 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl">Continue Phase</button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-10 animate-in zoom-in-95">
                  <div className="text-center">
                    <Briefcase className="mx-auto text-blue-500 mb-6" size={48} />
                    <h4 className="text-4xl font-black tracking-tighter uppercase italic text-white leading-none">Security Sync</h4>
                    <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mt-2">Authenticating Phone: {formData.ownerPhone}</p>
                  </div>
                  {!confirmationResult ? (
                    <button onClick={handleStartVerification} disabled={isVerifying} className="w-full bg-blue-600 text-white py-8 rounded-[3rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-3xl border-b-8 border-blue-800 active:translate-y-1 active:border-b-0">
                      {isVerifying ? <Loader2 className="animate-spin" /> : <>Request Legal OTP <ShieldCheck size={18}/></>}
                    </button>
                  ) : (
                    <div className="space-y-6">
                      <input maxLength={6} placeholder="------" className="w-full bg-slate-950 border-2 border-slate-800 rounded-[2.5rem] px-8 py-8 text-6xl font-black tracking-[0.5em] focus:border-blue-600 focus:outline-none text-center text-blue-500 uppercase" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} />
                      <button onClick={handleVerifyOTP} disabled={isVerifying || otpCode.length < 6} className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl">
                        {isVerifying ? <Loader2 className="animate-spin" /> : "Verify Security Hash"}
                      </button>
                    </div>
                  )}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-4 text-left">
                    <ShieldAlert size={20} className="text-amber-500 flex-shrink-0" />
                    <p className="text-[8px] font-black uppercase text-slate-500 leading-relaxed tracking-widest">Phone authentication creates a unique digital footprint for this institution.</p>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4">
                  <div>
                    <h4 className="text-4xl font-black tracking-tighter uppercase italic text-white leading-none">Authorization</h4>
                    <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mt-2">Finalize legal node deployment agreement</p>
                  </div>

                  {/* Terms Box */}
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 h-40 overflow-y-auto custom-scrollbar text-[9px] text-slate-400 font-bold uppercase tracking-tight leading-relaxed">
                    <p className="text-blue-500 mb-2 font-black">1. Institutional Compliance</p>
                    <p>By signing, the owner acknowledges all data within SmartClass.lk is managed under institutional liability. SmartClass.lk serves only as a platform facilitator.</p>
                    <p className="text-blue-500 mt-4 mb-2 font-black">2. Ownership vs Subscription</p>
                    <p>Subscription models require timely payments. Failure to settle monthly fees will lock the node console. One-time buy options include 10 years of cloud persistence.</p>
                    <p className="text-blue-500 mt-4 mb-2 font-black">3. Upgrade Policy</p>
                    <p>Upgrades between tiers incur a fixed LKR 1,500 Administrative Charge + Price Delta. No refunds for downgrades.</p>
                  </div>
                  
                  <div className="flex items-center gap-4 px-2">
                    <button onClick={() => setTermsRead(!termsRead)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${termsRead ? 'bg-blue-600 border-blue-500' : 'border-slate-800 bg-slate-950'}`}>
                      {termsRead && <CheckCircle2 size={16} className="text-white" />}
                    </button>
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">I agree to the Legal Provisioning Terms</span>
                  </div>

                  <div className={`relative bg-white rounded-3xl overflow-hidden border-4 border-slate-800 h-40 transition-opacity ${termsRead ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <canvas ref={canvasRef} width={600} height={160} className="w-full h-full cursor-crosshair touch-none" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
                    {!signatureData && <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20"><Scale className="text-slate-950 mr-3" size={24} /><span className="text-slate-950 font-black uppercase text-[10px] tracking-widest">Authorized Signature Required</span></div>}
                    <button onClick={clearCanvas} className="absolute bottom-4 right-4 bg-slate-900 text-slate-500 p-2 rounded-lg hover:text-white transition-colors"><RefreshCw size={14}/></button>
                  </div>

                  <button onClick={finalizeRegistration} disabled={!signatureData || !termsRead || isVerifying} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-8 rounded-[3rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 transition-all shadow-3xl border-b-8 border-emerald-800 active:translate-y-1 active:border-b-0">
                    {isVerifying ? <Loader2 className="animate-spin" /> : <>Finalize Deployment Contract <CreditCard size={20}/></>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDesk;
