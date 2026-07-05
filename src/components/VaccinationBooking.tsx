import { useState } from 'react';
import { X, Syringe, Calendar, Clock, MapPin, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { User, Pet, VetClinic, VaccinationAppointment } from '../types';

interface VaccinationBookingProps {
  vaccine: { name: string; age: string; core: boolean; diseases: string[]; booster: string; description: string };
  currentUser: User;
  clinics: VetClinic[];
  onClose: () => void;
  onBooked: (appointment: VaccinationAppointment) => void;
}

export default function VaccinationBooking({ vaccine, currentUser, clinics, onClose, onBooked }: VaccinationBookingProps) {
  const pets = currentUser.pets || [];
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(pets.length === 1 ? pets[0] : null);
  const [selectedClinic, setSelectedClinic] = useState<VetClinic | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const availableTimes = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'];
  const minDate = new Date().toISOString().split('T')[0];

  const handleSubmit = async () => {
    if (!selectedPet || !selectedClinic || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    setError('');
    try {
      const apiBase = (import.meta as any).env?.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/vaccinations/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          petId: selectedPet.id, petName: selectedPet.name, petType: selectedPet.type,
          clinicId: selectedClinic.id, clinicName: selectedClinic.name,
          vaccineName: vaccine.name, vaccineType: vaccine.core ? 'core' : 'non-core',
          diseasesProtected: vaccine.diseases,
          scheduledDate: selectedDate, scheduledTime: selectedTime, notes,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Booking failed'); }
      const appointment = await res.json();
      setSuccess(true);
      onBooked(appointment);
    } catch (err: any) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-md rounded-[24px] shadow-2xl p-8 text-center space-y-5" style={{ animation: 'scaleIn 0.2s ease-out' }}>
          <div className="w-20 h-20 rounded-3xl bg-green-50 border border-green-200 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="font-display font-black text-xl text-slate-900">Vaccination Booked!</h3>
          <p className="text-sm text-slate-500">Your {vaccine.name} appointment for <strong>{selectedPet?.name}</strong> at <strong>{selectedClinic?.name}</strong> is confirmed.</p>
          <div className="bg-slate-50 rounded-xl p-4 text-left space-y-1.5 border border-slate-100">
            <div className="flex justify-between text-xs"><span className="text-slate-500">Date</span><span className="font-bold text-slate-800">{selectedDate}</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-500">Time</span><span className="font-bold text-slate-800">{selectedTime}</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-500">Vaccine</span><span className="font-bold text-slate-800">{vaccine.name}</span></div>
          </div>
          <p className="text-[11px] text-slate-400">You'll receive reminders 24 hours and 2 hours before your appointment.</p>
          <button onClick={onClose} className="w-full py-3.5 bg-[#58B368] hover:bg-green-600 text-white font-extrabold rounded-xl transition-colors">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" style={{ animation: 'scaleIn 0.2s ease-out' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#58B368] to-[#4da85e] px-6 py-5 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center"><Syringe className="w-5 h-5" /></div>
            <div>
              <h3 className="font-display font-black text-lg">Book Vaccination</h3>
              <p className="text-[10px] text-white/70 font-semibold">{vaccine.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2 flex-shrink-0">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${step >= s ? 'bg-[#58B368] text-white' : 'bg-slate-100 text-slate-400'}`}>{s}</div>
              <span className={`text-[10px] font-bold ${step >= s ? 'text-slate-800' : 'text-slate-400'}`}>{s === 1 ? 'Select Pet' : s === 2 ? 'Choose Clinic' : 'Pick Date'}</span>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-[#58B368]' : 'bg-slate-100'}`} />}
            </div>
          ))}
        </div>

        {error && <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">{error}</div>}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Select Pet */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 leading-relaxed">
                <strong>Vaccine:</strong> {vaccine.name} · Protects against: {vaccine.diseases.join(', ')}
              </div>
              <h4 className="font-display font-bold text-sm text-slate-900">Select your pet</h4>
              {pets.length === 0 ? (
                <div className="text-center py-8"><p className="text-sm text-slate-500">No pets registered. Add a pet first.</p></div>
              ) : (
                <div className="space-y-2">
                  {pets.map(pet => (
                    <button key={pet.id} onClick={() => { setSelectedPet(pet); setStep(2); }}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${selectedPet?.id === pet.id ? 'border-[#58B368] bg-green-50/50 ring-2 ring-green-100' : 'border-slate-100 hover:border-green-200'}`}>
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl">{pet.type === 'Dog' ? '🐕' : pet.type === 'Cat' ? '🐈' : '🐾'}</div>
                      <div className="flex-1"><h5 className="font-bold text-sm text-slate-900">{pet.name}</h5><p className="text-[10px] text-slate-500">{pet.breed || pet.type} {pet.age ? `· ${pet.age} yr` : ''}</p></div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Clinic */}
          {step === 2 && (
            <div className="space-y-4">
              <h4 className="font-display font-bold text-sm text-slate-900">Choose a clinic for {selectedPet?.name}</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {clinics.filter(c => c.isOpenNow || true).slice(0, 8).map(clinic => (
                  <button key={clinic.id} onClick={() => { setSelectedClinic(clinic); setStep(3); }}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${selectedClinic?.id === clinic.id ? 'border-[#58B368] bg-green-50/50 ring-2 ring-green-100' : 'border-slate-100 hover:border-green-200'}`}>
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
                      <img src={clinic.imageUrl || 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=100'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-xs text-slate-900 truncate">{clinic.name}</h5>
                      <p className="text-[10px] text-slate-500">{clinic.area} · ★ {clinic.rating.toFixed(1)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="text-xs text-slate-500 font-bold hover:underline">← Back to pet selection</button>
            </div>
          )}

          {/* Step 3: Date & Time */}
          {step === 3 && (
            <div className="space-y-5">
              <h4 className="font-display font-bold text-sm text-slate-900">Pick date & time at {selectedClinic?.name}</h4>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Preferred Date</label>
                <input type="date" min={minDate} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-400" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Available Time Slots</label>
                <div className="grid grid-cols-3 gap-2">
                  {availableTimes.map(time => (
                    <button key={time} onClick={() => setSelectedTime(time)}
                      className={`py-2 rounded-lg text-[11px] font-bold border transition-all ${selectedTime === time ? 'bg-[#58B368] text-white border-[#58B368]' : 'bg-white border-slate-200 text-slate-600 hover:border-green-300'}`}>
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Notes (optional)</label>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special requirements..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-400" />
              </div>

              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                <h5 className="text-[10px] font-black text-slate-400 uppercase">Appointment Summary</h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-500">Pet:</span> <span className="font-bold text-slate-800">{selectedPet?.name}</span></div>
                  <div><span className="text-slate-500">Vaccine:</span> <span className="font-bold text-slate-800">{vaccine.name}</span></div>
                  <div><span className="text-slate-500">Clinic:</span> <span className="font-bold text-slate-800">{selectedClinic?.name}</span></div>
                  <div><span className="text-slate-500">Date:</span> <span className="font-bold text-slate-800">{selectedDate || '—'}</span></div>
                  <div><span className="text-slate-500">Time:</span> <span className="font-bold text-slate-800">{selectedTime || '—'}</span></div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors">Back</button>
                <button onClick={handleSubmit} disabled={!selectedDate || !selectedTime || submitting}
                  className="flex-1 py-3 bg-[#58B368] hover:bg-green-600 text-white font-extrabold text-sm rounded-xl shadow-md transition-all disabled:opacity-50 active:scale-[0.97]">
                  {submitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
