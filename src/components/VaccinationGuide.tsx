import { useState } from 'react';
import { Shield, ChevronDown, AlertCircle, Syringe, Info, CheckCircle2, Clock, Star } from 'lucide-react';

type Species = 'dogs' | 'cats' | 'rabbits' | 'birds' | 'exotics';

interface Vaccine {
  name: string;
  age: string;
  core: boolean;
  diseases: string[];
  booster: string;
  importance: 'Critical' | 'High' | 'Recommended' | 'Situational';
  description: string;
  diseaseInfo?: { overview: string; symptoms: string; transmission: string; severity: string };
}

interface SpeciesData {
  label: string;
  emoji: string;
  note?: string;
  timeline: string[];
  vaccines: Vaccine[];
}

const vaccinationData: Record<Species, SpeciesData> = {
  dogs: {
    label: 'Dogs', emoji: '🐶',
    timeline: ['6–8 Weeks', '9–12 Weeks', '12–16 Weeks', '6 Months', 'Annually / Every 3 Years'],
    vaccines: [
      { name: 'DHPP (Distemper Combo)', age: '6–8 weeks (series)', core: true, diseases: ['Distemper', 'Hepatitis (Adenovirus)', 'Parvovirus', 'Parainfluenza'], booster: 'Every 3 years after initial puppy series', importance: 'Critical', description: 'The most essential canine vaccine. Protects against four highly contagious and often fatal diseases. Puppies receive 3–4 doses spaced 3–4 weeks apart.', diseaseInfo: { overview: 'Parvovirus causes severe bloody diarrhea and vomiting in puppies with up to 90% mortality if untreated. Distemper attacks the nervous system.', symptoms: 'Lethargy, vomiting, bloody diarrhea, fever, seizures, nasal discharge', transmission: 'Direct contact, contaminated feces, airborne droplets', severity: 'Life-threatening in unvaccinated puppies' } },
      { name: 'Rabies', age: '12–16 weeks', core: true, diseases: ['Rabies virus'], booster: 'Annually or every 3 years (per local law)', importance: 'Critical', description: 'Legally required in most regions. Rabies is 100% fatal once symptoms appear and poses a serious public health risk.', diseaseInfo: { overview: 'A fatal viral disease affecting the central nervous system. Transmissible to humans. No cure exists once clinical signs appear.', symptoms: 'Behavioral changes, aggression, paralysis, excessive salivation, hydrophobia', transmission: 'Bite from infected animal', severity: 'Always fatal — zero survival rate once symptomatic' } },
      { name: 'Bordetella', age: '8+ weeks', core: false, diseases: ['Kennel Cough (Bordetella bronchiseptica)'], booster: 'Annually or every 6 months for high-risk dogs', importance: 'Recommended', description: 'Strongly recommended for dogs that visit boarding facilities, dog parks, grooming salons, or daycare.', diseaseInfo: { overview: 'Causes infectious tracheobronchitis ("kennel cough"), a highly contagious respiratory infection.', symptoms: 'Persistent dry cough, retching, nasal discharge, mild fever', transmission: 'Airborne, direct contact, shared water bowls', severity: 'Usually mild but can be serious in puppies or immunocompromised dogs' } },
      { name: 'Leptospirosis', age: '12+ weeks', core: false, diseases: ['Leptospira bacteria'], booster: 'Annually', importance: 'High', description: 'Recommended for dogs with outdoor exposure, especially near water bodies. Zoonotic — can spread to humans.', diseaseInfo: { overview: 'Bacterial infection transmitted through contaminated water or soil. Can cause liver and kidney failure.', symptoms: 'Fever, muscle pain, vomiting, diarrhea, jaundice, kidney failure', transmission: 'Contact with infected urine, contaminated water or soil', severity: 'Can be fatal; zoonotic risk to humans' } },
      { name: 'Canine Influenza', age: '6+ months', core: false, diseases: ['Canine Influenza Virus (H3N2, H3N8)'], booster: 'Annually', importance: 'Situational', description: 'Recommended in areas with known outbreaks or for dogs frequently in group settings.', diseaseInfo: { overview: 'Respiratory virus causing flu-like symptoms. Highly contagious among dogs.', symptoms: 'Cough, nasal discharge, fever, lethargy, reduced appetite', transmission: 'Airborne droplets, contaminated surfaces, direct contact', severity: 'Usually mild; severe pneumonia possible in some cases' } },
      { name: 'Lyme Disease', age: '12+ weeks (regional)', core: false, diseases: ['Borrelia burgdorferi'], booster: 'Annually (in endemic areas)', importance: 'Situational', description: 'Recommended only in tick-endemic regions. Discuss with your vet based on local prevalence.', diseaseInfo: { overview: 'Tick-borne bacterial disease causing joint inflammation and potentially kidney disease.', symptoms: 'Lameness, swollen joints, fever, lethargy, loss of appetite', transmission: 'Bite from infected Ixodes tick (deer tick)', severity: 'Chronic if untreated; can cause kidney failure' } },
    ],
  },
  cats: {
    label: 'Cats', emoji: '🐱',
    timeline: ['6–8 Weeks', '10–12 Weeks', '14–16 Weeks', '1 Year', 'Every 1–3 Years'],
    vaccines: [
      { name: 'FVRCP (Feline Distemper Combo)', age: '6–8 weeks (series)', core: true, diseases: ['Feline Viral Rhinotracheitis (Herpesvirus)', 'Calicivirus', 'Panleukopenia (Feline Distemper)'], booster: 'Every 3 years after initial kitten series', importance: 'Critical', description: 'Essential for all cats. Protects against three common and serious feline diseases. Kittens receive 3–4 doses.', diseaseInfo: { overview: 'Panleukopenia is highly fatal in kittens. Herpesvirus causes lifelong upper respiratory infections. Calicivirus causes oral ulcers and respiratory disease.', symptoms: 'Sneezing, nasal discharge, oral ulcers, severe diarrhea, lethargy, fever', transmission: 'Direct contact, contaminated objects, airborne', severity: 'Panleukopenia is often fatal in kittens; respiratory viruses cause chronic issues' } },
      { name: 'Rabies', age: '12–16 weeks', core: true, diseases: ['Rabies virus'], booster: 'Annually or every 3 years', importance: 'Critical', description: 'Required by law in most areas. Essential even for indoor cats due to potential exposure through escaped animals or bats.', diseaseInfo: { overview: 'Fatal viral encephalitis. Cats are the most commonly reported rabid domestic animal in some regions.', symptoms: 'Behavioral changes, aggression or unusual affection, paralysis, seizures', transmission: 'Bite from infected animal', severity: 'Always fatal once symptomatic' } },
      { name: 'FeLV (Feline Leukemia Virus)', age: '8+ weeks', core: false, diseases: ['Feline Leukemia Virus'], booster: 'Annually for at-risk cats', importance: 'High', description: 'Strongly recommended for kittens and cats that go outdoors or live with FeLV-positive cats. Leading infectious cause of cancer in cats.', diseaseInfo: { overview: 'Retrovirus that suppresses the immune system and can cause lymphoma and leukemia.', symptoms: 'Weight loss, recurring infections, pale gums, anemia, lymphoma', transmission: 'Saliva, nasal secretions, urine, milk; mutual grooming, shared bowls', severity: 'Fatal in many cases; progressive infection has no cure' } },
      { name: 'Chlamydia felis', age: '9+ weeks', core: false, diseases: ['Chlamydophila felis'], booster: 'Annually in multi-cat environments', importance: 'Situational', description: 'Considered in multi-cat households or catteries with known chlamydia issues.', diseaseInfo: { overview: 'Bacterial infection causing conjunctivitis, primarily in young cats in multi-cat environments.', symptoms: 'Watery eyes, conjunctivitis, mild sneezing, nasal discharge', transmission: 'Direct contact with infected secretions', severity: 'Usually mild; rarely serious' } },
      { name: 'Bordetella bronchiseptica', age: '4+ weeks', core: false, diseases: ['Feline Bordetellosis'], booster: 'Annually for high-risk cats', importance: 'Situational', description: 'Intranasal vaccine considered for cats in shelters or dense living situations.', diseaseInfo: { overview: 'Respiratory infection primarily seen in shelter or cattery environments.', symptoms: 'Coughing, sneezing, nasal discharge, fever, lethargy', transmission: 'Airborne, direct contact', severity: 'Usually mild in adults; can be serious in kittens' } },
    ],
  },
  rabbits: {
    label: 'Rabbits', emoji: '🐰',
    note: 'Rabbit vaccination availability varies significantly by country. RHDV and Myxomatosis vaccines are widely used in the UK, EU, and Australia but may not be available in all regions (e.g., limited availability in the US). Consult your local exotic vet.',
    timeline: ['5–7 Weeks', '10–12 Weeks', 'Annually'],
    vaccines: [
      { name: 'RHDV1 & RHDV2', age: '5+ weeks', core: true, diseases: ['Rabbit Hemorrhagic Disease Virus (RHDV1 & RHDV2)'], booster: 'Annually (or every 6 months in high-risk areas)', importance: 'Critical', description: 'Highly fatal calicivirus with near-100% mortality. Vaccination is the only protection. Both strains should be covered.', diseaseInfo: { overview: 'Acute viral disease causing massive internal hemorrhage and liver failure. Death often occurs within 12–36 hours with no warning signs.', symptoms: 'Sudden death, lethargy, fever, bloody nasal discharge, seizures', transmission: 'Direct contact, contaminated food/bedding, insects, fomites', severity: 'Near 100% fatality rate in unvaccinated rabbits' } },
      { name: 'Myxomatosis', age: '5+ weeks', core: true, diseases: ['Myxoma virus'], booster: 'Every 6–12 months', importance: 'Critical', description: 'Devastating viral disease spread by fleas and mosquitoes. Vaccine is essential in countries where the virus is endemic (UK, EU, Australia).', diseaseInfo: { overview: 'Causes swelling, conjunctivitis, and immunosuppression. Historically used as biological control for wild rabbit populations.', symptoms: 'Swollen eyes, genitals, and ears; skin nodules; respiratory distress; lethargy', transmission: 'Biting insects (fleas, mosquitoes), direct contact', severity: 'Usually fatal in unvaccinated domestic rabbits' } },
    ],
  },
  birds: {
    label: 'Birds', emoji: '🐦',
    note: 'Routine vaccination in companion birds is uncommon compared to dogs and cats. Protocols vary greatly by species, region, and avian veterinarian recommendations. The vaccines listed below are available for specific species in certain countries.',
    timeline: ['Species-Dependent', 'Consult Avian Vet'],
    vaccines: [
      { name: 'Pigeon Paramyxovirus (PMV-1)', age: '4–6 weeks', core: true, diseases: ['Pigeon Paramyxovirus Type 1 (Newcastle Disease variant)'], booster: 'Annually', importance: 'High', description: 'Essential for pigeons and doves. Protects against a highly contagious and fatal neurological disease. Widely used in pigeon-keeping communities.', diseaseInfo: { overview: 'Causes severe neurological disease, diarrhea, and high mortality in pigeons. Related to Newcastle Disease.', symptoms: 'Head tilting, circling, paralysis, watery green diarrhea, sudden death', transmission: 'Direct contact, contaminated feed/water, airborne', severity: 'Fatal in unvaccinated pigeons; can decimate flocks' } },
      { name: 'Polyomavirus (APV)', age: '4–6 weeks (selected parrots)', core: false, diseases: ['Avian Polyomavirus'], booster: 'Discuss with avian vet', importance: 'Situational', description: 'Available for psittacines (parrots). Primarily used in breeding facilities. Causes acute death in young chicks.', diseaseInfo: { overview: 'Causes "budgerigar fledgling disease" and acute death in young psittacines. Adult birds can be carriers.', symptoms: 'Sudden death in chicks, feather abnormalities, abdominal swelling, hemorrhage', transmission: 'Feather dust, feces, direct contact; adults shed intermittently', severity: 'Highly fatal in nestlings; adults often asymptomatic carriers' } },
      { name: 'Psittacosis Prevention', age: 'N/A', core: false, diseases: ['Chlamydia psittaci (Psittacosis)'], booster: 'No routine vaccine available', importance: 'Situational', description: 'No routine vaccine exists for companion parrots. Prevention relies on hygiene, quarantine, and testing. Zoonotic — can infect humans. Treatment with doxycycline if diagnosed.', diseaseInfo: { overview: 'Bacterial infection (also called "parrot fever") that can spread to humans. Causes respiratory and systemic illness.', symptoms: 'Fluffed feathers, nasal discharge, green droppings, lethargy, eye inflammation', transmission: 'Inhalation of dried droppings, feather dust, nasal secretions', severity: 'Treatable if caught early; zoonotic risk to humans (causes atypical pneumonia)' } },
    ],
  },
  exotics: {
    label: 'Exotics', emoji: '🦎',
    note: 'Vaccination protocols for exotic pets (reptiles, ferrets, hedgehogs, sugar gliders, etc.) vary enormously by species. Most exotic species do not have commercially available vaccines. The exception is ferrets, which should be vaccinated against canine distemper and rabies. Always consult an experienced exotic animal veterinarian for species-specific guidance.',
    timeline: ['Species-Specific', 'Consult Exotic Vet'],
    vaccines: [
      { name: 'Canine Distemper (Ferrets)', age: '6–8 weeks (series of 3)', core: true, diseases: ['Canine Distemper Virus'], booster: 'Annually', importance: 'Critical', description: 'Ferrets are highly susceptible to canine distemper with near-100% mortality. A ferret-approved vaccine (e.g., Purevax) must be used — do NOT use dog vaccines.', diseaseInfo: { overview: 'Canine distemper is almost always fatal in ferrets. Causes progressive neurological disease and death.', symptoms: 'Rash on chin/groin, swollen feet, nasal/eye discharge, seizures, coma', transmission: 'Airborne, direct contact with infected dogs or ferrets', severity: 'Near 100% fatal in unvaccinated ferrets' } },
      { name: 'Rabies (Ferrets)', age: '12+ weeks', core: true, diseases: ['Rabies virus'], booster: 'Annually', importance: 'Critical', description: 'Legally required for ferrets in many jurisdictions. Use only approved ferret rabies vaccines.', diseaseInfo: { overview: 'Fatal viral encephalitis. Ferrets can transmit rabies to humans through bites.', symptoms: 'Behavioral changes, aggression, paralysis, excessive salivation', transmission: 'Bite from infected animal', severity: 'Always fatal; serious public health concern' } },
    ],
  },
};

export default function VaccinationGuide() {
  const [activeSpecies, setActiveSpecies] = useState<Species>('dogs');
  const [expandedVaccine, setExpandedVaccine] = useState<string | null>(null);
  const data = vaccinationData[activeSpecies];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4FBF3] via-white to-[#F4FBF3]">

      {/* ===== HERO ===== */}
      <section 
        className="relative py-16 sm:py-24 px-4 overflow-hidden bg-cover bg-center text-white rounded-b-[56px] shadow-xl"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(11, 37, 20, 0.95), rgba(88, 179, 104, 0.35)), url('https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1200')`
        }}
      >
        <div className="absolute inset-0 bg-black/15 pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10 text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/15 mb-6">
            <Shield className="w-4 h-4 text-white" />
            <span className="text-xs font-bold text-white/90">Based on WSAVA & AAHA Guidelines</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight max-w-2xl">
            Pet Vaccination Guide
          </h1>
          <p className="text-white/80 text-sm sm:text-base mt-4 max-w-xl leading-relaxed font-medium">
            Explore recommended vaccination schedules for dogs, cats, rabbits, birds, and exotic companions. Protect your pet with the right vaccines at the right time.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* ===== SPECIES TABS ===== */}
        <div className="flex flex-wrap justify-center gap-2 bg-white rounded-2xl border border-slate-100 p-2 shadow-sm">
          {(Object.keys(vaccinationData) as Species[]).map((sp) => {
            const d = vaccinationData[sp];
            return (
              <button
                key={sp}
                onClick={() => { setActiveSpecies(sp); setExpandedVaccine(null); }}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeSpecies === sp ? 'bg-[#58B368] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-lg">{d.emoji}</span> {d.label}
              </button>
            );
          })}
        </div>

        {/* ===== SPECIES NOTE ===== */}
        {data.note && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">{data.note}</p>
          </div>
        )}

        {/* ===== TIMELINE ===== */}
        <section>
          <h2 className="font-display font-black text-xl text-slate-900 mb-4">Vaccination Timeline</h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {data.timeline.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 flex-shrink-0">
                <div className="bg-white border border-green-200 rounded-xl px-4 py-2.5 shadow-sm">
                  <span className="text-xs font-black text-[#58B368]">{step}</span>
                </div>
                {idx < data.timeline.length - 1 && (
                  <div className="w-6 h-0.5 bg-green-200 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ===== VACCINE CARDS ===== */}
        <section className="space-y-4">
          <h2 className="font-display font-black text-xl text-slate-900">Recommended Vaccines</h2>

          {data.vaccines.map((vaccine) => {
            const isExpanded = expandedVaccine === vaccine.name;
            return (
              <div key={vaccine.name} className="bg-white rounded-[20px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Card header */}
                <button
                  onClick={() => setExpandedVaccine(isExpanded ? null : vaccine.name)}
                  className="w-full p-5 text-left flex items-start gap-4 cursor-pointer"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${vaccine.core ? 'bg-green-50 border border-green-100' : 'bg-slate-50 border border-slate-100'}`}>
                    <Syringe className={`w-5 h-5 ${vaccine.core ? 'text-green-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-black text-base text-slate-900">{vaccine.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black ${vaccine.core ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {vaccine.core ? 'Core' : 'Non-Core'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black ${
                        vaccine.importance === 'Critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        vaccine.importance === 'High' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-50 text-slate-600 border border-slate-100'
                      }`}>
                        {vaccine.importance}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{vaccine.description}</p>

                    {/* Quick info row */}
                    <div className="flex flex-wrap gap-3 mt-3 text-[10px] font-semibold text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {vaccine.age}</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Booster: {vaccine.booster}</span>
                    </div>

                    {/* Diseases protected */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {vaccine.diseases.map((d) => (
                        <span key={d} className="px-2 py-0.5 bg-green-50/60 border border-green-100/60 text-green-800 text-[9px] font-bold rounded-md">{d}</span>
                      ))}
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded disease info */}
                {isExpanded && vaccine.diseaseInfo && (
                  <div className="px-5 pb-5 pt-0">
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-3">
                      <h4 className="font-display font-bold text-sm text-slate-800">Disease Information</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Overview</span>
                          <p className="text-xs text-slate-600 leading-relaxed">{vaccine.diseaseInfo.overview}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Symptoms</span>
                          <p className="text-xs text-slate-600 leading-relaxed">{vaccine.diseaseInfo.symptoms}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Transmission</span>
                          <p className="text-xs text-slate-600 leading-relaxed">{vaccine.diseaseInfo.transmission}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Severity</span>
                          <p className="text-xs text-slate-600 leading-relaxed font-semibold">{vaccine.diseaseInfo.severity}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* ===== CORE VS NON-CORE ===== */}
        <section className="bg-white rounded-[22px] border border-slate-100 p-6 sm:p-8 shadow-sm">
          <h2 className="font-display font-black text-xl text-slate-900 mb-5">Core vs Non-Core Vaccines</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-green-50/50 rounded-2xl border border-green-100 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-4.5 h-4.5 text-green-600" />
                </div>
                <h3 className="font-display font-black text-sm text-green-800">Core Vaccines</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">Essential for <strong>every pet</strong> regardless of lifestyle. Protect against highly contagious, severe, or fatal diseases with significant public health implications.</p>
              <ul className="text-[11px] text-slate-600 space-y-1">
                <li>• Recommended for all animals of that species</li>
                <li>• Protect against life-threatening diseases</li>
                <li>• Often legally required (e.g., Rabies)</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                  <Star className="w-4.5 h-4.5 text-slate-500" />
                </div>
                <h3 className="font-display font-black text-sm text-slate-700">Non-Core Vaccines</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">Recommended based on <strong>individual risk factors</strong>. Your vet will assess whether these are needed.</p>
              <ul className="text-[11px] text-slate-600 space-y-1">
                <li>• Lifestyle-dependent (outdoor access, boarding)</li>
                <li>• Geographic risk (endemic diseases)</li>
                <li>• Travel or multi-pet environments</li>
                <li>• Exposure to wildlife or other animals</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ===== DISCLAIMER ===== */}
        <section className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <strong className="text-slate-700">Important Disclaimer:</strong> Vaccination recommendations may vary depending on your pet's age, medical history, geographic location, and your veterinarian's professional assessment. This guide is based on widely accepted guidelines from WSAVA and AAHA but does not replace personalized veterinary advice. Always consult a licensed veterinarian before making healthcare decisions for your pet.
          </div>
        </section>

      </div>
    </div>
  );
}
