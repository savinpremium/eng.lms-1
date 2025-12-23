
import React, { useState, useEffect, useRef } from 'react';
import { storageService, auth } from '../services/storageService';
import { audioService } from '../services/audioService';
import { Institution, Tier } from '../types';
import { Plus, ShieldCheck, Mail, Lock, Building, Layers, Trash2, CheckCircle, Search, Phone, Smartphone, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

const SuperAdminDesk: React.FC = () => {
  const [institutes, setInstitutes] = useState<Institution[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'DETAILS' | 'OTP'>('DETAILS');
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [formData, setFormData] = useState<Omit<Institution, 'id' | 'createdAt'>>({
    name: '',
    email: '',
    password: '',
    ownerPhone: '',
    tier: 'Lite',
    subjects: ['General'],
    location: ''
  });

  const recaptchaWrapperRef = useRef<HTMLDivElement>(null);
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
        callback: (response: any) => {
          console.log("Recaptcha resolved");
        },
        'expired-callback': () => {
          alert("Recaptcha expired. Please try again.");
          recaptchaVerifierRef.current?.clear();
          recaptchaVerifierRef.current = null;
        }
      });
    } catch (e) {
      console.error("Recaptcha error", e);
    }
  };

  const handleStartVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ownerPhone.startsWith('+')) {
      alert("Please enter phone number in international format (e.g. +94771234567)");
      return;
    }

    setIsVerifying(true);
    setupRecaptcha();

    try {
      const appVerifier = recaptchaVerifierRef.current;
      if (!appVerifier) throw new Error("Recaptcha not initialized");
      
      const result = await signInWithPhoneNumber(auth, formData.ownerPhone, appVerifier);
      setConfirmationResult(result);
      setVerificationStep('OTP');
      audioService.playSuccess();
    } catch (error: any) {
      console.error(error);
      alert("SMS Sending Failed: " + error.message);
      if (recaptchaVerifierRef.current) {
         recaptchaVerifierRef.current.clear();
         recaptchaVerifierRef.current = null;
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!confirmationResult || !otpCode) return;
    setIsVerifying(true);
    try {
      await confirmationResult.confirm(otpCode);
      // Success! Proceed to save institution
      await finalizeRegistration();
    } catch (error: any) {
      audioService.playError();
      alert("Invalid OTP Code. Please check and try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const finalizeRegistration = async () => {
    const id = await storageService.saveInstitution({ 
      ...formData, 
      id: '', 
      createdAt: Date.now() 
    } as Institution);
    
    audioService.playCash();
    setShowAdd(false);
    resetForm();
    alert(`Campus Provisioned Successfully! ID: ${id}`);
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', ownerPhone: '', tier: 'Lite', subjects: ['General'], location: '' });
    setVerificationStep('DETAILS');
    setOtpCode('');
    setConfirmationResult(null);
    if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none text-blue-500">Network HQ</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.5em] mt-3">SmartClass.lk Global Infrastructure</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-[2.2rem] font-black text-xs tracking-widest uppercase flex items-center gap-4 transition-all shadow-2xl shadow-blue-500/20 border-b-8 border-blue-800 active:translate-y-1 active:border-b-0"
        >
          <Plus size={24} />
          Deploy New Campus
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-700">
        {institutes.map(inst => (
          <div key={inst.id} className="bg-slate-900/50 border-2 border-slate-800 p-10 rounded-[4.5rem] shadow-3xl hover:border-blue-500/30 transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity`}>
              <ShieldCheck size={100} />
            </div>
            
            <div className="space-y-8 relative z-10">
              <div>
                <span className={`text-[8px] font-black uppercase tracking-[0.4em] px-4 py-2 rounded-xl border ${
                  inst.tier === 'Golden' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                  inst.tier === 'Platinum' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                  'bg-slate-500/10 text-slate-500 border-slate-500/20'
                }`}>
                  {inst.tier} Node
                </span>
                <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white mt-8 leading-none">{inst.name}</h3>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-2">{inst.location}</p>
              </div>

              <div className="space-y-4 pt-8 border-t border-slate-800/50">
                <div className="flex items-center gap-3 text-slate-400">
                  {/* Fixed 'स्मार्टफोन' to 'Smartphone' */}
                  <Smartphone size={14} className="text-slate-600" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{inst.ownerPhone}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <Mail size={14} className="text-slate-600" />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">{inst.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <Layers size={14} className="text-slate-600" />
                  <span className="text-[10px] font-black text-blue-500 uppercase">ID: {inst.id}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {institutes.length === 0 && (
          <div className="lg:col-span-3 py-32 text-center opacity-20 border-4 border-dashed border-slate-800 rounded-[5rem]">
             <Building size={64} className="mx-auto mb-6" />
             <p className="font-black uppercase tracking-[0.6em] text-sm italic text-slate-400">Global Network Empty</p>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/95 overflow-y-auto">
          <div className="bg-slate-900 w-full max-w-xl p-12 rounded-[5rem] border border-slate-800 shadow-3xl space-y-10 animate-in zoom-in duration-500 my-auto">
            <div id="recaptcha-container"></div>
            
            <div className="text-center">
               <div className="w-20 h-20 bg-blue-600/10 text-blue-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                 {verificationStep === 'DETAILS' ? <Building size={40} /> : <Phone size={40} className="animate-pulse" />}
               </div>
              <h4 className="text-4xl font-black tracking-tighter uppercase italic text-white">
                {verificationStep === 'DETAILS' ? 'New Deployment' : 'Identity Sync'}
              </h4>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2">
                {verificationStep === 'DETAILS' ? 'Define Campus Parameters' : `Verification Code sent to ${formData.ownerPhone}`}
              </p>
            </div>
            
            {verificationStep === 'DETAILS' ? (
              <form onSubmit={handleStartVerification} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-2">Campus Name</label>
                    <input required placeholder="E.G. OXFORD ACADEMY" className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 font-black text-sm uppercase text-white shadow-inner focus:border-blue-600 outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-2">Region</label>
                    <input required placeholder="CITY / REGION" className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 font-black text-sm uppercase text-white shadow-inner focus:border-blue-600 outline-none transition-all" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-2">Owner Phone (International Format)</label>
                  <div className="relative group">
                    <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input required placeholder="+94 77 XXXXXXX" className="w-full bg-slate-950 border border-slate-800 rounded-3xl pl-16 pr-8 py-5 font-black text-sm uppercase text-white shadow-inner focus:border-blue-600 outline-none transition-all" value={formData.ownerPhone} onChange={e => setFormData({...formData, ownerPhone: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-2">Admin Email</label>
                    <input required type="email" placeholder="ADMIN@CAMPUS.LK" className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 font-black text-sm uppercase text-white shadow-inner focus:border-blue-600 outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-2">Secure Pass</label>
                    <input required type="password" placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-5 font-black text-sm uppercase text-white shadow-inner focus:border-blue-600 outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 py-4">
                  {(['Lite', 'Platinum', 'Golden'] as Tier[]).map(t => (
                    <button 
                      key={t}
                      type="button"
                      onClick={() => setFormData({...formData, tier: t})}
                      className={`p-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest border-2 transition-all ${
                        formData.tier === t ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-500/20 scale-105' : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => { setShowAdd(false); resetForm(); }} className="flex-1 py-6 bg-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-3xl hover:bg-slate-750 transition-all">Abort</button>
                  <button disabled={isVerifying} className="flex-1 py-6 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-3xl shadow-2xl shadow-blue-600/20 border-b-8 border-blue-800 active:translate-y-1 active:border-b-0 flex items-center justify-center gap-3 transition-all">
                    {isVerifying ? <Loader2 className="animate-spin" size={18} /> : <>Continue <ArrowRight size={18} /></>}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-10">
                <div className="space-y-4">
                   <label className="block text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Institutional OTP Protocol</label>
                   <input 
                    maxLength={6}
                    placeholder="------"
                    className="w-full bg-slate-950 border border-slate-800 rounded-[2.5rem] px-10 py-10 text-6xl font-black tracking-[0.5em] focus:border-blue-600 focus:outline-none text-center shadow-inner text-blue-500 uppercase transition-all"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                
                <div className="space-y-4">
                  <button 
                    onClick={handleVerifyOTP}
                    disabled={isVerifying || otpCode.length < 6}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-8 rounded-[2.5rem] flex items-center justify-center gap-5 transition-all shadow-2xl shadow-blue-600/20 uppercase tracking-widest text-lg border-b-8 border-blue-800"
                  >
                    {isVerifying ? <Loader2 className="animate-spin" /> : "AUTHENTICATE & DEPLOY"}
                  </button>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setVerificationStep('DETAILS')}
                      className="flex-1 py-5 bg-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-3xl"
                    >
                      Back to Info
                    </button>
                    <button 
                      onClick={() => window.location.reload()}
                      className="flex items-center justify-center gap-2 px-6 py-5 bg-slate-950 border border-slate-800 text-slate-500 font-black uppercase text-[10px] tracking-widest rounded-3xl"
                    >
                      <RefreshCw size={14}/> Reset
                    </button>
                  </div>
                </div>
                
                <p className="text-center text-[8px] font-black uppercase text-slate-700 tracking-[0.4em]">Powered by Firebase Security Hub</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDesk;
