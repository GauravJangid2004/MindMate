import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bot,
  Send,
  X,
  Sparkles,
  RotateCcw,
  Minimize2,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ai } from "../lib/api";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedPrompts?: string[];
  timestamp: Date;
}

interface MentorMiniChatbotProps {
  onApplyNeedsFilter?: (topic: string) => void;
}

const DEFAULT_PROMPTS = [
  "🎯 Help me choose a mentor",
  "💬 What should I say first?",
  "😰 Feeling stressed about exams",
  "🔒 How is my privacy protected?",
];

export function MentorMiniChatbot({ onApplyNeedsFilter }: MentorMiniChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCallout, setShowCallout] = useState(true);

  const initialBotMessage: Message = {
    id: "welcome-1",
    role: "assistant",
    content:
      "Hi there! 👋 I'm your **Mentor Guide AI**.\n\nNot sure which mentor to choose, or feeling a bit nervous about reaching out? I can help you pick the right mentor, write friendly icebreaker messages, or answer questions about your privacy.",
    suggestedPrompts: DEFAULT_PROMPTS,
    timestamp: new Date(),
  };

  const [messages, setMessages] = useState<Message[]>([initialBotMessage]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setShowCallout(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput("");
    setIsLoading(true);

    try {
      // Build lightweight conversation history for backend context
      const historyPayload = newHistory.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await ai.mentorChat(textToSend, historyPayload);
      const data = res.data || {};

      const assistantMessage: Message = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.reply || "I'm here to support you! Feel free to ask anything about our mentors or how to connect.",
        suggestedPrompts: Array.isArray(data.suggestedPrompts) ? data.suggestedPrompts : undefined,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      toast.error(err.message || "Unable to get AI response. Please try again.");
      const fallbackMessage: Message = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content:
          "I'm having a brief connection hiccup, but here's a quick tip: all our mentors are verified volunteers who genuinely care. Browse their expertise cards, pick someone whose hobbies or background resonate with you, and send a simple 'Hi! How has your week been?' request! 😊",
        suggestedPrompts: ["Help me choose a mentor", "How does anonymity work?"],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const resetChat = () => {
    setMessages([initialBotMessage]);
    toast.success("Chat reset");
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50">
      {/* Collapsed State / Floating Button */}
      {!isOpen && (
        <div className="relative flex items-center">
          {/* Gentle Callout speech bubble on first view */}
          {showCallout && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="hidden md:flex items-center gap-2 mr-3 px-3.5 py-2 rounded-2xl bg-white shadow-xl border border-purple-200/80 text-xs font-medium text-foreground"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span>Need help finding a mentor? Ask me!</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCallout(false);
                }}
                className="text-muted-foreground hover:text-foreground ml-1"
                aria-label="Close bubble"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            aria-label="Open Mentor Guide AI Chatbot"
            className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#9061F9] via-[#8B5CF6] to-[#7C3AED] text-white shadow-xl hover:shadow-2xl transition-all cursor-pointer ring-4 ring-purple-200/50"
          >
            <div className="relative">
              <Bot className="w-6 h-6 text-white group-hover:rotate-6 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white animate-pulse" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold leading-tight flex items-center gap-1">
                Mentor Guide AI
                <Sparkles className="w-3 h-3 text-amber-300" />
              </p>
              <p className="text-[10px] text-purple-100 opacity-90 leading-tight">Instant advice & matching</p>
            </div>
          </motion.button>
        </div>
      )}

      {/* Expanded Mini Chatbot Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-[92vw] sm:w-[380px] h-[520px] max-h-[82vh] rounded-3xl bg-white shadow-2xl border border-purple-200/80 flex flex-col overflow-hidden backdrop-blur-md"
          >
            {/* Header */}
            <div className="px-4 py-3.5 bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center relative shadow-inner">
                  <Bot className="w-5 h-5 text-white" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold leading-tight flex items-center gap-1.5">
                    Mentor Guide AI
                    <Badge className="bg-white/20 hover:bg-white/25 text-white border-0 text-[10px] py-0 px-1.5 font-normal">
                      Online
                    </Badge>
                  </h3>
                  <p className="text-[11px] text-purple-100 leading-tight">
                    Anonymous peer guidance & match helper
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={resetChat}
                  title="Reset conversation"
                  aria-label="Reset conversation"
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Minimize chatbot"
                  aria-label="Minimize chatbot"
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Privacy Sub-banner */}
            <div className="px-3 py-1.5 bg-[#F5F3FF] border-b border-purple-100 flex items-center justify-between text-[11px] text-purple-700">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                100% Anonymous · Safe Space
              </span>
              <span className="text-[10px] text-muted-foreground">Powered by MindMate AI</span>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-purple-50/20 to-white">
              {messages.map((msg) => {
                const isAssistant = msg.role === "assistant";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAssistant ? "items-start" : "items-end"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                        isAssistant
                          ? "bg-white border border-purple-100/90 text-foreground shadow-sm rounded-tl-sm"
                          : "bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-md rounded-tr-sm"
                      }`}
                    >
                      {/* Render text with basic bolding and bullet formatting */}
                      <div className="whitespace-pre-line space-y-1">
                        {msg.content.split("\n").map((line, idx) => {
                          const boldFormatted = line.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, pIdx) => {
                            if (part.startsWith("**") && part.endsWith("**")) {
                              return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
                            }
                            if (part.startsWith("*") && part.endsWith("*")) {
                              return <em key={pIdx}>{part.slice(1, -1)}</em>;
                            }
                            return part;
                          });

                          return <p key={idx}>{boldFormatted}</p>;
                        })}
                      </div>

                      {/* Copy message button for icebreakers */}
                      {isAssistant && msg.content.includes("'") && (
                        <div className="mt-2 pt-2 border-t border-purple-100 flex justify-end">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="text-[10px] text-purple-700 hover:text-purple-900 flex items-center gap-1 font-medium bg-purple-50 px-2 py-0.5 rounded-md hover:bg-purple-100 transition-colors"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy message</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Follow-up Suggestion Chips underneath Bot Messages */}
                    {isAssistant && msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%]">
                        {msg.suggestedPrompts.map((prompt, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => {
                              void handleSend(prompt);
                              if (
                                onApplyNeedsFilter &&
                                (prompt.includes("stress") || prompt.includes("exam"))
                              ) {
                                onApplyNeedsFilter("exam and academic stress");
                              }
                            }}
                            className="text-[11px] bg-white hover:bg-purple-50 text-purple-800 border border-purple-200/80 px-2.5 py-1 rounded-full shadow-xs hover:border-purple-300 transition-all text-left flex items-center gap-1 group"
                          >
                            <span>{prompt}</span>
                            <ChevronRight className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex items-start gap-2">
                  <div className="bg-white border border-purple-100 rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                    <span className="text-[11px] text-muted-foreground ml-1.5">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-purple-100">
              <div className="flex items-center gap-2 bg-[#F9F8FE] border border-purple-200/90 rounded-2xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-purple-400 focus-within:border-transparent transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about mentors, icebreakers, advice..."
                  maxLength={500}
                  disabled={isLoading}
                  className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                />
                <Button
                  size="icon"
                  type="button"
                  disabled={!input.trim() || isLoading}
                  onClick={() => void handleSend()}
                  aria-label="Send message"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white shadow-xs disabled:opacity-40 flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground px-1">
                <span>Press Enter to send</span>
                <span>Mentor Guide AI</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
