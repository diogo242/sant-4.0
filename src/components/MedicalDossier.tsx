import React, { useState, useRef } from "react";
import { MedicalRecord, UserProfile } from "../types";
import { Shield, Lock, Unlock, Upload, FileText, Plus, Check, Loader2, Award, Calendar, ChevronRight, AlertTriangle, ShieldAlert, Building, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { encryptData, calculateSHA256 } from "../utils/blockchain";

interface MedicalDossierProps {
  profile: UserProfile;
  records: MedicalRecord[];
  setRecords: React.Dispatch<React.SetStateAction<MedicalRecord[]>>;
  onMineRecord: (record: Omit<MedicalRecord, "blockIndex" | "blockHash">) => Promise<{ index: number; hash: string }>;
  simplifiedMode?: boolean;
}

export default function MedicalDossier({ profile, records, setRecords, onMineRecord, simplifiedMode = false }: MedicalDossierProps) {
  const [accessMode, setAccessMode] = useState<"patient" | "hospital">("patient");
  const [showAccessDeniedAlert, setShowAccessDeniedAlert] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<MedicalRecord["category"]>("Consultation");
  const [doctor, setDoctor] = useState("");
  const [hospital, setHospital] = useState("");
  const [details, setDetails] = useState("");
  const [files, setFiles] = useState<{ name: string; size: string; type: string }[]>([]);
  const [dragActive, setDragActive] = useState(false);
  
  // Decryption state for individual card viewing
  const [decryptedRecordId, setDecryptedRecordId] = useState<string | null>(null);

  // Mining / Encryption progress states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      addFiles(e.target.files);
    }
  };

  const addFiles = (fileList: FileList) => {
    const arr = [];
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      arr.push({
        name: f.name,
        size: (f.size / 1024).toFixed(1) + " KB",
        type: f.type || "application/octet-stream",
      });
    }
    setFiles([...files, ...arr]);
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !doctor || !hospital) return;

    setIsProcessing(true);
    
    try {
      // Step 1: Encrypting the payload
      setProcessingStep("Chiffrement local des données médicales (AES-256)...");
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 2: Hashing payload
      setProcessingStep("Calcul de l'empreinte SHA-256 du dossier...");
      await new Promise(resolve => setTimeout(resolve, 600));

      const mockPayload = `${title}-${category}-${doctor}-${details}-${JSON.stringify(files)}`;
      const payloadHash = calculateSHA256(mockPayload);

      // Step 3: Blockchain Mining
      setProcessingStep("Ancrage sur la blockchain (Calcul du Bloc de Santé)...");
      
      const unsavedRecord: Omit<MedicalRecord, "blockIndex" | "blockHash"> = {
        id: "rec-" + Math.random().toString(36).substr(2, 9),
        title,
        category,
        doctor,
        hospital,
        date: new Date().toLocaleDateString("fr-FR"),
        details,
        attachments: files,
        isEncrypted: true,
      };

      // Call parent blockchain mining routine
      const { index, hash } = await onMineRecord(unsavedRecord);

      // Step 4: Finished and Save
      const savedRecord: MedicalRecord = {
        ...unsavedRecord,
        blockIndex: index,
        blockHash: hash,
      };

      setRecords(prev => [savedRecord, ...prev]);
      
      // Reset form
      setTitle("");
      setDoctor("");
      setHospital("");
      setDetails("");
      setFiles([]);
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  const handleOpenAddForm = () => {
    if (accessMode === "patient") {
      setShowAccessDeniedAlert(true);
    } else {
      setShowAddForm(true);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-5xl mx-auto p-2" id="medical-dossier-section">
      {/* Contrôle d'accès au Registre */}
      <div className="mb-6 bg-slate-900 text-slate-200 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-indigo-400 font-mono block tracking-wider uppercase font-bold">
              {simplifiedMode ? "🔒 CONTRÔLE DE SÉCURITÉ" : "PASSERELLE DE SÉCURITÉ MÉDICALE"}
            </span>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          </div>
          <p className="text-xs font-semibold text-slate-300 mt-0.5">
            {simplifiedMode 
              ? "Qui remplit votre dossier ? Seul l'hôpital ou votre médecin y est autorisé." 
              : "Signature requise : Seul l'établissement hospitalier peut ajouter des dossiers de santé."}
          </p>
        </div>

        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-full md:w-auto">
          <button
            onClick={() => {
              setAccessMode("patient");
              setShowAddForm(false);
            }}
            className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              accessMode === "patient" 
                ? "bg-slate-800 text-white shadow-xs" 
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            {simplifiedMode ? "Mode Patient (Lecture)" : "Patient Souverain (Lecture)"}
          </button>
          <button
            onClick={() => setAccessMode("hospital")}
            className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              accessMode === "hospital" 
                ? "bg-emerald-600 text-white shadow-xs" 
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Building className="w-3.5 h-3.5 text-emerald-300" />
            {simplifiedMode ? "Mode Hôpital (Saisie)" : "Praticien Hospitalier (Écriture)"}
          </button>
        </div>
      </div>

      {/* Alerte de sécurité d'accès non autorisé */}
      <AnimatePresence>
        {showAccessDeniedAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-slate-800"
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-amber-950">
                  {simplifiedMode ? "🛑 Seul l'Hôpital peut ajouter de nouvelles informations !" : "Accès Refusé : Signature Professionnelle Requise"}
                </h4>
                <p className="text-amber-800/90 leading-relaxed">
                  {simplifiedMode 
                    ? "Pour garantir l'authenticité absolue de votre carnet, vous ne pouvez pas inscrire vous-même de nouveaux rapports médicaux. Seuls les hôpitaux ou votre médecin y sont autorisés. Votre dossier de traitement augmente automatiquement à chaque consultation payée sur la carte des hôpitaux !" 
                    : "L'inscription directe par le patient sur le registre décentralisé est verrouillée pour prévenir toute auto-déclaration non validée. Votre dossier médical augmente automatiquement lors de chaque consultation médicale validée auprès des hôpitaux partenaires."}
                </p>
                <div className="pt-2.5 flex gap-3">
                  <button
                    onClick={() => {
                      setAccessMode("hospital");
                      setShowAccessDeniedAlert(false);
                      setShowAddForm(true);
                    }}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all cursor-pointer text-xs"
                  >
                    {simplifiedMode ? "Basculer en Mode Hôpital (Simuler)" : "Basculer en Mode Praticien"}
                  </button>
                  <button
                    onClick={() => setShowAccessDeniedAlert(false)}
                    className="px-3.5 py-1.5 border border-amber-600/30 hover:bg-amber-500/5 text-amber-700 font-bold rounded-xl transition-all cursor-pointer text-xs"
                  >
                    {simplifiedMode ? "J'ai compris" : "Fermer l'alerte"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            📂 {simplifiedMode ? "Mon Carnet de Santé Sécurisé" : "Dossier Médical Sécurisé"}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {simplifiedMode 
              ? "Gérez vos ordonnances et certificats sous clé blockchain incassable."
              : "Visualisez vos ordonnances, rapports cliniques et documents médicaux scellés."
            }
          </p>
        </div>

        <button
          onClick={handleOpenAddForm}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-xs hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-2 shadow-md shadow-emerald-600/10 active:scale-[0.98] cursor-pointer touch-target-mobile"
        >
          <Plus className="w-4 h-4" /> 
          {simplifiedMode ? "Ajouter un Document" : "Ajouter une Fiche (Hôpital)"}
        </button>
      </div>

      {/* Adding/Mining Modal */}
      <AnimatePresence>
        {isProcessing && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 text-slate-100 max-w-md w-full rounded-2xl p-6 shadow-2xl text-center space-y-4"
            >
              <div className="relative w-16 h-16 mx-auto">
                <Loader2 className="w-16 h-16 text-emerald-500 animate-spin absolute inset-0" />
                <Shield className="w-8 h-8 text-teal-400 absolute top-4 left-4" />
              </div>
              <h3 className="text-lg font-bold font-sans">Sécurisation en Cours</h3>
              <p className="text-sm text-slate-400 font-medium px-4">{processingStep}</p>
              
              <div className="pt-2">
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full animate-pulse w-full"></div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create document Form (sliding panel or card) */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-xl p-6 mb-8"
        >
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" /> Sécuriser un nouveau document médical
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600 text-sm font-medium"
            >
              Annuler
            </button>
          </div>

          <form onSubmit={handleAddRecord} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Titre du document</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Électrocardiogramme - ECG de contrôle"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Catégorie</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as MedicalRecord["category"])}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-white"
                    >
                      {["Consultation", "Ordonnance", "Analyse", "Imagerie", "Vaccin"].map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Médecin Référent</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Dr. Martin"
                      value={doctor}
                      onChange={(e) => setDoctor(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Établissement / Hôpital</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: CHU Santé Plus"
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notes de consultation / détails</label>
                  <textarea
                    rows={3}
                    placeholder="Saisissez ici les observations, diagnostics ou traitements..."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                  />
                </div>
              </div>

              {/* Drag and drop file section */}
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Fichiers Joint (Simulé)</label>
                
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center h-[200px] ${
                    dragActive
                      ? "border-emerald-500 bg-emerald-50/20"
                      : "border-slate-200 hover:border-emerald-400 hover:bg-slate-50/50"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                  />
                  <Upload className="w-10 h-10 text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Glissez-déposez vos fichiers ici</p>
                  <p className="text-xs text-slate-400 mt-1">Formats acceptés : PDF, PNG, JPG (Max 10Mo)</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-3 bg-emerald-50 px-2 py-0.5 rounded-full">Ou parcourir sur votre appareil</p>
                </div>

                {/* List of files selected */}
                {files.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-3 max-h-[120px] overflow-y-auto space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Fichiers sélectionnés</p>
                    {files.map((f, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="font-medium text-slate-700 truncate">{f.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono flex-shrink-0 ml-2">{f.size}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-600/10 active:scale-[0.98] cursor-pointer"
              >
                {simplifiedMode ? "🔒 Cadenasser & Enregistrer mon Dossier" : "Chiffrer & Sceller sur la Blockchain"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Records Listing */}
      {records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center max-w-lg mx-auto">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">Aucun document sécurisé</h3>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            Votre dossier médical sécurisé est vide. Utilisez le bouton ci-dessus pour ajouter des documents et les sceller sur la blockchain de Santé Plus.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {records.map((rec) => {
            const isDecrypted = decryptedRecordId === rec.id;
            const encryptedText = encryptData(rec.details);

            return (
              <motion.div
                key={rec.id}
                layout
                className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Header card info */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 bg-slate-50/40">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg text-white font-semibold flex-shrink-0 ${
                      rec.category === "Consultation" ? "bg-indigo-600" :
                      rec.category === "Ordonnance" ? "bg-emerald-600" :
                      rec.category === "Analyse" ? "bg-amber-600" :
                      rec.category === "Imagerie" ? "bg-rose-600" : "bg-teal-600"
                    }`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{rec.category}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Le {rec.date}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-800 mt-1">{rec.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Émis par <span className="font-semibold text-slate-700">{rec.doctor}</span> • {rec.hospital}
                      </p>
                    </div>
                  </div>

                  {/* Blockchain badge */}
                  <div className="flex flex-col items-start md:items-end gap-1.5 flex-shrink-0">
                    <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      <Shield className="w-3.5 h-3.5" />
                      {simplifiedMode ? "Sceau de Vérité" : "Scellé"} • Bloc #{rec.blockIndex}
                    </div>
                    {rec.blockHash && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded max-w-[180px] truncate" title={rec.blockHash}>
                        {simplifiedMode ? "Preuve" : "Hash"}: {rec.blockHash.substring(0, 16)}...
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-4">
                  {/* Encrypted view block */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 relative">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        {isDecrypted ? <Unlock className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-indigo-500" />}
                        {simplifiedMode 
                          ? `Document ${isDecrypted ? "ouvert et lisible" : "cadenassé et secret"}` 
                          : `Contenu de la fiche ${isDecrypted ? "Déchiffrée" : "Chiffrée localement (AES-256)"}`
                        }
                      </span>

                      <button
                        onClick={() => setDecryptedRecordId(isDecrypted ? null : rec.id)}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                          isDecrypted 
                            ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
                            : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                        }`}
                      >
                        {isDecrypted ? (
                          <>{simplifiedMode ? "🔒 Refermer" : "Masquer le contenu"}</>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3" />
                            {simplifiedMode ? "🔑 Ouvrir le Cadenas" : "Déchiffrer"}
                          </>
                        )}
                      </button>
                    </div>

                    {isDecrypted ? (
                      <div className="text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                        {rec.details || "Aucune note complémentaire."}
                      </div>
                    ) : (
                      <div className="font-mono text-xs text-indigo-700 leading-relaxed bg-indigo-50/30 p-2 rounded overflow-x-auto select-none">
                        {encryptedText.substring(0, 200)}...
                      </div>
                    )}
                  </div>

                  {/* Attachment items (if any) */}
                  {rec.attachments && rec.attachments.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        {simplifiedMode ? "Pièces jointes certifiées conformes" : "Fichiers Sécurisés Scellés"}
                      </span>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {rec.attachments.map((file, fIdx) => (
                          <div key={fIdx} className="flex justify-between items-center border border-slate-100 bg-slate-50/50 p-2.5 rounded-lg text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              <span className="font-medium text-slate-700 truncate">{file.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-mono">{file.size}</span>
                              <div className="p-1 bg-emerald-50 text-emerald-600 rounded" title="Authenticité Blockchain Validée">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
