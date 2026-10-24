import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { chat, connections } from "../lib/api";
import { User, MessageCircle, Heart, Clock, BookOpen, Users, Loader2, AlertCircle } from "lucide-react";

interface Connection {
  _id: string;
  anonymousHandle: string;
  gender?: string;
  age?: number;
  course?: string;
  passion?: string;
  hobbies?: string[];
}

interface Conversation {
  _id: string;
  participants: Array<{ _id: string; anonymousHandle: string; userType: string }>;
  lastMessage?: string;
  lastMessageAt?: string;
}

export function Connect() {
  const { userType } = useAuth();
  const [connectionsList, setConnectionsList] = useState<Connection[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([connections.getConnections(), chat.getConversations()])
      .then(([connectionResponse, conversationResponse]) => {
        if (!active) return;
        setConnectionsList(connectionResponse.data?.connections || []);
        setConversations(conversationResponse.data?.conversations || []);
      })
      .catch((err: any) => active && setError(err.message || "Unable to load your connections."))
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, []);

  const filteredConnections = useMemo(() => connectionsList.filter((connection) => {
    const searchable = [connection.anonymousHandle, connection.gender, connection.course, connection.passion, ...(connection.hobbies || [])].filter(Boolean).join(" ").toLowerCase();
    return searchable.includes(searchTerm.toLowerCase());
  }), [connectionsList, searchTerm]);

  const getConversationId = (connectionId: string) => conversations.find((conversation) => conversation.participants.some((participant) => participant._id === connectionId))?._id;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl mb-3">{userType === "elder" ? "My Students" : "My Mentors"}</h1>
        <p className="text-muted-foreground">{userType === "elder" ? "Connect with your students and provide support." : "Chat with your connected mentors for support and guidance."}</p>
      </motion.div>

      {isLoading && <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
      {!isLoading && error && <Card className="p-8 text-center bg-white/80 rounded-2xl"><AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive" /><p className="text-muted-foreground">{error}</p></Card>}
      {!isLoading && !error && connectionsList.length > 0 && <>
        <div className="relative mb-6"><input type="text" placeholder={userType === "elder" ? "Search students..." : "Search mentors..."} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full p-4 rounded-2xl bg-white/80 border border-border focus:outline-none focus:ring-2 focus:ring-primary" /><Users className="w-5 h-5 text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2" /></div>
        <div className="space-y-4">
          {filteredConnections.map((connection, index) => {
            const conversationId = getConversationId(connection._id);
            return <motion.div key={connection._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <Card className="p-6 bg-white/80 border-border hover:shadow-lg transition-all rounded-2xl">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center flex-shrink-0"><User className="w-7 h-7 text-white" /></div>
                    <div className="flex-1"><h4 className="text-lg mb-1">{connection.anonymousHandle || "Anonymous User"}</h4><p className="text-sm text-muted-foreground mb-3">{userType === "elder" ? `${connection.age || ""}${connection.age ? " years" : ""} ${connection.course ? `• ${connection.course}` : ""}` : connection.passion || "Verified mentor"}</p><div className="flex flex-wrap gap-2">{(connection.hobbies || []).map((hobby) => <Badge key={hobby} className="bg-[#E9E4FF] text-[#6B21A8] hover:bg-[#E9E4FF] text-xs">{hobby}</Badge>)}</div>{conversationId && <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1"><Clock className="w-3 h-3" />Conversation ready</p>}</div>
                  </div>
                  <div className="flex flex-wrap gap-2"><Link to={`/chat/${conversationId || connection._id}`}><Button className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] text-white rounded-full"><MessageCircle className="w-4 h-4 mr-2" />Chat</Button></Link>{userType === "elder" && <Link to={`/diary/${connection._id}`}><Button variant="outline" className="rounded-full"><BookOpen className="w-4 h-4 mr-2" />View Diary</Button></Link>}</div>
                </div>
              </Card>
            </motion.div>;
          })}
        </div>
        {filteredConnections.length === 0 && <Card className="p-8 text-center bg-white/80 rounded-2xl"><Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" /><p className="text-muted-foreground">No connections match your search.</p></Card>}
      </>}
      {!isLoading && !error && connectionsList.length === 0 && <Card className="p-12 text-center bg-white/80 rounded-2xl"><Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" /><h3 className="text-xl mb-2">No connections yet</h3><p className="text-muted-foreground">{userType === "elder" ? "Accepted students will appear here." : "Choose a mentor or complete a QR connection to get started."}</p></Card>}
    </div>
  );
}
