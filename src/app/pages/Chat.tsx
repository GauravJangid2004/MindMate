import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Send, User, Smile, Heart, Mic, StopCircle, Play, Pause, Info } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "../components/ui/alert";

const mentorResponses = [
  "I understand what you're going through. I've been there too.",
  "That's completely valid. Many students feel this way.",
  "What helps me during tough times is taking it one day at a time.",
  "Have you considered talking to a counselor? They can provide great support.",
  "You're not alone in this. We're here for you.",
];

interface Message {
  sender: "user" | "other";
  text?: string;
  time: string;
  type: "text" | "voice";
  audioBlob?: Blob;
  audioDuration?: number;
}

export function Chat() {
  const { id } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
  const [showPermissionInfo, setShowPermissionInfo] = useState(true);
  const [microphonePermission, setMicrophonePermission] = useState<"granted" | "denied" | "prompt" | "unsupported">("prompt");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const chatName = "Alex";

  useEffect(() => {
    // Welcome message
    setTimeout(() => {
      setMessages([
        {
          sender: "other",
          text: "Hey! Thanks for connecting. I'm here to listen without judgment. What's on your mind?",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: "text",
        },
      ]);
    }, 500);

    // Check microphone support and permissions
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicrophonePermission("unsupported");
        return;
      }

      // Check permission status if available
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: "microphone" as PermissionName });
          setMicrophonePermission(permissionStatus.state as "granted" | "denied" | "prompt");
          
          // Listen for permission changes
          permissionStatus.onchange = () => {
            setMicrophonePermission(permissionStatus.state as "granted" | "denied" | "prompt");
          };
        } catch (error) {
          // Permission API might not support microphone on some browsers
          setMicrophonePermission("prompt");
        }
      } else {
        setMicrophonePermission("prompt");
      }
    } catch (error) {
      console.error("Error checking microphone permission:", error);
      setMicrophonePermission("prompt");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      sender: "user",
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "text",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate response
    setTimeout(() => {
      setIsTyping(false);
      const response = mentorResponses[Math.floor(Math.random() * mentorResponses.length)];
      setMessages((prev) => [
        ...prev,
        {
          sender: "other",
          text: response,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: "text",
        },
      ]);
    }, 1500 + Math.random() * 1000);
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just wanted to request permission
      stream.getTracks().forEach((track) => track.stop());
      setMicrophonePermission("granted");
      toast.success("Microphone access granted! You can now send voice messages.");
    } catch (error: any) {
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setMicrophonePermission("denied");
        toast.error("Microphone access denied. Please enable it in your browser settings to use voice messages.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        toast.error("No microphone found. Please connect a microphone.");
      } else {
        toast.error("Could not access microphone. Please check your browser settings.");
      }
    }
  };

  const startRecording = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Voice recording is not supported in your browser.");
        return;
      }

      // If permission not granted, request it first
      if (microphonePermission !== "granted") {
        await requestMicrophonePermission();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const duration = recordingTime;
        
        const newMessage: Message = {
          sender: "user",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: "voice",
          audioBlob,
          audioDuration: duration,
        };

        setMessages((prev) => [...prev, newMessage]);
        setRecordingTime(0);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Simulate voice response
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const response = mentorResponses[Math.floor(Math.random() * mentorResponses.length)];
          setMessages((prev) => [
            ...prev,
            {
              sender: "other",
              text: response,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              type: "text",
            },
          ]);
        }, 2000);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.success("Recording started");
    } catch (error: any) {
      // Silently handle the error as we've already shown user-friendly messages
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setMicrophonePermission("denied");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const getMicrophoneButtonTooltip = () => {
    switch (microphonePermission) {
      case "denied":
        return "Microphone access denied. Click to learn how to enable it.";
      case "unsupported":
        return "Voice recording not supported in this browser";
      case "prompt":
        return "Click to enable voice messages";
      case "granted":
        return "Send voice message";
      default:
        return "Send voice message";
    }
  };

  const handleMicrophoneClick = () => {
    if (microphonePermission === "denied") {
      toast.error(
        "Please enable microphone access in your browser settings. Look for the microphone icon in your browser's address bar.",
        { duration: 5000 }
      );
      return;
    }
    
    if (microphonePermission === "unsupported") {
      toast.error("Voice recording is not supported in your browser. Please try a different browser.");
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const playVoiceMessage = (index: number, audioBlob: Blob) => {
    if (playingMessageIndex === index) {
      // Pause
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingMessageIndex(null);
      }
    } else {
      // Play
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setPlayingMessageIndex(null);
      };
      
      audio.play();
      setPlayingMessageIndex(index);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-4xl mx-auto flex flex-col h-[calc(100dvh-7.5rem)] lg:h-screen">
      {/* Chat Header */}
      <Card className="p-3 sm:p-4 bg-white/80 backdrop-blur-sm border-border shadow-lg rounded-2xl mb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-medium">{chatName}</h2>
            <p className="text-sm text-muted-foreground">Trained Listener • Online</p>
          </div>
        </div>
      </Card>

      {/* Voice Permission Info */}
      {showPermissionInfo && microphonePermission !== "unsupported" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-4"
        >
          <Alert className={`${
            microphonePermission === "denied" 
              ? "bg-orange-50 border-orange-200" 
              : "bg-blue-50 border-blue-200"
          } rounded-2xl`}>
            <Info className={`h-4 w-4 ${
              microphonePermission === "denied" ? "text-orange-600" : "text-blue-600"
            }`} />
            <AlertDescription className={`text-sm ${
              microphonePermission === "denied" ? "text-orange-900" : "text-blue-900"
            } ml-2`}>
              {microphonePermission === "denied" 
                ? "Microphone access is blocked. To enable voice messages, click the microphone icon in your browser's address bar and allow access."
                : "Voice messaging is available! Click the microphone icon to record. You may need to allow microphone access when prompted."
              }
              <button
                onClick={() => setShowPermissionInfo(false)}
                className={`ml-2 underline ${
                  microphonePermission === "denied" 
                    ? "text-orange-600 hover:text-orange-800" 
                    : "text-blue-600 hover:text-blue-800"
                }`}
              >
                Got it
              </button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Messages Area */}
      <Card className="flex-1 bg-white/80 backdrop-blur-sm border-border shadow-lg rounded-2xl p-3 sm:p-4 lg:p-6 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] ${
                  message.sender === "user"
                    ? "bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] text-white"
                    : "bg-muted text-foreground"
                } rounded-2xl px-4 py-3`}
              >
                {message.type === "text" ? (
                  <>
                    <p className="text-sm mb-1">{message.text}</p>
                    <p
                      className={`text-xs ${
                        message.sender === "user" ? "text-white/70" : "text-muted-foreground"
                      }`}
                    >
                      {message.time}
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => message.audioBlob && playVoiceMessage(index, message.audioBlob)}
                      className="p-2 rounded-full hover:bg-white/20 transition-colors"
                    >
                      {playingMessageIndex === index ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                          <div className="h-full bg-white/60 rounded-full" style={{ width: "40%" }} />
                        </div>
                      </div>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === "user" ? "text-white/70" : "text-muted-foreground"
                        }`}
                      >
                        {formatTime(message.audioDuration || 0)} • {message.time}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 bg-muted-foreground rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-muted-foreground rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-muted-foreground rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Voice Recording Indicator */}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-red-900">Recording...</span>
                <span className="text-sm text-red-700">{formatTime(recordingTime)}</span>
              </div>
              <Button
                onClick={stopRecording}
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white rounded-full"
              >
                <StopCircle className="w-4 h-4 mr-1" />
                Stop
              </Button>
            </div>
          </motion.div>
        )}

        {/* Input Area */}
        <div className="flex gap-2">
          <Button
            onClick={handleMicrophoneClick}
            disabled={microphonePermission === "unsupported"}
            title={getMicrophoneButtonTooltip()}
            className={`${
              isRecording
                ? "bg-red-500 hover:bg-red-600"
                : microphonePermission === "denied"
                ? "bg-orange-500 hover:bg-orange-600"
                : "bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6]"
            } text-white rounded-xl px-4 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 p-3 rounded-xl bg-muted border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary max-h-32"
            rows={1}
            disabled={isRecording}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isRecording}
            className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6] text-white rounded-xl px-4 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-2 mt-2 flex-shrink-0 flex-wrap">
        <Button
          onClick={() => setInputMessage("I'm feeling anxious")}
          variant="outline"
          className="text-xs rounded-full"
        >
          <Smile className="w-4 h-4 mr-1" />
          I'm anxious
        </Button>
        <Button
          onClick={() => setInputMessage("I need support")}
          variant="outline"
          className="text-xs rounded-full"
        >
          <Heart className="w-4 h-4 mr-1" />
          Need support
        </Button>
      </div>
    </div>
  );
}
