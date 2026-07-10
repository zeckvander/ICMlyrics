import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Menu, Send, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DrawerMenu from "@/components/louvores/DrawerMenu";

export default function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [texto, setTexto] = useState("");
  const [sending, setSending] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const bottomRef = useRef(null);
  const musico = localStorage.getItem("icmlyrics_musico") || "Músico";

  useEffect(() => {
    loadMessages();

    // Sincroniza o chat em tempo real se o app estiver aberto em mais de uma aba
    const handleStorageChange = (e) => {
      if (e.key === "icmlyrics_chat_messages") {
        loadMessages();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const loadMessages = () => {
    try {
      const localData = localStorage.getItem("icmlyrics_chat_messages");
      if (localData) {
        setMessages(JSON.parse(localData));
      }
    } catch (e) {
      console.error("Erro ao carregar mensagens locais:", e);
      setMessages([]);
    }
    setLoading(false);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!texto.trim() || sending) return;
    
    const mensagemEnvio = texto.trim();
    setSending(true);
    
    try {
      const novaMensagem = {
        id: Math.random().toString(36).slice(2, 9),
        musico,
        mensagem: mensagemEnvio,
        created_date: new Date().toISOString()
      };

      const listaAtualizada = [...messages, novaMensagem];
      setMessages(listaAtualizada);
      localStorage.setItem("icmlyrics_chat_messages", JSON.stringify(listaAtualizada));
      
      setTexto("");
    } catch (err) {
      console.error("Erro ao salvar mensagem:", err);
    }
    setSending(false);
  };

  const formatarHora = (dataStr) => {
    try {
      if (!dataStr) return "";
      const d = new Date(dataStr);
      return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="h-screen max-h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Topbar com Seta e Hambúrguer juntos à esquerda */}
      <div className="bg-slate-900 text-white px-4 pt-12 pb-4 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/dashboard")} 
            className="text-slate-300 hover:text-white transition-colors"
            title="Voltar para o Dashboard"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <button 
            onClick={() => setDrawerOpen(true)} 
            className="text-slate-300 hover:text-white transition-colors p-1 mr-1"
            title="Menu Lateral"
          >
            <Menu className="w-6 h-6" />
          </button>

          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400" /> Chat da Equipe
          </h1>
        </div>
      </div>
      
      <DrawerMenu open={drawerOpen} onOpenChange={setDrawerOpen} />

      {/* Corpo do Chat */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-xs text-slate-400 font-medium">Carregando chat...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mx-2">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium text-sm">Nenhuma mensagem ainda</p>
            <p className="text-slate-400 text-xs mt-0.5">Seja o primeiro a enviar um aviso para a equipe!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.musico === musico;
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 shadow-sm ${
                  isMe ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                }`}>
                  {!isMe && <p className="text-xs font-bold text-amber-500 mb-0.5">{m.musico}</p>}
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{m.mensagem}</p>
                  <div className="flex justify-end items-center mt-1">
                    <span className={`text-[9px] font-medium ${isMe ? "text-indigo-200" : "text-slate-400"}`}>
                      {formatarHora(m.created_date)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input de Envio */}
      <form onSubmit={handleSend} className="bg-white border-t border-slate-200 px-4 py-3 flex gap-2 items-center shrink-0 shadow-lg">
        <Input 
          value={texto} 
          onChange={(e) => setTexto(e.target.value)} 
          placeholder="Digite sua mensagem para a equipe..." 
          className="h-11 rounded-full bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 px-4 flex-1 text-sm"
          disabled={loading}
        />
        <Button 
          type="submit" 
          size="icon" 
          className="h-11 w-11 rounded-full shrink-0 bg-indigo-600 hover:bg-indigo-700" 
          disabled={sending || !texto.trim() || loading}
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 text-white" />}
        </Button>
      </form>
    </div>
  );
}