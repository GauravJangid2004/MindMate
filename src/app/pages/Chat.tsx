import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { io, Socket } from "socket.io-client";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Send, User, Heart, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { chat } from "../lib/api";
import { getToken, SOCKET_URL } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface Participant { _id: string; anonymousHandle: string; userType: string; gender?: string; }
interface Conversation { _id: string; participants: Participant[]; }
interface ServerMessage { _id: string; conversationId: string; senderId: string | Participant; content: string; createdAt: string; type: "text" | "voice"; }

export function Chat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { studentProfile, elderProfile } = useAuth();
  const currentUserId = studentProfile?.id || elderProfile?.id;
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ServerMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    chat.getConversations().then(async (response) => {
      const list = response.data?.conversations || [];
      const selected = list.find((item: Conversation) => item._id === id) || list.find((item: Conversation) => item.participants.some((participant) => participant._id === id));
      if (!selected) throw new Error("Conversation not found. Connect with a mentor first.");
      const messageResponse = await chat.getMessages(selected._id);
      if (!active) return;
      setConversation(selected);
      setMessages(messageResponse.data?.messages || []);
    }).catch((err: any) => active && setError(err.message || "Unable to load this conversation.")).finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!conversation || !getToken()) return;
    const socket = io(SOCKET_URL, { auth: { token: getToken() }, transports: ["websocket", "polling"] });
    socketRef.current = socket;
    socket.on("connect", () => socket.emit("join_conversation", conversation._id));
    socket.on("new_message", (message: ServerMessage) => {
      if (message.conversationId !== conversation._id) return;
      setMessages((current) => current.some((item) => item._id === message._id) ? current : [...current, message]);
    });
    socket.on("user_typing", ({ userId }: { userId: string }) => { if (userId !== currentUserId) setIsTyping(true); });
    socket.on("user_stop_typing", ({ userId }: { userId: string }) => { if (userId !== currentUserId) setIsTyping(false); });
    socket.on("connect_error", () => setError("Live chat is unavailable. You can still try sending through the API."));
    return () => { socket.emit("leave_conversation", conversation._id); socket.disconnect(); socketRef.current = null; };
  }, [conversation, currentUserId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  const otherParticipant = useMemo(() => conversation?.participants.find((participant) => participant._id !== currentUserId), [conversation, currentUserId]);

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error && !conversation) return <div className="p-8 max-w-2xl mx-auto"><Card className="p-8 text-center bg-white/80 rounded-2xl"><AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive" /><p className="text-muted-foreground">{error}</p><Button onClick={() => navigate("/connect")} variant="outline" className="mt-4 rounded-full">Back to connections</Button></Card></div>;
  if (!conversation) return null;

  const isMine = (message: ServerMessage) => typeof message.senderId === "string" ? message.senderId === currentUserId : message.senderId._id === currentUserId;
  const sendMessage = async () => {
    const content = inputMessage.trim();
    if (!content || isSending) return;
    setIsSending(true);
    setInputMessage("");
    setIsTyping(false);
    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit("stop_typing", conversation._id);
        socketRef.current.emit("send_message", { conversationId: conversation._id, content, type: "text" });
      } else {
        const response = await chat.sendMessage(conversation._id, content);
        if (response.data?.message) setMessages((current) => [...current, response.data!.message]);
      }
    } catch (err: any) {
      setInputMessage(content);
      toast.error(err.message || "Unable to send message");
    } finally { setIsSending(false); }
  };
  const handleInput = (value: string) => { setInputMessage(value); if (socketRef.current?.connected) { if (value.trim()) socketRef.current.emit("typing", conversation._id); else socketRef.current.emit("stop_typing", conversation._id); } };

  return <div className="p-3 sm:p-4 lg:p-8 max-w-4xl mx-auto flex flex-col h-[calc(100dvh-7.5rem)] lg:h-screen"><Card className="p-3 sm:p-4 bg-white/80 border-border shadow-lg rounded-2xl mb-3 flex-shrink-0"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center"><User className="w-6 h-6 text-white" /></div><div><h2 className="font-medium">{otherParticipant?.anonymousHandle || "Anonymous connection"}</h2><p className="text-sm text-muted-foreground">Private encrypted conversation</p></div></div></Card>{error && <p className="text-xs text-orange-600 mb-2">{error}</p>}<Card className="flex-1 bg-white/80 border-border shadow-lg rounded-2xl p-3 sm:p-4 lg:p-6 overflow-hidden flex flex-col min-h-0"><div className="flex-1 overflow-y-auto mb-4 space-y-4">{messages.length === 0 && <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground"><Heart className="w-12 h-12 mb-3 text-primary/50" /><p>Start a supportive conversation.</p></div>}{messages.map((message) => <motion.div key={message._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isMine(message) ? "justify-end" : "justify-start"}`}><div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isMine(message) ? "bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] text-white" : "bg-muted text-foreground"}`}><p className="text-sm mb-1 whitespace-pre-wrap">{message.content}</p><p className={`text-xs ${isMine(message) ? "text-white/70" : "text-muted-foreground"}`}>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p></div></motion.div>)}{isTyping && <div className="flex justify-start"><div className="bg-muted rounded-2xl px-4 py-3 text-xs text-muted-foreground">Typing…</div></div>}<div ref={messagesEndRef} /></div><div className="flex gap-2"><textarea value={inputMessage} onChange={(event) => handleInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder="Type your message…" className="flex-1 p-3 rounded-xl bg-muted border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary" rows={1} /><Button onClick={sendMessage} disabled={!inputMessage.trim() || isSending} className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] text-white rounded-xl px-4"><Send className="w-5 h-5" /></Button></div></Card></div>;
}
