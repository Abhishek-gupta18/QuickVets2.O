import { useState, useEffect } from 'react';
import { Phone, Menu, X, LogIn, ClipboardList, AlertTriangle, LogOut, ShieldCheck, Stethoscope } from 'lucide-react';
import { User as UserType } from '../types';
import { AnimatePresence, motion } from 'motion/react';

interface NavbarProps {
  currentUser: UserType | null;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: (type: 'login' | 'signup') => void;
}

export default function Navbar({
  currentUser,
  onLogout,
  activeTab,
  setActiveTab,
  onOpenAuth,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'find_vets', label: 'Find Vets' },
    { id: 'emergency', label: 'Emergency' },
    { id: 'reviews', label: 'Pet Parents Community' },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <nav
      className={`sticky top-0 z-[1000] transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-black/[0.06] border-b border-white/40'
          : 'bg-white/60 backdrop-blur-md border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className={`flex justify-between transition-all duration-300 ${scrolled ? 'h-[60px]' : 'h-[72px]'}`}>
          
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-2 group cursor-pointer"
            >
              {/* Logo icon */}
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-[#58B368] to-[#2F855A] flex items-center justify-center shadow-md shadow-green-300/40 group-hover:scale-105 transition-transform">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-black text-[22px] text-[#1a2e1c] tracking-tight">
                Quick<span className="text-[#58B368]">Vet</span>
              </span>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className="relative px-4 py-2 text-sm font-semibold transition-colors duration-200 cursor-pointer group"
              >
                <span
                  className={`transition-colors duration-200 ${
                    activeTab === link.id
                      ? 'text-[#2F855A]'
                      : 'text-gray-500 group-hover:text-[#58B368]'
                  }`}
                >
                  {link.label}
                </span>
                {/* Animated underline indicator */}
                <span
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2.5px] rounded-full bg-[#58B368] transition-all duration-300 ${
                    activeTab === link.id ? 'w-5/6 opacity-100' : 'w-0 opacity-0'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Right: Actions & Auth */}
          <div className="hidden md:flex items-center gap-2.5">

            {currentUser && currentUser.role === 'pet_owner' && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleNavClick('user_dashboard')}
                className="flex items-center gap-2 px-3.5 py-2 bg-green-50 text-[#2F855A] border border-green-100 rounded-xl text-xs font-bold hover:bg-green-100 transition-colors cursor-pointer"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                My Dashboard
              </motion.button>
            )}

            {currentUser && currentUser.role === 'veterinarian' && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleNavClick('vet_dashboard')}
                className="flex items-center gap-2 px-3.5 py-2 bg-green-50 text-green-700 border border-green-100 rounded-xl text-xs font-bold hover:bg-green-100 transition-colors cursor-pointer"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Doctor Portal
              </motion.button>
            )}

            {currentUser && currentUser.role === 'admin' && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleNavClick('admin_dashboard')}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 text-white border border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-green-300" />
                Admin Control
              </motion.button>
            )}

            {/* Emergency Button with pulse ring */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavClick('emergency')}
              className="relative pulse-ring flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-300/40 transition-colors cursor-pointer overflow-visible"
            >
              <Phone className="w-3.5 h-3.5 fill-white" />
              Emergency
            </motion.button>

            {/* Divider */}
            <div className="w-px h-7 bg-gray-200 mx-1" />

            {currentUser ? (
              <div className="flex items-center gap-1.5">
                {/* Avatar pill */}
                <div className="flex items-center gap-2 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full overflow-hidden ring-2 ring-green-300/50">
                    <img
                      src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg'}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="leading-none text-left">
                    <span className="block text-[11px] font-bold text-gray-800 line-clamp-1 max-w-[90px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[9px] text-gray-400 capitalize">
                      {currentUser.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-gray-600 hover:text-[#58B368] font-semibold text-xs transition-colors cursor-pointer rounded-xl hover:bg-green-50"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Login
                </button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onOpenAuth('signup')}
                  className="px-4 py-2 bg-gradient-to-br from-[#58B368] to-[#2F855A] hover:from-[#4ea85f] hover:to-[#276c4a] text-white font-bold text-xs rounded-xl shadow-md shadow-green-200/50 transition-all cursor-pointer"
                >
                  Get Started
                </motion.button>
              </div>
            )}
          </div>

          {/* Mobile: actions */}
          <div className="flex items-center md:hidden gap-1.5">
            <button
              onClick={() => handleNavClick('emergency')}
              className="relative pulse-ring p-2.5 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-200/50 cursor-pointer"
              title="Emergency"
            >
              <Phone className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl border border-green-100 hover:bg-green-50 text-gray-600 cursor-pointer overflow-hidden"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileMenuOpen ? 'close' : 'open'}
                  initial={{ opacity: 0, rotate: -45, scale: 0.75 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 45, scale: 0.75 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="block"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence initial={false}>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'calc(100dvh - 72px)' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-b border-green-100/80 shadow-2xl overflow-hidden"
          >
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={{
                open: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } },
                closed: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
              }}
              className="h-full overflow-y-auto px-5 pt-5 pb-24 space-y-2.5"
            >
              {/* User card */}
              {currentUser && (
                <motion.div
                  variants={{ open: { opacity: 1, y: 0 }, closed: { opacity: 0, y: -10 } }}
                  className="flex items-center gap-3 bg-gradient-to-br from-green-50 to-emerald-50/60 p-4 rounded-2xl border border-green-100 mb-3"
                >
                  <img
                    src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg'}
                    alt={currentUser.name}
                    className="w-11 h-11 rounded-full border-2 border-green-200"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="font-bold text-gray-800">{currentUser.name}</h4>
                    <p className="text-xs text-gray-500 capitalize">{currentUser.role.replace('_', ' ')}</p>
                  </div>
                </motion.div>
              )}

              {/* Nav links */}
              {navLinks.map((link) => (
                <motion.button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  variants={{ open: { opacity: 1, y: 0 }, closed: { opacity: 0, y: -10 } }}
                  className={`block w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === link.id
                      ? 'bg-green-50 text-[#2F855A] border border-green-100'
                      : 'text-gray-700 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </motion.button>
              ))}

              {currentUser && currentUser.role === 'pet_owner' && (
                <motion.button
                  onClick={() => handleNavClick('user_dashboard')}
                  variants={{ open: { opacity: 1, y: 0 }, closed: { opacity: 0, y: -10 } }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[#2F855A] bg-green-50 border border-green-100 font-bold text-sm text-left"
                >
                  <ClipboardList className="w-4 h-4" />
                  My Pet Dashboard
                </motion.button>
              )}

              {currentUser && currentUser.role === 'veterinarian' && (
                <motion.button
                  onClick={() => handleNavClick('vet_dashboard')}
                  variants={{ open: { opacity: 1, y: 0 }, closed: { opacity: 0, y: -10 } }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-green-700 bg-green-50 border border-green-100 font-bold text-sm text-left"
                >
                  <ClipboardList className="w-4 h-4" />
                  Doctor Portal Dashboard
                </motion.button>
              )}

              {currentUser && currentUser.role === 'admin' && (
                <motion.button
                  onClick={() => handleNavClick('admin_dashboard')}
                  variants={{ open: { opacity: 1, y: 0 }, closed: { opacity: 0, y: -10 } }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-white bg-slate-900 border border-slate-800 font-bold text-sm text-left"
                >
                  <ShieldCheck className="w-4 h-4 text-green-300" />
                  Admin Control Center
                </motion.button>
              )}

              {/* Emergency */}
              <motion.button
                onClick={() => handleNavClick('emergency')}
                variants={{ open: { opacity: 1, y: 0 }, closed: { opacity: 0, y: -10 } }}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-emerald-200/50"
              >
                <AlertTriangle className="w-4 h-4 text-white animate-bounce" />
                Urgent Emergency Rescue
              </motion.button>

              {/* Auth */}
              {currentUser ? (
                <motion.button
                  onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                  variants={{ open: { opacity: 1, y: 0 }, closed: { opacity: 0, y: -10 } }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 font-bold text-sm text-left transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout Session
                </motion.button>
              ) : (
                <motion.div
                  variants={{ open: { opacity: 1, y: 0 }, closed: { opacity: 0, y: -10 } }}
                  className="grid grid-cols-2 gap-2.5 pt-3 border-t border-gray-100"
                >
                  <button
                    onClick={() => { setMobileMenuOpen(false); onOpenAuth('login'); }}
                    className="w-full py-3 border border-green-200 text-[#58B368] font-bold text-sm rounded-xl text-center hover:bg-green-50 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onOpenAuth('signup'); }}
                    className="w-full py-3 bg-gradient-to-br from-[#58B368] to-[#2F855A] text-white font-bold text-sm rounded-xl text-center shadow-md shadow-green-200/50"
                  >
                    Get Started
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
