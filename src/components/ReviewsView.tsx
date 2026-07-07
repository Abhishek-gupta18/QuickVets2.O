import React, { useState, useEffect, useRef } from 'react';
import { 
  Star, Search, Filter, SlidersHorizontal, CheckCircle2, 
  ThumbsUp, Calendar, MapPin, Award, ArrowRight, Stethoscope,
  ShieldCheck, Heart, Sparkles, RefreshCw, AlertCircle, Compass,
  FolderHeart, HeartPulse, Clock, Sparkle, ChevronLeft, ChevronRight, X,
  Share2, MessageSquare, Plus, Phone, TrendingUp, UserCheck
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
  const [featuredIndex, setFeaturedIndex] = useState(0);

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

  // Write Story Modal States
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [storyTitle, setStoryTitle] = useState('');
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('Dog');
  const [selectedClinicIdForReview, setSelectedClinicIdForReview] = useState('');
  const [vetName, setVetName] = useState('');
  const [storyText, setStoryText] = useState('');
  const [platformRating, setPlatformRating] = useState(5);
  const [platformFeedback, setPlatformFeedback] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isSubmittingStory, setIsSubmittingStory] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file: any) => {
      if (file.size > 2 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Max size is 2MB.`);
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUploadedImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeUploadedImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handlePublishStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!selectedClinicIdForReview) {
      alert('Please select a clinic.');
      return;
    }
    if (!storyTitle.trim() || !storyText.trim()) {
      alert('Please fill out both the story title and recovery details.');
      return;
    }

    setIsSubmittingStory(true);
    try {
      const apiBase = (import.meta as any).env?.VITE_API_URL || '';
      
      const serializedText = JSON.stringify({
        storyTitle,
        vetName,
        platformRating,
        platformFeedback,
        images: uploadedImages,
        mainText: storyText
      });

      const res = await fetch(`${apiBase}/api/clinics/${selectedClinicIdForReview}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userName: currentUser.name,
          userEmail: currentUser.email,
          petType,
          rating: platformRating,
          reviewText: serializedText,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit story.');
      }

      // Reset states & close
      setStoryTitle('');
      setPetName('');
      setPetType('Dog');
      setSelectedClinicIdForReview('');
      setVetName('');
      setStoryText('');
      setPlatformRating(5);
      setPlatformFeedback('');
      setUploadedImages([]);
      setShowWriteModal(false);
      
      // Refresh list
      await fetchReviews(true);
    } catch (err) {
      alert('Failed to publish story. Please check your network connection.');
    } finally {
      setIsSubmittingStory(false);
    }
  };

  const parseRichReviewText = (text: string) => {
    try {
      if (text && text.trim().startsWith('{') && text.trim().endsWith('}')) {
        return JSON.parse(text);
      }
    } catch (e) {
      // ignore
    }
    return null;
  };

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

  // Featured Clinics Carousel Autoplay
  useEffect(() => {
    const featuredClinicsCount = clinics.filter(c => c.verificationStatus === 'approved').length;
    const limit = Math.min(featuredClinicsCount, 8);
    if (limit === 0) return;
    const interval = setInterval(() => {
      setFeaturedIndex(prev => (prev + 1) % limit);
    }, 4500);
    return () => clearInterval(interval);
  }, [clinics]);

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

  // Get exactly 8 top rated featured clinics
  const featuredClinics = clinics
    .filter(c => c.verificationStatus === 'approved')
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

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
      
      {/* 1. PREMIUM UNIFIED HERO & FILTER CARD */}
      <section className="relative text-white py-14 px-4 md:px-8 rounded-b-[56px] shadow-xl overflow-hidden min-h-[460px] flex items-center">
        {/* Background Dog Image with overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[4000ms] hover:scale-105"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1581888227599-779811939961?auto=format&fit=crop&q=80&w=1200')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-transparent" />
        
        <div className="max-w-7xl mx-auto w-full relative z-10 space-y-6">
          <div className="max-w-3xl space-y-3 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-green-300 text-[11px] font-semibold tracking-wide shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Clinical Experiences Only</span>
            </div>

            <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight text-white">
              Pet Parents Community
            </h1>
          </div>

          {/* Unified Glassmorphic Filter Card */}
          <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 p-5 md:p-6 rounded-[24px] shadow-2xl space-y-4 max-w-3xl text-left">
            <div>
              <h2 className="font-display font-black text-base sm:text-lg text-white">
                Browse Pet Experiences
              </h2>
              <p className="text-green-100/60 text-[11px] sm:text-xs font-normal mt-1 leading-relaxed">
                Discover real stories, clinic reviews, vaccination journeys, emergency recoveries, and advice from verified pet parents.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search input */}
              <div className="md:col-span-6 relative flex items-center">
                <Search className="w-3.5 h-3.5 text-green-200/60 absolute left-3.5" />
                <input
                  type="text"
                  placeholder="Clinics, vets, treatments, or pet types..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs text-white bg-white/5 border border-white/10 rounded-2xl outline-none placeholder:text-green-200/40 focus:border-green-400 focus:bg-white/10 transition-all font-medium"
                />
              </div>

              {/* Location Select */}
              <div className="md:col-span-3">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs text-green-100 bg-white/5 border border-white/10 rounded-2xl outline-none cursor-pointer focus:border-green-400 focus:bg-white/10 transition-all font-bold"
                >
                  <option value="All" className="text-slate-900">All Locations</option>
                  <option value="Bengaluru" className="text-slate-900">Bengaluru</option>
                  <option value="Mumbai" className="text-slate-900">Mumbai</option>
                  <option value="Hyderabad" className="text-slate-900">Hyderabad</option>
                  <option value="Kochi" className="text-slate-900">Kochi</option>
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="md:col-span-3">
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs text-green-100 bg-white/5 border border-white/10 rounded-2xl outline-none cursor-pointer focus:border-green-400 focus:bg-white/10 transition-all font-bold"
                >
                  <option value="recent" className="text-slate-900">Sort by: Recent</option>
                  <option value="highest" className="text-slate-900">Sort by: Highest Rating</option>
                  <option value="helpful" className="text-slate-900">Sort by: Most Helpful</option>
                </select>
              </div>
            </div>

            {/* Category Filter Chips & Total Counter */}
            <div className="pt-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-t border-white/5">
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => {
                  const IconComp = cat.icon;
                  const isSelected = categoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer border hover:-translate-y-0.5 duration-200 active:scale-95 ${
                        isSelected
                          ? 'bg-[#58B368] text-white border-[#58B368] shadow-md shadow-green-900/30'
                          : 'bg-white/5 text-green-200 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <IconComp className="w-2.5 h-2.5" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex-shrink-0 text-[10px] font-extrabold text-green-300 uppercase tracking-widest bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl">
                🟢 {sortedReviews.length} experiences found
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. STATISTICS STRIP */}
      <section className="bg-white border-y border-slate-100/80 py-4.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-around items-center gap-6 text-center text-xs md:text-sm font-display">
          <div className="flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <div>
              <span className="block font-black text-slate-800 text-sm md:text-base leading-none">12,500+</span>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Verified Experiences</span>
            </div>
          </div>
          <div className="w-px h-6 bg-slate-100 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-lg">🐶</span>
            <div>
              <span className="block font-black text-slate-800 text-sm md:text-base leading-none">8,300+</span>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Dogs Care Logs</span>
            </div>
          </div>
          <div className="w-px h-6 bg-slate-100 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-lg">🐱</span>
            <div>
              <span className="block font-black text-slate-800 text-sm md:text-base leading-none">2,900+</span>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Cats Treated</span>
            </div>
          </div>
          <div className="w-px h-6 bg-slate-100 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-lg">🏥</span>
            <div>
              <span className="block font-black text-slate-800 text-sm md:text-base leading-none">540+</span>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Verified Clinics</span>
            </div>
          </div>
          <div className="w-px h-6 bg-slate-100 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-lg">❤️</span>
            <div>
              <span className="block font-black text-[#2D855A] text-sm md:text-base leading-none">98%</span>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Positive Reviews</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16">

        {/* 3. AUTO-SCROLLING FEATURED CLINICS CAROUSEL */}
        <section className="space-y-6 text-left">
          <div>
            <span className="text-[10px] uppercase font-black text-[#58B368] bg-[#E5F6EC] px-2 py-0.5 rounded border border-[#C6ECD2]">
              Top Rated Care Centers
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 mt-1">
              Featured Veterinary Clinics
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Top clinics offering emergency support, verified by nearby pet parents.
            </p>
          </div>

          <div className="relative overflow-hidden w-full p-1">
            <div 
              className="flex transition-transform duration-500 ease-out gap-6"
              style={{ transform: `translateX(-${featuredIndex * (isMobile ? 88 : 100)}%)` }}
            >
              {featuredClinics.map((clinic) => {
                const mockDistance = ((clinic.name.length * 7) % 4) + 1.2;
                return (
                  <div 
                    key={clinic.id} 
                    className="flex-shrink-0 w-[85vw] md:w-[calc(25%-18px)] bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-[#58B368]/20 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                  >
                    <div>
                      <div className="relative h-44 overflow-hidden">
                        <img 
                          src={clinic.imageUrl || 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=400'} 
                          alt={clinic.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        
                        {clinic.hasEmergency && (
                          <span className="absolute top-3 left-3 bg-red-500/90 backdrop-blur-sm border border-red-400/20 text-white rounded-full px-2.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider">
                            🚨 Emergency Ready
                          </span>
                        )}

                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm border border-[#58B368]/20 px-2.5 py-0.5 rounded-full text-xs font-black text-slate-800 flex items-center gap-0.5 shadow-sm">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{Number(clinic.rating).toFixed(1)}</span>
                        </div>
                      </div>

                      <div className="p-5 space-y-2">
                        <h4 
                          className="font-display font-bold text-slate-800 text-sm leading-tight hover:text-[#58B368] cursor-pointer truncate" 
                          onClick={() => onSelectClinic(clinic)}
                        >
                          {clinic.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                          <span>📍 {clinic.area}</span>
                          <span>•</span>
                          <span>{mockDistance.toFixed(1)} km away</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          ⭐ {clinic.reviewsCount} Patient Audits
                        </span>
                        
                        <div className="flex flex-wrap gap-1 pt-1.5">
                          {clinic.specialists.slice(0, 2).map(spec => (
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
                        className="w-full py-2.5 bg-slate-50 hover:bg-[#58B368] hover:text-white border border-slate-100 hover:border-[#58B368] text-slate-700 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow-[0_8px_20px_rgba(88,179,104,0.25)]"
                      >
                        Quick Visit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Carousel Indicators */}
            <div className="flex justify-center gap-1.5 mt-5">
              {Array.from({ length: Math.ceil(featuredClinics.length / (isMobile ? 1 : 4)) }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setFeaturedIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === featuredIndex ? 'w-6 bg-[#58B368]' : 'w-1.5 bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* 4. CURATED COLLECTIONS SECTION */}
        <section className="space-y-6 text-left">
          <div>
            <span className="text-[10px] uppercase font-black text-[#58B368] bg-[#E5F6EC] px-2 py-0.5 rounded border border-[#C6ECD2]">
              Expert Handpicked Guides
            </span>
            <h3 className="font-display font-black text-2xl text-slate-900 mt-1">Curated Care Collections</h3>
            <p className="text-xs text-slate-400 mt-0.5">Explore tailored clinical maps and advice verified by QuickVet specialist partners.</p>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-6 pb-4">
            {[
              {
                id: 'coll-emergency',
                title: 'Top Emergency Clinics',
                desc: '24/7 critical trauma centers with dedicated blood banks & ICU facilities.',
                count: '6 locations',
                image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=500',
                tag: 'Emergency'
              },
              {
                id: 'coll-vaccines',
                title: 'Best Vaccination Centers',
                desc: 'Audited clinics providing standard immunizations under cold chain storage.',
                count: '8 locations',
                image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=500',
                tag: 'Vaccination'
              },
              {
                id: 'coll-parks',
                title: 'Pet Friendly Parks',
                desc: 'Leash-free dog parks, play areas, and pet socialization hubs nearby.',
                count: '15 locations',
                image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=500',
                tag: 'Outdoor'
              },
              {
                id: 'coll-puppy',
                title: 'Puppy Starter Guide',
                desc: 'Essential initial care checklist, nutrition tips, and vaccine schedule for new owners.',
                count: '12 guides',
                image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=500',
                tag: 'Puppy'
              },
              {
                id: 'coll-cats',
                title: 'Cat Wellness Clinics',
                desc: 'Feline-friendly certified clinics with separate waiting rooms and quiet zones.',
                count: '8 locations',
                image: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=500',
                tag: 'Feline Care'
              },
              {
                id: 'coll-exotics',
                title: 'Exotic Pet Specialists',
                desc: 'Experienced veterinarians specialized in birds, rabbits, reptiles, and small mammals.',
                count: '4 locations',
                image: 'https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?auto=format&fit=crop&q=80&w=500',
                tag: 'Exotics'
              }
            ].map((coll) => (
              <div
                key={coll.id}
                onClick={() => handleCollectionSelect(coll.tag)}
                className="relative flex-shrink-0 w-[78vw] md:w-[320px] h-64 rounded-3xl overflow-hidden shadow-md group cursor-pointer text-left snap-center hover:-translate-y-1 transition-all duration-300"
              >
                <img 
                  src={coll.image} 
                  alt={coll.title} 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/40 to-slate-950/10" />
                
                <div className="absolute inset-0 p-6 flex flex-col justify-between text-white z-10">
                  <div className="flex justify-between items-start">
                    <span className="bg-[#58B368] text-white px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                      {coll.tag}
                    </span>
                    <span className="text-[10px] text-[#58B368] bg-white px-2 py-0.5 rounded-md font-black">
                      {coll.count}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-base font-black tracking-tight leading-tight">
                      {coll.title}
                    </h4>
                    <p className="text-[11px] text-slate-300 font-medium leading-relaxed line-clamp-2">
                      {coll.desc}
                    </p>
                    <span className="text-[10px] font-bold text-green-300 group-hover:text-white flex items-center gap-1 transition-colors pt-1">
                      Explore Collection <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5 & 6. COMMUNITY FEED & SIDEBAR GRID */}
        <div id="experiences-feed-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Social Community Feed (8/12 cols) */}
          <div className="lg:col-span-8 space-y-6 text-left">
            <div className="flex justify-between items-center border-b border-green-100 pb-3">
              <h3 className="font-display font-black text-xl text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#58B368]" />
                <span>Real Pet Experiences</span>
              </h3>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-500">
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
              // Premium Empty State
              <div className="p-12 text-center bg-white border border-slate-100 rounded-3xl space-y-5">
                <div className="w-28 h-28 mx-auto flex items-center justify-center bg-[#E5F6EC]/50 rounded-full">
                  <span className="text-5xl">🐾</span>
                </div>
                <h3 className="font-display font-black text-slate-800 text-lg">
                  Be the First to Share Your Pet's Journey
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Tell our community about your clinical experiences to help other pet caretakers discover the best local doctors.
                </p>
                <button
                  onClick={() => currentUser ? setShowWriteModal(true) : onOpenAuth('login')}
                  className="px-6 py-2.5 bg-[#58B368] hover:bg-[#4ea25d] text-white font-extrabold rounded-xl text-xs shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer hover:shadow-[0_8px_20px_rgba(88,179,104,0.25)]"
                >
                  Share Experience
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedReviews.map((rev, idx) => {
                  const hasVoted = votedReviews[rev.id];
                  const votes = (helpfulRatings[rev.id] || 0) + (idx % 3 === 0 ? 7 : idx % 5 === 1 ? 4 : 2);
                  const isAlternativeLayout = idx % 2 === 1;

                  const richData = parseRichReviewText(rev.reviewText);
                  const isRich = !!richData;
                  const displayText = isRich ? richData.mainText : rev.reviewText;
                  const displayTitle = isRich ? richData.storyTitle : `${rev.petType} Care Journey`;
                  const displayVetName = isRich ? (richData.vetName || rev.veterinarianName || 'Lead Surgeon') : (rev.veterinarianName || 'Lead Surgeon');
                  const displayImages = isRich && Array.isArray(richData.images) ? richData.images : [];
                  
                  // Generate an avatar based on userName
                  const userAvatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(rev.userName)}`;
                  
                  // Get a high-quality default pet image based on type if no images uploaded
                  const defaultPetImg = rev.petType === 'Dog' 
                    ? 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600'
                    : rev.petType === 'Cat'
                    ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600'
                    : rev.petType === 'Bird'
                    ? 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?auto=format&fit=crop&q=80&w=600'
                    : 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=600';

                  const imagesToDisplay = displayImages.length > 0 ? displayImages : [defaultPetImg];

                  return (
                    <motion.div
                      key={rev.id}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3 }}
                      className={`p-6 bg-white border border-slate-100 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-300 text-left hover:-translate-y-1 ${
                        isAlternativeLayout ? 'border-l-4 border-l-[#58B368]' : ''
                      }`}
                    >
                      {/* Post Header */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={userAvatarUrl} 
                            alt={rev.userName} 
                            className="w-10 h-10 rounded-full border border-slate-100 bg-emerald-50 object-cover" 
                          />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-display font-black text-sm text-slate-800 leading-tight">
                                {rev.userName}
                              </span>
                              <span className="text-[10px] text-slate-400">•</span>
                              <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 font-extrabold text-[9px] uppercase tracking-wide">
                                {rev.petType} Parent
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Shared {rev.date || 'recently'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-50/60 border border-amber-100 px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="font-extrabold text-slate-800 text-[10px]">{rev.rating}</span>
                        </div>
                      </div>

                      {/* Post Body */}
                      <div className="mt-4 space-y-3">
                        <h4 className="font-display font-black text-slate-900 text-base leading-tight">
                          {displayTitle}
                        </h4>
                        
                        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                          {displayText}
                        </p>

                        {/* Post Media (Pet Photo) */}
                        <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden border border-slate-100/60 bg-slate-50 mt-2">
                          <img 
                            src={imagesToDisplay[0]} 
                            alt="Pet Experience" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      </div>

                      {/* Tagged Clinic */}
                      <div className="mt-4 flex flex-wrap gap-2 items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Clinic Tagged:</span>
                        <button
                          onClick={() => {
                            const clinicObj = clinics.find(c => c.id === rev.clinicId);
                            if (clinicObj) onSelectClinic(clinicObj);
                          }}
                          className="px-3 py-1 rounded-full bg-[#E5F6EC] hover:bg-[#C6ECD2] text-[#2F855A] text-xs font-bold border border-[#C6ECD2] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>{rev.clinicName}</span>
                          <span className="text-[10px] text-[#2F855A]/70">• {rev.clinicArea}</span>
                        </button>
                      </div>

                      {/* Post Footer Action Bar */}
                      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-slate-400 text-[11px] font-semibold">
                        <button
                          onClick={() => handleHelpfulClick(rev.id)}
                          className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                            hasVoted ? 'text-[#58B368] font-bold' : 'hover:text-slate-800'
                          }`}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-emerald-100' : ''}`} />
                          <span>{votes} Likes</span>
                        </button>

                        <button className="flex items-center gap-1.5 hover:text-slate-800 cursor-pointer">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{((rev.id.length + 3) % 5) + 2} Comments</span>
                        </button>

                        <button className="flex items-center gap-1.5 hover:text-slate-800 cursor-pointer">
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share</span>
                        </button>
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

          {/* RIGHT SIDEBAR (4/12 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Emergency Hotline Card */}
            <div className="bg-gradient-to-br from-red-600 to-rose-750 text-white rounded-3xl p-6 shadow-md border border-red-500/20 relative overflow-hidden text-left">
              <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 pointer-events-none">🚑</div>
              <span className="bg-white/20 text-white px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider">
                24/7 Dispatch
              </span>
              <h4 className="font-display font-black text-lg mt-2 leading-tight">
                Medical Hotline
              </h4>
              <p className="text-[11px] text-red-100/90 mt-1 leading-relaxed">
                Call our operators for immediate veterinary dispatch and emergency first-aid guide.
              </p>
              <a 
                href="tel:18001234567"
                className="mt-4 w-full py-3 bg-white text-red-600 hover:bg-red-50 font-black text-xs rounded-xl shadow-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Call 1800-123-4567</span>
              </a>
            </div>

            {/* Trending Topics */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-left">
              <h4 className="font-display font-black text-slate-800 text-sm border-b border-green-50 pb-2.5 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#58B368]" />
                <span>Trending Topics</span>
              </h4>
              <div className="mt-3.5 space-y-3">
                {[
                  { tag: '#RainySeasonCare', count: '142 experiences' },
                  { tag: '#ParvoAlert', count: '98 checkups' },
                  { tag: '#PuppyVaccination', count: '210 guides' },
                  { tag: '#EmergencyFirstAid', count: '87 recoveries' },
                  { tag: '#ExoticPetsCare', count: '45 recommendations' }
                ].map((topic) => (
                  <button
                    key={topic.tag}
                    onClick={() => {
                      setSearchQuery(topic.tag.replace('#', ''));
                      document.getElementById('experiences-feed-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full flex justify-between items-center text-xs group cursor-pointer"
                  >
                    <span className="font-bold text-[#2F855A] group-hover:underline">
                      {topic.tag}
                    </span>
                    <span className="text-slate-400 font-semibold text-[10px]">
                      {topic.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Top Contributors */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-left">
              <h4 className="font-display font-black text-slate-800 text-sm border-b border-green-50 pb-2.5 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#58B368]" />
                <span>Top Contributors</span>
              </h4>
              <div className="mt-3.5 space-y-3.5">
                {[
                  { name: 'Rahul Malhotra', seed: 'Rahul', badge: 'Super Parent', stories: 12 },
                  { name: 'Dr. Myra Sen', seed: 'Myra', badge: 'Verified Vet', stories: 9 },
                  { name: 'Kavitha Iyer', seed: 'Kavitha', badge: 'Community Guide', stories: 7 }
                ].map((user) => (
                  <div key={user.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${user.seed}`} 
                        alt={user.name} 
                        className="w-8 h-8 rounded-full border border-slate-100 bg-slate-50" 
                      />
                      <div className="leading-tight">
                        <span className="font-black text-slate-800 text-xs block">{user.name}</span>
                        <span className="text-[9px] text-[#58B368] font-bold">{user.badge}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">
                      {user.stories} Posts
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Vaccination Camps */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-left">
              <h4 className="font-display font-black text-slate-800 text-sm border-b border-green-50 pb-2.5 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#58B368]" />
                <span>Vaccination Camps</span>
              </h4>
              <div className="mt-3.5 space-y-3.5">
                {[
                  { title: 'Free Anti-Rabies Camp', loc: 'JP Nagar Clinic', date: 'July 12' },
                  { title: 'Feline Wellness Drive', loc: 'Indiranagar Center', date: 'July 19' }
                ].map((camp) => (
                  <div key={camp.title} className="flex items-start gap-2 text-xs">
                    <span className="text-base mt-0.5">💉</span>
                    <div>
                      <span className="font-black text-slate-800 block leading-tight">{camp.title}</span>
                      <span className="text-slate-400 text-[10px] mt-0.5 block">{camp.loc} • <b>{camp.date}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nearby Clinics */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-left">
              <h4 className="font-display font-black text-slate-800 text-sm border-b border-green-50 pb-2.5 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#58B368]" />
                <span>Nearby Clinics</span>
              </h4>
              <div className="mt-3.5 space-y-3.5">
                {clinics.slice(0, 3).map((clinic) => (
                  <div 
                    key={clinic.id} 
                    onClick={() => onSelectClinic(clinic)}
                    className="group flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-black text-slate-800 text-xs block group-hover:text-[#58B368] transition-colors truncate max-w-[150px]">
                        {clinic.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                        📍 {clinic.area}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-black text-slate-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                      ⭐ {Number(clinic.rating).toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* 7. SHARE YOUR EXPERIENCE CTA */}
        <section className="bg-gradient-to-br from-[#0F2D19] to-[#24633E] text-white p-8 md:p-12 rounded-[32px] shadow-lg flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden text-left">
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
              onClick={() => currentUser ? setShowWriteModal(true) : onOpenAuth('login')}
              className="px-6 py-3 bg-white hover:bg-green-50 text-[#0F2D19] font-black text-xs rounded-2xl shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 animate-pulse"
              style={{ animationDuration: '3000ms' }}
            >
              <span>Write Your Story</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

      </div>

      {/* 8. WRITE YOUR STORY MODAL */}
      <AnimatePresence>
        {showWriteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="bg-[#F8FDF9] w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl border border-green-100 flex flex-col max-h-[90vh] my-auto"
            >
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-[#0F2D19] to-[#24633E] p-6 text-white flex items-center justify-between flex-shrink-0">
                <div>
                  <span className="text-[9px] uppercase font-black tracking-widest bg-white/10 px-2 py-0.5 rounded border border-white/20">Write Your Story</span>
                  <h3 className="font-display font-black text-lg sm:text-xl mt-1">Share Your Pet Journey & Platform Feedback</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWriteModal(false)}
                  className="p-2 bg-white/10 hover:bg-white/25 rounded-2xl text-white transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handlePublishStory} className="flex-grow overflow-y-auto p-6 md:p-8 space-y-6 text-left">
                
                {/* Story/Incident Details */}
                <div className="space-y-4">
                  <h4 className="font-display font-black text-slate-800 text-sm border-b border-green-100/50 pb-1.5 flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-[#58B368]" />
                    <span>1. Pet & Incident Story</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Story / Incident Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bella's Spine Stabilization Journey"
                        value={storyTitle}
                        onChange={(e) => setStoryTitle(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-400 h-10.5 font-bold text-slate-800"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Pet Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bella"
                        value={petName}
                        onChange={(e) => setPetName(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-400 h-10.5 font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Pet Type</label>
                      <select
                        value={petType}
                        onChange={(e) => setPetType(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-400 h-[38px] font-bold text-slate-700"
                      >
                        <option value="Dog">🐶 Dog</option>
                        <option value="Cat">🐱 Cat</option>
                        <option value="Bird">🦜 Bird</option>
                        <option value="Rabbit">🐰 Rabbit</option>
                        <option value="Exotics">🦎 Exotic Pet</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Clinic Visited</label>
                      <select
                        value={selectedClinicIdForReview}
                        onChange={(e) => setSelectedClinicIdForReview(e.target.value)}
                        required
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-400 h-[38px] font-bold text-slate-700"
                      >
                        <option value="">Select clinic...</option>
                        {clinics.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.area}, {c.city})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Veterinarian Name (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Sen"
                        value={vetName}
                        onChange={(e) => setVetName(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-400 h-10.5 font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Incident & Recovery Details</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Describe the medical incident, how QuickVet helped, the treatment, and the recovery process..."
                      value={storyText}
                      onChange={(e) => setStoryText(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-400 leading-relaxed font-medium text-slate-700"
                    />
                  </div>
                </div>

                {/* Platform Review */}
                <div className="space-y-4 pt-2">
                  <h4 className="font-display font-black text-slate-800 text-sm border-b border-green-100/50 pb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#58B368]" />
                    <span>2. QuickVet Platform Feedback</span>
                  </h4>
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Platform Experience Rating</label>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPlatformRating(i + 1)}
                          className="p-1 hover:scale-110 active:scale-95 transition-transform"
                        >
                          <Star
                            className={`w-7 h-7 cursor-pointer transition-colors ${
                              i < platformRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-black text-slate-600 pl-2">{platformRating} / 5 Stars</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Platform Review Comments (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Your feedback about our booking speeds, maps, support, or overall platform convenience..."
                      value={platformFeedback}
                      onChange={(e) => setPlatformFeedback(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-400 leading-relaxed font-medium text-slate-700"
                    />
                  </div>
                </div>

                {/* Image Upload Option */}
                <div className="space-y-4 pt-2">
                  <h4 className="font-display font-black text-slate-800 text-sm border-b border-green-100/50 pb-1.5 flex items-center gap-1.5">
                    <FolderHeart className="w-4 h-4 text-[#58B368]" />
                    <span>3. Upload Pet Recovery Photos</span>
                  </h4>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-white hover:bg-slate-50/50 hover:border-green-300 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <span className="text-2xl mb-1">📸</span>
                          <p className="text-xs font-black text-slate-600">Click to upload pet photos</p>
                          <p className="text-[10px] text-slate-400 mt-1">JPEG, PNG up to 2MB each</p>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Previews Grid */}
                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                        {uploadedImages.map((img, idx) => (
                          <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-100 group">
                            <img src={img} alt="pet upload preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeUploadedImage(idx)}
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowWriteModal(false)}
                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-black rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingStory}
                    className="px-6 py-2.5 bg-[#58B368] hover:bg-[#4ea25d] text-white text-xs font-black rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmittingStory ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-t-white border-white/20" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <span>Publish My Story</span>
                      </>
                    )}
                  </button>
                </div>

              </form>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
