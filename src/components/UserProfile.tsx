import React, { useState } from "react";
import { UserProfile } from "../types";
import { generateBitcoinKeys } from "../utils/blockchain";
import { Key, Shield, User, Mail, Calendar, Droplets, Phone, Copy, Check, FileText } from "lucide-react";
import { motion } from "motion/react";

interface UserProfileProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onLogin: (profile: UserProfile, preLoadRecordsType?: "empty" | "cardio" | "pediatric" | "nata") => void;
  simplifiedMode?: boolean;
}

export default function PatientProfile({ profile, setProfile, onLogin, simplifiedMode = false }: UserProfileProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+229");
  const [birthDate, setBirthDate] = useState("");
  const [bloodType, setBloodType] = useState("A+");
  const [copied, setCopied] = useState(false);
  const [privateKey, setPrivateKey] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) return;

    const keys = generateBitcoinKeys();
    setPrivateKey(keys.privateKey);

    const newProfile: UserProfile = {
      firstName,
      lastName,
      email,
      phone: phone || "+229 97 00 00 00",
      birthDate: birthDate || "1990-01-01",
      bloodType,
      publicKey: keys.publicKey,
      hasAccount: true,
    };

    setProfile(newProfile);
    onLogin(newProfile, "empty");
  };

  const handleLoadDemo = (type: "cardio" | "pediatric" | "nata") => {
    const keys = generateBitcoinKeys();
    setPrivateKey(keys.privateKey);

    let demoProfile: UserProfile = {
      firstName: "",
      lastName: "",
      email: "",
      phone: "+229 97 88 77 66",
      birthDate: "1985-05-12",
      bloodType: "O+",
      publicKey: keys.publicKey,
      hasAccount: true,
    };

    if (type === "cardio") {
      demoProfile.firstName = "Thomas";
      demoProfile.lastName = "Dupont";
      demoProfile.email = "thomas.dupont@gmail.com";
      demoProfile.bloodType = "B-";
      demoProfile.birthDate = "1968-09-24";
    } else if (type === "pediatric") {
      demoProfile.firstName = "Sophie";
      demoProfile.lastName = "Martin";
      demoProfile.email = "sophie.martin@gmail.com";
      demoProfile.bloodType = "AB+";
      demoProfile.birthDate = "2018-04-03";
    } else {
      demoProfile.firstName = "Nata";
      demoProfile.lastName = "Diallo";
      demoProfile.email = "nata.diallo@gmail.com";
      demoProfile.bloodType = "O+";
      demoProfile.birthDate = "1994-11-18";
    }

    setProfile(demoProfile);
    onLogin(demoProfile, type);
  };

  const copyPublicKey = () => {
    navigator.clipboard.writeText(profile.publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-2" id="user-profile-section">
      {!profile.hasAccount ? (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden grid md:grid-cols-12">
          {/* Side panel description */}
          <div className={`md:col-span-5 bg-gradient-to-br ${
            simplifiedMode 
              ? "from-emerald-700 via-teal-800 to-emerald-950" 
              : "from-emerald-600 to-teal-800"
          } text-white p-8 flex flex-col justify-between`}>
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-8 h-8 text-emerald-300" />
                <span className="font-sans font-bold text-xl tracking-tight">Santé Plus</span>
              </div>
              <h2 className="text-2xl font-sans font-bold mb-4 tracking-tight leading-snug">
                {simplifiedMode ? "Votre Carnet de Santé Simple & Secret" : "Votre dossier médical sécurisé par la Blockchain"}
              </h2>
              <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed mb-6">
                {simplifiedMode 
                  ? "Créez votre fiche d'identité. Vos papiers et ordonnances médicales seront mis à l'abri dans votre téléphone avec un cadenas numérique magique impossible à casser."
                  : "Créez votre compte patient souverain. Vos dossiers médicaux seront hachés et scellés de manière cryptographique sur un registre inspiré du protocole Bitcoin."
                }
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-700/50 rounded-lg text-emerald-200 mt-1">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">
                      {simplifiedMode ? "Cadenas Secret" : "Chiffrement AES Intégral"}
                    </h4>
                    <p className="text-xs text-emerald-200">
                      {simplifiedMode ? "Seul votre téléphone détient la clé secrète." : "Seul votre compte détient la clé de déchiffrement."}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-700/50 rounded-lg text-emerald-200 mt-1">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">
                      {simplifiedMode ? "Sceau de Confiance" : "Preuve d'Intégrité Immuable"}
                    </h4>
                    <p className="text-xs text-emerald-200">
                      {simplifiedMode ? "Vos dossiers sont marqués pour prouver qu'ils sont vrais." : "Audit et traçabilité inviolables via SHA-256 blockchain."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-emerald-700/50 text-xs text-emerald-200 flex items-center gap-1">
              <span>{simplifiedMode ? "Réseau d'entraide actif" : "Réseau Santé Plus Actif - Nœuds: 14"}</span>
            </div>
          </div>

          {/* Creation form / Demo quick access */}
          <div className="md:col-span-7 p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Initialiser votre Profil</h3>
            
            <form onSubmit={handleRegister} className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Prénom</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Jean"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nom</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Dupont"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Adresse Gmail / Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="jean.dupont@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="+33 6 12 34 56 78"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Groupe Sanguin</label>
                  <div className="relative">
                    <Droplets className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <select
                      value={bloodType}
                      onChange={(e) => setBloodType(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-white"
                    >
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bt) => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Date de Naissance</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium text-sm rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-600/10 active:scale-[0.99] cursor-pointer"
              >
                Générer mon dossier sécurisé
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-slate-400 font-medium">Ou présenter avec un profil démo</span></div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleLoadDemo("cardio")}
                className="flex flex-col items-center p-3 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/20 transition-all text-center cursor-pointer"
              >
                <Shield className="w-5 h-5 text-indigo-500 mb-1" />
                <span className="text-xs font-semibold text-slate-700">Thomas Dupont</span>
                <span className="text-[10px] text-slate-400">Dossier Cardio</span>
              </button>
              <button
                onClick={() => handleLoadDemo("pediatric")}
                className="flex flex-col items-center p-3 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/20 transition-all text-center cursor-pointer"
              >
                <Shield className="w-5 h-5 text-orange-500 mb-1" />
                <span className="text-xs font-semibold text-slate-700">Sophie Martin</span>
                <span className="text-[10px] text-slate-400">Pédiatrie</span>
              </button>
              <button
                onClick={() => handleLoadDemo("nata")}
                className="flex flex-col items-center p-3 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/20 transition-all text-center cursor-pointer"
              >
                <Shield className="w-5 h-5 text-emerald-500 mb-1" />
                <span className="text-xs font-semibold text-slate-700">Nata Diallo</span>
                <span className="text-[10px] text-slate-400">Général</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">Compte Patient Actif</span>
              <h2 className="text-2xl font-bold font-sans text-slate-800 mt-2">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-slate-500 text-sm mt-1">{profile.email}</p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setProfile({ ...profile, hasAccount: false })}
                className="px-3 py-1.5 border border-slate-200 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Changer de Compte
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Informations Personnelles</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="block text-xs text-slate-400">Téléphone</span>
                  <span className="text-sm font-semibold text-slate-700">{profile.phone}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="block text-xs text-slate-400">Groupe Sanguin</span>
                  <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                    <Droplets className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                    {profile.bloodType}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="block text-xs text-slate-400">Date de Naissance</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {new Date(profile.birthDate).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="block text-xs text-slate-400">Nœud du Réseau</span>
                  <span className="text-sm font-semibold text-indigo-600">SPlus-Node-74</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                {simplifiedMode ? "🔒 Vos Cadenas de Protection" : "Identifiants de Sécurité"}
              </h3>
              
              <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs space-y-3 relative overflow-hidden">
                <div className="absolute right-[-10px] top-[-10px] opacity-10">
                  <Shield className="w-24 h-24 text-emerald-500" />
                </div>
                
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">
                    {simplifiedMode ? "Adresse Publique (Votre numéro de carnet)" : "Clé Publique (Adresse Blockchain)"}
                  </span>
                  <div className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800 mt-1">
                    <span className="text-emerald-400 truncate mr-2">{profile.publicKey}</span>
                    <button 
                      onClick={copyPublicKey}
                      className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-all cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-sans">
                    {simplifiedMode ? "Niveau de sécurité de votre carnet" : "Statut Cryptographique"}
                  </span>
                  <div className="flex items-center gap-2 text-emerald-400 font-sans font-semibold mt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    {simplifiedMode ? "🔐 Cadenas Ultra-Secret Activé" : "Chiffrement AES-256 actif & Vérifié"}
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-sans">
                    {simplifiedMode ? "Votre Clé de Coffre Privée" : "Clé de Déchiffrement Privée"}
                  </span>
                  <div className="text-amber-400 font-sans mt-1">
                    {simplifiedMode ? "🔑 Cachée et gardée dans votre téléphone" : "Détenue localement (Masquée par sécurité)"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
