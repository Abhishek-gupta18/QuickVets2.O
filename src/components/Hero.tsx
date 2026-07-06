import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, HeartPulse, Home, Users, Star, Clock, MapPin, CheckCircle2, ArrowRight, Stethoscope, Phone, BadgeCheck } from 'lucide-react';
import { VetClinic } from '../types';
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
      
      // Easing: easeOutQuad
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


interface HeroProps {
  clinics: VetClinic[];
  userLocation: { lat: number; lng: number } | null;
  userLocationLabel: string | null;
  onSelectClinic: (id: string) => void;
  onNavigateToFind: (specialty?: string) => void;
  onNavigateToEmergency: () => void;
  onNavigateToVetRegister: () => void;
}

export default function Hero({
  clinics,
  userLocation,
  userLocationLabel,
  onSelectClinic,
  onNavigateToFind,
  onNavigateToEmergency,
  onNavigateToVetRegister,
}: HeroProps) {
  const verifiedClinics = clinics.filter(c => c.verificationStatus === 'approved');
  const featuredVets = clinics.slice(0, 6);

  const slideshowImages = [
    "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&q=80&w=1600",
    "/hero-vet-dog.jpg",
    "/hero-vet-puppy-kitten.jpg"
  ];

  const [bgIndex, setBgIndex] = useState(0);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % slideshowImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isInteracting = useRef(false);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const petCategories = [
    { name: 'Dogs', count: clinics.filter(c => c.specialists.includes('Dog')).length || 120, img: '/dog-carousel.png', fallbackSpecialists: '120+ Specialists' },
    { name: 'Cats', count: clinics.filter(c => c.specialists.includes('Cat')).length || 95, img: '/cat-carousel.png', fallbackSpecialists: '95+ Specialists' },
    { name: 'Birds', count: clinics.filter(c => c.specialists.includes('Bird')).length || 42, img: '/bird-carousel.png', fallbackSpecialists: '42+ Specialists' },
    { name: 'Rabbits', count: clinics.filter(c => c.specialists.includes('Rabbit')).length || 30, img: '/rabbit-carousel.png', fallbackSpecialists: '30+ Specialists' },
    { name: 'Exotics', count: clinics.filter(c => c.specialists.includes('Exotics')).length || 18, img: '/exotic-carousel.png', fallbackSpecialists: '18+ Specialists' },
    { name: 'Horses', count: clinics.filter(c => c.specialists.includes('Horse' as any)).length || 15, img: '/horse-carousel.png', fallbackSpecialists: '15+ Specialists' },
    { name: 'Hamsters', count: clinics.filter(c => c.specialists.includes('Hamster' as any)).length || 22, img: '/hamster-carousel.png', fallbackSpecialists: '22+ Specialists' },
  ];

  const duplicatedPets = [...petCategories, ...petCategories, ...petCategories, ...petCategories];

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let animationId: number;
    let lastTime = performance.now();

    const step = (time: number) => {
      if (!isInteracting.current && container) {
        const elapsed = time - lastTime;
        const speed = 0.035; // 25-35s loop
        container.scrollLeft += speed * elapsed;

        const singleSetWidth = container.scrollWidth / 4;
        if (container.scrollLeft >= singleSetWidth * 2) {
          container.scrollLeft -= singleSetWidth;
        }
      }
      lastTime = time;
      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDown.current = true;
    isInteracting.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0);
    scrollLeft.current = scrollRef.current?.scrollLeft || 0;
  };

  const handleMouseLeave = () => {
    isDown.current = false;
    isInteracting.current = false;
  };

  const handleMouseUp = () => {
    isDown.current = false;
    setTimeout(() => {
      if (!isDown.current) {
        isInteracting.current = false;
      }
    }, 200);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleTouchStart = () => {
    isInteracting.current = true;
  };

  const handleTouchEnd = () => {
    setTimeout(() => {
      isInteracting.current = false;
    }, 1000);
  };

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
      <section className="py-20 bg-gradient-to-b from-white to-[#F4FBF3]/35 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              {
                value: 500,
                suffix: '+',
                label: 'Verified Clinics',
                description: 'Fully vetted, license-checked veterinary clinics.',
                icon: (
                  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 transition-transform duration-300 group-hover:scale-110">
                    <defs>
                      <linearGradient id="clinic-grad-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ECFDF5" />
                        <stop offset="100%" stopColor="#A7F3D0" stopOpacity="0.4" />
                      </linearGradient>
                      <linearGradient id="clinic-primary" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#047857" />
                      </linearGradient>
                    </defs>
                    <circle cx="32" cy="32" r="28" fill="url(#clinic-grad-bg)" />
                    <path d="M18 44V23C18 21.8954 18.8954 21 20 21H40C41.1046 21 42 21.8954 42 23V44" stroke="url(#clinic-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M28 21V17C28 16.4477 28.4477 16 29 16H31C31.5523 16 32 16.4477 32 17V21" stroke="url(#clinic-primary)" strokeWidth="2" strokeLinecap="round" />
                    <rect x="22" y="26" width="6" height="6" rx="1.5" fill="#A7F3D0" stroke="url(#clinic-primary)" strokeWidth="2" />
                    <rect x="32" y="26" width="6" height="6" rx="1.5" fill="#A7F3D0" stroke="url(#clinic-primary)" strokeWidth="2" />
                    <rect x="22" y="35" width="6" height="6" rx="1.5" fill="#A7F3D0" stroke="url(#clinic-primary)" strokeWidth="2" />
                    <path d="M28 44V39C28 37.8954 28.8954 37 30 37H34" stroke="url(#clinic-primary)" strokeWidth="2.5" strokeLinecap="round" />
                    <g transform="translate(12, 10)">
                      <circle cx="28" cy="28" r="11" fill="url(#clinic-primary)" />
                      <path d="M25 28L27 30L31 26" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  </svg>
                )
              },
              {
                value: 10000,
                suffix: '+',
                useFormatter: true,
                label: 'Pets Treated',
                description: 'Loving medical attention provided to animals.',
                icon: (
                  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 transition-transform duration-300 group-hover:scale-110">
                    <defs>
                      <linearGradient id="pets-grad-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFF1F2" />
                        <stop offset="100%" stopColor="#FECDD3" stopOpacity="0.4" />
                      </linearGradient>
                      <linearGradient id="pets-primary" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F43F5E" />
                        <stop offset="100%" stopColor="#BE123C" />
                      </linearGradient>
                    </defs>
                    <circle cx="32" cy="32" r="28" fill="url(#pets-grad-bg)" />
                    <g transform="translate(0, -2)">
                      <path d="M32 40C27.5817 40 25.5 35 28.5 31C30.5 28.5 33.5 28.5 35.5 31C38.5 35 36.4183 40 32 40Z" fill="url(#pets-primary)" />
                      <circle cx="21" cy="26" r="4" fill="url(#pets-primary)" />
                      <circle cx="28" cy="20" r="4.5" fill="url(#pets-primary)" />
                      <circle cx="36" cy="20" r="4.5" fill="url(#pets-primary)" />
                      <circle cx="43" cy="26" r="4" fill="url(#pets-primary)" />
                    </g>
                    <path d="M14 44H24L27 36L30 48L33 40L35 44H50" stroke="url(#pets-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )
              },
              {
                value: 4.8,
                decimals: 1,
                suffix: '★',
                label: 'Average Rating',
                description: 'Consistently rated 5 stars by pet parents.',
                icon: (
                  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 transition-transform duration-300 group-hover:scale-110">
                    <defs>
                      <linearGradient id="rating-grad-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FEF3C7" />
                        <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.4" />
                      </linearGradient>
                      <linearGradient id="rating-primary" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#B45309" />
                      </linearGradient>
                      <linearGradient id="rating-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFFBEB" />
                        <stop offset="100%" stopColor="#FBBF24" />
                      </linearGradient>
                    </defs>
                    <circle cx="32" cy="32" r="28" fill="url(#rating-grad-bg)" />
                    <path d="M26 36V49L32 44L38 49V36" fill="#F59E0B" opacity="0.7" />
                    <path d="M29 36V52L32 48L35 52V36" fill="#D97706" />
                    <circle cx="32" cy="27" r="15" fill="url(#rating-primary)" stroke="#F59E0B" strokeWidth="1" />
                    <circle cx="32" cy="27" r="12" fill="url(#rating-gold)" />
                    <path d="M32 18L34.5 23.5L40.5 24.2L36 28.2L37.3 34.2L32 31L26.7 34.2L28 28.2L23.5 24.2L29.5 23.5L32 18Z" fill="#FFF" />
                  </svg>
                )
              },
              {
                value: 24,
                suffix: '/7',
                label: 'Emergency Support',
                description: 'SOS beacon & urgent response team standing by.',
                icon: (
                  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 transition-transform duration-300 group-hover:scale-110">
                    <defs>
                      <linearGradient id="emergency-grad-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#DBEAFE" />
                        <stop offset="100%" stopColor="#BFDBFE" stopOpacity="0.4" />
                      </linearGradient>
                      <linearGradient id="emergency-primary" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2563EB" />
                        <stop offset="100%" stopColor="#1D4ED8" />
                      </linearGradient>
                    </defs>
                    <circle cx="32" cy="32" r="28" fill="url(#emergency-grad-bg)" />
                    <rect x="18" y="24" width="28" height="22" rx="4" fill="url(#emergency-primary)" />
                    <path d="M26 24V20C26 18.8954 26.8954 18 28 18H36C37.1046 18 38 18.8954 38 20V24" stroke="url(#emergency-primary)" strokeWidth="2.5" strokeLinecap="round" />
                    <rect x="23" y="24" width="4" height="4" rx="1" fill="#93C5FD" />
                    <rect x="37" y="24" width="4" height="4" rx="1" fill="#93C5FD" />
                    <path d="M32 29V41M26 35H38" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
                    <circle cx="32" cy="32" r="23" stroke="#2563EB" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                  </svg>
                )
              }
            ].map((stat) => {
              return (
                <motion.div
                  key={stat.label}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                  }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="group text-left p-8 rounded-[24px] border border-slate-100/80 bg-gradient-to-br from-white to-slate-50/30 shadow-[0_4px_25px_rgba(0,0,0,0.015)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] backdrop-blur-sm transition-all duration-200 flex flex-col justify-between min-h-[220px]"
                >
                  <div className="mb-6 flex">
                    {stat.icon}
                  </div>
                  <div className="space-y-1">
                    <span className="block font-display font-black text-4xl text-slate-900 tracking-tight">
                      <CountUp 
                        end={stat.value} 
                        suffix={stat.suffix} 
                        decimals={stat.decimals} 
                        useFormatter={stat.useFormatter} 
                      />
                    </span>
                    <span className="block text-sm font-bold text-slate-800">{stat.label}</span>
                    <span className="block text-xs text-slate-400 font-medium leading-relaxed">{stat.description}</span>
                  </div>
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
              { icon: '🏥', title: 'Verified Clinics', desc: 'Every veterinarian on our platform is license-verified, background-checked, and rated by real pet parents.', img: '/verified-clinics.png' },
              { icon: '🚑', title: '24/7 Emergency Care', desc: 'One tap sends an SOS to nearby emergency-ready clinics. Get help within 15 minutes, any time of day.', img: '/emergency-care.png' },
              { icon: '🏠', title: 'Home Visit Booking', desc: 'Skip the clinic queue. Book certified vets for at-home vaccinations, checkups, and routine care.', img: '/home-visit.png' },
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
                    src={item.img}
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
      <section className="py-24 bg-gradient-to-b from-[#F4FBF3]/30 via-white to-[#F4FBF3]/40 border-t border-green-100/30 relative overflow-hidden">
        {/* Background Decorative elements (opacity < 5%) */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] select-none">
          {/* Dot pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#58B368_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
          {/* Blurred circles */}
          <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-[#58B368] blur-[120px]" />
          <div className="absolute bottom-1/3 right-10 w-[400px] h-[400px] rounded-full bg-green-300 blur-[130px]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-20"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-[#58B368]">Simple Process</span>
            <h2 className="font-display font-black text-4xl text-gray-900 tracking-tight mt-3">
              How QuickVet Works
            </h2>
            <p className="text-gray-500 text-base mt-4 max-w-xl mx-auto leading-relaxed">
              Getting quality veterinary care should be fast, simple, and stress-free.
            </p>
          </motion.div>

          <div className="relative">
            {/* Desktop connecting line */}
            <div className="absolute top-[76px] left-[12%] right-[12%] h-[4px] bg-slate-100/70 rounded-full z-0 hidden lg:block">
              {/* Active timeline line filled up to the hovered card */}
              <div 
                className="h-full bg-gradient-to-r from-[#58B368] to-[#2D855A] rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(88,179,104,0.4)]"
                style={{
                  width: hoveredStep === null ? '25%' : `${(hoveredStep + 1) * 25}%`
                }}
              />
              {/* Glowing Pulse Dot */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#58B368] shadow-[0_0_8px_#58B368] animate-[ping_1.5s_infinite]"
                style={{
                  left: hoveredStep === null ? '25%' : `${(hoveredStep + 1) * 25}%`,
                  transition: 'left 0.5s ease-in-out'
                }}
              />
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                visible: { transition: { staggerChildren: 0.12 } }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10"
              onMouseLeave={() => setHoveredStep(null)}
            >
              {[
                {
                  n: '1',
                  title: 'Share Location',
                  desc: 'Automatically detect your location or search manually to discover trusted veterinary clinics nearby.',
                  tooltip: 'Takes less than 30 seconds',
                  icon: (
                    <svg viewBox="0 0 100 100" className="w-20 h-20 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="step1-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#A7F3D0" />
                          <stop offset="100%" stopColor="#34D399" />
                        </linearGradient>
                      </defs>
                      <rect x="15" y="15" width="70" height="70" rx="16" fill="#F0FDF4" stroke="#E2E8F0" strokeWidth="1.5" />
                      <path d="M15 35H85M15 65H85M35 15V85M65 15V85" stroke="#F1F5F9" strokeWidth="1" />
                      <rect x="32" y="10" width="36" height="72" rx="8" fill="white" stroke="#94A3B8" strokeWidth="2.5" />
                      <line x1="45" y1="14" x2="55" y2="14" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="42" cy="30" r="3.5" fill="#34D399" />
                      <circle cx="58" cy="55" r="3.5" fill="#34D399" />
                      <circle cx="40" cy="60" r="2.5" fill="#94A3B8" />
                      <g transform="translate(44, 34)">
                        <path d="M6 0C2.68629 0 0 2.68629 0 6C0 10.5 6 17 6 17C6 17 12 10.5 12 6C12 2.68629 9.31371 0 6 0Z" fill="url(#step1-grad)" />
                        <circle cx="6" cy="6" r="2.5" fill="white" />
                      </g>
                    </svg>
                  )
                },
                {
                  n: '2',
                  title: 'Choose Your Vet',
                  desc: 'Compare verified vets based on ratings, specialties, consultation fees, and availability.',
                  tooltip: 'Verified Professionals',
                  icon: (
                    <svg viewBox="0 0 100 100" className="w-20 h-20 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="step2-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FED7AA" />
                          <stop offset="100%" stopColor="#F97316" />
                        </linearGradient>
                      </defs>
                      <rect x="20" y="20" width="60" height="60" rx="16" fill="white" stroke="#E2E8F0" strokeWidth="1.5" />
                      <circle cx="50" cy="42" r="14" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
                      <path d="M46 45C46 42 48 39 50 39C52 39 54 42 54 45" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M43 36L45 40" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M57 36L55 40" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
                      <circle cx="62" cy="32" r="7" fill="#10B981" />
                      <path d="M59 32L61 34L65 30" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <g transform="translate(34, 62)">
                        <polygon points="4,0 5.2,2.4 8,2.8 6,4.8 6.5,7.6 4,6.2 1.5,7.6 2,4.8 0,2.8 2.8,2.4" fill="#F59E0B" />
                        <polygon points="12,0 13.2,2.4 16,2.8 14,4.8 14.5,7.6 12,6.2 9.5,7.6 10,4.8 8,2.8 10.8,2.4" fill="#F59E0B" />
                        <polygon points="20,0 21.2,2.4 24,2.8 22,4.8 22.5,7.6 20,6.2 17.5,7.6 18,4.8 16,2.8 18.8,2.4" fill="#F59E0B" />
                        <polygon points="28,0 29.2,2.4 32,2.8 30,4.8 30.5,7.6 28,6.2 25.5,7.6 26,4.8 24,2.8 26.8,2.4" fill="#F59E0B" />
                      </g>
                      <rect x="35" y="74" width="30" height="8" rx="4" fill="#ECFDF5" />
                      <rect x="42" y="76" width="16" height="4" rx="2" fill="#10B981" />
                    </svg>
                  )
                },
                {
                  n: '3',
                  title: 'Book in Seconds',
                  desc: 'Choose your preferred date and time for a clinic visit, home visit, or online consultation.',
                  tooltip: 'Instant Confirmation',
                  icon: (
                    <svg viewBox="0 0 100 100" className="w-20 h-20 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="22" y="22" width="56" height="56" rx="12" fill="white" stroke="#3B82F6" strokeWidth="2.5" />
                      <rect x="22" y="22" width="56" height="14" rx="0" fill="#3B82F6" />
                      <rect x="34" y="14" width="5" height="12" rx="2.5" fill="#1E40AF" />
                      <rect x="61" y="14" width="5" height="12" rx="2.5" fill="#1E40AF" />
                      <rect x="44" y="44" width="32" height="18" rx="6" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1" />
                      <circle cx="50" cy="53" r="3" fill="#3B82F6" />
                      <line x1="56" y1="53" x2="68" y2="53" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="34" cy="62" r="12" fill="#10B981" />
                      <path d="M29 62L32 65L39 58" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )
                },
                {
                  n: '4',
                  title: 'Receive Professional Care',
                  desc: 'Visit the clinic or connect online and receive trusted veterinary care for your pet.',
                  tooltip: '24/7 Support',
                  icon: (
                    <svg viewBox="0 0 100 100" className="w-20 h-20 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="step4-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#D1FAE5" />
                          <stop offset="100%" stopColor="#10B981" />
                        </linearGradient>
                        <linearGradient id="cross-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="100%" stopColor="#047857" />
                        </linearGradient>
                      </defs>
                      <circle cx="50" cy="50" r="36" fill="url(#step4-grad)" opacity="0.15" />
                      <path d="M30 30C30 50 40 65 50 65C60 65 70 50 70 30" stroke="#94A3B8" strokeWidth="3.5" strokeLinecap="round" />
                      <rect x="42" y="32" width="16" height="36" rx="4" fill="url(#cross-grad)" />
                      <rect x="32" y="42" width="36" height="16" rx="4" fill="url(#cross-grad)" />
                      <path d="M50 44C48 40 44 40 44 43C44 46 50 50 50 50C50 50 56 46 56 43C56 40 52 40 50 44Z" fill="white" />
                      <path d="M72 32L74 35L77 36L74 37L72 40L70 37L67 36L70 35L72 32Z" fill="#F59E0B" />
                      <path d="M26 62L27.5 64.5L30 65L27.5 65.5L26 68L24.5 65.5L22 65L24.5 64.5L26 62Z" fill="#F59E0B" />
                    </svg>
                  )
                }
              ].map((step, idx) => {
                const isHovered = hoveredStep === idx;
                const isDimmed = hoveredStep !== null && hoveredStep !== idx;

                return (
                  <motion.div
                    key={step.n}
                    variants={{
                      hidden: { opacity: 0, y: 30 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                    }}
                    onMouseEnter={() => setHoveredStep(idx)}
                    className={`relative bg-white/80 backdrop-blur-md rounded-[24px] border border-green-100/40 p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_20px_45px_rgba(88,179,104,0.08)] hover:-translate-y-2 hover:scale-[1.03] transition-all duration-300 cursor-default select-none group flex flex-col justify-between min-h-[380px] z-10 ${
                      isDimmed ? 'opacity-55' : 'opacity-100'
                    }`}
                  >
                    {/* Tooltip */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: -4, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-black px-4 py-2 rounded-xl shadow-xl whitespace-nowrap z-30"
                        >
                          {step.tooltip}
                          {/* Tooltip arrow */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Step illustration */}
                    <div className="mb-6 h-[100px] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      {step.icon}
                    </div>

                    {/* Step number badge & Text info */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white bg-gradient-to-br from-[#58B368] to-[#2D855A] shadow-md group-hover:shadow-[0_0_8px_#58B368] transition-all duration-300`}>
                          {step.n}
                        </span>
                        <h4 className="font-display font-black text-base text-gray-800 tracking-tight">{step.title}</h4>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {step.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== PET CATEGORIES ===== */}
      <section className="py-24 bg-white overflow-hidden relative border-t border-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-[#58B368]">Our Specialties</span>
            <h2 className="font-display font-black text-4xl text-gray-900 tracking-tight mt-3">Care for Every Companion</h2>
            <p className="text-gray-500 text-sm mt-2">Specialized veterinarians for all types of pets.</p>
          </motion.div>
        </div>

        {/* Carousel Container */}
        <div className="w-full relative select-none">
          {/* Subtle gradient overlays to fade out the edges for premium look */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none hidden md:block" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none hidden md:block" />

          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="flex gap-6 overflow-x-auto whitespace-nowrap py-6 px-4 md:px-12 scrollbar-none cursor-grab active:cursor-grabbing select-none"
            style={{ scrollBehavior: 'auto' }}
          >
            {duplicatedPets.map((pet, idx) => (
              <motion.div
                key={`${pet.name}-${idx}`}
                onClick={() => {
                  if (!isDown.current) {
                    onNavigateToFind(pet.name);
                  }
                }}
                className="group flex flex-col flex-shrink-0 w-[280px] h-[380px] bg-gradient-to-br from-white/95 to-slate-50/50 backdrop-blur-sm rounded-[24px] border border-green-100/40 hover:border-green-300 shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:shadow-[0_20px_40px_rgba(88,179,104,0.12)] hover:-translate-y-2 hover:scale-[1.03] transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Image Section (70%) */}
                <div className="h-[70%] overflow-hidden relative">
                  <img
                    src={pet.img}
                    alt={pet.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent" />
                </div>

                {/* Content Section (30%) */}
                <div className="h-[30%] p-6 flex flex-col justify-between bg-white/40">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display font-black text-lg text-slate-800 tracking-tight">{pet.name}</h4>
                      <p className="text-xs font-semibold text-slate-400 mt-1">
                        {pet.count > 0 ? `${pet.count}+ Specialists` : pet.fallbackSpecialists}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-[#58B368] group-hover:bg-[#58B368] group-hover:text-white transition-colors duration-300">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#58B368]">
                    <span>Explore Specialists</span>
                    <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
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
                  onClick={onNavigateToVetRegister}
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
