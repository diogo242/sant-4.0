import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { Bot, User, Send, HelpCircle, Loader2, Sparkles, Shield, Key, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AssistantChatProps {
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isFloating?: boolean;
  onClose?: () => void;
}

export default function AssistantChat({ chatHistory, setChatHistory, isFloating, onClose }: AssistantChatProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    { text: "Comment la blockchain sécurise-t-elle mes dossiers ?", label: "Sécurité Blockchain" },
    { text: "Comment fonctionne la recommandation par géolocalisation ?", label: "Géolocalisation Hôpitaux" },
    { text: "Comment réserver et payer une consultation ?", label: "Prise de RDV & Paiement" },
    { text: "Qui a accès à ma clé privée de déchiffrement ?", label: "Clé Privée" },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now() + "-user",
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: chatHistory,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

      const assistantMsg: ChatMessage = {
        id: "msg-" + Date.now() + "-assistant",
        role: "assistant",
        text: data.text,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      };

      setChatHistory((prev) => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: "msg-" + Date.now() + "-error",
        role: "assistant",
        text: "Désolé, je rencontre des difficultés techniques pour me connecter à mon serveur d'intelligence artificielle. Veuillez vous assurer que votre clé API Gemini est correctement configurée.",
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto p-2 ${isFloating ? "h-[500px]" : "h-[550px]"} flex flex-col bg-white rounded-2xl border border-slate-100 shadow-md overflow-hidden`} id="assistant-chat-section">
      {/* Assistant Header */}
      <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex justify-between items-center flex-shrink-0 rounded-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/30 rounded-xl">
            <Bot className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5 leading-none">
              Santé Plus Assistant IA <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </h3>
            <span className="text-[10px] text-emerald-100 mt-1 block">Modèle de langage médical Gemini • En ligne</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isFloating && (
            <div className="text-[10px] bg-emerald-800/60 border border-emerald-600 px-2 py-0.5 rounded font-mono">
              V1.0.4-SECURE
            </div>
          )}
          {isFloating && onClose && (
            <button
              onClick={onClose}
              type="button"
              className="p-1 hover:bg-white/10 rounded-lg transition-all text-white cursor-pointer"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 scrollbar-thin">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-3">
            <Bot className="w-10 h-10 text-emerald-600 animate-bounce" />
            <h4 className="text-sm font-bold text-slate-700">Bienvenue sur l'Assistant Santé Plus !</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Je suis là pour vous aider à comprendre l'application et à répondre à vos questions sur la blockchain, la sécurité de vos données, ou vos prises de rendez-vous. Posez-moi vos questions ci-dessous ou cliquez sur un raccourci !
            </p>
          </div>
        ) : (
          chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {/* Profile Bubble Icon */}
              <div className={`p-2 rounded-xl flex-shrink-0 h-9 w-9 flex items-center justify-center ${
                msg.role === "user" ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white"
              }`}>
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content Bubble */}
              <div className="space-y-1">
                <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-white border border-slate-100 text-slate-700 shadow-sm rounded-tl-none whitespace-pre-line"
                }`}>
                  {msg.text}
                </div>
                <span className={`block text-[8px] text-slate-400 font-semibold uppercase ${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))
        )}

        {/* Loading Spinner Bubble */}
        {isLoading && (
          <div className="flex gap-3 mr-auto max-w-[85%]">
            <div className="p-2 bg-emerald-600 text-white rounded-xl h-9 w-9 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-100 shadow-sm p-3.5 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              <span className="text-xs text-slate-400 font-medium">Santé Plus IA est en train de formuler sa réponse...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input / Quick Actions Footer */}
      <div className="p-4 border-t border-slate-100 bg-white space-y-3 flex-shrink-0">
        {/* Quick Question Buttons */}
        {chatHistory.length === 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q.text)}
                className="flex-shrink-0 px-2.5 py-1.5 border border-slate-200 text-[10px] font-bold text-slate-600 rounded-lg hover:border-emerald-500 hover:text-emerald-700 transition-all cursor-pointer bg-slate-50"
              >
                {q.label}
              </button>
            ))}
          </div>
        )}

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="Posez une question à l'assistant IA..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-xl text-white transition-all shadow-md flex-shrink-0 cursor-pointer ${
              !input.trim() || isLoading
                ? "bg-slate-300 shadow-none cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98]"
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
