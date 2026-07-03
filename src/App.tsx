import React, { useState, useEffect } from "react";
import PatientProfile from "./components/UserProfile";
import MedicalDossier from "./components/MedicalDossier";
import BlockchainVisualizer from "./components/BlockchainVisualizer";
import HospitalMap from "./components/HospitalMap";
import AssistantChat from "./components/AssistantChat";
import PaymentModal from "./components/PaymentModal";
import HomeDashboard from "./components/HomeDashboard";
import HealthWallet from "./components/HealthWallet";

import { UserProfile, MedicalRecord, Block, Appointment, ChatMessage } from "./types";
import { createGenesisBlock, mineBlock, calculateSHA256 } from "./utils/blockchain";
import { Shield, Activity, FileText, Map, User, Bot, Calendar, Landmark, CheckCircle2, Menu, X, Clock, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthDate: "",
    bloodType: "",
    publicKey: "",
    hasAccount: false,
  });

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);
  
  // Navigation & Layout states
  const [activeTab, setActiveTab] = useState<"home" | "dossier" | "hospitals" | "blockchain" | "chat" | "profile" | "wallet">("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [simplifiedMode, setSimplifiedMode] = useState(true);
  const [activePayment, setActivePayment] = useState<Omit<Appointment, "id" | "status" | "isPaid"> | null>(null);

  // Initialize blockchain ledger with genesis block
  useEffect(() => {
    setBlocks([createGenesisBlock()]);
  }, []);

  // Set tab automatically on registration/login
  const handleOnLogin = (
    newProfile: UserProfile,
    preLoadRecordsType?: "empty" | "cardio" | "pediatric" | "nata"
  ) => {
    setActiveTab("home");

    // Re-initialize ledger to genesis block upon login/profile change
    const genesis = createGenesisBlock();
    let currentBlocks = [genesis];

    if (preLoadRecordsType === "empty" || !preLoadRecordsType) {
      setRecords([]);
      setAppointments([]);
      setBlocks(currentBlocks);
      return;
    }

    // Generate pre-populated files to show a rich demo for pitch presentations
    let demoRecords: MedicalRecord[] = [];
    let demoTxs: Block["transactions"][] = [];

    if (preLoadRecordsType === "cardio") {
      // Cardiology template
      demoRecords = [
        {
          id: "rec-cardio-1",
          title: "Électrocardiogramme de contrôle - Rythme Sinusal",
          category: "Analyse",
          doctor: "Dr. Thomas Dupont",
          hospital: "Institut Cardio-Vasculaire de l'Ouest",
          date: "24/06/2026",
          details: "ECG normal de repos. Fréquence cardiaque moyenne à 72 bpm. Pas de trouble de la repolarisation ni de l'activation sinusal. Tension artérielle 12/8.",
          attachments: [{ name: "ECG_Repos_24062026.pdf", size: "3.2 MB", type: "application/pdf" }],
          isEncrypted: true,
          blockIndex: 1,
          blockHash: "", // Will calculate below
        },
        {
          id: "rec-cardio-2",
          title: "Ordonnance Bêtabloquants - Traitement d'entretien",
          category: "Ordonnance",
          doctor: "Dr. Thomas Dupont",
          hospital: "Institut Cardio-Vasculaire de l'Ouest",
          date: "24/06/2026",
          details: "Prescription d'Aténolol 50mg (1 comprimé le matin) pour régulation tensionnelle. Durée: 6 mois.",
          attachments: [{ name: "Ordonnance_Atenolol.pdf", size: "1.1 MB", type: "application/pdf" }],
          isEncrypted: true,
          blockIndex: 2,
          blockHash: "",
        },
      ];
    } else if (preLoadRecordsType === "pediatric") {
      // Pediatric template
      demoRecords = [
        {
          id: "rec-pedia-1",
          title: "Bilan pédiatrique des 6 ans & Certificat d'aptitude",
          category: "Consultation",
          doctor: "Dr. Hélène Martin",
          hospital: "Centre Médical Pédiatrique & Familial",
          date: "12/05/2026",
          details: "Examen clinique normal. Croissance staturo-pondérale harmonieuse (courbes à jour). Développement psychomoteur adapté. Aptitude aux activités physiques scolaires.",
          attachments: [{ name: "Certificat_Aptitude_Sport.pdf", size: "850 KB", type: "application/pdf" }],
          isEncrypted: true,
          blockIndex: 1,
          blockHash: "",
        },
        {
          id: "rec-pedia-2",
          title: "Carnet de Vaccination - Rappel ROR",
          category: "Vaccin",
          doctor: "Dr. Hélène Martin",
          hospital: "Centre Médical Pédiatrique & Familial",
          date: "12/05/2026",
          details: "Vaccination ROR (Rougeole-Oreillons-Rubéole) effectuée ce jour. Tolérance immédiate excellente.",
          attachments: [],
          isEncrypted: true,
          blockIndex: 2,
          blockHash: "",
        },
      ];
    } else if (preLoadRecordsType === "nata") {
      // Nata Diallo's template (General)
      demoRecords = [
        {
          id: "rec-nata-1",
          title: "Bilan d'Analyse Sanguine Complet",
          category: "Analyse",
          doctor: "Dr. Marc Vasseur",
          hospital: "Centre Hospitalier Universitaire (CHU) Santé Plus",
          date: "18/02/2026",
          details: "Bilan lipidique, NFS et glycémie à jeun dans les valeurs de référence. Légère carence en vitamine D suggérant une supplémentation.",
          attachments: [{ name: "Bilan_Sanguin_18022026.pdf", size: "4.5 MB", type: "application/pdf" }],
          isEncrypted: true,
          blockIndex: 1,
          blockHash: "",
        },
        {
          id: "rec-nata-2",
          title: "Ordonnance Kinésithérapie - Séance de rééducation",
          category: "Ordonnance",
          doctor: "Dr. Marc Vasseur",
          hospital: "Centre Hospitalier Universitaire (CHU) Santé Plus",
          date: "18/02/2026",
          details: "Rééducation fonctionnelle du rachis lombaire. 10 séances préconisées suite à de légères tensions.",
          attachments: [],
          isEncrypted: true,
          blockIndex: 2,
          blockHash: "",
        },
      ];
    }

    // Sequentially anchor prepopulated demo files as separate blocks in the ledger
    demoRecords.forEach((rec, index) => {
      const idx = index + 1;
      const prevHash = currentBlocks[idx - 1].hash;
      const mockPayload = `${rec.title}-${rec.category}-${rec.doctor}-${rec.details}`;
      const payloadHash = calculateSHA256(mockPayload);

      const blockTx: Block["transactions"] = [
        {
          type: "MEDICAL_RECORD_ADDED",
          details: `Dossier de santé '${rec.title}' scellé pour ${newProfile.firstName} ${newProfile.lastName}`,
          userId: newProfile.email,
          patientName: `${newProfile.firstName} ${newProfile.lastName}`,
          payloadHash,
        },
      ];

      // Quick offline hashing to avoid async delay on onboarding load
      const blockHash = calculateSHA256(idx + "2026-06-01T12:00:00" + prevHash + JSON.stringify(blockTx) + "42");
      
      const newBlock: Block = {
        index: idx,
        timestamp: "02/07/2026 à 10:15",
        previousHash: prevHash,
        hash: blockHash,
        nonce: 1042 + idx * 23,
        transactions: blockTx,
      };

      currentBlocks.push(newBlock);
      rec.blockHash = blockHash;
    });

    setRecords(demoRecords);
    setBlocks(currentBlocks);
    setAppointments([]);
  };

  // Global Blockchain Mining function triggered by child elements
  const handleMineNewRecordBlock = async (
    record: Omit<MedicalRecord, "blockIndex" | "blockHash">
  ): Promise<{ index: number; hash: string }> => {
    const lastBlock = blocks[blocks.length - 1];
    const newIndex = blocks.length;

    const mockPayload = `${record.title}-${record.category}-${record.doctor}-${record.details}`;
    const payloadHash = calculateSHA256(mockPayload);

    const transaction: Block["transactions"][0] = {
      type: "MEDICAL_RECORD_ADDED",
      details: `Ajout du document médical '${record.title}' par le ${record.doctor}`,
      userId: profile.email,
      patientName: `${profile.firstName} ${profile.lastName}`,
      payloadHash,
    };

    // Trigger mining calculation
    const minedBlock = await mineBlock(newIndex, lastBlock.hash, [transaction], 3);

    // Update state
    setBlocks((prev) => [...prev, minedBlock]);

    return {
      index: minedBlock.index,
      hash: minedBlock.hash,
    };
  };

  // Payment completed successfully, mine block to seal transaction in ledger
  const handlePaymentSuccess = async (newApt: Appointment) => {
    setActivePayment(null);
    setAppointments((prev) => [newApt, ...prev]);

    // Go to dossier tab to view booked appointment status
    setActiveTab("dossier");

    // Mine transaction on blockchain ledger
    const lastBlock = blocks[blocks.length - 1];
    const newIndex = blocks.length;
    const payloadHash = calculateSHA256(JSON.stringify(newApt));

    const transaction: Block["transactions"][0] = {
      type: "PAYMENT_COMPLETED",
      details: `Paiement et Confirmation de rendez-vous en ${newApt.specialty} chez ${newApt.hospitalName} - Montant: ${newApt.fees}€`,
      userId: profile.email,
      patientName: newApt.patientName,
      payloadHash,
    };

    const minedBlock = await mineBlock(newIndex, lastBlock.hash, [transaction], 3);
    setBlocks((prev) => [...prev, minedBlock]);

    // Auto-generate detailed treatment medical record added directly by the hospital
    let detailsText = `Traitement médical de spécialité (${newApt.specialty}) administré avec succès suite au règlement sécurisé.`;
    let docName = "Dr. Martin (Chef de Clinique)";
    let recordCategory: MedicalRecord["category"] = "Consultation";
    
    const specialtyLower = newApt.specialty.toLowerCase();
    if (specialtyLower.includes("cardio")) {
      docName = "Dr. Thomas Dupont";
      recordCategory = "Analyse";
      detailsText = "Examen cardiologique complet. Rythme sinusal régulier de repos. Tension artérielle stabilisée à 120/80 mmHg. ECG numérique enregistré et scellé sur la blockchain. Ordonnance de suivi active.";
    } else if (specialtyLower.includes("pédia") || specialtyLower.includes("enfant")) {
      docName = "Dr. Hélène Martin";
      recordCategory = "Consultation";
      detailsText = "Bilan de santé pédiatrique général. Courbe de croissance normale. Réflexes et examen pulmonaire excellents. Recommandation d'entretien préventif à jour.";
    } else if (specialtyLower.includes("dent")) {
      docName = "Dr. Sophie Bernard";
      recordCategory = "Consultation";
      detailsText = "Contrôle bucco-dentaire périodique complet. Détartrage prophylactique effectué. Absence de carie active détectée lors de l'exploration optique.";
    } else if (specialtyLower.includes("général") || specialtyLower.includes("famille")) {
      docName = "Dr. Jean-Pierre";
      recordCategory = "Consultation";
      detailsText = "Consultation clinique de médecine générale. Paramètres vitaux normaux (tension 12/8). Prescription de soins de suivi adaptée chiffrée sur le registre.";
    } else if (specialtyLower.includes("urg")) {
      docName = "Médecin Urgentiste de Garde";
      recordCategory = "Consultation";
      detailsText = "Soin urgent de premier secours. Traitement immédiat administré et consigné par l'équipe hospitalière de garde. Suivi post-crise recommandé.";
    }

    const newRecordId = "rec-treatment-" + Math.random().toString(36).substr(2, 9);
    const treatmentRecord: MedicalRecord = {
      id: newRecordId,
      title: `Rapport de Traitement : ${newApt.specialty}`,
      category: recordCategory,
      doctor: docName,
      hospital: newApt.hospitalName,
      date: newApt.date,
      details: detailsText,
      attachments: [
        { name: `Rapport_Hospitalier_${newRecordId.substring(14)}.pdf`, size: "1.4 MB", type: "application/pdf" }
      ],
      isEncrypted: true,
      blockIndex: minedBlock.index,
      blockHash: minedBlock.hash,
    };

    setRecords((prev) => [treatmentRecord, ...prev]);
  };

  // Dynamic block generator for custom actions (like emergency funding and smart contracts)
  const handleAddBlockToLedger = async (type: string, payload: any): Promise<Block> => {
    const lastBlock = blocks[blocks.length - 1];
    const newIndex = blocks.length;
    const payloadHash = calculateSHA256(JSON.stringify(payload));

    const transaction: Block["transactions"][0] = {
      type: type as any,
      details: type === "EMERGENCY_TICKET_CREATED" 
        ? `Création d'un ticket de financement d'urgence #${payload.ticketId} - Cible : ${payload.targetSats} Sats`
        : `Règlement Smart Contract d'urgence #${payload.ticketId} - Validé vers la clinique`,
      userId: profile.email || "anonymous",
      patientName: `${profile.firstName} ${profile.lastName}`,
      payloadHash,
    };

    const minedBlock = await mineBlock(newIndex, lastBlock.hash, [transaction], 3);
    setBlocks((prev) => [...prev, minedBlock]);
    return minedBlock;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col antialiased">
      {/* Top Banner Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-50 rounded"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600 rounded-xl text-white">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-sans font-bold text-xl tracking-tight text-slate-800">Santé Plus</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 hidden sm:inline-block">
              Blockchain Active
            </span>
          </div>
        </div>

        {/* Clean Security Indicator */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="font-bold text-emerald-800">Sécurisé</span>
          </div>
        </div>
      </header>

      {/* Main split viewport layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Drawer Navigation (Sidebar) */}
        <aside className={`bg-slate-900 text-slate-300 w-[240px] flex-shrink-0 flex flex-col justify-between p-4 border-r border-slate-800 absolute md:static inset-y-0 left-0 z-30 transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          <div className="space-y-6">
            <div className="px-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Navigation Principale</span>
            </div>

            <nav className="space-y-1.5">
              <button
                onClick={() => {
                  setActiveTab("home");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "home"
                    ? "bg-emerald-600 text-white"
                    : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Landmark className="w-4 h-4" />
                Accueil & Chatbot
              </button>

              <button
                disabled={!profile.hasAccount}
                onClick={() => {
                  setActiveTab("dossier");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  !profile.hasAccount 
                    ? "opacity-40 cursor-not-allowed text-slate-600" 
                    : activeTab === "dossier"
                    ? "bg-emerald-600 text-white"
                    : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-4 h-4" />
                Mon Dossier Personnel
              </button>

              <button
                disabled={!profile.hasAccount}
                onClick={() => {
                  setActiveTab("wallet");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  !profile.hasAccount 
                    ? "opacity-40 cursor-not-allowed text-slate-600" 
                    : activeTab === "wallet"
                    ? "bg-emerald-600 text-white"
                    : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Wallet className="w-4 h-4" />
                Portefeuille & Secours
              </button>

              <button
                disabled={!profile.hasAccount}
                onClick={() => {
                  setActiveTab("hospitals");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  !profile.hasAccount 
                    ? "opacity-40 cursor-not-allowed text-slate-600" 
                    : activeTab === "hospitals"
                    ? "bg-emerald-600 text-white"
                    : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Map className="w-4 h-4" />
                Carte des Hôpitaux
              </button>

              <button
                disabled={!profile.hasAccount}
                onClick={() => {
                  setActiveTab("blockchain");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  !profile.hasAccount 
                    ? "opacity-40 cursor-not-allowed text-slate-600" 
                    : activeTab === "blockchain"
                    ? "bg-emerald-600 text-white"
                    : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Activity className="w-4 h-4" />
                Registre Blockchain
              </button>

              <button
                disabled={!profile.hasAccount}
                onClick={() => {
                  setActiveTab("chat");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  !profile.hasAccount 
                    ? "opacity-40 cursor-not-allowed text-slate-600" 
                    : activeTab === "chat"
                    ? "bg-emerald-600 text-white"
                    : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Bot className="w-4 h-4" />
                Assistant Santé IA
              </button>

              <div className="border-t border-slate-800/80 my-3"></div>

              <button
                onClick={() => {
                  setActiveTab("profile");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "profile"
                    ? "bg-emerald-600 text-white"
                    : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <User className="w-4 h-4" />
                Profil & Identifiants
              </button>
            </nav>
          </div>

          {profile.hasAccount ? (
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
              <span className="block text-[9px] text-slate-500 uppercase tracking-wider font-bold">Patient Souverain</span>
              <p className="text-slate-200 font-semibold truncate mt-1">
                {profile.firstName} {profile.lastName}
              </p>
              <span className="block text-[8px] text-emerald-500 font-mono mt-1 font-bold">AES-256 SÉCURISÉ</span>
            </div>
          ) : (
            <div className="p-3.5 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
              Veuillez configurer votre profil
            </div>
          )}
        </aside>

        {/* Overlay for mobile drawer */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-20 md:hidden"
          ></div>
        )}

        {/* Center active viewport */}
        <main className="flex-1 p-6 overflow-y-auto scrollbar-thin">
          {/* Active Consultation Bookings notification bar */}
          {appointments.length > 0 && activeTab === "dossier" && (
            <div className="max-w-5xl mx-auto p-4 mb-6 bg-indigo-50 border border-indigo-150 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-xl text-white flex-shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Prochain Rendez-vous Confirmé (Réglé)
                  </h4>
                  <p className="text-xs text-indigo-700 font-medium">
                    {appointments[0].hospitalName} • {appointments[0].specialty} • Le {appointments[0].date} à {appointments[0].time}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-100 font-bold text-xs px-2.5 py-1 rounded-full flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Facture & RDV scellés
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {activeTab === "home" && (
                <HomeDashboard
                  profile={profile}
                  setProfile={setProfile}
                  onLogin={handleOnLogin}
                  blocks={blocks}
                  chatHistory={chatHistory}
                  setChatHistory={setChatHistory}
                  setActiveTab={setActiveTab}
                  onOpenChat={() => setIsFloatingChatOpen(true)}
                  simplifiedMode={simplifiedMode}
                />
              )}
              {activeTab === "profile" && (
                <PatientProfile 
                  profile={profile} 
                  setProfile={setProfile} 
                  onLogin={handleOnLogin} 
                  simplifiedMode={simplifiedMode}
                />
              )}
              {activeTab === "dossier" && (
                <MedicalDossier
                  profile={profile}
                  records={records}
                  setRecords={setRecords}
                  onMineRecord={handleMineNewRecordBlock}
                  simplifiedMode={simplifiedMode}
                />
              )}
              {activeTab === "hospitals" && (
                <HospitalMap profile={profile} onInitiatePayment={setActivePayment} />
              )}
              {activeTab === "wallet" && (
                <HealthWallet
                  profile={profile}
                  appointments={appointments}
                  blocks={blocks}
                  onAddBlock={handleAddBlockToLedger}
                  simplifiedMode={simplifiedMode}
                />
              )}
              {activeTab === "blockchain" && (
                <BlockchainVisualizer blocks={blocks} simplifiedMode={simplifiedMode} />
              )}
              {activeTab === "chat" && (
                <AssistantChat chatHistory={chatHistory} setChatHistory={setChatHistory} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Interactive Payment overlay */}
      <AnimatePresence>
        {activePayment && (
          <PaymentModal
            appointment={activePayment}
            onClose={() => setActivePayment(null)}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </AnimatePresence>

      {/* Floating Chic AI Assistant Trigger & Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3" id="floating-ai-assistant">
        <AnimatePresence>
          {isFloatingChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-[360px] sm:w-[420px] max-w-[calc(100vw-2rem)] shadow-2xl rounded-3xl overflow-hidden"
            >
              <AssistantChat 
                chatHistory={chatHistory} 
                setChatHistory={setChatHistory} 
                isFloating={true} 
                onClose={() => setIsFloatingChatOpen(false)} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsFloatingChatOpen(!isFloatingChatOpen)}
          className="relative flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-full shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer border border-emerald-500/20"
        >
          <Bot className="w-5 h-5 text-emerald-100 animate-pulse" />
          <span className="text-xs font-bold">Besoin d'aide ?</span>
          {!isFloatingChatOpen && chatHistory.length === 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white animate-ping"></span>
          )}
        </motion.button>
      </div>
    </div>
  );
}
