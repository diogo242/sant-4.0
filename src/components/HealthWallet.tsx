import React, { useState, useEffect } from "react";
import { UserProfile, Appointment, Block } from "../types";
import { 
  Wallet, Zap, Shield, HelpCircle, RefreshCw, Send, 
  ChevronRight, Lock, Key, CheckCircle, AlertTriangle, 
  QrCode, ArrowUpRight, ArrowDownLeft, Network, Copy, Check, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { calculateSHA256 } from "../utils/blockchain";

interface HealthWalletProps {
  profile: UserProfile;
  appointments: Appointment[];
  blocks: Block[];
  onAddBlock: (details: string, payload: any) => Promise<any>;
  simplifiedMode?: boolean;
}

interface WalletTx {
  id: string;
  type: "deposit" | "withdraw" | "medical_payment" | "emergency_received" | "smart_settlement";
  amountSats: number;
  amountEur: number;
  date: string;
  status: "Completed" | "Pending" | "Failed";
  memo: string;
  txid?: string;
  preimage?: string;
}

interface EmergencyTicket {
  id: string;
  patientName: string;
  hospitalName: string;
  specialty: string;
  targetSats: number;
  collectedSats: number;
  status: "Active" | "Fully_Funded" | "Settled_To_Hospital";
  invoiceBolt11: string;
  paymentHash: string;
  preimage: string;
  date: string;
}

export default function HealthWallet({ profile, appointments, blocks, onAddBlock, simplifiedMode = false }: HealthWalletProps) {
  // Balance in satoshis (1 EUR = ~230 Sats for simulator purposes)
  const [balanceSats, setBalanceSats] = useState<number>(345000); // Initial 345,000 Sats (~1500 EUR)
  const EUR_TO_SATS = 230;

  // LNBits & Breez static configuration info (retrieved from Master Prompt)
  const lnbitsKey = "LNURL1DP68GURN8GHJ7URJDAJZUMRWVF5HGUEWVDHK6TMVDE6HYMRS9AVXXU262EXQHJZJRX";
  const breezCertExcerpt = "MIIBgzCCATWgAwIBAgIHP1bQptq7lTAFBgMrZXAwEDEOMAwGA1UEAxMFQnJlZXowHhcNMjYw... [mTLS Activé]";

  // Copied alerts
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // View state inside wallet tab
  const [walletTab, setWalletTab] = useState<"wallet" | "emergency" | "proof">("wallet");

  // Wallet transactions history
  const [transactions, setTransactions] = useState<WalletTx[]>([
    {
      id: "tx-init-1",
      type: "deposit",
      amountSats: 400000,
      amountEur: 1739.13,
      date: "02/07/2026 à 14:30",
      status: "Completed",
      memo: "Approvisionnement initial par carte bancaire",
      txid: "8c3b9b4a...9f01"
    },
    {
      id: "tx-init-2",
      type: "medical_payment",
      amountSats: 55000,
      amountEur: 239.13,
      date: "02/07/2026 à 16:15",
      status: "Completed",
      memo: "Règlement Consultation Urgence - CHU Santé Plus",
      txid: "92fd8c3e...12a4"
    }
  ]);

  // Emergency tickets state
  const [tickets, setTickets] = useState<EmergencyTicket[]>([
    {
      id: "TKT-4891",
      patientName: `${profile.firstName} ${profile.lastName}`,
      hospitalName: "Institut Cardio-Vasculaire de l'Ouest",
      specialty: "Chirurgie Cardiaque - Pose de Stent",
      targetSats: 500000,
      collectedSats: 320000,
      status: "Active",
      invoiceBolt11: "lnbc5000u1pn...9f2b8a7d6e5c4b3a2f1",
      paymentHash: "4f7c8d9e2b1a0f3d5c6b7a89f0123456789abcde0123456789abcdef01234567",
      preimage: "8c3b9b4a1f2e3d4c5b6a7980f123456789abcdef0123456789abcdef01234567",
      date: "03/07/2026 à 08:00"
    }
  ]);

  // Funding modal input
  const [newRequestAmount, setNewRequestAmount] = useState<string>("500000");
  const [newRequestSpecialty, setNewRequestSpecialty] = useState<string>("Intervention Pédiatrique Spéciale");
  const [newRequestHospital, setNewRequestHospital] = useState<string>("Centre Médical Pédiatrique & Familial");
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);

  // Simulated Lightning Payment workflow
  const [simulatedPayingTicketId, setSimulatedPayingTicketId] = useState<string | null>(null);
  const [simulatedPayingAmount, setSimulatedPayingAmount] = useState<string>("180000");
  const [processingSimulation, setProcessingSimulation] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);

  // Medical Proof hashing tool state (Module 2)
  const [rawDossierText, setRawDossierText] = useState<string>(
    JSON.stringify({
      patient: `${profile.firstName} ${profile.lastName}`,
      bloodType: profile.bloodType || "O+",
      allergy: "Pénicilline",
      lastCheckup: "Tension 12/8 - Fréquence cardiaque stable à 72 bpm",
      verifiedBy: "Dr. Thomas Dupont",
      timestamp: new Date().toISOString()
    }, null, 2)
  );
  const [medicalProofSalt, setMedicalProofSalt] = useState<string>("92f3a8b4c7d6e50123456789abcdef01");
  const [calculatedHash, setCalculatedHash] = useState<string>("");
  const [isAnkered, setIsAnkered] = useState<boolean>(false);
  const [anchoredTxId, setAnchoredTxId] = useState<string>("");

  useEffect(() => {
    // Dynamically calculate hash
    const formatted = rawDossierText.replace(/\s+/g, ""); // canonicalize simple mock
    const hash = calculateSHA256(formatted + medicalProofSalt);
    setCalculatedHash(hash);
  }, [rawDossierText, medicalProofSalt]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const generateNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(newRequestAmount) || 100000;
    const preimageBytes = Array.from({length: 32}, () => Math.floor(Math.random() * 256));
    const preimageHex = preimageBytes.map(b => b.toString(16).padStart(2, '0')).join('');
    const paymentHashHex = calculateSHA256(preimageHex);

    const newTicket: EmergencyTicket = {
      id: "TKT-" + Math.floor(1000 + Math.random() * 9000),
      patientName: `${profile.firstName} ${profile.lastName}`,
      hospitalName: newRequestHospital,
      specialty: newRequestSpecialty,
      targetSats: amount,
      collectedSats: 0,
      status: "Active",
      invoiceBolt11: `lnbc${Math.floor(amount / 1000)}u1p${Math.random().toString(36).substr(2, 9)}...9f2b8a`,
      paymentHash: paymentHashHex,
      preimage: preimageHex,
      date: new Date().toLocaleDateString("fr-FR") + " à " + new Date().toLocaleTimeString("fr-FR", {hour: '2-digit', minute:'2-digit'})
    };

    setTickets([newTicket, ...tickets]);
    setShowCreateTicketModal(false);
    
    // Anchor request creation in the blockchain
    onAddBlock("EMERGENCY_TICKET_CREATED", {
      ticketId: newTicket.id,
      patient: newTicket.patientName,
      targetSats: newTicket.targetSats,
      paymentHash: newTicket.paymentHash
    });
  };

  // Simulates family member paying Lightning invoice (HTLC flow)
  const simulateFamilyPayment = async (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    setSimulatedPayingTicketId(ticketId);
    setProcessingSimulation(true);
    setSimulationLog([]);

    const log = (msg: string) => {
      setSimulationLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    try {
      log("Initialisation du canal Lightning...");
      await new Promise(r => setTimeout(r, 600));
      log(`Décodage de la facture BOLT11 : ${ticket.invoiceBolt11.substring(0, 20)}...`);
      log(`Paiement bloqué par Hash HTLC : ${ticket.paymentHash.substring(0, 16)}...`);
      await new Promise(r => setTimeout(r, 800));
      
      const payAmount = parseInt(simulatedPayingAmount) || 100000;
      log(`Envoi de ${payAmount.toLocaleString()} Sats par le réseau décentralisé...`);
      await new Promise(r => setTimeout(r, 900));

      // Update ticket statistics
      setTickets(prev => prev.map(t => {
        if (t.id === ticketId) {
          const nextCollected = Math.min(t.targetSats, t.collectedSats + payAmount);
          const nextStatus = nextCollected >= t.targetSats ? "Fully_Funded" : "Active";
          return {
            ...t,
            collectedSats: nextCollected,
            status: nextStatus
          };
        }
        return t;
      }));

      // Add transaction history
      const newTx: WalletTx = {
        id: "tx-sim-" + Math.random().toString(36).substr(2, 9),
        type: "emergency_received",
        amountSats: payAmount,
        amountEur: payAmount / EUR_TO_SATS,
        date: new Date().toLocaleDateString("fr-FR") + " à " + new Date().toLocaleTimeString("fr-FR", {hour: '2-digit', minute:'2-digit'}),
        status: "Completed",
        memo: `Financement d'urgence reçu - ${ticket.specialty}`
      };
      setTransactions(prev => [newTx, ...prev]);

      log(`✓ ${payAmount.toLocaleString()} Sats reçus sur le contrat d'escrow temporaire.`);
      
      const nextCollected = ticket.collectedSats + payAmount;
      if (nextCollected >= ticket.targetSats) {
        log(`⚡ Objectif atteint (100%) ! Déclenchement automatique du SMART PAYMENT.`);
        await new Promise(r => setTimeout(r, 1000));
        log(`Révélation du Secret de déverrouillage (Preimage) : S = ${ticket.preimage.substring(0, 20)}...`);
        log(`Règlement direct vers le centre médical "${ticket.hospitalName}"...`);
        await new Promise(r => setTimeout(r, 1200));

        // Mark ticket as completely settled
        setTickets(prev => prev.map(t => {
          if (t.id === ticketId) {
            return { ...t, status: "Settled_To_Hospital" };
          }
          return t;
        }));

        // Mine a block on the blockchain verifying this settlement
        await onAddBlock("SMART_PAYMENT_SETTLED", {
          ticketId: ticket.id,
          recipientHospital: ticket.hospitalName,
          amountSats: ticket.targetSats,
          preimage: ticket.preimage,
          hash: ticket.paymentHash
        });

        log(`✓ Paiement de ${ticket.targetSats.toLocaleString()} Sats réglé en direct ! Dossier scellé dans le bloc blockchain.`);
      }

    } catch (e) {
      log("Erreur lors de la simulation de règlement Lightning.");
    } finally {
      setProcessingSimulation(false);
    }
  };

  const handleAnchorRecord = async () => {
    setIsAnkered(true);
    setAnchoredTxId("08f1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f809a1b2c3d4e5f6a7b8c9d0e1f2");

    // Add block
    await onAddBlock("MEDICAL_RECORD_ADDED", {
      details: `Ancrage cryptographique du dossier médical par OP_RETURN`,
      userId: profile.email,
      payloadHash: calculatedHash,
      patientName: `${profile.firstName} ${profile.lastName}`
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in" id="health-wallet-container">
      
      {/* Tab Selectors */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setWalletTab("wallet")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            walletTab === "wallet" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Wallet className="w-4 h-4" /> 
          {simplifiedMode ? "💰 Ma Tirelire Santé" : "Portefeuille Lightning"}
        </button>
        <button
          onClick={() => setWalletTab("emergency")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer relative ${
            walletTab === "emergency" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Zap className="w-4 h-4" /> 
          {simplifiedMode ? "🚨 Entraide Familiale d'Urgence" : "Financement d'Urgence (HTLC)"}
          {tickets.some(t => t.status === "Active") && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
          )}
        </button>
        <button
          onClick={() => setWalletTab("proof")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            walletTab === "proof" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Shield className="w-4 h-4" /> 
          {simplifiedMode ? "🔒 Preuve de Sûreté du Carnet" : "Preuve Médicale (OP_RETURN)"}
        </button>
      </div>

      {walletTab === "wallet" && (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Main Wallet Card */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900 rounded-3xl text-white p-6 relative overflow-hidden border border-slate-800 shadow-xl">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-900/40 via-slate-950 to-slate-950"></div>
              
              <div className="relative space-y-6 z-10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/30">
                      <Zap className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block tracking-wider uppercase">
                        {simplifiedMode ? "COFFRE LIGHTNING SÉCURISÉ" : "NŒUD LIGHTNING BREEZ"}
                      </span>
                      <span className="text-xs font-bold text-slate-100">{profile.firstName} {profile.lastName}</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold font-mono px-2 py-0.5 rounded-full">
                    {simplifiedMode ? "SECRET" : "SOUVERAIN"}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-medium">
                    {simplifiedMode ? "Mon argent de secours mis de côté" : "Solde Épargne Santé"}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                      {balanceSats.toLocaleString()}
                    </h2>
                    <span className="text-emerald-400 font-bold text-sm">Sats</span>
                  </div>
                  <p className="text-slate-400 text-xs font-medium">
                    {simplifiedMode ? "Valeur approximative : " : "Equivalent : "}
                    <span className="text-slate-200 font-mono font-bold">{(balanceSats / EUR_TO_SATS).toFixed(2)} EUR</span>
                  </p>
                </div>

                {/* API Credentials summary */}
                <div className="border-t border-slate-800 pt-4 space-y-2 text-[10px] font-mono text-slate-400">
                  <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-850">
                    <span className="text-slate-500">LNBits Clé :</span>
                    <span className="truncate max-w-[180px] text-slate-300 font-semibold">{lnbitsKey}</span>
                    <button
                      onClick={() => handleCopy(lnbitsKey, "lnbits")}
                      className="p-1 text-slate-500 hover:text-white transition-all cursor-pointer"
                    >
                      {copiedKey === "lnbits" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-850">
                    <span className="text-slate-500">Breez Cert :</span>
                    <span className="truncate max-w-[180px] text-slate-300 font-semibold">{breezCertExcerpt}</span>
                    <button
                      onClick={() => handleCopy(breezCertExcerpt, "breez")}
                      className="p-1 text-slate-500 hover:text-white transition-all cursor-pointer"
                    >
                      {copiedKey === "breez" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <button 
                    onClick={() => setBalanceSats(prev => prev + 50000)}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/10 cursor-pointer touch-target-mobile"
                  >
                    <ArrowDownLeft className="w-4 h-4" /> 
                    {simplifiedMode ? "➕ Ajouter de l'argent" : "Déposer (Sats)"}
                  </button>
                  <button 
                    onClick={() => {
                      if (balanceSats >= 50000) setBalanceSats(prev => prev - 50000);
                    }}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer touch-target-mobile"
                  >
                    <ArrowUpRight className="w-4 h-4" /> 
                    {simplifiedMode ? "➖ Récupérer de l'argent" : "Retirer (Sats)"}
                  </button>
                </div>
              </div>
            </div>

            {/* Transaction Logs */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                Historique des Transactions
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                {transactions.map((tx) => (
                  <div key={tx.id} className="py-3 flex justify-between items-center gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl flex-shrink-0 ${
                        tx.type === "deposit" || tx.type === "emergency_received"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-indigo-50 text-indigo-600"
                      }`}>
                        {tx.type === "deposit" ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">{tx.memo}</span>
                        <span className="text-[10px] text-slate-400">{tx.date}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono font-bold block ${
                        tx.type === "deposit" || tx.type === "emergency_received" ? "text-emerald-600" : "text-slate-700"
                      }`}>
                        {tx.type === "deposit" || tx.type === "emergency_received" ? "+" : "-"}
                        {tx.amountSats.toLocaleString()} Sats
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {(tx.amountEur).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Wallet Guide */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-slate-400" /> Sécurisation Lightning
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Le portefeuille utilise l'API <strong>LNBits</strong> pour la distribution instantanée des factures BOLT11, combiné avec le certificat client mTLS de <strong>Breez SDK</strong> qui gère la liquidité hors chaîne sur le réseau Liquid/Greenlight de manière non-dépositaire.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-[11px] text-slate-600">
                <p className="font-bold text-slate-700">Avantages du modèle :</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Zéro Frais</strong> pour les micro-règlements internes.</li>
                  <li><strong>Zéro Délai</strong> de validation du paiement.</li>
                  <li>Souveraineté totale du patient sur son épargne médicale.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {walletTab === "emergency" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">Financement d'Urgence (HTLC Lightning)</h3>
              <p className="text-xs text-slate-500 max-w-xl">
                Si un patient manque de fonds pour un acte urgent ou une chirurgie, un ticket d'aide sociale est ouvert. La famille peut approvisionner directement la facture. Les fonds restent bloqués par un Hash cryptographique (HTLC) et sont libérés directement à la clinique uniquement en échange de la Preimage (Secret médical).
              </p>
            </div>
            <button
              onClick={() => setShowCreateTicketModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap self-start sm:self-center touch-target-mobile"
            >
              {simplifiedMode ? "🚨 Lancer un Appel d'Aide" : "Nouveau Ticket d'Urgence"}
            </button>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Active Tickets List */}
            <div className="lg:col-span-7 space-y-4">
              {tickets.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-xs">
                  Aucun ticket de financement d'urgence actif actuellement.
                </div>
              ) : (
                tickets.map((ticket) => {
                  const percent = Math.round((ticket.collectedSats / ticket.targetSats) * 100);
                  return (
                    <div key={ticket.id} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <span className="text-[10px] font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {ticket.id}
                          </span>
                          <h4 className="text-sm font-bold text-slate-800 mt-1.5">{ticket.specialty}</h4>
                          <span className="text-xs text-slate-400 font-medium">{ticket.hospitalName}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          ticket.status === "Settled_To_Hospital"
                            ? "bg-emerald-100 text-emerald-700"
                            : ticket.status === "Fully_Funded"
                            ? "bg-indigo-100 text-indigo-700 animate-pulse"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {ticket.status === "Settled_To_Hospital" 
                            ? (simplifiedMode ? "✓ Payé directement à l'Hôpital" : "✓ Réglé à la Clinique") 
                            : ticket.status === "Fully_Funded" 
                            ? (simplifiedMode ? "Collecte Réussie !" : "Objectif Atteint") 
                            : (simplifiedMode ? "En attente d'aide de la famille" : "En cours de collecte")}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-500">
                            {simplifiedMode ? "Argent réuni" : "Montant collecté"}
                          </span>
                          <span className="text-slate-800">{percent}% ({ticket.collectedSats.toLocaleString()} / {ticket.targetSats.toLocaleString()} Sats)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Payment HTLC Specs */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 text-[10px] font-mono text-slate-600">
                        <div className="flex justify-between">
                          <span>{simplifiedMode ? "Lien de paiement (BOLT11) :" : "Facture Lightning :"}</span>
                          <span className="font-bold text-slate-800 text-right truncate max-w-[200px]">{ticket.invoiceBolt11}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Hash du Paiement (H) :</span>
                          <span className="font-bold text-slate-800 text-right truncate max-w-[200px]">{ticket.paymentHash}</span>
                        </div>
                        {ticket.status === "Settled_To_Hospital" && (
                          <div className="flex justify-between border-t border-slate-200/50 pt-1.5 text-emerald-600 font-bold">
                            <span>Preimage révélée (S) :</span>
                            <span className="truncate max-w-[200px]">{ticket.preimage}</span>
                          </div>
                        )}
                      </div>

                      {/* Control buttons */}
                      {ticket.status !== "Settled_To_Hospital" && (
                        <div className="flex gap-2.5 pt-1">
                          <button
                            disabled={processingSimulation}
                            onClick={() => {
                              setSimulatedPayingAmount((ticket.targetSats - ticket.collectedSats).toString());
                              simulateFamilyPayment(ticket.id);
                            }}
                            className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-850 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                          >
                            <QrCode className="w-3.5 h-3.5 text-amber-400" /> Simuler règlement de la famille
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Lightning Simulator Log Viewport */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-950 text-slate-300 rounded-2xl border border-slate-850 p-5 space-y-4 font-mono text-xs shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CONSOLE LIGHTNING HTLC</span>
                  <div className="flex items-center gap-1 text-[10px] text-amber-500">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                    SIMULATION EN DIRECT
                  </div>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin text-[11px] leading-relaxed">
                  {simulationLog.length === 0 ? (
                    <span className="text-slate-500 italic">En attente d'un événement de règlement Lightning... Cliquez sur le bouton "Simuler règlement" à gauche.</span>
                  ) : (
                    simulationLog.map((logStr, idx) => (
                      <div key={idx} className="whitespace-pre-wrap">{logStr}</div>
                    ))
                  )}
                </div>

                {processingSimulation && (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 animate-pulse pt-2 border-t border-slate-900">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Traitement cryptographique en cours...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {walletTab === "proof" && (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Module 2: Medical Proof Input & Hashing */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Formattage & Hachage du Dossier Patient (Module 2)</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Chaque document de santé est canonicalisé (selon la norme RFC 8785) puis combiné avec un sel de sécurité de 32 octets avant d'être hashé en SHA-256. L'empreinte finale garantit l'immutabilité du dossier médical.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">JSON du Dossier Médical</label>
                  <textarea
                    rows={6}
                    value={rawDossierText}
                    onChange={(e) => setRawDossierText(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 bg-slate-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sel Aléatoire de 32 octets (Salt)</label>
                    <input
                      type="text"
                      value={medicalProofSalt}
                      onChange={(e) => setMedicalProofSalt(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Générateur</label>
                    <button
                      onClick={() => {
                        const randomBytes = Array.from({length: 16}, () => Math.floor(Math.random() * 256));
                        setMedicalProofSalt(randomBytes.map(b => b.toString(16).padStart(2, '0')).join(''));
                      }}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-all cursor-pointer border border-slate-150"
                    >
                      Régénérer le Sel
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 font-mono text-[11px] text-slate-700">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Empreinte Digitale Finale (Hash SHA-256)</span>
                  <div className="break-all font-bold text-emerald-600">{calculatedHash}</div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    disabled={isAnkered}
                    onClick={handleAnchorRecord}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/10 cursor-pointer disabled:opacity-40"
                  >
                    <Network className="w-4 h-4" /> {isAnkered ? "✓ Dossier Ancré" : "Ancrer sur la Blockchain"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Module 2 Blockchain Proof Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">État d'Ancrage Blockchain</h4>
              {isAnkered ? (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-3 text-xs text-emerald-700 font-medium">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                    <div>
                      <p className="font-bold">Ancrage Bitcoin OP_RETURN réussi</p>
                      <p className="text-[11px] text-emerald-600 mt-1">L'empreinte cryptographique de ce dossier a été scellée de manière permanente.</p>
                    </div>
                  </div>

                  <div className="font-mono text-[10px] space-y-1.5 text-slate-500 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <span className="block uppercase text-[8px] font-bold text-slate-400">Bitcoin TxID (OP_RETURN)</span>
                      <span className="break-all text-slate-800 font-bold">{anchoredTxId}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 py-10 space-y-3">
                  <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto animate-bounce" />
                  <p>Ce dossier médical n'est pas encore ancré sur la blockchain.</p>
                  <p className="text-[10px] text-slate-400">Modifiez le contenu à gauche ou cliquez sur Ancrer pour lancer la transaction OP_RETURN.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {showCreateTicketModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-100">
                  Nouveau Ticket de Financement d'Urgence
                </h3>

                <form onSubmit={generateNewRequest} className="space-y-4 mt-4 text-xs font-medium">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Spécialité Médicale / Acte urgent</label>
                    <input
                      type="text"
                      required
                      value={newRequestSpecialty}
                      onChange={(e) => setNewRequestSpecialty(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Établissement de Santé Destinataire</label>
                    <select
                      value={newRequestHospital}
                      onChange={(e) => setNewRequestHospital(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 bg-white"
                    >
                      <option value="Centre Hospitalier Universitaire (CHU) Santé Plus">CHU Santé Plus</option>
                      <option value="Clinique de l'Espérance">Clinique de l'Espérance</option>
                      <option value="Institut Cardio-Vasculaire de l'Ouest">Institut Cardio-Vasculaire de l'Ouest</option>
                      <option value="Hôpital Privé Saint-Jean">Hôpital Privé Saint-Jean</option>
                      <option value="Centre Médical Pédiatrique & Familial">Centre Médical Pédiatrique & Familial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Montant requis (Satoshis)</label>
                    <input
                      type="number"
                      required
                      value={newRequestAmount}
                      onChange={(e) => setNewRequestAmount(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 font-mono"
                    />
                    <span className="block text-[10px] text-slate-400 mt-1 font-sans">
                      Equivalent : ~{(parseInt(newRequestAmount) / EUR_TO_SATS || 0).toFixed(2)} EUR (1 EUR = 230 Sats)
                    </span>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowCreateTicketModal(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                    >
                      Créer le Ticket d'Urgence
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
