import React, { useState } from "react";
import { AccessAuthorization } from "../types";
import { Shield, Check, X, Clock, User, Stethoscope } from "lucide-react";
import { motion } from "motion/react";

interface AuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGrant: (auth: Omit<AccessAuthorization, "id" | "grantedAt" | "accessLog" | "status">) => void;
  patientName: string;
}

export default function AuthorizationModal({ isOpen, onClose, onGrant, patientName }: AuthorizationModalProps) {
  const [providerName, setProviderName] = useState("");
  const [providerSpecialty, setProviderSpecialty] = useState("");
  const [providerHospital, setProviderHospital] = useState("");
  const [duration, setDuration] = useState("24h");
  const [permissions, setPermissions] = useState({
    canRead: true,
    canWrite: false,
    canAddRecords: true,
    canViewPaymentHistory: false,
  });

  if (!isOpen) return null;

  const handleGrant = () => {
    const expiresAt = new Date();
    if (duration === "1h") expiresAt.setHours(expiresAt.getHours() + 1);
    else if (duration === "24h") expiresAt.setHours(expiresAt.getHours() + 24);
    else if (duration === "7d") expiresAt.setDate(expiresAt.getDate() + 7);
    else if (duration === "30d") expiresAt.setDate(expiresAt.getDate() + 30);

    onGrant({
      patientId: patientName,
      providerId: `provider-${Date.now()}`,
      providerName,
      providerSpecialty,
      providerHospital,
      expiresAt: expiresAt.toISOString(),
      permissions,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-full text-emerald-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Autorisation d'accès</h3>
            <p className="text-xs text-slate-400">Patient : {patientName}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Nom du médecin</label>
            <input
              type="text"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              placeholder="Dr. Jean Dupont"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Spécialité</label>
            <input
              type="text"
              value={providerSpecialty}
              onChange={(e) => setProviderSpecialty(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              placeholder="Cardiologie"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Hôpital</label>
            <input
              type="text"
              value={providerHospital}
              onChange={(e) => setProviderHospital(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              placeholder="CHU de Cotonou"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Durée d'accès</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="1h">1 heure</option>
              <option value="24h">24 heures</option>
              <option value="7d">7 jours</option>
              <option value="30d">30 jours</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600">Permissions</label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={permissions.canRead}
                onChange={(e) => setPermissions({ ...permissions, canRead: e.target.checked })}
                className="rounded"
              />
              <span>Lire le dossier</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={permissions.canWrite}
                onChange={(e) => setPermissions({ ...permissions, canWrite: e.target.checked })}
                className="rounded"
              />
              <span>Modifier les données</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={permissions.canAddRecords}
                onChange={(e) => setPermissions({ ...permissions, canAddRecords: e.target.checked })}
                className="rounded"
              />
              <span>Ajouter des documents</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={permissions.canViewPaymentHistory}
                onChange={(e) => setPermissions({ ...permissions, canViewPaymentHistory: e.target.checked })}
                className="rounded"
              />
              <span>Voir l'historique des paiements</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={handleGrant}
            className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold rounded-lg hover:from-emerald-700 hover:to-teal-700 cursor-pointer"
          >
            Autoriser
          </button>
        </div>
      </motion.div>
    </div>
  );
}
