import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { io, Socket } from "socket.io-client";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Send,
  User,
  Heart,
  Loader2,
  AlertCircle,
  Mic,
  Trash2,
  Play,
  Pause,
} from "lucide-react";
import { toast } from "sonner";
import { chat, getToken, SOCKET_URL } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface Participant {
  _id: string;
  anonymousHandle: string;
  userType: string;
  gender?: string;
}

interface Conversation {
  _id: string;
  participants: Participant[];
}

interface ServerMessage {
  _id: string;
  conversationId: string;
  senderId: string | Participant;
  content: string;
  createdAt: string;
  type: "text" | "voice";
  voiceDuration?: number;
}

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function VoiceMessagePlayer({
  audioSrc,
  duration,
  isMine,
}: {
  audioSrc: string;
  duration?: number;
  isMine: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(Math.round(audio.currentTime));
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audioRef.current = null;
    };
  }, [audioSrc]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          toast.error("Unable to play voice message");
        });
    }
  };

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 py-1 min-w-[200px] sm:min-w-[240px]">
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 flex-shrink-0 shadow-sm ${
          isMine
            ? "bg-white/30 hover:bg-white/40 text-white"
            : "bg-primary/15 hover:bg-primary/25 text-primary"
        }`}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      <div className="flex-1 space-y-1">
        <div className="relative h-2 rounded-full overflow-hidden bg-black/15 dark:bg-white/15">
          <div
            className={`h-full transition-all duration-150 ${
              isMine ? "bg-white" : "bg-primary"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div
          className={`flex justify-between text-[11px] font-medium ${
            isMine ? "text-white/80" : "text-muted-foreground"
          }`}
        >
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
}

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

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    chat
      .getConversations()
      .then(async (response) => {
        const list = response.data?.conversations || [];
        const selected =
          list.find((item: Conversation) => item._id === id) ||
          list.find((item: Conversation) =>
            item.participants.some((participant) => participant._id === id)
          );
        if (!selected) {
          throw new Error("Conversation not found. Connect with a mentor first.");
        }
        const messageResponse = await chat.getMessages(selected._id);
        if (!active) return;
        setConversation(selected);
        setMessages(messageResponse.data?.messages || []);
      })
      .catch((err: any) => {
        if (active) setError(err.message || "Unable to load this conversation.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!conversation || !getToken()) return;
    const socket = io(SOCKET_URL, {
      auth: { token: getToken() },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_conversation", conversation._id);
    });

    socket.on("new_message", (message: ServerMessage) => {
      if (message.conversationId !== conversation._id) return;
      setMessages((current) =>
        current.some((item) => item._id === message._id)
          ? current
          : [...current, message]
      );
    });

    socket.on("user_typing", ({ userId }: { userId: string }) => {
      if (userId !== currentUserId) setIsTyping(true);
    });

    socket.on("user_stop_typing", ({ userId }: { userId: string }) => {
      if (userId !== currentUserId) setIsTyping(false);
    });

    socket.on("connect_error", () => {
      setError("Live chat is unavailable. You can still try sending through the API.");
    });

    return () => {
      socket.emit("leave_conversation", conversation._id);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conversation, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const otherParticipant = useMemo(
    () =>
      conversation?.participants.find(
        (participant) => participant._id !== currentUserId
      ),
    [conversation, currentUserId]
  );

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !conversation) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Card className="p-8 text-center bg-white/80 rounded-2xl">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive" />
          <p className="text-muted-foreground">{error}</p>
          <Button
            onClick={() => navigate("/connect")}
            variant="outline"
            className="mt-4 rounded-full"
          >
            Back to connections
          </Button>
        </Card>
      </div>
    );
  }

  if (!conversation) return null;

  const isMine = (message: ServerMessage) =>
    typeof message.senderId === "string"
      ? message.senderId === currentUserId
      : message.senderId._id === currentUserId;

  const sendMessage = async () => {
    const content = inputMessage.trim();
    if (!content || isSending) return;
    setIsSending(true);
    setInputMessage("");
    setIsTyping(false);
    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit("stop_typing", conversation._id);
        socketRef.current.emit("send_message", {
          conversationId: conversation._id,
          content,
          type: "text",
        });
      } else {
        const response = await chat.sendMessage(conversation._id, content);
        if (response.data?.message) {
          setMessages((current) => [...current, response.data!.message]);
        }
      }
    } catch (err: any) {
      setInputMessage(content);
      toast.error(err.message || "Unable to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleInput = (value: string) => {
    setInputMessage(value);
    if (socketRef.current?.connected) {
      if (value.trim()) socketRef.current.emit("typing", conversation._id);
      else socketRef.current.emit("stop_typing", conversation._id);
    }
  };

  // ─── Voice Recording Helpers ──────────────────────────
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Audio recording is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      toast.error("Microphone access was denied or is unavailable.");
    }
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const stopAndSendRecording = async () => {
    if (!mediaRecorderRef.current) return;
    const duration = recordingSeconds;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: mediaRecorderRef.current?.mimeType || "audio/webm",
      });
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
      setIsRecording(false);
      setRecordingSeconds(0);

      if (audioBlob.size === 0) return;

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        setIsSending(true);
        try {
          if (socketRef.current?.connected) {
            socketRef.current.emit("send_message", {
              conversationId: conversation._id,
              content: base64Audio,
              type: "voice",
              voiceDuration: duration,
            });
          } else {
            const response = await chat.sendMessage(
              conversation._id,
              base64Audio,
              "voice",
              duration
            );
            if (response.data?.message) {
              setMessages((current) => [...current, response.data!.message]);
            }
          }
          toast.success("Voice message sent");
        } catch (err: any) {
          toast.error(err.message || "Failed to send voice message");
        } finally {
          setIsSending(false);
        }
      };
      reader.readAsDataURL(audioBlob);
    };

    mediaRecorderRef.current.stop();
  };

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-4xl mx-auto flex flex-col h-[calc(100dvh-7.5rem)] lg:h-screen">
      {/* Header */}
      <Card className="p-3 sm:p-4 bg-white/80 border-border shadow-lg rounded-2xl mb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center shadow-sm">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-medium text-foreground">
              {otherParticipant?.anonymousHandle || "Anonymous connection"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Private encrypted conversation · Text & Voice
            </p>
          </div>
        </div>
      </Card>

      {error && <p className="text-xs text-orange-600 mb-2">{error}</p>}

      {/* Messages Feed */}
      <Card className="flex-1 bg-white/80 border-border shadow-lg rounded-2xl p-3 sm:p-4 lg:p-6 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-1">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <Heart className="w-12 h-12 mb-3 text-primary/50" />
              <p>Start a supportive conversation with text or voice.</p>
            </div>
          )}

          {messages.map((message) => {
            const mine = isMine(message);
            return (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                    mine
                      ? "bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] text-white"
                      : "bg-muted/70 text-foreground border border-border/50"
                  }`}
                >
                  {message.type === "voice" ? (
                    <VoiceMessagePlayer
                      audioSrc={message.content}
                      duration={message.voiceDuration}
                      isMine={mine}
                    />
                  ) : (
                    <p className="text-sm mb-1 whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                  )}
                  <p
                    className={`text-[10px] text-right mt-1 ${
                      mine ? "text-white/75" : "text-muted-foreground"
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </motion.div>
            );
          })}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-2.5 text-xs text-muted-foreground animate-pulse">
                Typing…
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area */}
        {isRecording ? (
          <div className="flex items-center justify-between p-3 bg-red-50/80 border border-red-200 rounded-2xl animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-red-600">
                  {formatDuration(recordingSeconds)}
                </span>
                <span className="text-xs text-red-500 hidden sm:inline">
                  Recording voice note...
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cancelRecording}
                className="text-muted-foreground hover:text-destructive rounded-full px-3"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={stopAndSendRecording}
                disabled={isSending}
                className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-full px-4 shadow-sm"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-1.5" />
                    Send Voice
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={startRecording}
              className="rounded-xl h-11 w-11 flex-shrink-0 text-muted-foreground hover:text-primary hover:bg-muted"
              title="Record voice message"
            >
              <Mic className="w-5 h-5" />
            </Button>

            <textarea
              value={inputMessage}
              onChange={(event) => handleInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type your message or record voice…"
              className="flex-1 p-3 rounded-xl bg-muted/50 border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm max-h-28"
              rows={1}
            />

            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isSending}
              className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] text-white rounded-xl h-11 px-4 flex-shrink-0 shadow-sm hover:opacity-95"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
