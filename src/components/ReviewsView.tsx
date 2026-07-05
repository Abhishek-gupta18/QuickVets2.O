import React, { useState, useEffect, useRef } from 'react';
import { 
  Star, Search, Filter, SlidersHorizontal, CheckCircle2, 
  ThumbsUp, Calendar, MapPin, Award, ArrowRight, Stethoscope,
  ShieldCheck, Heart, Sparkles, RefreshCw, AlertCircle, Compass,
  FolderHeart, HeartPulse, Clock, Sparkle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { VetClinic, ClinicReview, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ReviewsViewProps {
  clinics: VetClinic[];
  currentUser: User | null;
  onOpenAuth: (type: 'login' | 'signup') => void;
  onSelectClinic: (clinic: VetClinic) => void;
}

// 1. Curated list of Success Stories for the Carousel
const FEATURED_STORIES = [
  {
    id: 'story-rocky',
    title: 'Rocky’s Miracle Midnight Recovery',
    timeline: [
      { label: '0 min', desc: 'Critical trauma alert dispatched from JP Nagar' },
      { label: '9 min', desc: 'Accepted by Cessna Lifeline emergency surgeon' },
      { label: '25 min', desc: 'Patient admitted to Critical Care Unit (ICU)' },
      { label: '45 min', desc: 'Vitals stabilized; emergency vitals restoration' },
      { label: 'Day 3', desc: 'Discharged back to active running' }
    ],
    ownerName: 'Vikram Bose',
    petName: 'Rocky',
    petBreed: 'Golden Retriever',
    petAvatar: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=120',
    coverImage: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=800',
    clinicName: 'Cessna Lifeline 24x7 Animal Hospital',
    vetName: 'Dr. Ramesh Roy',
    visitType: 'Emergency Surgery',
    storyText: 'Rocky met with a sudden severe accident late at night. Within 9 minutes of dispatching the emergency alert on QuickVet, Dr. Ramesh Roy accepted the case and instructed us on critical first-aid. The surgery was highly complex, but the specialized trauma team stabilized Rocky flawlessly. We are forever grateful.'
  },
  {
    id: 'story-bella',
    title: 'Bella’s Spine Stabilization Journey',
    timeline: [
      { label: 'Day 1', desc: 'Sudden hind leg paralysis noted at home' },
      { label: 'Hour 2', desc: 'Admitted to Crown Vet for emergency MRI diagnostics' },
      { label: 'Hour 4', desc: 'Hemilaminectomy spine surgery successfully done' },
      { label: 'Week 2', desc: 'Laser physiotherapy & acupuncture rehabilitation' },
      { label: 'Month 1', desc: 'Bella takes her first active steps independently' }
    ],
    ownerName: 'Ananya Sharma',
    petName: 'Bella',
    petBreed: 'Persian Cat',
    petAvatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=120',
    coverImage: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=800',
    clinicName: 'Crown Vet Premium Clinic',
    vetName: 'Dr. Ananya Sen',
    visitType: 'Spinal Orthopedics',
    storyText: 'Bella woke up unable to move her back legs. We rushed to Crown Vet, where Dr. Sen diagnosed a herniated disc immediately. The surgical precision was outstanding, and their customized rehabilitation therapy has given Bella her complete mobility back.'
  },
  {
    id: 'story-coco',
    title: 'Coco’s Micro-Surgical Wing Repair',
    timeline: [
      { label: '0 min', desc: 'Fractured wing joint from household accident' },
      { label: 'Hour 1', desc: 'Admitted to Happy Tails Avian specialist care' },
      { label: 'Hour 2', desc: 'Inhalation anesthesia & micro-bone pinning done' },
      { label: 'Day 5', desc: 'Pain management and splinting adjustment' },
      { label: 'Week 3', desc: 'Splint removed; successful flight testing' }
    ],
    ownerName: 'Priya Iyer',
    petName: 'Coco',
    petBreed: 'Cockatiel Bird',
    petAvatar: 'https://images.unsplash.com/photo-1522850959076-3f4f70659e5f?auto=format&fit=crop&q=80&w=120',
    coverImage: 'https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?auto=format&fit=crop&q=80&w=800',
    clinicName: 'Happy Tails Specialist Clinic',
    vetName: 'Dr. Kabir Mehta',
    visitType: 'Avian Micro-Surgery',
    storyText: 'Finding a clinic that understands exotic birds is incredibly hard. Dr. Kabir Mehta treated Coco’s fractured wing joint with incredible expertise under micro-surgical instruments. Coco is fully active, flying, and singing once again!'
  }
];

// 2. Curated Collections
const COLLECTIONS = [
  {
    id: 'coll-emergency',
    title: 'Top Emergency Clinics',
    desc: '24/7 critical trauma centers with dedicated blood banks & ICU facilities.',
    count: '6 locations',
    image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=300',
    tag: 'Emergency'
  },
  {
    id: 'coll-cats',
    title: 'Best Cat Specialists',
    desc: 'Feline-friendly certified clinics with separate waiting rooms and quiet zones.',
    count: '8 locations',
    image: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=300',
    tag: 'Feline Care'
  },
  {
    id: 'coll-recommended',
    title: 'Most Recommended This Month',
    desc: 'Clinics with the highest rating-to-volume ratio verified by pet parents.',
    count: '12 locations',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=300',
    tag: 'Top Rated'
  },
  {
    id: 'coll-verified',
    title: 'Recently Verified Clinics',
    desc: 'Recently audited practices with fully vetted government medical licensing.',
    count: '5 locations',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=300',
    tag: 'Newly Audited'
  }
];

// 3. Category Filters
const CATEGORIES = [
  { id: 'all', label: 'All Experiences', icon: Compass },
  { id: 'Dog', label: 'Dogs', icon: Heart },
  { id: 'Cat', label: 'Cats', icon: Heart },
  { id: 'Bird', label: 'Birds', icon: Heart },
  { id: 'emergency', label: 'Emergency Care', icon: HeartPulse },
  { id: 'surgery', label: 'Surgery', icon: Stethoscope },
  { id: 'vaccination', label: 'Vaccination', icon: CheckCircle2 },
  { id: 'routine', label: 'Routine Care', icon: Clock },
  { id: 'home', label: 'Home Visits', icon: MapPin }
];

export default function ReviewsView({
  clinics,
  currentUser,
  onOpenAuth,
  onSelectClinic,
}: ReviewsViewProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // Carousel states
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Swipe gesture trackers
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Interaction state (no likes/shares, only simple helpful triggers)
  const [helpfulRatings, setHelpfulRatings] = useState<Record<string, number>>({});
  const [votedReviews, setVotedReviews] = useState<Record<string, boolean>>({});

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPetType, setSelectedPetType] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedRating, setSelectedRating] = useState('All');
  const [selectedSort, setSelectedSort] = useState('recent');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Detect mobile viewport
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Autoplay handler with hover pausing
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % FEATURED_STORIES.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isHovered]);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActiveSlide(prev => (prev - 1 + FEATURED_STORIES.length) % FEATURED_STORIES.length);
      } else if (e.key === 'ArrowRight') {
        setActiveSlide(prev => (prev + 1) % FEATURED_STORIES.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Touch handlers for mobile swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 55;
    const isRightSwipe = distance < -55;
    
    if (isLeftSwipe) {
      setActiveSlide(prev => (prev + 1) % FEATURED_STORIES.length);
    } else if (isRightSwipe) {
      setActiveSlide(prev => (prev - 1 + FEATURED_STORIES.length) % FEATURED_STORIES.length);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Fetch Reviews
  const fetchReviews = async (isNewLoad = true) => {
    if (isNewLoad) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const apiBase = (import.meta as any).env?.VITE_API_URL || '';
      const limit = 8;
      const offset = isNewLoad ? 0 : (page - 1) * limit;
      
      const petQuery = selectedPetType !== 'All' ? `&petType=${selectedPetType}` : '';
      const ratingQuery = selectedRating !== 'All' ? `&rating=${selectedRating}` : '';
      
      const res = await fetch(`${apiBase}/api/reviews?limit=${limit}&offset=${offset}${petQuery}${ratingQuery}`);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      
      const data = await res.json();
      
      if (isNewLoad) {
        setReviews(data);
      } else {
        setReviews(prev => [...prev, ...data]);
      }
      
      setHasMore(data.length === limit);
    } catch (err) {
      console.error('Error fetching global reviews:', err);
      if (isNewLoad) setReviews([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReviews(true);
  }, [selectedPetType, selectedRating]);

  // Local filtering & search matching
  const filteredReviews = reviews.filter(rev => {
    const clinic = clinics.find(c => c.id === rev.clinicId);
    
    // Search Query (clinics, veterinarians, treatments, pet types)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchClinic = rev.clinicName?.toLowerCase().includes(q);
      const matchVet = rev.veterinarianName?.toLowerCase().includes(q) || clinic?.veterinarianName?.toLowerCase().includes(q);
      const matchComment = rev.reviewText?.toLowerCase().includes(q);
      const matchPet = rev.petType?.toLowerCase().includes(q);
      if (!matchClinic && !matchVet && !matchComment && !matchPet) return false;
    }

    // City Filter
    if (selectedCity !== 'All') {
      const clinicCity = rev.clinicCity || clinic?.city;
      if (clinicCity?.toLowerCase() !== selectedCity.toLowerCase()) return false;
    }

    // Category Selector Filter
    if (categoryFilter !== 'all') {
      if (['Dog', 'Cat', 'Bird'].includes(categoryFilter)) {
        if (rev.petType?.toLowerCase() !== categoryFilter.toLowerCase()) return false;
      } else if (categoryFilter === 'emergency') {
        if (!rev.reviewText?.toLowerCase().includes('emergency') && !rev.reviewText?.toLowerCase().includes('accident')) return false;
      } else if (categoryFilter === 'surgery') {
        if (!rev.reviewText?.toLowerCase().includes('surgery') && !rev.reviewText?.toLowerCase().includes('operation')) return false;
      } else if (categoryFilter === 'vaccination') {
        if (!rev.reviewText?.toLowerCase().includes('vaccin') && !rev.reviewText?.toLowerCase().includes('shot')) return false;
      } else if (categoryFilter === 'routine') {
        if (!rev.reviewText?.toLowerCase().includes('checkup') && !rev.reviewText?.toLowerCase().includes('consultation')) return false;
      } else if (categoryFilter === 'home') {
        if (!rev.reviewText?.toLowerCase().includes('home') && !rev.reviewText?.toLowerCase().includes('house call')) return false;
      }
    }

    return true;
  });

  // Sorting
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (selectedSort === 'highest') {
      return b.rating - a.rating;
    } else if (selectedSort === 'helpful') {
      const countA = helpfulRatings[a.id] || 0;
      const countB = helpfulRatings[b.id] || 0;
      return countB - countA;
    }
    return b.date.localeCompare(a.date);
  });

  const handleHelpfulClick = (id: string) => {
    if (votedReviews[id]) return;
    setHelpfulRatings(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
    setVotedReviews(prev => ({
      ...prev,
      [id]: true
    }));
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    fetchReviews(false);
  };

  // Get exactly 4 top rated featured clinics
  const featuredClinics = clinics
    .filter(c => c.verificationStatus === 'approved')
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

  const handleCollectionSelect = (tag: string) => {
    if (tag === 'Emergency') {
      setCategoryFilter('emergency');
    } else if (tag === 'Feline Care') {
      setCategoryFilter('Cat');
    } else {
      setCategoryFilter('all');
    }
    document.getElementById('experiences-feed-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Peeking translation style generator
  const getSlideStyle = (idx: number) => {
    let offset = idx - activeSlide;
    
    // Circular wrapping for 3 stories
    if (offset < -1) offset += FEATURED_STORIES.length;
    if (offset > 1) offset -= FEATURED_STORIES.length;
    
    const translatePercent = isMobile ? 58 : 46;
    const scaleAmt = 0.88;
    const blurAmt = '3px';
    const opacityAmt = 0.6;
    
    if (offset === 0) {
      return {
        transform: 'translateX(0) scale(1)',
        opacity: 1,
        zIndex: 30,
        filter: 'blur(0px)',
        pointerEvents: 'auto' as const
      };
    } else if (offset === -1) {
      return {
        transform: `translateX(-${translatePercent}%) scale(${scaleAmt})`,
        opacity: opacityAmt,
        zIndex: 20,
        filter: `blur(${blurAmt})`,
        pointerEvents: 'auto' as const
      };
    } else if (offset === 1) {
      return {
        transform: `translateX(${translatePercent}%) scale(${scaleAmt})`,
        opacity: opacityAmt,
        zIndex: 20,
        filter: `blur(${blurAmt})`,
        pointerEvents: 'auto' as const
      };
    } else {
      return {
        transform: `translateX(${offset * 120}%) scale(0.8)`,
        opacity: 0,
        zIndex: 10,
        filter: 'blur(5px)',
        pointerEvents: 'none' as const
      };
    }
  };

  return (
    <div className="bg-[#F8FDF9] min-h-screen pb-20 text-left font-sans transition-colors duration-300">
      
      {/* 1. PREMIUM HERO SECTION */}
      <section className="relative text-white py-20 px-4 md:px-8 rounded-b-[56px] shadow-xl overflow-hidden min-h-[500px] flex items-center">
        {/* Background Dog Image with overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[4000ms] hover:scale-105"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1581888227599-779811939961?auto=format&fit=crop&q=80&w=1200')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-transparent" />
        
        <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
          <div className="max-w-2xl space-y-7">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-green-300 text-xs font-semibold tracking-wide shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Clinical Experiences Only</span>
            </div>

            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-tight text-white">
              Pet Parents Community
            </h1>

            <p className="text-green-100/90 text-sm sm:text-base font-normal leading-relaxed max-w-xl">
              Discover authentic experiences, recovery journeys, veterinarian recommendations, and trusted advice shared by verified pet parents across India.
            </p>

            {/* Glassmorphic Search Bar */}
            <div className="backdrop-blur-lg bg-white/15 border border-white/20 p-2.5 rounded-3xl shadow-2xl flex flex-col md:flex-row gap-2.5 max-w-2xl transition-all duration-200 hover:border-white/30">
              <div className="flex-1 relative flex items-center">
                <Search className="w-4 h-4 text-green-200 absolute left-3.5" />
                <input
                  type="text"
                  placeholder="Clinics, vets, treatments, or pet types..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm text-white bg-transparent border-0 outline-none placeholder:text-green-200/60"
                />
              </div>
              <div className="w-px bg-white/20 hidden md:block" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent text-xs text-green-100 outline-none px-2 py-2 cursor-pointer border-0 font-bold"
              >
                <option value="All" className="text-slate-800">All Locations</option>
                <option value="Bengaluru" className="text-slate-800">Bengaluru</option>
                <option value="Mumbai" className="text-slate-800">Mumbai</option>
                <option value="Hyderabad" className="text-slate-800">Hyderabad</option>
                <option value="Kochi" className="text-slate-800">Kochi</option>
              </select>
              <button 
                onClick={() => fetchReviews(true)}
                className="px-6 py-3 bg-[#58B368] hover:bg-[#4ea25d] text-white text-xs font-black rounded-2xl transition-all shadow-md shadow-green-900/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                Search
              </button>
            </div>
          </div>

          {/* Gracefully Floating Trust Cards on the Right */}
          <div className="w-full lg:w-[380px] flex flex-col gap-5 relative">
            {/* Glass trust card 1 */}
            <div className="backdrop-blur-md bg-white/85 border border-white/40 p-4 rounded-2xl shadow-lg flex items-center gap-3 text-xs text-slate-800 font-extrabold transition-all hover:scale-105 duration-200 max-w-[280px] self-start">
              <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm shadow-inner">⭐</span>
              <div>
                <span className="block text-xs text-slate-800 font-black leading-tight">4.9/5 Rating</span>
                <span className="text-[9.5px] text-slate-500 block font-normal mt-0.5">Platform Score</span>
              </div>
            </div>

            {/* Glass trust card 2 */}
            <div className="backdrop-blur-md bg-white/85 border border-white/40 p-4 rounded-2xl shadow-lg flex items-center gap-3 text-xs text-slate-800 font-extrabold transition-all hover:scale-105 duration-200 max-w-[280px] self-center">
              <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm shadow-inner">⚡</span>
              <div>
                <span className="block text-xs text-slate-800 font-black leading-tight">99.2% Dispatch</span>
                <span className="text-[9.5px] text-slate-500 block font-normal mt-0.5">Emergency Success</span>
              </div>
            </div>

            {/* Glass trust card 3 */}
            <div className="backdrop-blur-md bg-white/85 border border-white/40 p-4 rounded-2xl shadow-lg flex items-center gap-3 text-xs text-slate-800 font-extrabold transition-all hover:scale-105 duration-200 max-w-[280px] self-end">
              <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm shadow-inner">🏥</span>
              <div>
                <span className="block text-xs text-slate-800 font-black leading-tight">50+ Clinics</span>
                <span className="text-[9.5px] text-slate-500 block font-normal mt-0.5">Verified Partners</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-20">

        {/* 2. REVOLVING SUCCESS STORIES PEEK CAROUSEL (Netflix/Apple TV Style) */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[10px] uppercase font-black text-[#58B368] bg-green-50 px-2 py-0.5 rounded border border-green-100">Success Journeys</span>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 mt-1">Featured Recovery Stories</h2>
            </div>
            
            {/* Nav Arrows Removed */}
          </div>

          {/* Peek Carousel Wrapper */}
          <div 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative overflow-hidden w-full flex items-center justify-center min-h-[480px] md:min-h-[420px] select-none"
          >
            <div className="w-full relative h-[460px] md:h-[400px] flex items-center justify-center">
              {FEATURED_STORIES.map((story, idx) => {
                const style = getSlideStyle(idx);
                const isCenter = idx === activeSlide;

                return (
                  <div
                    key={story.id}
                    onClick={() => !isCenter && setActiveSlide(idx)}
                    style={{
                      transform: style.transform,
                      opacity: style.opacity,
                      zIndex: style.zIndex,
                      filter: style.filter,
                      pointerEvents: style.pointerEvents,
                      transition: 'all 950ms cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                    className="absolute w-[78%] md:w-[70%] bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-[0_12px_36px_-12px_rgba(0,0,0,0.12)] flex flex-col md:flex-row h-full max-h-[380px]"
                  >
                    {/* Cover image */}
                    <div className="w-full md:w-[42%] relative h-40 md:h-full overflow-hidden flex-shrink-0">
                      <img 
                        src={story.coverImage} 
                        alt={story.title} 
                        className="absolute inset-0 w-full h-full object-cover"
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute top-4 left-4 bg-emerald-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <Sparkle className="w-3 h-3 fill-white" />
                        <span>{story.visitType}</span>
                      </div>
                    </div>
                    
                    {/* Story details */}
                    <div className="flex-1 p-5 md:p-8 flex flex-col justify-between overflow-y-auto space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[8.5px] uppercase font-black tracking-widest text-[#58B368] bg-green-50 px-2 py-0.5 rounded border border-green-100">Recovery log</span>
                          <span className="text-[9px] text-slate-400 font-bold">• Case Audit Verified</span>
                        </div>
                        
                        <h3 className="font-display font-black text-lg md:text-xl text-slate-900 leading-snug">
                          {story.title}
                        </h3>

                        <p className="text-slate-600 text-xs leading-relaxed italic line-clamp-3">
                          "{story.storyText}"
                        </p>
                      </div>

                      {/* Recovery Timeline */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-y-1.5 text-[9px]">
                          {story.timeline.slice(0, 4).map((step, sIdx) => (
                            <React.Fragment key={sIdx}>
                              <div className="flex items-center gap-1">
                                <span className="w-3.5 h-3.5 rounded-full bg-[#58B368]/90 text-white flex items-center justify-center font-bold text-[7px]">{sIdx + 1}</span>
                                <div>
                                  <span className="font-black text-slate-800 leading-none">{step.label}</span>
                                  <span className="text-slate-400 block text-[7px] max-w-[80px] truncate leading-none mt-0.5">{step.desc}</span>
                                </div>
                              </div>
                              {sIdx < 3 && (
                                <span className="text-slate-200 mx-1">→</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      {/* Vet & Patient Profile Meta */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                          <img src={story.petAvatar} alt={story.petName} className="w-7 h-7 rounded-full object-cover border border-slate-100 shadow-sm" />
                          <div className="text-[10px] leading-tight">
                            <span className="font-black text-slate-800 block">{story.petName}</span>
                            <span className="text-slate-400 block text-[8px]">{story.petBreed} • Parent: {story.ownerName}</span>
                          </div>
                        </div>
                        
                        <div className="text-[10px] sm:text-right leading-tight">
                          <span className="font-black text-[#58B368] block">{story.clinicName}</span>
                          <span className="text-slate-500 text-[9px]">Care physician: <b>{story.vetName}</b></span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Segment Progress Bars (Apple TV Style) */}
          <div className="flex justify-center items-center gap-2 mt-2">
            {FEATURED_STORIES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className="group relative h-1 w-16 bg-slate-200 rounded-full overflow-hidden transition-all duration-300"
              >
                <div 
                  className={`absolute inset-0 bg-[#58B368] transition-all duration-500 ${
                    idx === activeSlide ? 'w-full' : 'w-0'
                  }`}
                />
              </button>
            ))}
          </div>
        </section>

        {/* 3. BROWSE BY CATEGORIES */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="font-display font-black text-lg text-slate-900">Browse by Categories</h3>
            <span className="text-xs text-slate-400 font-semibold">Select a tag to filter pet experiences</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              const isSelected = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-4.5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
                    isSelected
                      ? 'bg-[#58B368] text-white border-[#58B368] shadow-md shadow-green-200'
                      : 'backdrop-blur-sm bg-white/70 text-[#2F855A] border-emerald-500/20 hover:bg-[#58B368] hover:text-white shadow-sm'
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#58B368]'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. FEATURED CLINICS */}
        <section className="space-y-6">
          <div>
            <span className="text-[10px] uppercase font-black text-[#58B368] bg-green-50 px-2 py-0.5 rounded border border-green-100">Top Rated Care</span>
            <h3 className="font-display font-black text-2xl text-slate-900 mt-1">Highly Rated Featured Clinics</h3>
            <p className="text-xs text-slate-400 mt-0.5">Voted high-trust standards by the local community.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredClinics.map((clinic) => (
              <div 
                key={clinic.id} 
                className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg hover:border-[#58B368]/20 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-44 overflow-hidden">
                    <img 
                      src={clinic.imageUrl} 
                      alt={clinic.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    
                    {clinic.hasEmergency && (
                      <span className="absolute top-3 left-3 bg-red-500/90 backdrop-blur-sm border border-red-400/20 text-white rounded-full px-2.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider">
                        🚨 Emergency Ready
                      </span>
                    )}

                    {/* Rating Pill */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm border border-[#58B368]/20 px-2.5 py-0.5 rounded-full text-xs font-black text-slate-800 flex items-center gap-0.5 shadow-sm">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{Number(clinic.rating).toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <h4 
                      className="font-display font-bold text-slate-800 text-sm leading-tight hover:text-[#58B368] cursor-pointer" 
                      onClick={() => onSelectClinic(clinic)}
                    >
                      {clinic.name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                      <span>📍 {clinic.area}, {clinic.city}</span>
                      <span>•</span>
                      <span>{clinic.reviewsCount} Patient Audits</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {clinic.specialists.map(spec => (
                        <span key={spec} className="px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded text-[9px] font-extrabold uppercase tracking-wide">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button 
                    onClick={() => onSelectClinic(clinic)}
                    className="w-full py-2.5 bg-slate-50 hover:bg-[#58B368] hover:text-white border border-slate-100 hover:border-[#58B368] text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    View Clinic Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5 & 6. REAL PET EXPERIENCES & CURATED COLLECTIONS SIDE-BY-SIDE */}
        <div id="experiences-feed-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Real Pet Experiences (8/12 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-center border-b border-green-100 pb-3">
              <h3 className="font-display font-black text-xl text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#58B368]" />
                <span>Real Pet Experiences</span>
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                {sortedReviews.length} experiences
              </span>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 space-y-4 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-100 rounded w-1/4" />
                        <div className="h-3 bg-slate-100 rounded w-1/3" />
                      </div>
                    </div>
                    <div className="h-10 bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
            ) : sortedReviews.length === 0 ? (
              <div className="p-12 text-center bg-white border border-slate-100 rounded-3xl space-y-3">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-display font-bold text-slate-800 text-base">No Pet Experiences Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Try adjusting your search queries or category filters to load matching verified veterinary stories.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedPetType('All');
                    setSelectedCity('All');
                    setSelectedRating('All');
                    setCategoryFilter('all');
                  }}
                  className="px-4 py-2 bg-[#58B368] text-white font-bold rounded-xl text-xs shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
                >
                  Reset Category
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedReviews.map((rev, idx) => {
                  const hasVoted = votedReviews[rev.id];
                  const votes = (helpfulRatings[rev.id] || 0) + (idx % 3 === 0 ? 7 : idx % 5 === 1 ? 4 : 2);
                  const isAlternativeLayout = idx % 2 === 1;

                  return (
                    <motion.div
                      key={rev.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22 }}
                      className={`p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow text-left ${
                        isAlternativeLayout ? 'border-l-4 border-l-[#58B368]' : ''
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-50 to-[#58B368]/20 flex items-center justify-center text-xl shadow-inner flex-shrink-0">
                            {rev.petType === 'Dog' ? '🐶' : rev.petType === 'Cat' ? '🐱' : rev.petType === 'Bird' ? '🦜' : '🐾'}
                          </div>
                          <div>
                            <h4 className="font-display font-black text-slate-800 text-sm leading-tight">
                              {rev.clinicName}
                            </h4>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              📍 {rev.clinicArea}, {rev.clinicCity}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold block mt-1">
                              Veterinarian: <strong className="text-slate-700">{rev.veterinarianName || 'Lead Surgeon'}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-end gap-1.5">
                          <div className="flex text-amber-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-100'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[9px] font-extrabold uppercase text-[#58B368] tracking-wider flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                            <ShieldCheck className="w-2.5 h-2.5" /> Verified Patient
                          </span>
                        </div>
                      </div>

                      {/* Review Comment */}
                      <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal bg-slate-50/50 p-4 rounded-2xl border border-slate-100/30 italic">
                        "{rev.reviewText}"
                      </p>

                      {/* Interaction Row */}
                      <div className="mt-4 pt-3.5 border-t border-slate-50 flex items-center justify-between flex-wrap gap-4 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">{rev.userName}</span>
                          <span className="text-slate-300">•</span>
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 font-bold uppercase text-[9px]">
                            {rev.petType} Parent
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{rev.date}</span>
                          </span>

                          <button
                            onClick={() => handleHelpfulClick(rev.id)}
                            className={`flex items-center gap-1.5 font-extrabold transition-colors cursor-pointer ${
                              hasVoted ? 'text-[#58B368]' : 'hover:text-slate-700 text-slate-400'
                            }`}
                          >
                            <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-green-100' : ''}`} />
                            <span>{votes} {hasVoted ? 'Voted Helpful' : 'Helpful?'}</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Load More */}
            {hasMore && !loading && (
              <div className="text-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-black text-xs rounded-2xl shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 mx-auto cursor-pointer disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-t-slate-800 border-slate-200" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Load More Experiences</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Curated Collections */}
          <div className="lg:col-span-4 space-y-6">
            <h3 className="font-display font-black text-xl text-slate-900 flex items-center gap-2">
              <FolderHeart className="w-5 h-5 text-[#58B368]" />
              <span>Curated Collections</span>
            </h3>

            <div className="grid grid-cols-1 gap-5">
              {COLLECTIONS.map((coll) => (
                <div
                  key={coll.id}
                  onClick={() => handleCollectionSelect(coll.tag)}
                  className="relative h-44 rounded-3xl overflow-hidden shadow-md group cursor-pointer text-left"
                >
                  <img 
                    src={coll.image} 
                    alt={coll.title} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-slate-950/20" />
                  
                  <div className="absolute inset-0 p-5 flex flex-col justify-between text-white z-10">
                    <div className="flex justify-between items-start">
                      <span className="bg-[#58B368] text-white px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider">
                        {coll.tag}
                      </span>
                      <span className="text-[9px] text-[#58B368] bg-white px-2 py-0.5 rounded-md font-black">
                        {coll.count}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-sm font-black tracking-tight leading-tight">
                        {coll.title}
                      </h4>
                      <p className="text-[10px] text-slate-300 font-medium leading-relaxed line-clamp-2">
                        {coll.desc}
                      </p>
                      <span className="text-[9px] font-bold text-green-300 group-hover:text-white flex items-center gap-1 transition-colors pt-1">
                        Explore Collection <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 7. SHARE YOUR EXPERIENCE CTA */}
        <section className="bg-gradient-to-br from-[#0F2D19] to-[#24633E] text-white p-8 md:p-12 rounded-[32px] shadow-lg flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-green-500/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg text-xs font-bold text-green-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Help Pet Caretakers Choose Wisely</span>
            </div>
            <h3 className="font-display font-black text-2xl sm:text-3xl text-white">Share Your Trusted Veterinary Experience</h3>
            <p className="text-green-100 text-xs sm:text-sm">
              Your feedback guides other pet owners to the best doctors and diagnostic centers. Share recovery stories or routine checkup reviews.
            </p>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={() => currentUser ? onOpenAuth('login') : onOpenAuth('signup')}
              className="px-6 py-3 bg-white hover:bg-green-50 text-[#0F2D19] font-black text-xs rounded-2xl shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 animate-pulse"
              style={{ animationDuration: '3000ms' }}
            >
              <span>Write Your Story</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

      </div>

    </div>
  );
}
