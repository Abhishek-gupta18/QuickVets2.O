import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  PawPrint, CalendarDays, ShieldAlert, Plus, Clock,
  MapPin, Star, ArrowRight, Syringe, FileText, Activity,
  BadgeCheck, Stethoscope, ChevronRight, Phone, Home, Heart
} from 'lucide-react';
import { User, Pet, Booking, EmergencyRequest, VetClinic } from '../types';
import PetProfileModal from './PetProfileModal';

interface UserDashboardProps {
  currentUser: User;
  bookings: Booking[];
  emergencies: EmergencyRequest[];
  clinics: VetClinic[];
  onAddPet: (petForm: any) => Promise<void>;
  onSelectTab: (tab: string) => void;
}

export default function UserDashboard({
  currentUser,
  bookings,
  emergencies,
  clinics,
  onAddPet,
  onSelectTab,
}: UserDashboardProps) {
  const [showAddPetForm, setShowAddPetForm] = useState(false);
  const [activeProfilePet, setActiveProfilePet] = useState<Pet | null>(null);
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [medHistory, setMedHistory] = useState('');
  const [submittingPet, setSubmittingPet] = useState(false);

  const userBookings = bookings.filter(b => b.petOwnerEmail.toLowerCase() === currentUser.email.toLowerCase());
  const userEmergencies = emergencies.filter(e => e.petOwnerEmail.toLowerCase() === currentUser.email.toLowerCase());
  const upcomingBookings = userBookings.filter(b => b.status === 'pending' || b.status === 'approved');
  const completedBookings = userBookings.filter(b => b.status === 'completed');
  const pets = currentUser.pets || [];
  const nearbyClinics = clinics.slice(0, 4);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleAddPetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petName || !petType) { alert('Name and type required'); return; }
    setSubmittingPet(true);
    try {
      await onAddPet({ name: petName, type: petType, breed, age, weight, medicalHistory: medHistory });
      setPetName(''); setPetType('Dog'); setBreed(''); setAge(''); setWeight(''); setMedHistory('');
      setShowAddPetForm(false);
    } catch { alert('Failed to add pet'); }
    finally { setSubmittingPet(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4FBF3] via-[#f8fcf8] to-white">

      {/* ===== PREMIUM WELCOME HERO ===== */}
      <section className="relative bg-gradient-to-br from-[#58B368] via-[#4da85e] to-[#3a8f4a] py-10 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-[-60px] right-[-60px] w-[300px] h-[300px] rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-40px] left-[10%] w-[200px] h-[200px] rounded-full bg-white/5 blur-xl pointer-events-none" />
        <div className="absolute top-[20%] right-[20%] w-6 h-6 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute bottom-[30%] left-[5%] w-4 h-4 rounded-full bg-white/8 pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* User row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-3 border-white/25 shadow-xl flex-shrink-0 ring-4 ring-white/10">
              <img src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.name}`} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h1 className="font-display font-black text-2xl sm:text-3xl text-white leading-tight">{greeting()}, {currentUser.name.split(' ')[0]} 👋</h1>
              <p className="text-white/65 text-sm mt-1">Welcome back! Here's everything you need to keep your companions healthy and happy.</p>
            </div>
          </div>

          {/* Floating glass stat cards */}
          <div className="grid grid-cols-3 gap-3 mt-7">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3.5 hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <PawPrint className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <span className="block font-display font-black text-xl text-white leading-none">{pets.length}</span>
                  <span className="text-[10px] text-white/60 font-semibold">Registered Pets</span>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3.5 hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <CalendarDays className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <span className="block font-display font-black text-xl text-white leading-none">{upcomingBookings.length}</span>
                  <span className="text-[10px] text-white/60 font-semibold">Upcoming</span>
                </div>
              </div>
            </div>
            <button onClick={() => onSelectTab('emergency')} className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3.5 hover:bg-red-500/20 hover:border-red-300/20 transition-all text-left cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-400/20 flex items-center justify-center">
                  <ShieldAlert className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <span className="block font-display font-black text-sm text-white leading-none">SOS</span>
                  <span className="text-[10px] text-white/60 font-semibold">Emergency</span>
                </div>
              </div>
            </button>
          </div>

          {/* Date */}
          <p className="text-white/40 text-[11px] font-semibold mt-5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* ===== MY PETS — VISUAL CENTERPIECE ===== */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-black text-2xl text-slate-900">My Pets</h2>
              <p className="text-sm text-slate-500 mt-0.5">Your registered companions</p>
            </div>
            <button onClick={() => setShowAddPetForm(true)} className="group flex items-center gap-2 px-5 py-2.5 bg-[#58B368] hover:bg-green-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-green-200/40 hover:shadow-lg hover:shadow-green-200/50 active:scale-[0.97]">
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" /> Add Pet
            </button>
          </div>

          {pets.length === 0 ? (
            <div className="relative bg-gradient-to-br from-green-50 to-emerald-50/30 rounded-[24px] border border-green-100/60 p-10 sm:p-14 text-center shadow-sm overflow-hidden">
              <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-green-200/20 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="w-24 h-24 rounded-3xl bg-white border border-green-100 shadow-md flex items-center justify-center mx-auto mb-5">
                  <span className="text-5xl">🐶</span>
                </div>
                <h3 className="font-display font-black text-xl text-slate-800">Your Pet Family Awaits</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">Add your first companion to start tracking vaccinations, appointments, and health history — all in one place.</p>
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button onClick={() => setShowAddPetForm(true)} className="px-7 py-3.5 bg-[#58B368] hover:bg-green-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-green-200/40 transition-all active:scale-[0.97]">
                    <Plus className="w-4 h-4 inline mr-1.5" /> Add Your First Pet
                  </button>
                  <button className="px-5 py-3.5 bg-white text-slate-600 font-bold text-sm rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-5 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
              {pets.map((pet) => (
                <div key={pet.id} className="flex-shrink-0 w-[300px] sm:w-[340px] snap-start bg-white rounded-[22px] border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden">
                  {/* Pet header with gradient */}
                  <div className="h-20 bg-gradient-to-r from-green-100 to-emerald-50 relative flex items-end px-5 pb-0">
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 bg-white/90 backdrop-blur rounded-lg text-[9px] font-black text-green-700 border border-green-100 shadow-sm">
                        ❤️ Healthy
                      </span>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-white border-2 border-white shadow-md flex items-center justify-center text-3xl translate-y-5">
                      {pet.type === 'Dog' ? '🐕' : pet.type === 'Cat' ? '🐈' : pet.type === 'Bird' ? '🐦' : pet.type === 'Rabbit' ? '🐇' : '🐾'}
                    </div>
                  </div>

                  <div className="pt-8 pb-5 px-5 space-y-3.5">
                    <div>
                      <h4 className="font-display font-black text-lg text-slate-900">{pet.name}</h4>
                      <p className="text-xs text-slate-500">{pet.breed || pet.type} {pet.age ? `· ${pet.age} years old` : ''} {pet.weight ? `· ${pet.weight}` : ''}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Species</span>
                        <span className="block text-xs font-black text-slate-700 mt-0.5">{pet.type}</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Age</span>
                        <span className="block text-xs font-black text-slate-700 mt-0.5">{pet.age || '—'} yr</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Weight</span>
                        <span className="block text-xs font-black text-slate-700 mt-0.5">{pet.weight || '—'}</span>
                      </div>
                    </div>

                    {pet.medicalHistory && pet.medicalHistory.length > 0 && (
                      <div className="bg-green-50/60 border border-green-100/60 rounded-xl px-3.5 py-2.5 text-[11px] text-green-700">
                        <span className="font-bold">Last record:</span> {pet.medicalHistory[pet.medicalHistory.length - 1]}
                      </div>
                    )}

                    <button 
                      onClick={() => setActiveProfilePet(pet)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950"
                    >
                      View Full Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ===== QUICK ACTIONS — PREMIUM ICON CARDS ===== */}
        <section className="bg-white/60 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-10 rounded-[28px] border border-slate-100/60 shadow-sm">
          <h2 className="font-display font-black text-xl text-slate-900 mb-5">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: Plus, label: 'Add Pet', desc: 'Register new', action: () => setShowAddPetForm(true), gradient: 'from-green-500 to-emerald-600' },
              { icon: CalendarDays, label: 'Book Visit', desc: 'Schedule care', action: () => onSelectTab('find_vets'), gradient: 'from-blue-500 to-indigo-600' },
              { icon: MapPin, label: 'Find Vet', desc: 'Nearby clinics', action: () => onSelectTab('find_vets'), gradient: 'from-purple-500 to-violet-600' },
              { icon: ShieldAlert, label: 'Emergency', desc: 'Urgent help', action: () => onSelectTab('emergency'), gradient: 'from-rose-500 to-red-600' },
              { icon: FileText, label: 'Records', desc: 'Medical files', action: () => {}, gradient: 'from-amber-500 to-orange-600' },
              { icon: Syringe, label: 'Vaccines', desc: 'Track shots', action: () => {}, gradient: 'from-cyan-500 to-teal-600' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.label} onClick={item.action} className="group bg-white border border-slate-100 rounded-[18px] p-4 text-left hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-slate-50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md transition-shadow`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="block text-xs font-black text-slate-800">{item.label}</span>
                  <span className="block text-[10px] text-slate-400 font-medium mt-0.5">{item.desc}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })}
          </div>
        </section>

        {/* ===== UPCOMING APPOINTMENTS — PREMIUM CARDS ===== */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-black text-xl text-slate-900">Upcoming Appointments</h2>
            {upcomingBookings.length > 0 && <span className="text-[11px] font-bold text-white bg-[#58B368] px-3 py-1 rounded-full shadow-sm">{upcomingBookings.length} scheduled</span>}
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="relative bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-[22px] border border-blue-100/50 p-10 text-center overflow-hidden">
              <div className="absolute bottom-[-20px] right-[-20px] w-32 h-32 bg-blue-100/30 rounded-full blur-xl pointer-events-none" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white border border-blue-100 shadow-sm flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="w-8 h-8 text-blue-300" />
                </div>
                <h4 className="font-display font-bold text-lg text-slate-700">No Upcoming Appointments</h4>
                <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto">Regular checkups keep your pet healthy and catch issues early.</p>
                <button onClick={() => onSelectTab('find_vets')} className="mt-5 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition-colors active:scale-[0.97]">
                  Book a Checkup
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="bg-white rounded-[20px] border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-50 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <Stethoscope className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-bold text-sm text-slate-900 truncate">{booking.clinicName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{booking.service} · {booking.petName}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-[10px] text-slate-600 font-semibold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        <Clock className="w-3 h-3" /> {booking.date} · {booking.time}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${booking.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                        {booking.status === 'approved' ? '✓ Confirmed' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors" title="Directions">
                      <MapPin className="w-4 h-4 text-slate-500" />
                    </button>
                    <button className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors" title="Call">
                      <Phone className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ===== RECENT ACTIVITY — TIMELINE ===== */}
        <section className="bg-gradient-to-br from-slate-50/80 to-white -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-10 rounded-[28px] border border-slate-100/60">
          <h2 className="font-display font-black text-xl text-slate-900 mb-5">Recent Activity</h2>

          {userBookings.length === 0 && userEmergencies.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mx-auto mb-4">
                <Activity className="w-7 h-7 text-slate-200" />
              </div>
              <h4 className="font-bold text-sm text-slate-600">No activity yet</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Book an appointment or add a pet to see your activity timeline here.</p>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-4">
              {[...userBookings.slice(0, 4).map(b => ({ type: 'booking' as const, data: b, date: b.createdAt })),
                ...userEmergencies.slice(0, 2).map(e => ({ type: 'emergency' as const, data: e, date: e.createdAt }))]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5)
                .map((item, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 border-white shadow-sm ${item.type === 'booking' ? 'bg-blue-400' : 'bg-rose-400'}`} />
                    <div className="bg-white rounded-[16px] border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow ml-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type === 'booking' ? 'bg-blue-50' : 'bg-rose-50'}`}>
                          {item.type === 'booking' ? <CalendarDays className="w-4.5 h-4.5 text-blue-500" /> : <ShieldAlert className="w-4.5 h-4.5 text-rose-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {item.type === 'booking' ? `Appointment at ${(item.data as Booking).clinicName}` : `Emergency for ${(item.data as EmergencyRequest).petName}`}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {item.type === 'booking' ? `${(item.data as Booking).service} · ${(item.data as Booking).petName}` : (item.data as EmergencyRequest).description?.slice(0, 50)}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black flex-shrink-0 ${
                          (item.data as any).status === 'completed' ? 'bg-green-50 text-green-700 border border-green-100' :
                          (item.data as any).status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-slate-50 text-slate-600 border border-slate-100'
                        }`}>
                          {(item.data as any).status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* ===== NEARBY VETERINARIANS — PREMIUM CARDS ===== */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-black text-xl text-slate-900">Recommended Veterinarians</h2>
              <p className="text-sm text-slate-500 mt-0.5">Verified clinics near you</p>
            </div>
            <button onClick={() => onSelectTab('find_vets')} className="group text-xs font-bold text-[#58B368] flex items-center gap-1 hover:underline">
              View All <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {nearbyClinics.map((clinic) => (
              <div key={clinic.id} className="group bg-white rounded-[20px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
                <div className="relative h-28 overflow-hidden">
                  <img src={clinic.imageUrl || 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=400'} alt={clinic.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  {clinic.hasEmergency && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded-md shadow-sm">24/7</span>
                  )}
                  {clinic.isOpenNow && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-green-500 text-white text-[8px] font-black rounded-md shadow-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Open
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-display font-bold text-xs text-slate-900 line-clamp-1">{clinic.name}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{clinic.rating.toFixed(1)}</span>
                    <span>·</span>
                    <span>{clinic.area}</span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {clinic.specialists.slice(0, 2).map(s => (
                      <span key={s} className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[8px] font-bold rounded border border-green-100">{s}</span>
                    ))}
                    {clinic.verificationStatus === 'approved' && (
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-bold rounded border border-blue-100 flex items-center gap-0.5">
                        <BadgeCheck className="w-2.5 h-2.5" /> Verified
                      </span>
                    )}
                  </div>
                  <button onClick={() => onSelectTab('find_vets')} className="w-full mt-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black rounded-xl transition-colors">
                    Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== HELPFUL REMINDERS — PREMIUM ALERT CARDS ===== */}
        <section>
          <h2 className="font-display font-black text-xl text-slate-900 mb-5">Helpful Reminders</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Syringe, title: 'Vaccination Due', desc: 'Annual booster recommended for all pets.', due: 'Due in 2 weeks', gradient: 'from-amber-50 to-orange-50', border: 'border-amber-100', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700', action: 'Schedule Now' },
              { icon: PawPrint, title: 'Deworming', desc: 'Routine deworming every 3 months.', due: 'Due next month', gradient: 'from-blue-50 to-indigo-50', border: 'border-blue-100', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700', action: 'Mark Complete' },
              { icon: Stethoscope, title: 'Annual Checkup', desc: 'Full health checkup once a year.', due: 'Overdue', gradient: 'from-rose-50 to-pink-50', border: 'border-rose-100', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-700', action: 'Book Now' },
            ].map((rem, idx) => {
              const Icon = rem.icon;
              return (
                <div key={idx} className={`bg-gradient-to-br ${rem.gradient} rounded-[20px] border ${rem.border} p-5 space-y-3 hover:shadow-md transition-shadow`}>
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl bg-white/80 border ${rem.border} flex items-center justify-center shadow-inner`}>
                      <Icon className={`w-5 h-5 ${rem.text}`} />
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black ${rem.badge}`}>{rem.due}</span>
                  </div>
                  <div>
                    <h4 className={`font-display font-black text-sm ${rem.text}`}>{rem.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{rem.desc}</p>
                  </div>
                  <button className={`text-[10px] font-black ${rem.text} hover:underline flex items-center gap-1`}>
                    {rem.action} <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

      </div>

      {/* ===== ADD PET MODAL ===== */}
      {showAddPetForm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[24px] shadow-2xl border border-slate-200 overflow-hidden" style={{ animation: 'scaleIn 0.2s ease-out' }}>
            <div className="bg-gradient-to-r from-[#58B368] to-[#4da85e] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <PawPrint className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg">Add a New Pet</h3>
                  <p className="text-[10px] text-white/70 font-semibold">Register your companion</p>
                </div>
              </div>
              <button onClick={() => setShowAddPetForm(false)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white text-sm font-bold">✕</button>
            </div>
            <form onSubmit={handleAddPetSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Name *</label>
                  <input type="text" required placeholder="e.g. Bruno" value={petName} onChange={(e) => setPetName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Species *</label>
                  <select value={petType} onChange={(e) => setPetType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-400 h-[38px]">
                    <option value="Dog">🐶 Dog</option>
                    <option value="Cat">🐱 Cat</option>
                    <option value="Bird">🦜 Bird</option>
                    <option value="Rabbit">🐰 Rabbit</option>
                    <option value="Exotics">🦎 Exotic</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Breed</label>
                  <input type="text" placeholder="Breed" value={breed} onChange={(e) => setBreed(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Age</label>
                  <input type="text" placeholder="yrs" value={age} onChange={(e) => setAge(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Weight</label>
                  <input type="text" placeholder="kg" value={weight} onChange={(e) => setWeight(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-400" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Medical Notes</label>
                <textarea rows={2} placeholder="Allergies, conditions, past surgeries..." value={medHistory} onChange={(e) => setMedHistory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-400 leading-relaxed" />
              </div>
              <button type="submit" disabled={submittingPet}
                className="w-full py-3.5 bg-[#58B368] hover:bg-green-600 text-white font-extrabold text-sm rounded-xl shadow-md shadow-green-200/40 transition-all disabled:opacity-50 active:scale-[0.97]">
                {submittingPet ? 'Adding...' : 'Add Pet'}
              </button>
            </form>
          </div>
        </div>
      )}

      <AnimatePresence>
        {activeProfilePet && (
          <PetProfileModal
            pet={activeProfilePet}
            currentUser={currentUser}
            onClose={() => setActiveProfilePet(null)}
            onSelectTab={onSelectTab}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
