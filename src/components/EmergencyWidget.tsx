import React, { useState, useEffect } from 'react';
import { 
  Phone, Activity, AlertTriangle, ShieldAlert, X, Clock, MapPin, 
  CheckCircle2, Star, Zap, Bell, Shield, Truck, BadgeCheck, 
  ChevronDown, HeartPulse, Lock, Compass, AlertCircle
} from 'lucide-react';
import { User, EmergencyRequest } from '../types';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

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
      <section className="py-24 bg-white border-b border-slate-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
            
            {/* Left: Heading & Reassurance Card */}
            <div className="lg:col-span-4 text-left space-y-6">
              <span className="text-xs font-black uppercase tracking-widest text-[#58B368] bg-green-50 px-3.5 py-2 rounded-lg border border-green-100 inline-block">Workflow Timeline</span>
              <h2 className="font-display font-black text-3xl text-gray-900 tracking-tight leading-tight">
                What Happens After You Submit
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Once an alert is filed, the QuickVet coordination system runs autonomously to secure clinical care in minutes.
              </p>

              {/* Reassurance checklist */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
                <h4 className="font-display font-bold text-xs text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
                  <Shield className="w-4.5 h-4.5" /> Immediately After Submission:
                </h4>
                <div className="space-y-3">
                  {[
                    'Your coordinates are securely sent to 10+ closest clinics',
                    'Vet team will prepare surgery/triage bay',
                    'You receive phone call match instructions in under 10m',
                    'Direct communication coordinate feed is established',
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Steps Grid */}
            <div className="lg:col-span-8 space-y-5">
              {[
                { step: '01', title: 'Emergency Alert Sent', desc: 'Secure location, contact parameters, and symptoms are packaged and broadcasted.' },
                { step: '02', title: 'Nearest Vet Accepts', desc: 'Responding veterinarians accept. Contact coordinates and live ETAs are matched.' },
                { step: '03', title: 'Phone Confirmation', desc: 'Vet calls you directly to guide you through stabilization while moving to the clinic.' },
                { step: '04', title: 'Treatment Begins', desc: 'The clinic team stabilizes your companion immediately upon your arrival.' },
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-50 rounded-3xl p-6 border border-slate-200/50 text-left relative flex items-start gap-5 hover:shadow-sm transition-shadow">
                  <span className="font-display font-black text-2xl text-[#58B368] bg-green-50 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-green-100">{item.step}</span>
                  <div>
                    <h4 className="font-display font-black text-base text-slate-900 mb-1">{item.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ===== WHY QUICKVET (COMPRESSED TO 3 PILLARS) ===== */}
      <section className="py-20 bg-[#F4FBF3] border-b border-slate-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4 text-left space-y-3">
              <span className="text-xs font-black uppercase tracking-widest text-[#58B368] bg-green-100/40 px-3 py-1.5 rounded border border-green-200/40 inline-block">Security Matrix</span>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-gray-900">Why Trust QuickVet</h3>
              <p className="text-slate-500 text-xs sm:text-sm">We provide secure routing and background-checked vet responders.</p>
            </div>
            
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: Shield, title: 'Verified Emergency Vets', desc: '100% license checked and background audited.' },
                { icon: Compass, title: 'Live GPS Pinpoint', desc: 'Coordinates are transmitted to vets automatically.' },
                { icon: Clock, title: '24/7 Active Network', desc: 'Constant surveillance and active responders 365 days.' },
              ].map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div key={idx} className="bg-white rounded-2xl p-6 border border-green-100/30 text-left space-y-3 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="font-display font-bold text-xs text-slate-900 uppercase tracking-wider">{feat.title}</h4>
                    <p className="text-[11.5px] text-slate-500 leading-normal">{feat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* ===== EMERGENCY SITUATIONS WE HANDLE ===== */}
      <section className="py-24 bg-white border-b border-slate-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          
          <div className="text-left mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-red-500 bg-red-50 px-3.5 py-2 rounded-lg border border-red-100 inline-block">Symptom Guide</span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-gray-900 tracking-tight leading-tight">
              Emergency Situations We Handle
            </h2>
            <p className="text-slate-500 text-sm max-w-xl">
              If your companion animal exhibits any of the critical symptoms below, immediately submit the emergency form above.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Road Accidents', desc: 'Vehicular trauma, open wounds, fractures, or shock.', icon: Truck, color: 'text-red-500 bg-red-50' },
              { title: 'Poisoning', desc: 'Ingestion of chocolate, chemical cleaning fluids, or human medications.', icon: AlertCircle, color: 'text-[#58B368] bg-green-50' },
              { title: 'Difficulty Breathing', desc: 'Heavy gasping, choking, choking sounds, blue-tinted gums.', icon: HeartPulse, color: 'text-blue-500 bg-blue-50' },
              { title: 'Severe Bleeding', desc: 'Active continuous hemorrhage or deep punctures.', icon: AlertTriangle, color: 'text-amber-500 bg-amber-50' },
              { title: 'Seizures', desc: 'Sudden tremors, non-responsiveness, loss of motor control.', icon: Activity, color: 'text-purple-500 bg-purple-50' },
              { title: 'Heat Stroke', desc: 'Heavy panting, drooling, high body temperature, lethargy.', icon: Clock, color: 'text-orange-500 bg-orange-50' },
              { title: 'Fractures', desc: 'Broken limbs, inability to stand, or severe structural damage.', icon: ShieldAlert, color: 'text-indigo-500 bg-indigo-50' },
              { title: 'Snake Bites', desc: 'Venomous bites, swelling, immediate paralysis or weakness.', icon: Shield, color: 'text-teal-500 bg-teal-50' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-200/50 text-left space-y-4 hover:border-red-200 transition-colors">
                  <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center`}>
                    <Icon className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h4 className="font-display font-black text-sm text-slate-900 mb-1">{item.title}</h4>
                    <p className="text-[11.5px] text-slate-500 leading-normal">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

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
