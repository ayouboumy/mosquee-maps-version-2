import { motion } from 'motion/react';
import { 
  ArrowLeft, MapPin, Navigation, Heart, CheckCircle2, 
  Clipboard, Check, Share2, Building2, Users, Maximize, 
  Home, Droplets, Info, Activity, Clock, ShieldCheck,
  Compass
} from 'lucide-react';
import { Mosque } from '../types';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { t, getLocalizedName } from '../utils/translations';
import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';

const miniMapIcon = L.divIcon({
  className: 'mini-mosque-marker',
  html: `
    <div style="width: 30px; height: 30px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); border: 2px solid white;">
      <div style="transform: rotate(45deg); padding-top: 1px; padding-left: 1px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 30]
});

interface ProfileScreenProps {
  mosque: Mosque;
  onClose: () => void;
}

export default function ProfileScreen({ mosque, onClose }: ProfileScreenProps) {
  const { favorites, toggleFavorite, language, routeProfile, userLocation, setRoutingToMosque, mapStyle } = useAppStore();
  const [copied, setCopied] = useState(false);
  const isFavorite = favorites.includes(mosque.id);

  const handleCopyPosition = () => {
    const coords = `${mosque.latitude}, ${mosque.longitude}`;
    navigator.clipboard.writeText(coords);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: mosque.name,
          text: `${mosque.name} - ${mosque.address}`,
          url: `https://www.google.com/maps/search/?api=1&query=${mosque.latitude},${mosque.longitude}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleStartRoute = () => {
    setRoutingToMosque(mosque);
    onClose();
  };

  const handleOpenGoogleMapsRoute = () => {
    const travelMode = (routeProfile || 'foot') === 'foot' ? 'walking' : 'driving';
    if (userLocation) {
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${mosque.latitude},${mosque.longitude}&travelmode=${travelMode}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}&travelmode=${travelMode}`, '_blank');
    }
  };

  // Intelligent Data Organization
  const { organizedData, highlights, openingStatus } = useMemo(() => {
    const highlightsList: { label: string; value: string; icon: any; color: string }[] = [];
    let opening: string | null = null;
    if (!mosque.extraData) return { organizedData: [], highlights: [], openingStatus: null };

    const categories = [
      {
        id: 'general',
        title: t('General Information', language),
        icon: Info,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        keys: ['type de commune', 'milieu', 'code', 'nature', 'entité de financement', 'financement', 'ministère', 'habous', 'région', 'province', 'caïdat', 'nidhara', 'awqaf', 'état', 'condition'],
        items: [] as { key: string; value: any }[]
      },
      {
        id: 'situation',
        title: t('Situation Information', language),
        icon: MapPin,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        keys: ['x', 'y', 'coordonnées', 'topographie', 'pentes', 'ravin', 'autre terrain', 'zone thermique'],
        items: [] as { key: string; value: any }[]
      },
      {
        id: 'capacity',
        title: t('Capacity & Space', language),
        icon: Maximize,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        keys: ['capacité', 'surface', 'aire', 'm2', 'place', 'nombre de fidèles', 'superficie'],
        items: [] as { key: string; value: any }[]
      },
      {
        id: 'prayer',
        title: t('Prayer Areas', language),
        icon: Users,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        keys: ['femme', 'homme', 'salle', 'prière', 'étage', 'mezzanine'],
        items: [] as { key: string; value: any }[]
      },
      {
        id: 'sanitary',
        title: t('Sanitary Facilities', language),
        icon: Droplets,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
        keys: ['eau', 'électricité', 'sanitaire', 'latrine', 'toilette', 'abdest', 'puits', 'compteur', 'robinet'],
        items: [] as { key: string; value: any }[]
      },
      {
        id: 'staff',
        title: t('Staff & Housing', language),
        icon: Home,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        keys: ['logement', 'imam', 'mouadhine', 'mouadine', 'gardien', 'fquih'],
        items: [] as { key: string; value: any }[]
      },
      {
        id: 'status',
        title: t('Status & Environment', language),
        icon: Activity,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        keys: ['construction', 'date', 'terrain', 'titre', 'foncier', 'clôture', 'urbain', 'rural', 'صومعة'],
        items: [] as { key: string; value: any }[]
      },
      {
        id: 'other',
        title: t('Other Details', language),
        icon: Info,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        keys: [],
        items: [] as { key: string; value: any }[]
      }
    ];

    // Deep Analysis for Highlights and Categorization
    Object.entries(mosque.extraData).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      const valStr = String(value);

      // Extract Opening Status
      if (lowerKey.includes('ouvert') || lowerKey.includes('fermé') || lowerKey.includes('statut d\'ouverture')) {
        opening = valStr;
        return;
      }

      // Extract highlights...
      if ((lowerKey.includes('capacité') || lowerKey.includes('nombre de fidèles')) && !highlightsList.find(h => h.label === 'Capacity')) {
        highlightsList.push({ label: 'Capacity', value: valStr, icon: Users, color: 'emerald' });
        return;
      }
      if ((lowerKey.includes('surface') || lowerKey.includes('superficie')) && !highlightsList.find(h => h.label === 'Surface')) {
        highlightsList.push({ label: 'Surface', value: valStr, icon: Maximize, color: 'blue' });
        return;
      }
      if (lowerKey.includes('état') && !highlightsList.find(h => h.label === 'Condition')) {
        highlightsList.push({ label: 'Condition', value: valStr, icon: Activity, color: 'amber' });
        return;
      }
      if (lowerKey.includes('construction') && !highlightsList.find(h => h.label === 'Built')) {
        highlightsList.push({ label: 'Built', value: valStr, icon: Clock, color: 'purple' });
        return;
      }

      let found = false;
      for (const cat of categories) {
        if (cat.keys.some(k => lowerKey.includes(k))) {
          cat.items.push({ key, value });
          found = true;
          break;
        }
      }
      if (!found) {
        categories.find(c => c.id === 'other')?.items.push({ key, value });
      }
    });

    return { 
      organizedData: categories.filter(cat => cat.items.length > 0),
      highlights: highlightsList,
      openingStatus: opening
    };
  }, [mosque.extraData, language]);

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[2000] bg-gray-50 overflow-y-auto"
    >
      {/* Hero Section */}
      <div className="relative h-[45vh] min-h-[350px]">
        {mosque.image ? (
          <img 
            src={mosque.image} 
            alt={getLocalizedName(mosque, language)} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-emerald-900 flex items-center justify-center">
            <Compass size={64} className="text-emerald-500 opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
        
        <button 
          onClick={onClose}
          className={`absolute top-safe-4 ${language === 'ar' ? 'right-4' : 'left-4'} p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all border border-white/20 z-10`}
        >
          <ArrowLeft size={24} className={language === 'ar' ? 'rotate-180' : ''} />
        </button>

        <div className="absolute bottom-8 left-6 right-6 text-white z-10">
          <div className="flex items-center gap-2 mb-3">
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="px-3 py-1.5 bg-emerald-500/90 backdrop-blur-sm rounded-full text-[10px] uppercase tracking-widest font-black shadow-lg shadow-emerald-900/30 flex items-center gap-1.5"
            >
              <ShieldCheck size={14} />
              {t(mosque.type, language)}
            </motion.div>

            {openingStatus && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className={cn(
                  "px-3 py-1.5 backdrop-blur-sm rounded-full text-[10px] uppercase tracking-widest font-black shadow-lg flex items-center gap-1.5",
                  openingStatus.toLowerCase().includes('ouvert') 
                    ? "bg-blue-500/90 shadow-blue-900/30" 
                    : "bg-red-500/90 shadow-red-900/30"
                )}
              >
                <Clock size={14} />
                {openingStatus}
              </motion.div>
            )}
            
            {mosque.commune && (
              <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] uppercase tracking-widest font-black shadow-lg flex items-center gap-1.5">
                <Building2 size={14} />
                {t(mosque.commune, language)}
              </div>
            )}
          </div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl font-serif font-black mb-3 leading-[1.15] tracking-tight drop-shadow-xl"
          >
            {getLocalizedName(mosque, language)}
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-start text-white/90 text-sm font-medium"
          >
            <MapPin size={16} className={cn("shrink-0 mt-0.5", language === 'ar' ? 'ml-2' : 'mr-2 text-gray-300')} />
            <span className="leading-snug line-clamp-2">{t(mosque.address, language)}</span>
          </motion.div>
        </div>
      </div>

      <div className="relative z-20 px-4 sm:px-6 pb-24 -mt-4">
        {/* Main Route Button - Prominent */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="bg-white rounded-[24px] p-2 shadow-bottom-sheet flex items-center justify-between mb-8 border border-white/50"
        >
          <button
            onClick={handleStartRoute}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-lg py-4 rounded-[18px] shadow-emerald-glow active:scale-95 transition-all"
          >
            <Navigation size={22} className="fill-emerald-100" />
            {t('Start Live Route', language)}
          </button>
          <div className="flex gap-2 px-2 shrink-0">
            <button 
              onClick={() => toggleFavorite(mosque.id)}
              className={cn(
                "w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-90",
                isFavorite ? "bg-red-50 text-red-500 shadow-sm" : "bg-gray-100/80 text-gray-500 hover:bg-gray-200"
              )}
            >
              <Heart size={22} className={cn(isFavorite && "fill-current")} />
            </button>
            <button 
              onClick={handleShare}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100/80 text-gray-700 hover:bg-gray-200 transition-all active:scale-90"
            >
              <Share2 size={20} />
            </button>
          </div>
        </motion.div>

        <div className="flex flex-col gap-6">
          {/* Mini Map Preview */}
          {mosque.latitude && mosque.longitude && (
            <section className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-100">
              <div className="h-32 w-full relative z-0 pointer-events-none">
                <MapContainer 
                  center={[mosque.latitude, mosque.longitude]} 
                  zoom={15} 
                  zoomControl={false}
                  attributionControl={false}
                  className="w-full h-full"
                >
                  <TileLayer url={mapStyle === 'street' ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"} />
                  <Marker position={[mosque.latitude, mosque.longitude]} icon={miniMapIcon} />
                </MapContainer>
              </div>
              <div className="p-3 bg-white flex justify-between items-center z-10 relative">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {mosque.latitude.toFixed(5)}, {mosque.longitude.toFixed(5)}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCopyPosition} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-bold text-gray-600 transition-colors">
                    {copied ? t('Copied', language) : t('Copy', language)}
                  </button>
                  <button onClick={handleOpenGoogleMapsRoute} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full text-xs font-bold transition-colors">
                    Google Maps
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Key Highlights Grid */}
          {highlights.length > 0 && (
            <section className="grid grid-cols-2 gap-3">
              {highlights.map((h, idx) => (
                <div key={idx} className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 flex items-start gap-3">
                  <div className={cn("p-2.5 rounded-xl shrink-0", `bg-${h.color}-50 text-${h.color}-600`)}>
                    <h.icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-0.5">{t(h.label, language)}</p>
                    <p className="text-base font-black text-gray-900 truncate">{h.value}</p>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Intelligent Data Rows */}
          {organizedData.map(cat => (
            <section key={cat.id} className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                 <div className={cn("p-2 rounded-xl shrink-0", cat.bgColor, cat.color)}>
                  <cat.icon size={18} />
                 </div>
                 <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">{cat.title}</h2>
              </div>
              <div className="p-2 gap-0.5 flex flex-col">
                {cat.items.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                    <span className="text-xs font-bold text-gray-500 max-w-[40%] leading-relaxed">{t(item.key, language)}</span>
                    <span className="text-sm font-medium text-gray-900 text-right max-w-[55%]">{t(String(item.value), language)}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Facilities and Services Chips */}
          <section className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-5 mt-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">{t('Services & Facilities', language)}</h2>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {mosque.services.map(service => (
                <div key={service} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100/50 rounded-full text-xs font-bold text-emerald-700">
                  <CheckCircle2 size={12} className="text-emerald-500 fill-emerald-100" />
                  {t(service, language)}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {mosque.items.map(item => (
                <div key={item} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-[11px] font-bold uppercase tracking-wider rounded-md border border-gray-200/50">
                  {t(item, language)}
                </div>
              ))}
              {mosque.services.length === 0 && mosque.items.length === 0 && (
                <p className="text-sm text-gray-400 italic font-medium w-full text-center py-2">{t('No specific facilities listed', language)}</p>
              )}
            </div>
          </section>

        </div>
      </div>
    </motion.div>
  );
}
