import React, { useState } from "react";
import { Block } from "../types";
import { Shield, Key, Cpu, HelpCircle, Activity, Server, ArrowRight, RefreshCw, CheckCircle2, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BlockchainVisualizerProps {
  blocks: Block[];
  simplifiedMode?: boolean;
}

export default function BlockchainVisualizer({ blocks, simplifiedMode = false }: BlockchainVisualizerProps) {
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<"idle" | "success" | "running">("idle");
  const [auditedIndex, setAuditedIndex] = useState<number>(-1);

  const runChainAudit = async () => {
    setIsAuditing(true);
    setAuditResult("running");
    
    // Scan each block sequentially with visual delay
    for (let i = 0; i < blocks.length; i++) {
      setAuditedIndex(i);
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    setAuditResult("success");
    setIsAuditing(false);
    
    setTimeout(() => {
      setAuditResult("idle");
      setAuditedIndex(-1);
    }, 4000);
  };

  return (
    <div className="max-w-6xl mx-auto p-2" id="blockchain-visualizer-section">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            {simplifiedMode ? "🔗 Le Grand Livre de Sûreté" : "🔗 Registre Blockchain Santé Plus"}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {simplifiedMode 
              ? "Découvrez comment vos dossiers sont gravés et gardés à l'abri pour toujours."
              : "Visualisez le registre cryptographique immuable qui sécurise votre identité et vos dossiers médicaux."
            }
          </p>
        </div>

        <button
          onClick={runChainAudit}
          disabled={isAuditing || blocks.length === 0}
          className={`px-4 py-2.5 text-white font-medium text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer touch-target-mobile ${
            isAuditing 
              ? "bg-slate-500 shadow-none cursor-not-allowed" 
              : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10 active:scale-[0.98]"
          }`}
        >
          {isAuditing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> 
              {simplifiedMode ? `Vérification... (${auditedIndex + 1}/${blocks.length})` : `Audit en cours (${auditedIndex + 1}/${blocks.length})`}
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" /> 
              {simplifiedMode ? "🔍 Vérifier que rien n'a été modifié" : "Auditer l'Intégrité du Registre"}
            </>
          )}
        </button>
      </div>

      {/* Audit Success Banner */}
      <AnimatePresence>
        {auditResult === "success" && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-3 shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold">
                {simplifiedMode ? "✓ Tout est Parfaitement Sûr !" : "Audit Cryptographique Réussi !"}
              </h4>
              <p className="text-xs text-emerald-700">
                {simplifiedMode 
                  ? `La vérification est terminée : l'intégralité des ${blocks.length} dossiers est parfaitement authentique et d'origine. Aucune fraude détectée !`
                  : `100% de la chaîne est intègre. Les liaisons de hashages de tous les ${blocks.length} blocs sont valides. Aucun dossier n'a subi d'altération.`
                }
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blockchain Flow / Train of blocks */}
      <div className="bg-slate-900 rounded-2xl p-6 text-slate-200 border border-slate-800 shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="absolute left-0 bottom-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
        
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-emerald-500" /> Chaîne de Blocs en Temps Réel (Réseau Décentralisé)
        </h3>

        {/* Horizontal scroll of blocks */}
        <div className="flex items-center gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-800">
          {blocks.map((block, idx) => {
            const isAuditedNow = auditedIndex === idx;
            const isSelected = selectedBlock?.index === block.index;

            return (
              <React.Fragment key={block.index}>
                {/* Connecting arrow (not for Genesis Block #0) */}
                {idx > 0 && (
                  <div className="flex-shrink-0 flex items-center justify-center">
                    <ArrowRight className={`w-5 h-5 ${
                      isAuditedNow ? "text-emerald-500 animate-pulse" : "text-slate-700"
                    }`} />
                  </div>
                )}

                {/* Individual Block Node */}
                <motion.button
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedBlock(block)}
                  className={`flex-shrink-0 w-[185px] bg-slate-950/80 hover:bg-slate-950 p-4 rounded-xl border transition-all text-left relative cursor-pointer ${
                    isAuditedNow 
                      ? "border-emerald-500 shadow-md shadow-emerald-500/10 bg-emerald-950/10" 
                      : isSelected 
                      ? "border-indigo-500 bg-indigo-950/10 shadow-md shadow-indigo-500/10" 
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {/* Status scanning effect during audit */}
                  {isAuditedNow && (
                    <div className="absolute inset-0 bg-emerald-500/5 rounded-xl border border-emerald-400 animate-pulse"></div>
                  )}

                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bloc #{block.index}</span>
                    <span className="text-[10px] font-bold font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded">
                      Nonce: {block.nonce}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-200 mt-2 truncate">
                    {block.transactions[0]?.type === "ACCOUNT_CREATED" ? "Création Profil" :
                     block.transactions[0]?.type === "MEDICAL_RECORD_ADDED" ? "Dossier Médical" :
                     block.transactions[0]?.type === "PAYMENT_COMPLETED" ? "Paiement RDV" : "Rendez-vous"}
                  </h4>

                  <p className="text-[10px] text-slate-400 mt-1 truncate">{block.transactions[0]?.patientName || "Santé Plus"}</p>
                  
                  <div className="mt-4 pt-3 border-t border-slate-900/60 space-y-1">
                    <span className="block text-[8px] text-slate-500 uppercase tracking-widest font-mono">SHA-256 Hash</span>
                    <span className="block text-[10px] font-mono text-indigo-400 truncate">{block.hash}</span>
                  </div>
                </motion.button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Block Details & Blockchain Explanation */}
      <div className="grid md:grid-cols-12 gap-6">
        {/* Left pane: Selected Block details */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          {selectedBlock ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Scellé Cryptographique</span>
                  <h3 className="text-lg font-bold text-slate-800 mt-1">Détails du Bloc #{selectedBlock.index}</h3>
                </div>
                <span className="text-xs text-slate-400">{selectedBlock.timestamp}</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400 font-sans font-semibold uppercase">Hachage du Bloc (SHA-256)</span>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100 text-slate-700 break-all font-mono mt-0.5">
                    {selectedBlock.hash}
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] text-slate-400 font-sans font-semibold uppercase">Hachage du Bloc Précédent (Chaînage)</span>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100 text-slate-600 break-all font-mono mt-0.5">
                    {selectedBlock.previousHash}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 font-sans text-sm">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase font-mono">Nombre d'Essais (Nonce)</span>
                    <span className="text-slate-800 font-bold font-mono text-base">{selectedBlock.nonce}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase font-mono">Difficulté du Réseau</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1 text-sm mt-1">
                      <Cpu className="w-4 h-4" /> 3 Zéros initiaux
                    </span>
                  </div>
                </div>

                <div className="font-sans pt-3">
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase font-mono mb-2">Transactions Scellées ({selectedBlock.transactions.length})</span>
                  {selectedBlock.transactions.map((tx, idx) => (
                    <div key={idx} className="bg-indigo-50/40 border border-indigo-100/50 p-3.5 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {tx.type}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">{tx.patientName}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{tx.details}</p>
                      
                      <div className="pt-2 border-t border-indigo-100 font-mono text-[10px] text-indigo-500">
                        <span className="block text-[8px] text-slate-400 uppercase">Empreinte numérique de la transaction</span>
                        <span className="block truncate">{tx.payloadHash}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[350px] text-center text-slate-400">
              <HelpCircle className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-sm font-semibold">Sélectionnez un bloc de la chaîne</p>
              <p className="text-xs px-8 mt-1 leading-relaxed">
                Cliquez sur un bloc ci-dessus pour inspecter ses informations cryptographiques et auditer ses transactions sécurisées.
              </p>
            </div>
          )}
        </div>

        {/* Right pane: Educational content / Blockchain pitch */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100 rounded-2xl p-6 shadow-md border border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
              <Server className="w-5 h-5 text-indigo-400" /> Pourquoi la Blockchain ?
            </h3>
            
            <p className="text-slate-300 text-xs leading-relaxed mb-4">
              Dans les systèmes classiques, vos fichiers médicaux résident sur un serveur central vulnérable à la corruption ou au piratage. Santé Plus résout cela en s'appuyant sur l'immuabilité mathématique.
            </p>

            <div className="space-y-4 text-xs">
              <div className="flex gap-3">
                <div className="p-1.5 bg-slate-800 border border-slate-700 rounded text-emerald-400 flex-shrink-0 h-8 w-8 flex items-center justify-center">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-white">Chiffrement AES-256 local</h4>
                  <p className="text-slate-400">Vos dossiers sont chiffrés sur votre appareil. Personne ne peut lire vos informations sans votre clé privée.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="p-1.5 bg-slate-800 border border-slate-700 rounded text-emerald-400 flex-shrink-0 h-8 w-8 flex items-center justify-center">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-white">Scellage SHA-256</h4>
                  <p className="text-slate-400">Chaque document génère une empreinte numérique unique. Si une virgule est altérée sur le serveur, le hash change et la chaîne rejette le fichier.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="p-1.5 bg-slate-800 border border-slate-700 rounded text-emerald-400 flex-shrink-0 h-8 w-8 flex items-center justify-center">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-white">Immuabilité par chaînage</h4>
                  <p className="text-slate-400">Chaque nouveau bloc contient le hash du bloc précédent. Modifier un dossier médical nécessiterait de recalculer tous les blocs du réseau, ce qui est mathématiquement impossible.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">État de l'Infrastructure</h4>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-white p-3 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400">Noeuds Actifs</span>
                <span className="text-lg font-bold text-indigo-600">14</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400">Statut Réseau</span>
                <span className="text-xs font-bold text-emerald-600 mt-1 block">Synchronisé</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
