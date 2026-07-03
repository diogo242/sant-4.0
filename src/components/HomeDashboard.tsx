import React from "react";
import { UserProfile, Block, ChatMessage } from "../types";
import { 
  Heart, 
  Smile, 
  Compass, 
  MessageSquare, 
  Bot, 
  FileText, 
  Wallet, 
  Map, 
  ArrowRight, 
  Sparkles, 
  UserCheck,
  Building2
} from "lucide-react";
import { motion } from "motion/react";

interface HomeDashboardProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onLogin: (profile: UserProfile, preLoadRecordsType?: "empty" | "cardio" | "pediatric" | "nata") => void;
  blocks: Block[];
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setActiveTab: (tab: "dossier" | "hospitals" | "blockchain" | "chat" | "profile" | "home" | "wallet") => void;
  onOpenChat: () => void;
  simplifiedMode?: boolean;
}

export default function HomeDashboard({
  profile,
  onLogin,
  blocks,
  chatHistory,
  setChatHistory,
  setActiveTab,
  onOpenChat,
  simplifiedMode = true,
}: HomeDashboardProps) {

  // Auto configure preloaded profile for demo if they click one of the quick starts
  const handleQuickOnboard = (type: "cardio" | "pediatric" | "nata") => {
    let preloadedProfile: UserProfile = {
      firstName: "Nata",
      lastName: "Diallo",
      email: "nata.diallo@santeplus.org",
      phone: "+221 77 123 45 67",
      birthDate: "1994-11-20",
      bloodType: "O+",
      publicKey: "0x89D2B7E1F2A3B4C5D6E7F809A1B2C3D4E5F6A7B8",
      hasAccount: true,
    };

    if (type === "cardio") {
      preloadedProfile = {
        firstName: "Thomas",
        lastName: "Dupont",
        email: "thomas.dupont@gmail.com",
        phone: "+221 70 894 51 22",
        birthDate: "1968-04-12",
        bloodType: "A-",
        publicKey: "0x7F9B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B",
        hasAccount: true,
      };
    } else if (type === "pediatric") {
      preloadedProfile = {
        firstName: "Sophie",
        lastName: "Laurent",
        email: "sophie.laurent@yahoo.fr",
        phone: "+221 76 789 01 23",
        birthDate: "1988-09-05",
        bloodType: "B+",
        publicKey: "0x4A5B6C7D8E9F0A1B2C3D4E5F6A7B8C9D0E1F2A3B",
        hasAccount: true,
      };
    }

    onLogin(preloadedProfile, type);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-4 py-4" id="home-dashboard-container">
      {/* Welcoming Greeting Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 to-teal-950 text-white p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-10"></div>
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl"></div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl"></div>

        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs font-bold text-emerald-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Votre Carnet de Santé Secret & Familial
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            {profile.hasAccount ? (
              <>Ravi de vous revoir, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-emerald-300">{profile.firstName}</span> 👋</>
            ) : (
              <>Votre Santé, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-emerald-300">Votre Secret</span></>
            )}
          </h1>

          <p className="text-slate-200 text-sm leading-relaxed max-w-2xl">
            {profile.hasAccount 
              ? "Toutes vos ordonnances et comptes-rendus médicaux sont en sécurité ici, cryptés dans votre appareil. Personne ne peut y accéder à votre insu."
              : "Santé Plus est un carnet de santé numérique ultra-sécurisé et très simple d'utilisation pour toute la famille. Vos documents ne sont jamais envoyés en clair sur internet."}
          </p>

          <div className="pt-2 flex flex-wrap gap-4 items-center">
            {profile.hasAccount ? (
              <button
                onClick={() => setActiveTab("dossier")}
                className="px-5 py-3 bg-amber-400 text-slate-950 font-black text-xs rounded-xl hover:bg-amber-500 transition-all shadow-md shadow-amber-400/20 flex items-center gap-1.5 cursor-pointer touch-target-mobile"
              >
                Ouvrir mon Carnet Secret <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            ) : (
              <button
                onClick={() => setActiveTab("profile")}
                className="px-5 py-3 bg-amber-400 text-slate-950 font-black text-xs rounded-xl hover:bg-amber-500 transition-all shadow-md shadow-amber-400/20 flex items-center gap-1.5 cursor-pointer touch-target-mobile"
              >
                Créer mon Profil Sécurisé <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            )}

            {!profile.hasAccount && (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-slate-300 text-xs font-semibold">Exemples prêts à l'emploi :</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleQuickOnboard("nata")}
                    className="px-3 py-1.5 bg-slate-850 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 transition-all cursor-pointer"
                  >
                    👵 Maman Nata
                  </button>
                  <button
                    onClick={() => handleQuickOnboard("cardio")}
                    className="px-3 py-1.5 bg-slate-850 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 transition-all cursor-pointer"
                  >
                    👴 Papa Thomas
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Welcoming Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Medical Dossier */}
        <div 
          onClick={() => {
            if (profile.hasAccount) {
              setActiveTab("dossier");
            } else {
              setActiveTab("profile");
            }
          }}
          className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-850">Dossier Médical Sécurisé</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Retrouvez vos ordonnances, vos comptes-rendus et vos certificats. Gravés de manière authentique à chaque traitement à l'hôpital.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Y accéder <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        {/* Card 2: Wallet & Solidarity */}
        <div 
          onClick={() => {
            if (profile.hasAccount) {
              setActiveTab("wallet");
            } else {
              setActiveTab("profile");
            }
          }}
          className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:border-amber-500/20 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-850">Entraide & Tirelire Santé</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Mettez de l'argent de côté pour vos frais de santé. Votre famille ou vos enfants à l'étranger peuvent vous aider à régler l'hôpital instantanément.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Gérer mes fonds <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        {/* Card 3: Find Hospital Map */}
        <div 
          onClick={() => {
            if (profile.hasAccount) {
              setActiveTab("hospitals");
            } else {
              setActiveTab("profile");
            }
          }}
          className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:border-teal-500/20 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-850">Prendre Rendez-vous</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Trouvez les cliniques et hôpitaux partenaires proches de chez vous sur la carte interactive. Prenez rendez-vous en un clic.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-teal-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Voir la carte <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* AI Assistant Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl border border-slate-800 p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-[10px] font-black text-emerald-300">
            <Bot className="w-3 h-3" />
            CONSEILLER IA SANTÉ PLUS
          </div>
          <h2 className="text-lg font-bold">Une ordonnance compliquée ? Des questions sur vos soins ?</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Notre conseiller intelligent vous aide à lire et comprendre vos documents médicaux ou vous explique le fonctionnement de Santé Plus dans des mots simples et clairs de tous les jours.
          </p>
        </div>
        <button
          onClick={onOpenChat}
          className="w-full md:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/45 cursor-pointer touch-target-mobile"
        >
          <MessageSquare className="w-4 h-4" />
          Discuter avec l'IA
        </button>
      </div>
    </div>
  );
}
