import { useState, useEffect } from 'react';
import { ShieldCheck, HeartPulse, Home, Users, Star, Clock, MapPin, CheckCircle2, ArrowRight, Stethoscope, Phone, BadgeCheck } from 'lucide-react';
import { VetClinic } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface HeroProps {
  clinics: VetClinic[];
  userLocation: { lat: number; lng: number } | null;
  userLocationLabel: string | null;
  onSelectClinic: (id: string) => void;
  onNavigateToFind: () => void;
  onNavigateToEmergency: () => void;
}

export default function Hero({
  clinics,
  userLocation,
  userLocationLabel,
  onSelectClinic,
  onNavigateToFind,
  onNavigateToEmergency,
}: HeroProps) {
  const verifiedClinics = clinics.filter(c => c.verificationStatus === 'approved');
  const featuredVets = clinics.slice(0, 3);

  const slideshowImages = [
    "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&q=80&w=1600",
    "/hero-vet-dog.jpg",
    "/hero-vet-puppy-kitten.jpg"
  ];

  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % slideshowImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-hidden">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Full-Width Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="popLayout">
            <motion.img
              key={bgIndex}
              src={slideshowImages[bgIndex]}
              alt="Veterinarian background"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 w-full h-full object-cover object-[80%_center] lg:object-center"
            />
          </AnimatePresence>
          {/* Subtle responsive gradient to ensure high text contrast, fading out sooner to keep the background image fully visible on the right */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F4FBF3] via-[#F4FBF3]/85 to-transparent z-10" />
        </div>

        {/* Decorative blobs */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-green-100/25 blur-[100px] pointer-events-none z-0" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-emerald-100/20 blur-[80px] pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 lg:py-0 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8 text-left relative z-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur border border-green-100 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-600">Trusted by 10,000+ pet parents across India</span>
              </div>

              <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-[64px] text-gray-900 tracking-tight leading-[1.05]">
                Premium <span className="text-shimmer">Veterinary Care</span> at Your Fingertips
              </h1>

              <p className="text-gray-500 text-lg sm:text-xl max-w-lg leading-relaxed">
                Connect with verified veterinarians, book instant appointments, and access 24/7 emergency care for your beloved pets.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onNavigateToFind}
                  className="group px-8 py-4 bg-[#58B368] hover:bg-green-600 text-white font-extrabold rounded-2xl shadow-lg shadow-green-200/50 hover:shadow-xl hover:shadow-green-200/60 transition-all text-center cursor-pointer text-base flex items-center justify-center gap-2"
                >
                  Find a Veterinarian
                  <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onNavigateToEmergency}
                  className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-center cursor-pointer text-base flex items-center justify-center gap-2"
                >
                  <HeartPulse className="w-5 h-5 text-rose-500" />
                  Emergency Help
                </motion.button>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-5 pt-2">
                <div className="flex -space-x-2">
                  {['photo-1544005313-94ddf0286df2', 'photo-1506794778202-cad84cf45f1d', 'photo-1534528741775-53994a69daeb', 'photo-1507003211169-0a1dd7228f2d'].map((img, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm">
                      <img src={`https://images.unsplash.com/${img}?auto=format&fit=crop&q=80&w=80`} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                    <span className="text-xs font-bold text-slate-600 ml-1">4.8</span>
                  </div>
                  <span className="text-[11px] text-slate-400">from 2,400+ reviews</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Floating cards only (image is full background) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="relative hidden lg:block h-[560px]"
            >
              {/* Floating cards */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="absolute top-12 left-16 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-green-100 shadow-xl flex items-center gap-3 animate-[float_3s_ease-in-out_infinite]"
              >
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <BadgeCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <span className="block text-sm font-black text-gray-800">500+ Verified</span>
                  <span className="text-[10px] text-gray-500">Licensed Veterinarians</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="absolute bottom-16 left-24 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-green-100 shadow-xl flex items-center gap-3 animate-[float_3s_ease-in-out_infinite_0.5s]"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                  <HeartPulse className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <span className="block text-sm font-black text-gray-800">&lt;15 min</span>
                  <span className="text-[10px] text-gray-500">Emergency Response</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="absolute top-1/2 -right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-green-100 shadow-xl flex items-center gap-3 animate-[float_3s_ease-in-out_infinite_1s]"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <span className="block text-sm font-black text-gray-800">24/7 Open</span>
                  <span className="text-[10px] text-gray-500">Always Available</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== TRUST STATS ===== */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { value: '500+', label: 'Verified Clinics', icon: ShieldCheck, color: 'text-green-600 bg-green-50' },
              { value: '10,000+', label: 'Pets Treated', icon: HeartPulse, color: 'text-rose-500 bg-rose-50' },
              { value: '4.8★', label: 'Average Rating', icon: Star, color: 'text-amber-500 bg-amber-50' },
              { value: '24/7', label: 'Emergency Support', icon: Phone, color: 'text-blue-600 bg-blue-50' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                  }}
                  whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(0,0,0,0.04)" }}
                  className="text-center p-6 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="block font-display font-black text-3xl text-slate-900">{stat.value}</span>
                  <span className="text-sm text-slate-500 font-medium">{stat.label}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ===== WHY CHOOSE QUICKVET ===== */}
      <section className="py-24 bg-[#F4FBF3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-[#58B368]">Why QuickVet</span>
            <h2 className="font-display font-black text-4xl text-gray-900 tracking-tight mt-3">
              Everything Your Pet Needs, In One Place
            </h2>
            <p className="text-gray-500 text-base mt-4 leading-relaxed">
              From routine checkups to critical emergencies, QuickVet connects you with trusted professionals who care.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              visible: { transition: { staggerChildren: 0.12 } }
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { icon: '🏥', title: 'Verified Clinics', desc: 'Every veterinarian on our platform is license-verified, background-checked, and rated by real pet parents.', img: 'photo-1584132967334-10e028bd69f7' },
              { icon: '🚑', title: '24/7 Emergency Care', desc: 'One tap sends an SOS to nearby emergency-ready clinics. Get help within 15 minutes, any time of day.', img: 'photo-1612531386530-97d3f79d6043' },
              { icon: '🏠', title: 'Home Visit Booking', desc: 'Skip the clinic queue. Book certified vets for at-home vaccinations, checkups, and routine care.', img: 'photo-1587300003388-59208cc962cb' },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                }}
                whileHover={{ y: -6 }}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={`https://images.unsplash.com/${item.img}?auto=format&fit=crop&q=80&w=600`}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <span className="text-3xl">{item.icon}</span>
                  <h3 className="font-display font-black text-lg text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURED VETERINARIANS ===== */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#58B368]">Featured</span>
              <h2 className="font-display font-black text-4xl text-gray-900 tracking-tight mt-2">Top-Rated Veterinarians</h2>
              <p className="text-gray-500 text-sm mt-2">Handpicked professionals trusted by thousands of pet parents.</p>
            </div>
            <button
              onClick={onNavigateToFind}
              className="text-sm font-bold text-[#58B368] hover:underline flex items-center gap-1 flex-shrink-0"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {featuredVets.map((vet) => (
              <motion.div
                key={vet.id}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                }}
                whileHover={{ y: -6 }}
                className="group bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={vet.imageUrl || 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=600'}
                    alt={vet.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur rounded-lg text-[10px] font-black text-green-700 border border-green-100">
                    <BadgeCheck className="w-3 h-3" /> Verified
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <h4 className="font-display font-black text-base text-slate-900 truncate">{vet.veterinarianName || vet.name}</h4>
                    <p className="text-xs text-slate-500 truncate">{vet.name} · {vet.area}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {vet.rating.toFixed(1)}</span>
                    <span>·</span>
                    <span>{vet.reviewsCount} reviews</span>
                    <span>·</span>
                    <span>{vet.specialists.slice(0,2).join(', ')}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {vet.hasEmergency && <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-md border border-rose-100">24/7</span>}
                    {vet.hasHomeVisit && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md border border-blue-100">Home Visit</span>}
                    <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-md border border-green-100">{vet.workingHours}</span>
                  </div>
                  <button
                    onClick={() => onSelectClinic(vet.id)}
                    className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-colors"
                  >
                    View & Book
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-24 bg-[#F4FBF3] border-t border-green-100/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs font-bold uppercase tracking-widest text-[#58B368]">Simple Process</span>
            <h2 className="font-display font-black text-4xl text-gray-900 tracking-tight mt-3 mb-16">
              How QuickVet Works
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              visible: { transition: { staggerChildren: 0.12 } }
            }}
            className="grid grid-cols-1 sm:grid-cols-4 gap-8 relative"
          >
            <div className="hidden sm:block absolute top-8 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-green-200 via-green-300 to-green-200" />
            {[
              { n: '1', title: 'Share Location', desc: 'We auto-detect your location to find the nearest clinics.', emoji: '📍' },
              { n: '2', title: 'Choose Your Vet', desc: 'Compare ratings, specialties, and availability at a glance.', emoji: '🩺' },
              { n: '3', title: 'Book Instantly', desc: 'Schedule a clinic visit or home appointment in seconds.', emoji: '📅' },
              { n: '4', title: 'Get Care', desc: 'Your pet receives professional treatment from verified vets.', emoji: '💚' },
            ].map((step) => (
              <motion.div
                key={step.n}
                variants={{
                  hidden: { opacity: 0, scale: 0.9, y: 20 },
                  visible: { opacity: 1, scale: 1, y: 0 }
                }}
                className="relative z-10 flex flex-col items-center text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-green-200 shadow-md flex items-center justify-center text-2xl">
                  {step.emoji}
                </div>
                <h4 className="font-display font-black text-sm text-gray-800">{step.title}</h4>
                <p className="text-xs text-gray-500 max-w-[180px] leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== PET CATEGORIES ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="font-display font-black text-3xl text-gray-900 tracking-tight">Care for Every Companion</h2>
            <p className="text-gray-500 text-sm mt-2">Specialized veterinarians for all types of pets.</p>
          </motion.div>
          
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              visible: { transition: { staggerChildren: 0.08 } }
            }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
          >
            {[
              { emoji: '🐕', name: 'Dogs', count: clinics.filter(c => c.specialists.includes('Dog')).length },
              { emoji: '🐈', name: 'Cats', count: clinics.filter(c => c.specialists.includes('Cat')).length },
              { emoji: '🐦', name: 'Birds', count: clinics.filter(c => c.specialists.includes('Bird')).length },
              { emoji: '🐇', name: 'Rabbits', count: clinics.filter(c => c.specialists.includes('Rabbit')).length },
              { emoji: '🦎', name: 'Exotics', count: clinics.filter(c => c.specialists.includes('Exotics')).length },
            ].map((pet) => (
              <motion.div
                key={pet.name}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ y: -4, scale: 1.02 }}
                onClick={onNavigateToFind}
                className="bg-[#F4FBF3] border border-green-100/60 rounded-2xl p-5 text-center hover:shadow-md hover:border-green-200 transition-all cursor-pointer"
              >
                <span className="text-4xl block mb-2">{pet.emoji}</span>
                <h4 className="font-display font-black text-sm text-slate-800">{pet.name}</h4>
                <p className="text-[11px] text-slate-400 font-semibold mt-1">{pet.count} specialists</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-24 bg-[#F4FBF3]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-[#58B368]">Testimonials</span>
            <h2 className="font-display font-black text-4xl text-gray-900 tracking-tight mt-3">Loved by Pet Parents</h2>
          </motion.div>
          
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { text: 'When Rocky had a heat stroke, the emergency button connected us to a vet in under 12 minutes. Genuinely life-saving.', name: 'Sarah Banerjee', role: 'Golden Retriever Mom', img: 'photo-1544005313-94ddf0286df2' },
              { text: 'Booked a home deworming visit for Luna. The vet was incredibly gentle and thorough. No more stressful car rides!', name: 'Rohan Sridhar', role: 'Persian Cat Dad', img: 'photo-1506794778202-cad84cf45f1d' },
              { text: 'Finding an avian specialist in Bengaluru was impossible until I found QuickVet. Kiwi got the best care possible.', name: 'Ananya Krishnan', role: 'Parakeet Parent', img: 'photo-1534528741775-53994a69daeb' },
            ].map((t, idx) => (
              <motion.div
                key={idx}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ y: -6 }}
                className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-5"
              >
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed italic">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-green-100">
                    <img src={`https://images.unsplash.com/${t.img}?auto=format&fit=crop&q=80&w=150`} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-gray-800">{t.name}</h5>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== JOIN AS VET CTA ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="relative rounded-[32px] overflow-hidden"
          >
            <img
              src="https://images.unsplash.com/photo-1581888227599-779811939961?auto=format&fit=crop&q=80&w=1200"
              alt="Veterinarian team"
              className="w-full h-[320px] sm:h-[280px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/40" />
            <div className="absolute inset-0 flex items-center px-8 sm:px-14">
              <div className="max-w-lg space-y-5 text-white">
                <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight">Join as a Verified Veterinarian</h2>
                <p className="text-white/75 text-sm leading-relaxed">
                  Get discovered by thousands of pet parents. Manage bookings, build your reputation, and grow your practice with QuickVet.
                </p>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onNavigateToFind}
                  className="px-7 py-3.5 bg-[#58B368] hover:bg-green-600 text-white font-extrabold rounded-2xl shadow-lg transition-all text-sm cursor-pointer"
                >
                  Register Your Clinic
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
