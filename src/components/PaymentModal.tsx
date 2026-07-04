import React, { useState } from "react";
import { Appointment, Block } from "../types";
import { Shield, CreditCard, Landmark, Check, Loader2, ArrowRight, ShieldCheck, Printer, Calendar, Clock, Zap, Copy, QrCode, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { calculateSHA256 } from "../utils/blockchain";
import { generateMockPaymentIntent, detectWebLN, sendViaWebLN, formatSats } from "../utils/bitcoinPayment";

interface PaymentModalProps {
  appointment: Omit<Appointment, "id" | "status" | "isPaid"> | null;
  onClose: () => void;
  onPaymentSuccess: (appointment: Appointment) => void;
}

export default function PaymentModal({ appointment, onClose, onPaymentSuccess }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bitcoin" | "apple">("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const [paymentStep, setPaymentStep] = useState<"review" | "processing" | "receipt">("review");
  const [transactionId, setTransactionId] = useState("");
  const [receiptHash, setReceiptHash] = useState("");

  // Bitcoin flow state
  const [btcStatus, setBtcStatus] = useState<"select" | "creating" | "awaiting" | "success" | "error">("select");
  const [btcIntent, setBtcIntent] = useState<any>(null);
  const [btcError, setBtcError] = useState("");
  const [btcCopied, setBtcCopied] = useState(false);
  const [btcMethod, setBtcMethod] = useState<"lightning" | "onchain">("lightning");

  if (!appointment) return null;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStep("processing");

    // Realistic processing timeouts
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const txId = "tx-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const hashData = `${txId}-${appointment.hospitalName}-${appointment.fees}-${appointment.patientName}`;
    const hash = calculateSHA256(hashData);

    setTransactionId(txId);
    setReceiptHash(hash);
    setPaymentStep("receipt");
  };

  const handleFinalize = () => {
    const finalAppointment: Appointment = {
      id: "apt-" + Math.random().toString(36).substr(2, 9),
      hospitalId: appointment.hospitalId,
      hospitalName: appointment.hospitalName,
      specialty: appointment.specialty,
      date: appointment.date,
      time: appointment.time,
      fees: appointment.fees,
      isPaid: true,
      status: "Confirmed",
      patientName: appointment.patientName,
    };

    onPaymentSuccess(finalAppointment);
  };

  const completeBtcPayment = (preimage?: string) => {
    setBtcStatus("success");
    const final: Appointment = {
      id: "apt-" + Math.random().toString(36).substr(2, 9),
      hospitalId: appointment.hospitalId,
      hospitalName: appointment.hospitalName,
      specialty: appointment.specialty,
      date: appointment.date,
      time: appointment.time,
      fees: appointment.fees,
      isPaid: true,
      status: "Confirmed",
      patientName: appointment.patientName,
    };
    setTimeout(() => onPaymentSuccess(final), 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden"
      >
        {paymentStep === "review" && (
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" /> Règlement de Consultation
            </h3>

            <div className="my-4 p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
              <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Récapitulatif de votre rendez-vous</p>
              <div className="flex justify-between items-center text-slate-700 text-sm font-semibold">
                <span>{appointment.hospitalName}</span>
                <span className="font-bold text-emerald-600">{appointment.fees}€</span>
              </div>
              <p className="text-slate-500 font-medium">{appointment.specialty}</p>
              <div className="flex gap-4 text-[11px] text-slate-400 font-bold pt-1.5 border-t border-slate-200/50">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {appointment.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> à {appointment.time}</span>
              </div>
            </div>

            {/* Selector methods */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={() => setPaymentMethod("card")}
                className={`py-2 px-1 rounded-lg border text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
                  paymentMethod === "card" ? "border-emerald-500 bg-emerald-50/20 text-emerald-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                CB / Visa
              </button>
              <button
                onClick={() => setPaymentMethod("bitcoin")}
                className={`py-2 px-1 rounded-lg border text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
                  paymentMethod === "bitcoin" ? "border-emerald-500 bg-emerald-50/20 text-emerald-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Shield className="w-4 h-4" />
                Bitcoin
              </button>
              <button
                onClick={() => setPaymentMethod("apple")}
                className={`py-2 px-1 rounded-lg border text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
                  paymentMethod === "apple" ? "border-emerald-500 bg-emerald-50/20 text-emerald-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Landmark className="w-4 h-4" />
                Apple Pay
              </button>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              {paymentMethod === "card" ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nom du titulaire</label>
                    <input
                      type="text"
                      required
                      placeholder="Jean Dupont"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Numéro de carte</label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      placeholder="4970 1234 5678 9012"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expiration</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        placeholder="MM/AA"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Code CVC</label>
                      <input
                        type="password"
                        required
                        maxLength={3}
                        placeholder="123"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 font-mono text-center"
                      />
                    </div>
                  </div>
                </div>
              ) : paymentMethod === "bitcoin" ? (
                <div>
                  {btcStatus === "select" && (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between text-slate-700 font-semibold">
                          <span>Montant</span>
                          <span className="text-emerald-600 font-bold">{appointment.fees}EUR</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Satoshis</span>
                          <span className="font-mono">{formatSats(Math.round(appointment.fees * 230))}</span>
                        </div>
                      </div>
                      <button onClick={async () => {
                        setBtcStatus("creating");
                        const result = generateMockPaymentIntent({
                          appointmentId: `apt-${Date.now()}`,
                          hospitalName: appointment.hospitalName,
                          specialty: appointment.specialty,
                          amountEur: appointment.fees,
                          method: btcMethod,
                          patientName: appointment.patientName,
                        });
                        setBtcIntent({ ...result, status: "pending", createdAt: new Date().toISOString() });
                        setBtcStatus("awaiting");
                      }} className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-bold rounded-xl cursor-pointer">
                        Générer le paiement Bitcoin
                      </button>
                    </div>
                  )}

                  {btcStatus === "awaiting" && btcIntent && (
                    <div className="space-y-4">
                      <div className="p-3 bg-amber-50 rounded-lg flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-700">En attente de paiement</span>
                        <span className="text-xs font-mono text-amber-600">{formatSats(btcIntent.amountSats)}</span>
                      </div>

                      {btcIntent.bolt11 && (
                        <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">QR Code Lightning</p>
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(btcIntent.bolt11)}`}
                            alt="QR Lightning"
                            className="w-full max-w-[220px] mx-auto rounded-lg border border-slate-200 bg-white p-2"
                          />
                          <p className="text-[10px] text-slate-500 break-all font-mono">{btcIntent.bolt11}</p>
                          <button onClick={() => { navigator.clipboard.writeText(btcIntent.bolt11); setBtcCopied(true); setTimeout(() => setBtcCopied(false), 2000); }} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            {btcCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {btcCopied ? "Copié !" : "Copier l'invoice"}
                          </button>
                        </div>
                      )}

                      {btcIntent.address && (
                        <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">QR Code On-chain</p>
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`bitcoin:${btcIntent.address}?amount=${(btcIntent.amountSats / 100_000_000).toFixed(8)}`)}`}
                            alt="QR BTC"
                            className="w-full max-w-[220px] mx-auto rounded-lg border border-slate-200 bg-white p-2"
                          />
                          <p className="text-xs font-mono break-all">{btcIntent.address}</p>
                          <p className="text-[10px] text-slate-500">Envoyez {(btcIntent.amountSats / 100_000_000).toFixed(8)} BTC</p>
                        </div>
                      )}
                    </div>
                  )}

                  {btcStatus === "success" && (
                    <div className="p-6 text-center">
                      <Shield className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                      <p className="font-bold">Paiement Bitcoin Validé</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                  <Landmark className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Confirmer le paiement rapide via Apple Pay</p>
                  <p className="text-[10px] text-slate-400 mt-1">Transaction sécurisée par empreinte biométrique</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-600/10 active:scale-[0.98] cursor-pointer"
                >
                  Régler {appointment.fees}.00€
                </button>
              </div>
            </form>
          </div>
        )}

        {paymentStep === "processing" && (
          <div className="p-8 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Validation Bancaire & Cryptographique...</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Nous vérifions vos identifiants bancaires et ancrons l'autorisation de consultation dans le registre blockchain décentralisé.
            </p>
          </div>
        )}

        {paymentStep === "receipt" && (
          <div className="p-6">
            <div className="flex flex-col items-center text-center space-y-2 pb-4 mb-4 border-b border-slate-100">
              <div className="p-2 bg-emerald-50 rounded-full text-emerald-600">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Paiement Validé & Sécurisé</h3>
              <p className="text-xs text-slate-400">Le reçu numérique a été généré et ancré avec succès.</p>
            </div>

            {/* Visual printable receipt */}
            <div className="border border-slate-150 rounded-xl p-4 font-mono text-xs bg-slate-50/50 space-y-3">
              <div className="flex justify-between font-sans font-bold border-b border-slate-200 pb-2 text-slate-700">
                <span>REÇU OFFICIEL</span>
                <span className="text-emerald-600">SANTÉ PLUS</span>
              </div>

              <div className="space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Patient :</span>
                  <span className="font-bold text-slate-800 font-sans">{appointment.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Établissement :</span>
                  <span className="font-bold text-slate-800 font-sans">{appointment.hospitalName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Spécialité :</span>
                  <span className="font-bold text-slate-800 font-sans">{appointment.specialty}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Heure :</span>
                  <span className="font-bold text-slate-800 font-sans">{appointment.date} à {appointment.time}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/50 pt-1.5 text-sm font-bold text-slate-800">
                  <span>Montant Payé :</span>
                  <span className="font-mono text-emerald-600">{appointment.fees}.00€</span>
                </div>
              </div>

              <div className="pt-3 border-t border-dashed border-slate-200 text-[10px] space-y-2 text-slate-400">
                <div>
                  <span className="block uppercase text-[8px] font-bold">Transaction ID</span>
                  <span className="text-indigo-600">{transactionId}</span>
                </div>
                <div>
                  <span className="block uppercase text-[8px] font-bold">Hash du Reçu (Blockchain)</span>
                  <span className="break-all">{receiptHash}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-5">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimer
              </button>
              <button
                onClick={handleFinalize}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
              >
                Terminer
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
