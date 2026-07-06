import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, Activity, AlertTriangle, ShieldAlert, X, Clock, MapPin, 
  CheckCircle2, Star, Zap, Bell, Shield, Truck, BadgeCheck, 
  ChevronDown, HeartPulse, Lock, Compass, AlertCircle
} from 'lucide-react';
import { User, EmergencyRequest } from '../types';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
  useFormatter?: boolean;
}

function CountUp({ end, duration = 1.2, suffix = '', decimals = 0, useFormatter = false }: CountUpProps) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStarted(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = elementRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  useEffect(() => {
    if (!started) return;

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      
      const easedProgress = progress * (2 - progress);
      const currentVal = easedProgress * end;
      setCount(currentVal);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [started, end, duration]);

  const displayVal = useFormatter 
    ? Math.floor(count).toLocaleString('en-IN') 
    : count.toFixed(decimals);

  return (
    <span ref={elementRef} className="tabular-nums">
      {displayVal}
      {suffix}
    </span>
  );
}

interface EmergencyWidgetProps {
  currentUser: User | null;
  onOpenAuth: (type: 'login' | 'signup') => void;
  onRequestSubmitted?: (req: EmergencyRequest) => void;
}

export default function EmergencyWidget({
  currentUser,
  onOpenAuth,
  onRequestSubmitted,
}: EmergencyWidgetProps) {
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('Dog');
  const [submitting, setSubmitting] = useState(false);
  const [activeEmergency, setActiveEmergency] = useState<EmergencyRequest | null>(null);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [hoveredWorkflowStep, setHoveredWorkflowStep] = useState<number | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const commonHazards = [
    'Bleeding / Injury from accident',
    'Ingested toxic substance',
    'Vomiting / Severe diarrhea',
    'Seizures / Unconsciousness',
    'Breathing difficulties / Heat stroke'
  ];

  useEffect(() => {
    if (!activeEmergency) return;
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => { setActiveStep(2); activeEmergency.status = 'notified'; }, 4000));
    timers.push(setTimeout(() => {
      setActiveStep(3);
      activeEmergency.status = 'accepted';
      activeEmergency.acceptedByClinicId = 'clinic-1';
      activeEmergency.acceptedByClinicName = 'Cessna Lifeline 24x7 Animal Hospital';
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 }, colors: ['#2F855A', '#58B368', '#BFE7C4'] });
    }, 9000));
    timers.push(setTimeout(() => { setActiveStep(4); activeEmergency.status = 'completed'; }, 16000));
    return () => { timers.forEach(clearTimeout); };
  }, [activeEmergency]);

  const handleTriggerEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !address || !description) { alert('Please fill all required fields.'); return; }
    setSubmitting(true);
    try {
      const payload = { 
        petOwnerName: currentUser?.name || 'Emergency Guest', 
        petOwnerEmail: currentUser?.email || 'guest@quickvet.in', 
        petName: petName || 'My Pet', 
        petType, 
        phone, 
        address, 
        description, 
        latitude: 12.9716, 
        longitude: 77.5946 
      };
      const apiBase = (import.meta as any).env?.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/emergency`, { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json', 
        }, 
        credentials: 'include', 
        body: JSON.stringify(payload) 
      });
      if (!res.ok) throw new Error('Failed');
      const data: EmergencyRequest = await res.json();
      setActiveEmergency(data);
      setActiveStep(1);
      if (onRequestSubmitted) onRequestSubmitted(data);
    } catch { 
      alert('Failed to send emergency alert. Please try again.'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const clearActiveEmergency = () => { 
    setActiveEmergency(null); 
    setActiveStep(1); 
    setPhone(''); 
    setAddress(''); 
    setDescription(''); 
    setPetName(''); 
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const faqs = [
    { q: 'Is the emergency service really free?', a: 'Yes. QuickVet\'s emergency alert system is completely free for all pet parents. Consultation fees may apply at the clinic.' },
    { q: 'Do I need an account to use this?', a: 'No. Emergency alerts can be sent without logging in. We only need your phone number and location to connect you with responders.' },
    { q: 'How fast will a vet respond?', a: 'On average, the nearest vet responds within 10-15 minutes. In metro areas, it can be as fast as 5 minutes.' },
    { q: 'What if no vet is available nearby?', a: 'Our system expands the search radius automatically and provides you with phone numbers of 24/7 emergency hospitals.' },
    { q: 'Is this available outside Bengaluru?', a: 'We\'re expanding across India. Currently active in Bengaluru, Hyderabad, and Chennai with more cities coming soon.' },
  ];

  return (
    <div id="emergency-portal" className="bg-slate-50 text-slate-800 antialiased font-sans overflow-x-hidden">
      
      {/* ===== INTEGRATED HERO + EMERGENCY FORM SECTION ===== */}
      <section className="relative min-h-[85vh] flex items-center bg-gradient-to-b from-slate-950 via-slate-900 to-[#0e2716] overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32 text-white">
        
        {/* Soft glowing background shapes */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-red-500/5 blur-[130px] pointer-events-none" />
        
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            
            {/* Left Column: Headline, Trust Badges, Testimonial */}
            <div className="lg:col-span-6 space-y-8 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-red-500/10 border border-red-500/20 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-[pulse_1.5s_ease-in-out_infinite]" />
                <span className="text-[11px] font-black text-red-400 uppercase tracking-widest">24/7 Live Emergency Portal</span>
              </div>

              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-[62px] tracking-tight leading-[1.05]">
                Emergency Veterinary Care <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-lime-400">
                  When Every Second Matters
                </span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed">
                No registration required. Instantly broadcast your emergency to all verified clinics within 10km. Vets respond directly by phone.
              </p>

              {/* Compact Trust Badges Row */}
              <div className="grid grid-cols-2 gap-4 max-w-md pt-2">
                {[
                  { text: '24/7 Availability' },
                  { text: 'Verified Emergency Vets' },
                  { text: '<15 min Avg Response' },
                  { text: '10,000+ Pets Assisted' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-slate-200 font-semibold text-xs sm:text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Compressed Testimonial Block */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 max-w-md text-left shadow-lg pt-3">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 italic">"A vet contacted us within 9 minutes after our dog met with an accident."</p>
                <span className="block text-[10px] font-bold text-slate-400 mt-1">— Vikram, Bengaluru</span>
              </div>
            </div>

            {/* Right Column: Live Form / Live Status Tracker (Integrated Card) */}
            <div className="lg:col-span-6 relative">
              <AnimatePresence mode="wait">
                
                {/* State A: Show Emergency request Form */}
                {!activeEmergency ? (
                  <motion.div 
                    key="emergency-form"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white text-slate-800 rounded-[32px] overflow-hidden shadow-2xl border border-slate-200/80 flex flex-col text-left"
                  >
                    <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white p-6 flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="font-display font-black text-base">Request Emergency Dispatch</h3>
                          <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Broadcast starts immediately on submit</p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleTriggerEmergency} className="p-6 sm:p-8 space-y-4">
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pet Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Bruno" 
                            value={petName} 
                            onChange={(e) => setPetName(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-300 font-semibold text-slate-800" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pet Type</label>
                          <select 
                            value={petType} 
                            onChange={(e) => setPetType(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-300 h-[42px] font-semibold text-slate-800"
                          >
                            <option value="Dog">🐶 Dog</option>
                            <option value="Cat">🐱 Cat</option>
                            <option value="Bird">🦜 Bird</option>
                            <option value="Rabbit">🐰 Rabbit</option>
                            <option value="Exotics">🦎 Exotic</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phone Number *</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                          <input 
                            type="tel" 
                            required 
                            placeholder="+91 98765 43210" 
                            value={phone} 
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-300 font-semibold text-slate-800" 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Location Address *</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            required 
                            placeholder="Street address or landmark" 
                            value={address} 
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-300 font-semibold text-slate-800" 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Symptom Quick Select</label>
                        <div className="flex flex-wrap gap-1.5">
                          {commonHazards.map((haz) => (
                            <button 
                              key={haz} 
                              type="button" 
                              onClick={() => setDescription(haz)}
                              className={`px-2.5 py-1.5 rounded-lg border text-[10.5px] font-bold transition-all cursor-pointer ${
                                description === haz 
                                  ? 'bg-red-50 text-red-700 border-red-200' 
                                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              {haz}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Describe Condition *</label>
                        <textarea 
                          rows={2} 
                          required 
                          placeholder="Describe details: bleeding, unconsciousness, heavy choking..." 
                          value={description} 
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-300 leading-relaxed font-semibold text-slate-800" 
                        />
                      </div>

                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit" 
                        disabled={submitting}
                        className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-100 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        <Activity className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
                        {submitting ? 'Broadcasting Alert...' : 'Send Emergency Alert'}
                      </motion.button>
                    </form>
                  </motion.div>
                ) : (
                  
                  /* State B: Live Request Tracking (Inline Transition) */
                  <motion.div 
                    key="emergency-tracker"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="bg-slate-900 border-2 border-emerald-500 text-white rounded-[32px] p-6 sm:p-8 shadow-2xl text-left relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-lime-400 animate-pulse" />
                    
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">Live Incident Active</span>
                        <h3 className="font-display font-black text-lg text-white mt-2">Alert for {activeEmergency.petName}</h3>
                      </div>
                      <button onClick={clearActiveEmergency} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10.5px] font-black rounded-lg transition-colors">Clear</button>
                    </div>

                    <div className="space-y-4">
                      {[
                        { step: 1, title: 'Alert Broadcasted', desc: 'Secure location coordinates sent to 10+ clinics' },
                        { step: 2, title: 'Responders Searching', desc: 'Awaiting first veterinarian match acceptance' },
                        { step: 3, title: 'Vet Accepted Request', desc: activeStep >= 3 ? `${activeEmergency.acceptedByClinicName || 'Cessna 24/7'}` : 'Connecting matching doctor...' },
                        { step: 4, title: 'Care In Progress', desc: 'Clinical response room stabilized' },
                      ].map((s) => (
                        <div key={s.step} className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${activeStep >= s.step ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-950/20 border-slate-800/40'}`}>
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${activeStep >= s.step ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                            {activeStep > s.step ? '✓' : s.step}
                          </span>
                          <div>
                            <span className="block text-[11px] font-black uppercase text-slate-200 tracking-wider">{s.title}</span>
                            <span className="block text-xs text-slate-400 leading-normal">{s.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Estimated response:</span>
                      <span className="font-black text-emerald-400 text-sm">9.4 Minutes</span>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </section>

      {/* ===== WHAT HAPPENS AFTER YOU SUBMIT ===== */}
      <section className="py-24 bg-slate-50 relative overflow-hidden border-b border-slate-100">
        {/* Healthcare Pattern Background (<4% opacity) */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.025] select-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="heartbeat-grid" width="120" height="120" patternUnits="userSpaceOnUse">
                {/* ECG Heartbeat path */}
                <path d="M 0 60 L 30 60 L 40 45 L 48 75 L 56 30 L 64 85 L 70 55 L 75 60 L 120 60" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Medical Cross */}
                <path d="M 95 15 L 105 15 M 100 10 L 100 20" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                {/* Paw print */}
                <circle cx="20" cy="20" r="3" fill="#10B981" />
                <circle cx="12" cy="14" r="2.5" fill="#10B981" />
                <circle cx="28" cy="14" r="2.5" fill="#10B981" />
                <circle cx="16" cy="7" r="2" fill="#10B981" />
                <circle cx="24" cy="7" r="2" fill="#10B981" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#heartbeat-grid)" />
          </svg>
          {/* Blurred green circle */}
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-[#58B368] blur-[150px] opacity-60" />
        </div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
            
            {/* Left: Heading & Reassurance Card */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-4 text-left space-y-6 lg:sticky lg:top-24"
            >
              <span className="text-xs font-black uppercase tracking-widest text-[#58B368] bg-green-50 px-3.5 py-2 rounded-lg border border-green-100 inline-block">
                LIVE EMERGENCY WORKFLOW
              </span>
              <h2 className="font-display font-black text-3xl text-gray-900 tracking-tight leading-tight">
                What Happens After You Submit an Emergency Request
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                QuickVet immediately begins coordinating nearby emergency veterinary clinics to ensure the fastest possible response.
              </p>

              {/* Premium Emergency Card */}
              <div className="bg-gradient-to-br from-[#0c2e17] via-[#092512] to-[#041208] text-white rounded-[24px] p-6 border border-emerald-500/20 shadow-[0_20px_50px_rgba(16,185,129,0.12)] backdrop-blur-md relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                <h4 className="font-display font-bold text-xs text-emerald-400 flex items-center gap-2 uppercase tracking-wider mb-4">
                  <Shield className="w-4.5 h-4.5" /> Immediately After Submission:
                </h4>
                <div className="space-y-3.5">
                  {[
                    "Your GPS location is securely shared with verified emergency clinics",
                    "Nearby veterinarians receive an instant emergency notification",
                    "The closest available vet reviews your case immediately",
                    "Your emergency contact receives confirmation",
                    "Live tracking begins automatically",
                    "Your pet's medical history is shared (if available)"
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-slate-800 flex">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 font-extrabold text-[11px] rounded-xl border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse_1.5s_infinite]" />
                    Average response time: Under 7 minutes
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Right: Steps Grid & Live Progress Tracker */}
            <div className="lg:col-span-8 relative text-left">
              {/* Vertical connecting line */}
              <div className="absolute left-[24px] md:left-[44px] top-[40px] bottom-[40px] w-[4px] bg-slate-200/60 rounded-full z-0" />
              
              {/* Active connecting progress line */}
              {(() => {
                const currentProgressStep = activeEmergency ? activeStep : (hoveredWorkflowStep !== null ? hoveredWorkflowStep + 1 : 1);
                return (
                  <div 
                    className="absolute left-[24px] md:left-[44px] top-[40px] w-[4px] bg-gradient-to-b from-[#58B368] to-[#2D855A] rounded-full transition-all duration-500 z-0"
                    style={{
                      height: `${Math.max(0, ((currentProgressStep - 1) / 3) * 100)}%`,
                      maxHeight: 'calc(100% - 80px)'
                    }}
                  />
                );
              })()}

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={{
                  visible: { transition: { staggerChildren: 0.15 } }
                }}
                className="space-y-6 relative z-10"
                onMouseLeave={() => setHoveredWorkflowStep(null)}
              >
                {[
                  {
                    stepNum: 1,
                    step: '01',
                    title: 'Emergency Alert Sent',
                    timeBadge: '⚡ 5 Seconds',
                    statusType: 'Completed',
                    desc: 'Your emergency details, location, symptoms, and contact information are securely broadcast to nearby verified emergency veterinary clinics.',
                    icon: (
                      <svg viewBox="0 0 100 100" className="w-16 h-16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="emerg-step1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FEE2E2" />
                            <stop offset="100%" stopColor="#EF4444" />
                          </linearGradient>
                        </defs>
                        <rect x="25" y="10" width="50" height="80" rx="10" fill="white" stroke="#94A3B8" strokeWidth="2.5" />
                        <line x1="45" y1="16" x2="55" y2="16" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="50" cy="50" r="16" fill="url(#emerg-step1)" opacity="0.15" />
                        <circle cx="50" cy="50" r="8" fill="url(#emerg-step1)" />
                        <circle cx="38" cy="30" r="2" fill="#EF4444" />
                        <circle cx="62" cy="70" r="2" fill="#EF4444" />
                        <path d="M 50 35 L 50 45" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="50" cy="50" r="1" fill="white" />
                        <circle cx="50" cy="50" r="12" stroke="#EF4444" strokeWidth="1" strokeDasharray="3 3" className="animate-ping" style={{ transformOrigin: '50px 50px' }} />
                      </svg>
                    )
                  },
                  {
                    stepNum: 2,
                    step: '02',
                    title: 'Nearest Veterinarian Accepts',
                    timeBadge: 'Usually within 2 Minutes',
                    statusType: 'Responders Searching',
                    desc: 'The nearest available veterinarian reviews your case, accepts the emergency, and begins preparing the clinic before your arrival.',
                    icon: (
                      <svg viewBox="0 0 100 100" className="w-16 h-16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="emerg-step2" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#D1FAE5" />
                            <stop offset="100%" stopColor="#10B981" />
                          </linearGradient>
                        </defs>
                        <circle cx="50" cy="36" r="16" fill="url(#emerg-step2)" />
                        <path d="M26 75C26 62 34 56 50 56C66 56 74 62 74 75" fill="url(#emerg-step2)" />
                        <circle cx="50" cy="50" r="32" stroke="#E2E8F0" strokeWidth="2.5" />
                        <path d="M40 38C40 48 46 54 50 54C54 54 60 48 60 38" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="70" cy="30" r="8" fill="#10B981" />
                        <path d="M67 30L69 32L73 28" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )
                  },
                  {
                    stepNum: 3,
                    step: '03',
                    title: 'Phone Confirmation',
                    timeBadge: 'Within 5 Minutes',
                    statusType: 'Phone Confirmation',
                    desc: 'A veterinarian contacts you with first-aid instructions, confirms your route, and shares an estimated arrival time.',
                    icon: (
                      <svg viewBox="0 0 100 100" className="w-16 h-16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="32" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="2" />
                        <path d="M35 38C35 34 38 34 41 37L45 41C47 43 47 45 44 47C48 53 52 57 58 61C60 58 62 58 64 60L68 64C71 67 71 70 67 70C52 70 35 53 35 38Z" fill="#3B82F6" />
                        <path d="M56 32C62 34 66 38 68 44" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M62 26C70 29 76 35 79 43" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )
                  },
                  {
                    stepNum: 4,
                    step: '04',
                    title: 'Treatment Begins',
                    timeBadge: 'Upon Arrival',
                    statusType: 'Treatment Started',
                    desc: 'Your pet receives immediate professional treatment while QuickVet securely records consultation details and medical history.',
                    icon: (
                      <svg viewBox="0 0 100 100" className="w-16 h-16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="emerg-step4" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#A7F3D0" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                        </defs>
                        <circle cx="50" cy="50" r="32" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
                        <rect x="44" y="32" width="12" height="36" rx="3" fill="url(#emerg-step4)" />
                        <rect x="32" y="44" width="36" height="12" rx="3" fill="url(#emerg-step4)" />
                        <circle cx="50" cy="50" r="2.5" fill="white" />
                        <circle cx="45" cy="46" r="1.5" fill="white" />
                        <circle cx="55" cy="46" r="1.5" fill="white" />
                        <circle cx="47" cy="42" r="1.2" fill="white" />
                        <circle cx="53" cy="42" r="1.2" fill="white" />
                      </svg>
                    )
                  }
                ].map((item, idx) => {
                  const currentProgressStep = activeEmergency ? activeStep : (hoveredWorkflowStep !== null ? hoveredWorkflowStep + 1 : 1);
                  const isCompleted = currentProgressStep > item.stepNum;
                  const isActive = currentProgressStep === item.stepNum;
                  const isFuture = currentProgressStep < item.stepNum;
                  
                  const getStatusLabel = () => {
                    if (isCompleted) {
                      return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-lg border border-emerald-200">
                          ✓ Completed
                        </span>
                      );
                    }
                    if (isActive) {
                      if (item.stepNum === 4) {
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-lg border border-blue-200 animate-pulse">
                            🏥 Treatment Started
                          </span>
                        );
                      }
                      return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-lg shadow-sm animate-pulse">
                          🟢 In Progress
                        </span>
                      );
                    }
                    return (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-400 text-[10px] font-black rounded-lg border border-slate-200">
                        ⏳ Waiting
                      </span>
                    );
                  };

                  return (
                    <motion.div 
                      key={idx} 
                      variants={{
                        hidden: { opacity: 0, y: 25 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                      }}
                      onMouseEnter={() => setHoveredWorkflowStep(idx)}
                      className={`relative bg-white/90 backdrop-blur-md rounded-[24px] p-6 border border-green-100/40 text-left flex flex-col md:flex-row items-start md:items-center gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_20px_45px_rgba(88,179,104,0.08)] hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-200 cursor-default group ml-12 md:ml-20 ${
                        isFuture ? 'opacity-55' : 'opacity-100'
                      }`}
                    >
                      {/* Timeline node circle positioned absolutely to line up with connector */}
                      <div 
                        className={`absolute left-[-28px] md:left-[-54px] top-1/2 -translate-y-1/2 w-[12px] h-[12px] md:w-[16px] md:h-[16px] rounded-full border-4 border-slate-50 z-10 transition-all duration-300 ${
                          isCompleted ? 'bg-[#58B368] shadow-[0_0_8px_rgba(88,179,104,0.4)]' : 
                          isActive ? 'bg-[#58B368] scale-125 animate-pulse shadow-[0_0_12px_#58B368]' : 
                          'bg-slate-200'
                        }`}
                      />

                      {/* Step Illustration */}
                      <div className="w-16 h-16 flex-shrink-0 group-hover:scale-105 transition-transform duration-300 mx-auto md:mx-0">
                        {item.icon}
                      </div>

                      {/* Content Area */}
                      <div className="flex-grow space-y-2 text-center md:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center justify-center md:justify-start gap-2.5">
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black text-white bg-gradient-to-br from-[#58B368] to-[#2D855A] shadow-sm`}>
                              {item.step}
                            </span>
                            <h4 className="font-display font-black text-base text-slate-900 leading-tight">
                              {item.title}
                            </h4>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md border border-slate-200">
                              {item.timeBadge}
                            </span>
                            {getStatusLabel()}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-2xl font-medium">
                          {item.desc}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== WHY QUICKVET (REDESIGNED TO PREMIUM SHOWCASE) ===== */}
      <section className="py-24 bg-[#F4FBF3]/30 border-b border-slate-100 relative overflow-hidden">
        {/* Subtle Veterinary-themed Background Pattern (<5% opacity) */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] select-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="trust-grid" width="160" height="160" patternUnits="userSpaceOnUse">
                {/* Shield Outline */}
                <path d="M 30 20 C 30 20 30 35 20 42 C 10 35 10 20 10 20 L 20 16 Z" fill="none" stroke="#10B981" strokeWidth="2" />
                {/* ECG Heartbeat path */}
                <path d="M 40 80 L 70 80 L 80 65 L 88 95 L 96 50 L 104 105 L 110 75 L 115 80 L 160 80" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Medical Cross */}
                <path d="M 135 25 L 145 25 M 140 20 L 140 30" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                {/* Paw print */}
                <circle cx="20" cy="120" r="3" fill="#10B981" />
                <circle cx="12" cy="114" r="2.5" fill="#10B981" />
                <circle cx="28" cy="114" r="2.5" fill="#10B981" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#trust-grid)" />
          </svg>
          {/* Blurred green circle */}
          <div className="absolute top-1/2 left-2/3 w-[600px] h-[600px] rounded-full bg-[#58B368] blur-[160px] opacity-35" />
        </div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10 w-full">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            
            {/* Left Side: Heading, Subtitle & Trust Score Panel */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 text-left space-y-6"
            >
              <span className="text-xs font-black uppercase tracking-widest text-[#2D855A] bg-green-50 px-3.5 py-2 rounded-lg border border-green-100 inline-block">
                WHY PET PARENTS TRUST US
              </span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-gray-900 tracking-tight leading-tight">
                Your Pet's Safety Is Our Highest Priority
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
                Every emergency request is handled through a secure, verified, and real-time response network designed to get professional veterinary care to your pet as quickly as possible.
              </p>

              {/* Premium Trust Score Panel */}
              <div className="bg-white/80 backdrop-blur-md rounded-[24px] p-6 border border-green-100/50 shadow-[0_15px_35px_rgba(88,179,104,0.06)] flex items-center gap-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="space-y-1.5 flex-grow">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="font-display font-black text-slate-800 text-lg ml-1">4.9/5</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-400 leading-normal">
                    Rated by thousands of pet owners across India for speed, professionalism, and reliability.
                  </p>
                </div>
                <div className="border-l border-slate-100 pl-6 flex-shrink-0 text-center">
                  <span className="block font-display font-black text-3xl text-[#2D855A]">
                    12K+
                  </span>
                  <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Pet Parents
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Right Side: 2x2 Responsive Grid / Carousel */}
            <div className="lg:col-span-7">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={{
                  visible: { transition: { staggerChildren: 0.1 } }
                }}
                className="flex md:grid overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none gap-6 pb-6 md:grid-cols-2 scrollbar-none"
              >
                {[
                  {
                    title: 'Verified Emergency Veterinarians',
                    desc: 'Every emergency responder is license-verified and background checked before joining the network.',
                    badge: '100% Verified',
                    icon: (
                      <svg viewBox="0 0 120 100" className="w-full h-24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="120" height="100" rx="16" fill="url(#grad-vets)" />
                        <defs>
                          <linearGradient id="grad-vets" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ECFDF5" />
                            <stop offset="100%" stopColor="#D1FAE5" />
                          </linearGradient>
                        </defs>
                        <circle cx="60" cy="35" r="14" fill="#34D399" />
                        <path d="M 38 75 C 38 60 48 55 60 55 C 72 55 82 60 82 75 Z" fill="#34D399" />
                        <path d="M 52 55 L 52 75 M 68 55 L 68 75" stroke="white" strokeWidth="2.5" />
                        <rect x="74" y="24" width="22" height="22" rx="11" fill="white" stroke="#10B981" strokeWidth="2" />
                        <path d="M 80 35 L 84 38 L 90 32" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )
                  },
                  {
                    title: 'Live GPS Tracking',
                    desc: 'Your location is securely transmitted to the nearest available veterinary professionals in real time.',
                    badge: 'Live Tracking',
                    icon: (
                      <svg viewBox="0 0 120 100" className="w-full h-24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="120" height="100" rx="16" fill="url(#grad-gps)" />
                        <defs>
                          <linearGradient id="grad-gps" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#EFF6FF" />
                            <stop offset="100%" stopColor="#DBEAFE" />
                          </linearGradient>
                        </defs>
                        <line x1="20" y1="10" x2="20" y2="90" stroke="#BFDBFE" strokeWidth="1.5" strokeDasharray="3 3" />
                        <line x1="60" y1="10" x2="60" y2="90" stroke="#BFDBFE" strokeWidth="1.5" strokeDasharray="3 3" />
                        <line x1="100" y1="10" x2="100" y2="90" stroke="#BFDBFE" strokeWidth="1.5" strokeDasharray="3 3" />
                        <line x1="10" y1="30" x2="110" y2="30" stroke="#BFDBFE" strokeWidth="1.5" strokeDasharray="3 3" />
                        <line x1="10" y1="70" x2="110" y2="70" stroke="#BFDBFE" strokeWidth="1.5" strokeDasharray="3 3" />
                        <path d="M 30 70 L 60 70 L 60 40 L 90 40" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="30" cy="70" r="4" fill="#3B82F6" />
                        <path d="M 90 28 C 86 28 84 32 90 40 C 96 32 94 28 90 28 Z" fill="#EF4444" stroke="white" strokeWidth="1" />
                        <circle cx="90" cy="32" r="1.5" fill="white" />
                      </svg>
                    )
                  },
                  {
                    title: '24×7 Emergency Response',
                    desc: 'Our emergency coordination network continuously monitors requests every hour of every day.',
                    badge: 'Always Active',
                    icon: (
                      <svg viewBox="0 0 120 100" className="w-full h-24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="120" height="100" rx="16" fill="url(#grad-247)" />
                        <defs>
                          <linearGradient id="grad-247" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FFFBEB" />
                            <stop offset="100%" stopColor="#FEF3C7" />
                          </linearGradient>
                        </defs>
                        <rect x="25" y="25" width="32" height="22" rx="4" fill="white" stroke="#F59E0B" strokeWidth="1.5" />
                        <rect x="63" y="25" width="32" height="22" rx="4" fill="white" stroke="#F59E0B" strokeWidth="1.5" />
                        <path d="M 30 36 L 36 36 L 40 30 L 44 42 L 48 36 L 52 36" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 68 36 L 74 36 L 78 30 L 82 42 L 86 36 L 90 36" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="60" cy="65" r="12" fill="white" stroke="#F59E0B" strokeWidth="2" />
                        <path d="M 60 58 L 60 65 L 66 65" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="70" cy="56" r="2" fill="#EF4444" />
                      </svg>
                    )
                  },
                  {
                    title: 'Secure Medical Records',
                    desc: "Your pet's medical information is encrypted and only shared with the responding veterinarian.",
                    badge: 'Bank-Level Security',
                    icon: (
                      <svg viewBox="0 0 120 100" className="w-full h-24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="120" height="100" rx="16" fill="url(#grad-secure)" />
                        <defs>
                          <linearGradient id="grad-secure" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#F3E8FF" />
                            <stop offset="100%" stopColor="#E9D5FF" />
                          </linearGradient>
                        </defs>
                        <rect x="35" y="20" width="50" height="60" rx="6" fill="white" stroke="#8B5CF6" strokeWidth="2" />
                        <line x1="45" y1="35" x2="65" y2="35" stroke="#E2E8F0" stroke-width="2.5" stroke-linecap="round" />
                        <line x1="45" y1="45" x2="75" y2="45" stroke="#E2E8F0" stroke-width="2.5" stroke-linecap="round" />
                        <line x1="45" y1="55" x2="70" y2="55" stroke="#E2E8F0" stroke-width="2.5" stroke-linecap="round" />
                        <path d="M 72 50 C 72 50 72 65 60 72 C 48 65 48 50 48 50 L 60 46 Z" fill="#8B5CF6" stroke="white" stroke-width="1.5" />
                        <path d="M 57 54 L 59 56 L 63 52" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    )
                  }
                ].map((card, idx) => (
                  <motion.div
                    key={idx}
                    variants={{
                      hidden: { opacity: 0, y: 30 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                    }}
                    className="snap-center shrink-0 w-[80vw] md:w-auto bg-gradient-to-br from-white/95 to-emerald-50/10 backdrop-blur-md rounded-[24px] p-6 border border-green-100/40 text-left shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_20px_45px_rgba(88,179,104,0.08)] hover:-translate-y-2 transition-all duration-200 group"
                  >
                    <div className="mb-4 overflow-hidden rounded-2xl group-hover:scale-105 transition-transform duration-300">
                      {card.icon}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-display font-black text-sm text-slate-900 leading-tight">
                          {card.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {card.desc}
                      </p>
                      <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-green-50 text-[#2D855A] rounded border border-green-100">
                        {card.badge}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

          </div>

          {/* Statistics Strip */}
          <div className="mt-16 pt-12 border-t border-slate-100 w-full">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { end: 500, suffix: '+', label: 'Verified Clinics' },
                { end: 10000, suffix: '+', label: 'Emergency Cases Handled', useFormatter: true },
                { end: 7, suffix: ' min', label: 'Average Response Time' },
                { end: 24, suffix: '×7', label: 'Always Available', isConst: true }
              ].map((stat, idx) => (
                <div key={idx} className="text-center space-y-1.5">
                  <span className="block font-display font-black text-3xl md:text-4xl text-[#2D855A]">
                    {stat.isConst ? (
                      <span>{stat.end}{stat.suffix}</span>
                    ) : (
                      <CountUp end={stat.end} suffix={stat.suffix} useFormatter={stat.useFormatter} />
                    )}
                  </span>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Indicators Row */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-slate-400 text-xs font-bold border-t border-slate-100/50 pt-8">
            {[
              'Licensed Veterinarians',
              'Real-Time GPS',
              'Encrypted Data',
              'Background Verified',
              'Emergency Coordination'
            ].map((text, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{text}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ===== EMERGENCY SITUATIONS WE HANDLE ===== */}
      <section className="py-24 bg-white relative overflow-hidden border-b border-slate-100">
        {/* Healthcare Pattern Background (<4% opacity) */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.025] select-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="emergency-grid" width="120" height="120" patternUnits="userSpaceOnUse">
                {/* ECG Heartbeat path */}
                <path d="M 0 60 L 30 60 L 40 45 L 48 75 L 56 30 L 64 85 L 70 55 L 75 60 L 120 60" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Emergency SOS Ring */}
                <circle cx="100" cy="30" r="8" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 3" />
                {/* Paw print */}
                <circle cx="20" cy="20" r="3" fill="#EF4444" />
                <circle cx="12" cy="14" r="2.5" fill="#EF4444" />
                <circle cx="28" cy="14" r="2.5" fill="#EF4444" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#emergency-grid)" />
          </svg>
          {/* Blurred amber circle */}
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-amber-500 blur-[130px] opacity-40" />
        </div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10 w-full">
          
          <div className="text-left mb-16 space-y-4">
            <span className="text-xs font-black uppercase tracking-widest text-[#2D855A] bg-green-50 px-3.5 py-2 rounded-lg border border-green-100 inline-block">
              24/7 EMERGENCY CARE
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-gray-900 tracking-tight leading-tight">
              Emergency Situations We Handle
            </h2>
            <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
              If your pet is experiencing any of the following conditions, submit an emergency request immediately. Our verified veterinarians are available around the clock to provide urgent assistance.
            </p>
          </div>

          {/* Cards container: snaps on mobile, grids on larger screens */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              visible: { transition: { staggerChildren: 0.08 } }
            }}
            className="flex md:grid overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none gap-6 pb-8 md:grid-cols-2 lg:grid-cols-4 scrollbar-none"
          >
            {[
              {
                title: 'Road Accidents',
                desc: 'Vehicular trauma, structural fractures, internal damage, or shock from collisions.',
                severity: 'Critical',
                urgency: '⚡ Immediate (0m)',
                symptoms: [
                  'Visible heavy bleeding or deep lacerations',
                  'Inability to stand or drag behind limbs',
                  'Pale or white gums indicating internal shock',
                  'Continuous crying, whining, or rapid panting'
                ],
                firstAid: [
                  'Keep your pet completely calm and warm',
                  'Minimize spinal movement; support the pet on a flat board if possible',
                  'Apply firm, direct pressure to actively bleeding wounds using a clean cloth',
                  'Contact QuickVet immediately for routing instructions'
                ],
                recommendedResponse: '⚡ Within 5 Minutes',
                themeColor: 'red',
                icon: (
                  <svg viewBox="0 0 120 100" className="w-24 h-20 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="120" height="100" rx="16" fill="#FEF2F2" />
                    <path d="M 60 15 L 90 70 L 30 70 Z" fill="#FEE2E2" stroke="#EF4444" strokeWidth="3" strokeLinejoin="round" />
                    <path d="M 60 30 L 60 52" stroke="#EF4444" strokeWidth="4.5" strokeLinecap="round" />
                    <circle cx="60" cy="62" r="3" fill="#EF4444" />
                    <rect x="75" y="55" width="28" height="18" rx="4" fill="white" stroke="#EF4444" strokeWidth="1.5" />
                    <circle cx="82" cy="74" r="3.5" fill="#EF4444" />
                    <circle cx="96" cy="74" r="3.5" fill="#EF4444" />
                    <path d="M 89 60 L 89 68 M 85 64 L 93 64" stroke="#EF4444" strokeWidth="1.5" />
                  </svg>
                )
              },
              {
                title: 'Poisoning',
                desc: 'Ingestion of household chemicals, human medication, chocolate, or grapes.',
                severity: 'Critical',
                urgency: '⚡ Immediate (0m)',
                symptoms: [
                  'Foaming at the mouth or excessive drooling',
                  'Sudden severe vomiting or bloody diarrhea',
                  'Uncontrolled twitching, seizures, or loss of balance',
                  'Lethargy or collapse within short timeframe'
                ],
                firstAid: [
                  'Do NOT induce vomiting unless instructed by a qualified veterinarian',
                  'Identify and preserve the toxic substance or its packaging',
                  'Rinse the mouth with fresh water if the pet is fully conscious',
                  'Contact QuickVet immediately with substance details'
                ],
                recommendedResponse: '⚡ Within 5 Minutes',
                themeColor: 'red',
                icon: (
                  <svg viewBox="0 0 120 100" className="w-24 h-20 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="120" height="100" rx="16" fill="#F0FDF4" />
                    <rect x="45" y="25" width="30" height="45" rx="6" fill="white" stroke="#10B981" strokeWidth="3" />
                    <path d="M 52 25 L 52 18 L 68 18 L 68 25" stroke="#10B981" strokeWidth="3" strokeLinejoin="round" />
                    <circle cx="60" cy="42" r="5" fill="#10B981" />
                    <path d="M 55 52 L 65 52 M 57 48 L 63 56 M 63 48 L 57 56" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="85" cy="65" r="3" fill="#F59E0B" />
                    <circle cx="95" cy="58" r="3.5" fill="#EF4444" />
                  </svg>
                )
              },
              {
                title: 'Difficulty Breathing',
                desc: 'Choking, continuous heavy gasping, blue-tinted gums, or asphyxiation.',
                severity: 'Critical',
                urgency: '⚡ Immediate (0m)',
                symptoms: [
                  'Gums or tongue turning blue, purple, or pale slate',
                  'Neck stretched out with mouth wide open gasping',
                  'Abdomen moving violently in/out to draw breath',
                  'Choking sounds or rubbing face against ground'
                ],
                firstAid: [
                  'Check the mouth carefully for visible foreign obstructions',
                  'Avoid wrapping or constricting the chest or throat areas',
                  'Keep the ambient temperature cool and air circulating',
                  'Get the pet to an oxygen-equipped clinic immediately'
                ],
                recommendedResponse: '⚡ Within 5 Minutes',
                themeColor: 'red',
                icon: (
                  <svg viewBox="0 0 120 100" className="w-24 h-20 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="120" height="100" rx="16" fill="#EFF6FF" />
                    <path d="M 45 45 Q 30 50 35 68 Q 45 72 52 62 Z" fill="white" stroke="#3B82F6" strokeWidth="2.5" />
                    <path d="M 75 45 Q 90 50 85 68 Q 75 72 68 62 Z" fill="white" stroke="#3B82F6" strokeWidth="2.5" />
                    <path d="M 60 20 L 60 45 M 60 45 L 52 50 M 60 45 L 68 50" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M 20 80 L 40 80 L 45 68 L 50 90 L 55 75 L 60 80 L 100 80" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )
              },
              {
                title: 'Severe Bleeding',
                desc: 'Deep puncture wounds, arterial hemorrhages, or continuous bleeding.',
                severity: 'Critical',
                urgency: '⚡ Immediate (0m)',
                symptoms: [
                  'Blood spurting or flowing continuously from a wound',
                  'Weakness, dizziness, or collapse from blood loss',
                  'Direct pressure fails to stop flow after 5 minutes',
                  'Rapid heart rate and shallow respiratory depth'
                ],
                firstAid: [
                  'Apply clean dressing and press firmly with both hands',
                  'Elevate the injured limb above heart level if possible',
                  'Do NOT remove blood-soaked pads; place new ones on top',
                  'Tie a snug wrap; avoid tourniquets unless arterial spurt'
                ],
                recommendedResponse: '⚡ Within 5 Minutes',
                themeColor: 'red',
                icon: (
                  <svg viewBox="0 0 120 100" className="w-24 h-20 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="120" height="100" rx="16" fill="#FEF2F2" />
                    <rect x="40" y="25" width="40" height="36" rx="6" fill="white" stroke="#EF4444" strokeWidth="3" />
                    <rect x="52" y="16" width="16" height="9" rx="2" fill="white" stroke="#EF4444" strokeWidth="2" />
                    <path d="M 60 35 L 60 51 M 52 43 L 68 43" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 90 45 C 90 50 86 54 82 54 C 78 54 74 50 74 45 C 74 40 82 30 82 30 C 82 30 90 40 90 45 Z" fill="#EF4444" />
                  </svg>
                )
              },
              {
                title: 'Seizures',
                desc: 'Uncontrolled muscle tremors, temporary loss of consciousness, or foaming.',
                severity: 'Critical',
                urgency: '⚡ Immediate (0m)',
                symptoms: [
                  'Rigid limbs, paddling movements, or jaw clamping',
                  'Loss of consciousness, drooling, or urination',
                  'Seizure lasts longer than 3 minutes continuously',
                  'Multiple separate seizures occurring within 24 hours'
                ],
                firstAid: [
                  'Clear the surrounding area of hard, sharp objects',
                  'Do NOT insert your hands or any objects into the mouth',
                  'Record the exact start, duration, and details of the fit',
                  'Turn off bright lights and maintain a quiet environment'
                ],
                recommendedResponse: '⚡ Within 5 Minutes',
                themeColor: 'red',
                icon: (
                  <svg viewBox="0 0 120 100" className="w-24 h-20 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="120" height="100" rx="16" fill="#FAF5FF" />
                    <path d="M 20 50 Q 40 50 45 25 Q 50 75 55 45 Q 60 55 65 50 L 100 50" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M 45 42 C 40 42 38 35 48 30 C 48 20 62 18 64 28 C 72 25 78 32 72 38 C 76 44 70 50 62 46 C 58 52 48 48 45 42 Z" stroke="#8B5CF6" strokeWidth="1.5" strokeDasharray="3 3" />
                  </svg>
                )
              },
              {
                title: 'Heat Stroke',
                desc: 'High core body temperature, extreme panting, drooling, or disorientation.',
                severity: 'Urgent',
                urgency: '⚡ Within 5 Minutes',
                symptoms: [
                  'Heavy, rapid, frantic panting and thick saliva',
                  'Bright red or dark colored tongue and gums',
                  'Lethargy, weakness, glassy eyes, or staggering',
                  'Vomiting, diarrhea, or body temperature >104°F'
                ],
                firstAid: [
                  'Move your pet to a cool, shaded, or air-conditioned area immediately',
                  'Pour cool (NOT ice-cold) water over the body, head, and neck',
                  'Provide small amounts of fresh, cool drinking water',
                  'Place a wet towel under the body; do NOT wrap the pet'
                ],
                recommendedResponse: '⚡ Within 10 Minutes',
                themeColor: 'amber',
                icon: (
                  <svg viewBox="0 0 120 100" className="w-24 h-20 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="120" height="100" rx="16" fill="#FFFBEB" />
                    <circle cx="60" cy="40" r="14" fill="#F59E0B" opacity="0.2" />
                    <circle cx="60" cy="40" r="10" fill="#F59E0B" />
                    <path d="M 60 20 L 60 26 M 60 54 L 60 60 M 40 40 L 46 40 M 74 40 L 80 40" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                    <rect x="85" y="25" width="8" height="35" rx="4" fill="white" stroke="#EF4444" strokeWidth="1.5" />
                    <circle cx="89" cy="55" r="6" fill="#EF4444" />
                    <line x1="89" y1="32" x2="89" y2="52" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                )
              },
              {
                title: 'Fractures',
                desc: 'Broken bones, limbs bent at unnatural angles, or inability to bear weight.',
                severity: 'Urgent',
                urgency: '⚡ Within 10 Minutes',
                symptoms: [
                  'Limb held completely off the ground or dangling',
                  'Swelling, deformity, or bone protruding through skin',
                  'Extreme pain, vocalization, or aggression when touched',
                  'Grinding sound or sensation in the affected limb'
                ],
                firstAid: [
                  'Do NOT attempt to reset the bone or apply splints yourself',
                  'Support the injured limb gently; keep the pet confined',
                  'Muzzle the pet if they show signs of pain-induced biting',
                  'Transport on a flat, rigid surface to minimize movement'
                ],
                recommendedResponse: '⚡ Within 15 Minutes',
                themeColor: 'amber',
                icon: (
                  <svg viewBox="0 0 120 100" className="w-24 h-20 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="120" height="100" rx="16" fill="#EEF2F6" />
                    <rect x="35" y="20" width="50" height="60" rx="6" fill="#1E293B" />
                    <path d="M 52 30 C 48 30 48 24 52 24 C 56 24 56 30 52 30 M 52 70 C 48 70 48 76 52 76 C 56 76 56 70 52 70" stroke="white" strokeWidth="2" />
                    <path d="M 68 30 C 64 30 64 24 68 24 C 72 24 72 30 68 30 M 68 70 C 64 70 64 76 68 76 C 72 76 72 70 68 70" stroke="white" strokeWidth="2" />
                    <line x1="52" y1="30" x2="52" y2="70" stroke="white" strokeWidth="5.5" strokeLinecap="round" />
                    <line x1="68" y1="30" x2="68" y2="70" stroke="white" strokeWidth="5.5" strokeLinecap="round" />
                    <path d="M 46 48 L 58 52" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )
              },
              {
                title: 'Snake Bites',
                desc: 'Venomous bites, sudden severe swelling, puncture marks, or paralysis.',
                severity: 'Critical',
                urgency: '⚡ Immediate (0m)',
                symptoms: [
                  'Two distinct bleeding puncture marks on the skin',
                  'Rapid, painful swelling around the bite location',
                  'Weakness, wobbly gait, breathing trouble, or paralysis',
                  'Tremors, vomiting, or blood in urine/saliva'
                ],
                firstAid: [
                  'Identify the snake if safe to do so; do NOT try to capture it',
                  'Keep the bite site located BELOW heart level if possible',
                  'Do NOT cut the wound, attempt to suck venom, or apply ice',
                  'Seek veterinary antivenom treatment immediately'
                ],
                recommendedResponse: '⚡ Within 5 Minutes',
                themeColor: 'red',
                icon: (
                  <svg viewBox="0 0 120 100" className="w-24 h-20 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="120" height="100" rx="16" fill="#EBF8FF" />
                    <path d="M 40 70 Q 55 80 70 70 Q 85 60 70 50 Q 55 40 70 30" stroke="#3182CE" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 68 30 L 76 26" stroke="#3182CE" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="76" cy="26" r="1.5" fill="#3182CE" />
                    <rect x="85" y="45" width="10" height="25" rx="2" fill="white" stroke="#EF4444" strokeWidth="1.5" />
                    <line x1="90" y1="45" x2="90" y2="38" stroke="#EF4444" strokeWidth="2" />
                  </svg>
                )
              }
            ].map((item, idx) => {
              const isExpanded = expandedCard === idx;
              const isCritical = item.severity === 'Critical';
              
              const handleKeyDown = (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setExpandedCard(isExpanded ? null : idx);
                }
              };

              return (
                <motion.div
                  key={idx}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-expanded={isExpanded}
                  aria-label={`${item.title} - Severity: ${item.severity}. Click to expand first aid instructions.`}
                  onKeyDown={handleKeyDown}
                  onClick={() => setExpandedCard(isExpanded ? null : idx)}
                  className={`snap-center shrink-0 w-[85vw] md:w-auto bg-white/95 backdrop-blur-md rounded-[24px] p-6 border-t border-r border-b border-green-100/40 text-left shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-lg transition-all duration-200 cursor-pointer group select-none border-l-4 ${
                    isCritical 
                      ? 'border-l-red-500/80 hover:shadow-[0_20px_45px_rgba(239,68,68,0.08)] hover:border-l-red-500' 
                      : 'border-l-amber-500/80 hover:shadow-[0_20px_45px_rgba(245,158,11,0.08)] hover:border-l-amber-500'
                  } ${isExpanded ? 'ring-2 ring-[#58B368]/30 md:col-span-2 lg:col-span-2' : 'hover:-translate-y-2'}`}
                >
                  <div className="mb-5 overflow-hidden rounded-2xl group-hover:scale-105 transition-transform duration-200">
                    {item.icon}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-display font-black text-base text-slate-900 leading-tight">
                        {item.title}
                      </h4>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse ${
                        isCritical ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {isCritical ? '🔴 Critical' : '🟡 Urgent'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2">
                      {item.desc}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-4 text-xs font-semibold text-slate-400">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 py-1 px-2.5 rounded-lg">
                      {item.urgency}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#2D855A] hover:text-[#58B368] transition-colors font-bold">
                      {isExpanded ? 'Show Less' : 'Learn More'}
                      <span className="transform group-hover:translate-x-1.5 transition-transform duration-200">→</span>
                    </span>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden border-t border-slate-100 mt-5 pt-5 space-y-4 text-xs text-left"
                      >
                        <div className="space-y-1.5">
                          <span className="block font-black text-slate-800 uppercase tracking-wider text-[10px]">
                            ⚠️ Critical Symptoms:
                          </span>
                          <ul className="space-y-1 pl-4 list-disc text-slate-500 font-medium">
                            {item.symptoms.map((symp, i) => (
                              <li key={i}>{symp}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-1.5">
                          <span className="block font-black text-[#2D855A] uppercase tracking-wider text-[10px]">
                            🏥 Immediate First Aid:
                          </span>
                          <ul className="space-y-1 pl-4 list-disc text-slate-500 font-medium">
                            {item.firstAid.map((aid, i) => (
                              <li key={i}>{aid}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-4 mt-2">
                          <div>
                            <span className="block text-[9px] uppercase font-bold text-slate-400">Response target</span>
                            <span className="text-slate-800 font-black text-sm">{item.recommendedResponse}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              scrollToTop();
                            }}
                            className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-extrabold text-[10px] uppercase py-2.5 px-4 rounded-xl shadow-md transition-colors cursor-pointer w-full sm:w-auto text-center"
                          >
                            Request Emergency Help
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>

        </div>
      </section>

      {/* ===== FAQ DIRECTORY ===== */}
      <section className="py-24 bg-[#F4FBF3]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
            
            {/* Left Column FAQ */}
            <div className="lg:col-span-4 text-left space-y-4">
              <span className="text-xs font-black uppercase tracking-widest text-[#58B368] bg-green-100/40 px-3.5 py-2 rounded-lg border border-green-200/40 inline-block">Support FAQ</span>
              <h2 className="font-display font-black text-3xl text-gray-900 tracking-tight leading-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Review core questions regarding dispatch, clinical verification, and support limits.
              </p>
            </div>

            {/* Right Column Accordions */}
            <div className="lg:col-span-8 space-y-3.5">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200/40 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                  <button 
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)} 
                    className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-slate-50/55"
                  >
                    <span className="text-sm font-bold text-slate-800">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === idx && (
                      <motion.div 
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      >
                        <div className="px-5 pb-5 border-t border-slate-50 pt-3 text-left">
                          <p className="text-xs text-slate-500 leading-relaxed">{faq.a}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* ===== BOTTOM CTA ===== */}
      <section className="py-24 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="relative rounded-[40px] overflow-hidden bg-slate-950 border border-slate-900 text-white py-20 px-8 sm:px-16 text-center">
            
            {/* Glowing Accent Blobs */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h3 className="font-display font-black text-3xl sm:text-4xl leading-tight">
                Your Pet's Safety Is <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-300">
                  One Click Away
                </span>
              </h3>
              <p className="text-slate-400 text-base leading-relaxed max-w-xl mx-auto">
                Every second matters. Trigger a secure emergency alert directly to verified nearby clinics now without administrative delays.
              </p>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={scrollToTop}
                className="relative pulse-ring inline-flex items-center justify-center gap-2.5 px-10 py-5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-extrabold rounded-2xl shadow-xl shadow-red-500/20 transition-all text-sm cursor-pointer w-full sm:w-auto"
              >
                <Phone className="w-4.5 h-4.5" />
                Get Emergency Help Now
              </motion.button>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
