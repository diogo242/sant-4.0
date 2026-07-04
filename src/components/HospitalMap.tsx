import React, { useState, useEffect } from "react";
import { Hospital, Appointment, UserProfile } from "../types";
import { 
  MapPin, Navigation, Phone, Calendar, Clock, Star, Search, Layers, Compass, 
  Map as MapIcon, Eye, Check, ChevronRight, Activity, Info, ZoomIn, ZoomOut, RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HospitalMapProps {
  profile: UserProfile;
  onInitiatePayment: (appointment: Omit<Appointment, "id" | "status" | "isPaid">) => void;
}

export default function HospitalMap({ profile, onInitiatePayment }: HospitalMapProps) {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locStatus, setLocStatus] = useState<"loading" | "success" | "fallback" | "denied">("loading");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  
  // Custom Google Maps States
  const [searchQuery, setSearchQuery] = useState("");
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "transit">("roadmap");
  const [zoomLevel, setZoomLevel] = useState(13);
  const [showTraffic, setShowTraffic] = useState(true);

  // Mobile navigation views: List vs Map view
  const [mobileView, setMobileView] = useState<"list" | "map">("map");

  // Booking flow state
  const [bookingStep, setBookingStep] = useState<"browse" | "schedule">("browse");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  // Category Filter Pills
  const [selectedCategory, setSelectedCategory] = useState<"all" | "hosp" | "clinic" | "emergency">("all");

  // Simulated coordinate names
  const [locationName, setLocationName] = useState("Paris, France");

  useEffect(() => {
    // 1. Fetch hospitals from backend server API
    fetch("/api/hospitals")
      .then((res) => res.json())
      .then((data) => {
        setHospitals(data);
      })
      .catch((err) => {
        console.error("Failed to load hospitals from API", err);
      });

    // 2. Fetch User Geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          setLocStatus("success");
          setLocationName(`GPS: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
        },
        (error) => {
          console.warn("Geolocation permission denied or error:", error);
          // Fallback to coordinates of Paris Central
          setUserLocation({ lat: 48.8566, lng: 2.3522 });
          setLocStatus("fallback");
          setLocationName("Paris Centre, Île-de-France");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setUserLocation({ lat: 48.8566, lng: 2.3522 });
      setLocStatus("denied");
      setLocationName("Défaut: Paris, France");
    }
  }, []);

  // Recalculate hospital coordinates and distances dynamically once position is loaded
  const getProcessedHospitals = (): Hospital[] => {
    if (!userLocation) return hospitals;
    
    return hospitals.map((h) => {
      // Calculate realistic Euclidean distance based on lat/lng offsets
      const dist = Math.sqrt(Math.pow(h.latOffset, 2) + Math.pow(h.lngOffset, 2)) * 111; // 1 degree ~ 111km
      const roundedDist = Math.round(dist * 10) / 10;
      const travelTime = Math.round(roundedDist * 2.5 + 4); // walking / driving estimate

      return {
        ...h,
        distance: roundedDist,
        travelTime,
      };
    }).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  };

  const processedHospitals = getProcessedHospitals();

  // Filter based on search query and category filter pills
  const filteredHospitals = processedHospitals.filter((h) => {
    const query = searchQuery.toLowerCase();
    
    // Category match
    let categoryMatch = true;
    if (selectedCategory === "clinic") {
      categoryMatch = h.name.toLowerCase().includes("clinique");
    } else if (selectedCategory === "hosp") {
      categoryMatch = h.name.toLowerCase().includes("hôpital") || h.name.toLowerCase().includes("chu") || h.name.toLowerCase().includes("institut");
    } else if (selectedCategory === "emergency") {
      categoryMatch = h.specialties.some((s) => s.toLowerCase().includes("urgence") || s.toLowerCase().includes("cardio"));
    }

    const searchMatch = (
      h.name.toLowerCase().includes(query) ||
      h.address.toLowerCase().includes(query) ||
      h.specialties.some((s) => s.toLowerCase().includes(query))
    );

    return categoryMatch && searchMatch;
  });

  // Set default selected hospital once loaded
  useEffect(() => {
    if (filteredHospitals.length > 0 && !selectedHospital) {
      setSelectedHospital(filteredHospitals[0]);
    }
  }, [filteredHospitals]);

  const handleOpenBooking = (hosp: Hospital) => {
    setSelectedHospital(hosp);
    setSelectedSpecialty(hosp.specialties[0] || "Médecine Générale");
    // Default tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split("T")[0]);
    setSelectedTime("10:00");
    setBookingStep("schedule");
    
    // Auto switch to map panel on mobile to complete the reservation form
    if (window.innerWidth < 1024) {
      setMobileView("map");
    }
  };

  const handleConfirmBooking = () => {
    if (!selectedHospital || !selectedDate || !selectedTime) return;

    onInitiatePayment({
      hospitalId: selectedHospital.id,
      hospitalName: selectedHospital.name,
      specialty: selectedSpecialty,
      date: new Date(selectedDate).toLocaleDateString("fr-FR"),
      time: selectedTime,
      fees: selectedHospital.fees.consultation,
      patientName: `${profile.firstName} ${profile.lastName}`,
    });
  };

  const triggerGeolocation = () => {
    setLocStatus("loading");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          setLocStatus("success");
          setLocationName(`GPS: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
        },
        () => {
          setUserLocation({ lat: 48.8566, lng: 2.3522 });
          setLocStatus("fallback");
          setLocationName("Paris Centre (Défaut)");
        }
      );
    }
  };

  const timeSlots = ["08:30", "09:15", "10:00", "10:45", "11:30", "14:15", "15:00", "15:45", "16:30"];

  // Coordonnées réelles approximatives des hôpitaux au Bénin
  const hospitalCoordinates = [
    { id: "hosp-1", lat: 6.3667, lng: 2.3833 }, // Cotonou
    { id: "hosp-2", lat: 6.3667, lng: 2.3833 }, // Cotonou
    { id: "hosp-3", lat: 6.4969, lng: 2.6289 }, // Porto-Novo
    { id: "hosp-4", lat: 9.3376, lng: 2.6303 }, // Parakou
    { id: "hosp-5", lat: 7.1833, lng: 2.0833 }, // Bohicon
  ];

  const getHospitalCoords = (hospitalId: string) => {
    return hospitalCoordinates.find(h => h.id === hospitalId) || { lat: 6.3667, lng: 2.3833 };
  };

  const mapSrc = userLocation 
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${userLocation.lng - 0.1},${userLocation.lat - 0.1},${userLocation.lng + 0.1},${userLocation.lat + 0.1}&layer=mapnik&marker=${userLocation.lat},${userLocation.lng}`
    : `https://www.openstreetmap.org/export/embed.html?bbox=2.2833,6.2667,2.4833,6.4667&layer=mapnik&marker=6.3667,2.3833`;

  return (
    <div className="max-w-7xl mx-auto space-y-4" id="google-maps-hospital-section">
      
      {/* Top Banner & Control Status */}
      <div className="p-3 bg-white border border-slate-150 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <MapIcon className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-700">Carte Interactive - OpenStreetMap</span>
            <span className="text-[10px] text-slate-400 block font-medium">Cartographie en temps réel du Bénin</span>
          </div>
        </div>

        {/* Mobile View Switcher */}
        <div className="flex lg:hidden bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setMobileView("map")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              mobileView === "map" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500"
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" /> Carte
          </button>
          <button
            onClick={() => setMobileView("list")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              mobileView === "list" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500"
            }`}
          >
            <Search className="w-3.5 h-3.5" /> Liste ({filteredHospitals.length})
          </button>
        </div>

        <div className="flex items-center gap-2.5 font-mono text-[10px] bg-slate-50 p-1 rounded-lg border border-slate-100">
          <span className="font-bold text-slate-500 uppercase">Position :</span>
          <span className="text-emerald-600 font-bold">{locationName}</span>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid lg:grid-cols-12 gap-5 h-[620px] lg:h-[720px] overflow-hidden rounded-3xl border border-slate-150 shadow-md bg-white relative">
        
        {/* Left Side: Hospital List & Search (4 Columns) - Hidden on mobile if map view is selected */}
        <div className={`lg:col-span-4 flex flex-col h-full bg-white border-r border-slate-100 overflow-hidden ${
          mobileView === "list" ? "flex" : "hidden lg:flex"
        }`}>
          
          {/* Google Maps Search Bar & Category Pills */}
          <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher clinique, hôpital, spécialité..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Effacer
                </button>
              )}
            </div>

            {/* Quick search categories (like Google Maps "Hospitals", "Clinics", "Emergencies") */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`flex-shrink-0 px-2 py-1 text-[10px] font-bold rounded-full border transition-all cursor-pointer ${
                  selectedCategory === "all" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Tout
              </button>
              <button
                onClick={() => setSelectedCategory("hosp")}
                className={`flex-shrink-0 px-2 py-1 text-[10px] font-bold rounded-full border transition-all cursor-pointer ${
                  selectedCategory === "hosp" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Hôpitaux
              </button>
              <button
                onClick={() => setSelectedCategory("clinic")}
                className={`flex-shrink-0 px-2 py-1 text-[10px] font-bold rounded-full border transition-all cursor-pointer ${
                  selectedCategory === "clinic" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Cliniques
              </button>
              <button
                onClick={() => setSelectedCategory("emergency")}
                className={`flex-shrink-0 px-2 py-1 text-[10px] font-bold rounded-full border transition-all cursor-pointer ${
                  selectedCategory === "emergency" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Urgences / Cardio
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
              <span>{filteredHospitals.length} établissements</span>
              {locStatus === "success" && (
                <span className="text-emerald-600 flex items-center gap-1">● À proximité</span>
              )}
            </div>
          </div>

          {/* Hospital List Scrollbox */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-2 scrollbar-thin">
            {filteredHospitals.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Aucun établissement ne correspond à votre recherche.
              </div>
            ) : (
              filteredHospitals.map((hosp, index) => {
                const isSelected = selectedHospital?.id === hosp.id;
                return (
                  <button
                    key={hosp.id}
                    onClick={() => {
                      setSelectedHospital(hosp);
                      setBookingStep("browse");
                      // Switch to map view on mobile immediately when hospital clicked to see it plotted
                      if (window.innerWidth < 1024) {
                        setMobileView("map");
                      }
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs flex gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50/30 border-emerald-500 shadow-xs"
                        : "bg-white border-transparent hover:border-slate-200"
                    }`}
                  >
                    {/* Google map styled marker index */}
                    <div className="p-2 bg-emerald-50 text-emerald-700 font-mono font-bold rounded-lg h-8 w-8 flex items-center justify-center flex-shrink-0 border border-emerald-100 shadow-xs">
                      {String.fromCharCode(65 + index)}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-800 truncate block text-xs">{hosp.name}</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 flex-shrink-0 bg-emerald-50 px-1 py-0.5 rounded">
                          {hosp.distance} km
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <span className="flex items-center text-amber-500 font-bold gap-0.5">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {hosp.rating}
                        </span>
                        <span>•</span>
                        <span>{hosp.travelTime} min en voiture</span>
                      </div>

                      <p className="text-[11px] text-slate-500 truncate">{hosp.address}</p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {hosp.specialties.slice(0, 2).map((sp, idx) => (
                          <span key={idx} className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            {sp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Support Prompt footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center font-medium">
            Tarifs réglementés par la CPAM • Tiers payant disponible
          </div>
        </div>

        {/* Right Side: Visual Interactive Map & Booking Detail (8 Columns) - Hidden on mobile if list view is selected */}
        <div className={`lg:col-span-8 flex flex-col h-full overflow-hidden bg-slate-100 relative ${
          mobileView === "map" ? "flex" : "hidden lg:flex"
        }`}>
          
          {/* Google Maps Styled Canvas Viewport */}
          <div className="flex-1 relative overflow-hidden bg-[#e5e3df] min-h-[300px]">
            
            {/* SATELLITE VS ROADMAP BACKGROUND */}
            {mapType === "satellite" ? (
              <div className="absolute inset-0 bg-[#111827] opacity-95">
                {/* Simulated satellite green/blue terrain */}
                <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-950/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-900 rounded-full blur-3xl"></div>
                {/* Satellite grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)] bg-[size:50px_50px] opacity-10"></div>
              </div>
            ) : (
              // Standard Roadmap Style
              <div className="absolute inset-0 bg-[#f4f3f0]">
                {/* Major River path (La Seine style curved layout) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d="M-50,220 C200,100 400,450 900,300" 
                    fill="none" 
                    stroke="#aad3df" 
                    strokeWidth="48" 
                    strokeLinecap="round"
                  />
                  <text x="180" y="220" fill="#719cb0" className="text-[9px] font-bold font-sans tracking-widest rotate-[-15deg] uppercase">La Seine</text>
                </svg>

                {/* Parks & Forests (Green areas) */}
                <div className="absolute top-12 left-16 w-36 h-24 bg-[#d0f0c0] rounded-3xl opacity-60 flex items-center justify-center">
                  <span className="text-[8px] text-[#556b2f] font-bold uppercase tracking-wider">Jardin Médical</span>
                </div>
                <div className="absolute bottom-20 right-10 w-44 h-32 bg-[#d0f0c0] rounded-2xl opacity-60 flex items-center justify-center">
                  <span className="text-[8px] text-[#556b2f] font-bold uppercase tracking-wider">Bois de Vincennes</span>
                </div>

                {/* Road System Grid (styled street lines) */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_2px,transparent_2px),linear-gradient(to_bottom,#ffffff_2px,transparent_2px)] bg-[size:80px_80px] opacity-80"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#fef08a_1px,transparent_1px),linear-gradient(to_bottom,#fef08a_1px,transparent_1px)] bg-[size:240px_240px] opacity-40"></div>
              </div>
            )}

            {/* Public Transit/Metro layer icon indicators */}
            {mapType === "transit" && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Transit line 1 */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0,150 L800,150" fill="none" stroke="#eab308" strokeWidth="4" />
                  <path d="M120,0 L120,600" fill="none" stroke="#22c55e" strokeWidth="4" />
                </svg>
                {/* Metro markers */}
                <div className="absolute top-[140px] left-[110px] bg-sky-600 text-white font-sans text-[8px] font-extrabold rounded h-5 w-5 flex items-center justify-center shadow">M</div>
                <div className="absolute top-[140px] left-[350px] bg-sky-600 text-white font-sans text-[8px] font-extrabold rounded h-5 w-5 flex items-center justify-center shadow">M</div>
                <div className="absolute top-[400px] left-[110px] bg-sky-600 text-white font-sans text-[8px] font-extrabold rounded h-5 w-5 flex items-center justify-center shadow">M</div>
              </div>
            )}

            {/* ROUTING DIRECTIONS (Interactive Google-style active path to selected hospital) */}
            {userLocation && selectedHospital && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                
                {/* Pulsing route line from map center to selected hospital marker */}
                <path
                  d={`M ${280} ${200} 
                      Q ${280 + selectedHospital.lngOffset * 700} ${200 - selectedHospital.latOffset * 700} 
                        ${280 + selectedHospital.lngOffset * 1500} ${200 - selectedHospital.latOffset * 1500}`}
                  fill="none"
                  stroke="url(#routeGrad)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="animate-pulse"
                />
                
                {/* Dash animation indicating motion direction */}
                <path
                  d={`M ${280} ${200} 
                      Q ${280 + selectedHospital.lngOffset * 700} ${200 - selectedHospital.latOffset * 700} 
                        ${280 + selectedHospital.lngOffset * 1500} ${200 - selectedHospital.latOffset * 1500}`}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="8 6"
                />
              </svg>
            )}

            {/* USER CURRENT POSITION (Pulsing blue radar dot) */}
            <div className="absolute top-[200px] left-[280px] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
              <div className="relative flex h-8 w-8 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60"></span>
                <span className="absolute inline-flex rounded-full h-6 w-6 bg-blue-500/20 border-2 border-blue-400"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-600 border-2 border-white shadow-lg"></span>
              </div>
              <div className="text-[9px] font-bold text-blue-700 bg-white/95 px-2 py-0.5 rounded-md border border-blue-200 mt-1 uppercase font-mono shadow-md">
                Votre Position
              </div>
            </div>

            {/* HOSPITAL PLOTTED MARKERS */}
            {filteredHospitals.map((h, idx) => {
              const isSelected = selectedHospital?.id === h.id;
              
              // Plot hospital markers relative to center point [280, 200]
              const xOffset = 280 + h.lngOffset * 1500;
              const yOffset = 200 - h.latOffset * 1500;

              return (
                <div
                  key={h.id}
                  style={{ left: `${xOffset}px`, top: `${yOffset}px` }}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-fade-in"
                >
                  <button
                    onClick={() => {
                      setSelectedHospital(h);
                      setBookingStep("browse");
                    }}
                    className={`relative p-1.5 rounded-full border transition-all drop-shadow-md hover:scale-110 active:scale-95 cursor-pointer ${
                      isSelected 
                        ? "bg-emerald-600 border-white text-white scale-125 z-30" 
                        : "bg-white border-slate-300 text-slate-700 hover:border-emerald-500 hover:text-emerald-600"
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                    
                    {/* Tiny index letter inside pin */}
                    <span className="absolute -top-1 -right-1 text-[7px] font-mono font-bold bg-indigo-600 text-white h-3.5 w-3.5 rounded-full flex items-center justify-center border border-white">
                      {String.fromCharCode(65 + idx)}
                    </span>
                  </button>

                  <span className={`text-[8px] font-bold bg-white/95 text-slate-700 px-1.5 py-0.5 rounded border mt-1 shadow-sm whitespace-nowrap max-w-[120px] truncate ${
                    isSelected ? "border-emerald-500 text-emerald-700" : "border-slate-200"
                  }`}>
                    {h.name.split(" ")[0]}
                  </span>

                  {/* MINI GOOGLE MAPS POPUP WINDOW OVER SELECTED MARKER */}
                  {isSelected && (
                    <div className="absolute bottom-11 left-1/2 -translate-x-1/2 w-48 bg-white border border-slate-200 rounded-xl p-2.5 shadow-xl text-[10px] space-y-1.5 z-30 pointer-events-auto">
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-bold text-slate-800 leading-snug">{h.name}</span>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded flex items-center gap-0.5 flex-shrink-0">
                          ★ {h.rating}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[9px] leading-tight line-clamp-2">{h.address}</p>
                      <div className="flex justify-between items-center text-[9px] border-t border-slate-100 pt-1.5 font-semibold text-indigo-600">
                        <span>~{h.travelTime} min en transit</span>
                        <span>{h.fees.consultation}€</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* GOOGLE MAP CONTROLS OVERLAY (Zoom, Reset, GPS Re-center) */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
              {/* Zoom buttons */}
              <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 1, 18))}
                  className="p-2 hover:bg-slate-50 border-b border-slate-100 text-slate-600 hover:text-slate-800 cursor-pointer"
                  title="Zoom Avant"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 1, 10))}
                  className="p-2 hover:bg-slate-50 text-slate-600 hover:text-slate-800 cursor-pointer"
                  title="Zoom Arrière"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
              </div>

              {/* Geolocation Button */}
              <button
                onClick={triggerGeolocation}
                className="p-2 bg-white rounded-xl border border-slate-200 shadow-lg text-slate-600 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center cursor-pointer"
                title="Trouver ma position"
              >
                <Compass className="w-4 h-4 text-emerald-600 animate-pulse" />
              </button>

              {/* Reset view */}
              <button
                onClick={() => {
                  setZoomLevel(13);
                  setMapType("roadmap");
                }}
                className="p-2 bg-white rounded-xl border border-slate-200 shadow-lg text-slate-600 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center cursor-pointer"
                title="Réinitialiser la carte"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* MAP LAYERS CONTROLLER (Roadmap / Satellite / Transit) */}
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-lg p-1.5 flex gap-1 z-20">
              <button
                onClick={() => setMapType("roadmap")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  mapType === "roadmap" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <MapIcon className="w-3 h-3" /> Carte
              </button>
              <button
                onClick={() => setMapType("satellite")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  mapType === "satellite" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Eye className="w-3 h-3" /> Satellite
              </button>
              <button
                onClick={() => setMapType("transit")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  mapType === "transit" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Layers className="w-3 h-3" /> Transit
              </button>
            </div>

          </div>

          {/* ACTIVE ITINERARY DISPLAY ON THE MAP ROOT */}
          {selectedHospital && (
            <div className="p-3 bg-indigo-900 text-white font-mono text-[10px] flex justify-between items-center z-10 border-t border-indigo-950">
              <div className="flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-indigo-300 animate-bounce" />
                <span className="font-sans font-bold text-xs">Itinéraire :</span>
                <span className="text-indigo-200 truncate max-w-[180px] sm:max-w-none">GPS optimal → {selectedHospital.name}</span>
              </div>
              <div className="text-right text-emerald-400 font-bold whitespace-nowrap">
                {selectedHospital.travelTime} MIN
              </div>
            </div>
          )}

          {/* Booking & Hospital Detail Sheet */}
          {selectedHospital && (
            <div className="bg-white border-t border-slate-100 p-4 sm:p-5 space-y-4 max-h-[250px] overflow-y-auto scrollbar-thin">
              {bookingStep === "browse" ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-800">{selectedHospital.name}</h3>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                          ★ {selectedHospital.rating}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{selectedHospital.address}</p>
                    </div>
                    
                    <div className="bg-emerald-50 text-emerald-700 font-mono text-xs font-bold px-2.5 py-1 rounded border border-emerald-100 flex-shrink-0">
                      {selectedHospital.fees.consultation}€
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] sm:text-xs">
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="block text-[8px] sm:text-[9px] text-slate-400 uppercase">Téléphone</span>
                      <span className="font-semibold text-slate-700">{selectedHospital.phone}</span>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="block text-[8px] sm:text-[9px] text-slate-400 uppercase">Distance</span>
                      <span className="font-bold text-emerald-600 font-mono">{selectedHospital.distance} km</span>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="block text-[8px] sm:text-[9px] text-slate-400 uppercase">Temps estimé</span>
                      <span className="font-semibold text-slate-700 font-mono">~{selectedHospital.travelTime} min</span>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="block text-[8px] sm:text-[9px] text-slate-400 uppercase">CPAM</span>
                      <span className="font-semibold text-emerald-600">Secteur 1</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex flex-wrap gap-1">
                      {selectedHospital.specialties.map((sp, idx) => (
                        <span key={idx} className="text-[9px] sm:text-[10px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {sp}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => handleOpenBooking(selectedHospital)}
                      className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/15 cursor-pointer"
                    >
                      Prendre RDV <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Google Style Scheduling Card */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">Rendez-vous</span>
                      <h3 className="text-sm font-bold text-slate-800">{selectedHospital.name}</h3>
                    </div>
                    <button
                      onClick={() => setBookingStep("browse")}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-medium">
                    {/* Specialty select */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Spécialité</label>
                      <select
                        value={selectedSpecialty}
                        onChange={(e) => setSelectedSpecialty(e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/10 bg-white"
                      >
                        {selectedHospital.specialties.map((sp) => (
                          <option key={sp} value={sp}>{sp}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date picker */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/10 text-slate-700 font-sans"
                      />
                    </div>

                    {/* Time slot picker */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Heure de consultation</label>
                      <div className="grid grid-cols-3 gap-1 max-h-[85px] overflow-y-auto bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        {timeSlots.map((ts) => (
                          <button
                            key={ts}
                            type="button"
                            onClick={() => setSelectedTime(ts)}
                            className={`p-1 text-[9px] font-bold rounded font-mono text-center transition-all cursor-pointer ${
                              selectedTime === ts
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-150"
                            }`}
                          >
                            {ts}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-700">
                    <span>Total Consultation : {selectedHospital.fees.consultation}€</span>
                    <button
                      onClick={handleConfirmBooking}
                      className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20 cursor-pointer"
                    >
                      Payer & Réserver
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
