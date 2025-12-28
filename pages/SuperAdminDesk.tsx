
import React, { useState, useEffect, useRef } from 'react';
import { storageService, auth } from '../services/storageService';
import { audioService } from '../services/audioService';
import { Institution, Tier, PaymentMode, InstitutionStatus } from '../types';
import { 
  Plus, ShieldCheck, Building, Search, ArrowRight, Loader2, RefreshCw, PenTool, 
  CheckCircle2, X, ChevronRight, Scale, Settings2, Lock, Unlock, Trash2, Snowflake, Activity, Layers, Mail, Smartphone
} from 'lucide-react';

const SuperAdminDesk: React.FC = () => {
  const [institutes, setInstitutes] = useState<Institution[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showManage, setShowManage] = useState<Institution | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [formData, setFormData] = useState<Omit<Institution, 'createdAt' | 'digitalSignature' | 'termsAccepted' | 'status' | 'emailVerified'>>({
    id: '', // Auto-generated or custom
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

  useEffect(() => {
    return storageService.listenInstitutions(setInstitutes);
  }, []);

  const generateAutoId = async () => {
    let newId = '';
    let exists = true;
    while(exists) {
      newId = `CLASS-${Math.floor(1000 + Math.random() * 9000)}`;
      exists = await storageService.checkIdExists(newId);
    }
    setFormData(prev => ({ ...prev, id: newId }));
  };

  useEffect(() => {
    if (showAdd && !formData.id) generateAutoId();
  }, [showAdd]);

  const handleStartEmailVerification = async () => {
    if (!formData.email.includes('@')) {
      alert("Invalid email format.");
      return;
    }
    setEmailVerifying(true);
    try {
      // In a real flow, this triggers Firebase sendEmailVerification
      await storageService.registerInstitutionAuth(formData.email, formData.password);
      alert("Verification email dispatched to " + formData.email + ". Please verify to complete activation.");
      setCurrentStep(3);
      audioService.playSuccess();
    } catch (error: any) {
      alert("Auth Hub Error: " + error.message);
    } finally {
      setEmailVerifying(false);
    }
  };

  const finalizeRegistration = async () => {
    if (!signatureData) { alert("Legal signature required."); return; }
    if (!termsAccepted) { alert("Agreement must be signed."); return; }
    
    setIsVerifying(true);
    try {
      await storageService.saveInstitution({ 
        ...formData, 
        digitalSignature: signatureData,
        termsAccepted: true,
        status: 'Active',
        createdAt: Date.now(),
        emailVerified: false // Will be updated by system later
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

  const resetForm = () => {
    setFormData({ id: '', name: '', email: '', password: '', ownerPhone: '', ownerNIC: '', registrationNumber: '', address: '', tier: 'Lite', paymentMode: 'Subscription', subjects: ['General'], location: '' });
    setCurrentStep(1);
    setSignatureData(null);
    setTermsAccepted(false);
  };

  const startDrawing = (e: any) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
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

  const termsText = `Terms & Conditions for Institution Registration

1. Eligibility & Authority: The person registering the institution confirms that they are the legal owner, director, or an authorized representative. Providing false information results in immediate suspension.
2. Institution Registration & Verification: Requires valid NIC, phone number, and OTP/Email verification. Registration is not complete until verification and agreement acceptance.
3. Digital Agreement Acceptance: Acceptance constitutes a legally binding agreement. IP address and timestamps are recorded.
4. Use of the Platform: Legal educational purposes only. No abuse, reverse engineering, or malicious content.
5. Data Responsibility & Ownership: Institutions are responsible for student data and parent information accuracy. Institution retains ownership of its data.
6. Privacy & Data Handling: System stores data for operations. Owner is not liable for data incorrectly entered.
7. Payments & Fees: Fees may change. Non-payment results in feature limitation or suspension.
8. Attendance & QR Code Usage: Generated for identification. Accuracy is not guaranteed by the platform.
9. System Availability: Provided "as is". No guarantee of 100% uptime.
10. Limitation of Liability: Owner not liable for data loss, financial loss, or legal disputes.
11. Suspension & Termination: Owner may terminate for violations or legal reasons.
12. Modifications to Terms: Owner may update terms at any time.
13. Governing Law: Governed by the laws applicable to System Owner's jurisdiction.
14. Entire Agreement: Overrides all prior agreements.
15. Acceptance Confirmation: By completing registration and verification, Institution confirms agreement and authority.`;

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-in fade-in duration-500 px-4">
        <div>
          <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none text-white">Network HQ</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.5em] mt-3">Node Control Centre</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-6 rounded-[2.5rem] font-black text-xs tracking-widest uppercase flex items-center gap-4 transition-all shadow-3xl">
          <Plus size={24} />
          Deploy New Class
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
        {institutes.map(inst => (
          <div key={inst.id} className="bg-slate-900 border-2 border-slate-800 p-10 rounded-[4.5rem] shadow-3xl group relative overflow-hidden h-full flex flex-col justify-between transition-all hover:border-blue-500/40">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] px-4 py-1.5 bg-blue-500/10 text-blue-500 rounded-full border border-blue-500/20">{inst.tier} Hub</span>
                <p className="text-[10px] font-bold text-slate-600 font-mono italic">ID: {inst.id}</p>
              </div>
              <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-none">{inst.name}</h3>
              <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">{inst.email}</p>
            </div>
            <button onClick={() => setShowManage(inst)} className="w-full mt-8 py-4 bg-slate-950 border border-slate-800 rounded-2xl font-black uppercase text-[9px] tracking-widest text-slate-500 hover:text-white transition-all flex items-center justify-center gap-2">
              <Settings2 size={14} />
              Node Configuration
            </button>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-3xl bg-slate-950/95 overflow-y-auto">
          <div className="bg-slate-900 w-full max-w-4xl rounded-[5rem] border border-slate-800 shadow-3xl flex flex-col md:flex-row overflow-hidden min-h-[700px]">
            <div className="w-full md:w-64 bg-slate-950 p-12 flex flex-col justify-between border-r border-slate-800/50">
              <div className="space-y-12">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><PenTool className="text-white" size={20} /></div>
                  <span className="text-xs font-black uppercase tracking-widest">Setup</span>
                </div>
                <div className="space-y-8">
                  {[1, 2, 3, 4].map(s => (
                    <div key={s} className={`flex items-center gap-4 transition-opacity ${currentStep >= s ? 'opacity-100' : 'opacity-20'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${currentStep === s ? 'bg-blue-600 text-white' : currentStep > s ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-500'}`}>
                        {currentStep > s ? <CheckCircle2 size={14} /> : s}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest">{s === 1 ? 'Package' : s === 2 ? 'Details' : s === 3 ? 'Auth' : 'Legal'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[8px] font-black uppercase text-slate-700 tracking-widest">System Provisioning Engine v4.0</p>
            </div>

            <div className="flex-1 p-12 flex flex-col justify-center relative bg-slate-900/40">
              <button onClick={() => { setShowAdd(false); resetForm(); }} className="absolute top-8 right-10 text-slate-500 hover:text-white"><X size={28} /></button>
              
              {currentStep === 1 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                  <h4 className="text-4xl font-black tracking-tighter uppercase italic text-white">Node Selection</h4>
                  <div className="space-y-4">
                    {['Lite', 'Platinum', 'Golden'].map(pkg => (
                      <button key={pkg} onClick={() => setFormData({...formData, tier: pkg as Tier})} className={`w-full p-8 rounded-3xl border-2 text-left flex justify-between items-center transition-all ${formData.tier === pkg ? 'bg-blue-600 border-blue-500 text-white scale-[1.02]' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                        <p className="text-xl font-black uppercase italic">{pkg} Pack</p>
                        <CheckCircle2 className={formData.tier === pkg ? 'text-white' : 'text-slate-800'} />
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setCurrentStep(2)} className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl">
                    Proceed to Identity
                  </button>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                  <h4 className="text-4xl font-black tracking-tighter uppercase italic text-white">Identity Registry</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-4">Class Identifier (Editable)</label>
                      <input placeholder="CLASS-ID" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-black text-xs uppercase text-blue-500 outline-none focus:border-blue-600" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-4">Class/Campus Name</label>
                      <input placeholder="ELITE ACADEMY" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-black text-xs uppercase text-white outline-none focus:border-blue-600" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-4">Owner NIC</label>
                      <input placeholder="19XXXXXXXXX" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-black text-xs uppercase text-white outline-none focus:border-blue-600" value={formData.ownerNIC} onChange={e => setFormData({...formData, ownerNIC: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-4">Phone Number</label>
                      <input placeholder="+94 77 XXX XXXX" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-black text-xs uppercase text-white outline-none focus:border-blue-600" value={formData.ownerPhone} onChange={e => setFormData({...formData, ownerPhone: e.target.value})} />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setCurrentStep(1)} className="flex-1 py-5 bg-slate-800 text-slate-400 font-black uppercase text-[10px] rounded-2xl">Back</button>
                    <button onClick={() => setCurrentStep(3)} className="flex-1 py-5 bg-blue-600 text-white font-black uppercase text-[10px] rounded-2xl shadow-xl">Auth Hub</button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-10 animate-in zoom-in-95">
                  <div className="text-center">
                    <Mail className="mx-auto text-blue-500 mb-6" size={48} />
                    <h4 className="text-4xl font-black tracking-tighter uppercase italic text-white leading-none">Auth Security</h4>
                    <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mt-2">Provision Secure Access Channel</p>
                  </div>
                  <div className="space-y-4">
                    <input type="email" placeholder="ADMIN EMAIL" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-8 py-5 font-black text-xs uppercase text-white outline-none focus:border-blue-600" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    <input type="password" placeholder="SECURE PASSWORD" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-8 py-5 font-black text-xs uppercase text-white outline-none focus:border-blue-600" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    <button onClick={handleStartEmailVerification} disabled={emailVerifying} className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3">
                      {emailVerifying ? <Loader2 className="animate-spin" /> : <>Verify & Continue <ChevronRight size={16}/></>}
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4">
                  <h4 className="text-4xl font-black tracking-tighter uppercase italic text-white leading-none">Legal Approval</h4>
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 h-56 overflow-y-auto custom-scrollbar text-[10px] text-slate-400 font-bold uppercase tracking-tight leading-relaxed whitespace-pre-wrap">
                    {termsText}
                  </div>
                  
                  <div className="flex items-center gap-4 px-2">
                    <button onClick={() => setTermsAccepted(!termsAccepted)} className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${termsAccepted ? 'bg-blue-600 border-blue-500' : 'border-slate-800 bg-slate-950'}`}>
                      {termsAccepted && <CheckCircle2 size={18} className="text-white" />}
                    </button>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">I verify authority and accept terms</span>
                  </div>

                  <div className={`relative bg-white rounded-3xl overflow-hidden h-40 border-4 border-slate-800 ${termsAccepted ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
                    <canvas ref={canvasRef} width={600} height={160} className="w-full h-full cursor-crosshair touch-none" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
                    {!signatureData && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 font-black uppercase text-[10px] tracking-widest">Legal Signature Required</div>}
                    <button onClick={clearCanvas} className="absolute bottom-4 right-4 bg-slate-900 text-slate-500 p-2 rounded-lg hover:text-white"><RefreshCw size={14}/></button>
                  </div>

                  <button onClick={finalizeRegistration} disabled={!signatureData || !termsAccepted || isVerifying} className="w-full bg-emerald-600 text-white py-8 rounded-[3rem] font-black uppercase text-xs tracking-widest shadow-3xl flex items-center justify-center gap-4 border-b-8 border-emerald-800 active:translate-y-1 active:border-b-0">
                    {isVerifying ? <Loader2 className="animate-spin" /> : "Authorize Deployment"}
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
