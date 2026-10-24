import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { BookOpen, Calendar, Smile, Frown, Meh, Heart, User, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router";
import { connections, diary } from "../lib/api";

interface DiaryEntry { _id: string; content: string; createdAt: string; mood?: string; }
const moodIcons: Record<string, any> = { happy: { icon: Smile, color: "from-[#FEF3C7] to-[#FDE68A]", label: "Happy" }, sad: { icon: Frown, color: "from-[#BAE6FD] to-[#7DD3FC]", label: "Sad" }, neutral: { icon: Meh, color: "from-[#E9E4FF] to-[#C4B5FD]", label: "Neutral" }, grateful: { icon: Heart, color: "from-[#D1FAE5] to-[#A7F3D0]", label: "Grateful" } };

export function StudentDiary() {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { elderProfile } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [student, setStudent] = useState<{ id: string; anonymousHandle: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!elderProfile) { navigate("/login"); return; }
    if (!studentId) {
      connections.getConnections().then((response) => {
        const firstStudent = response.data?.connections?.[0];
        if (firstStudent?._id) navigate(`/diary/${firstStudent._id}`, { replace: true });
        else setError("No connected students have shared a diary yet.");
      }).catch((err: any) => setError(err.message || "Unable to load connected students.")).finally(() => setIsLoading(false));
      return;
    }
    diary.getStudentDiary(studentId).then((response) => { setStudent(response.data?.student || null); setEntries(response.data?.entries || []); }).catch((err: any) => setError(err.message || "Unable to load this diary.")).finally(() => setIsLoading(false));
  }, [elderProfile, navigate, studentId]);

  if (!elderProfile) return null;
  const formatDate = (value: string) => new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return <div className="p-4 lg:p-8 max-w-4xl mx-auto"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8"><div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#BAE6FD] to-[#7DD3FC] flex items-center justify-center"><BookOpen className="w-6 h-6 text-white" /></div><div><h1 className="text-3xl">Student's Diary</h1><p className="text-sm text-muted-foreground">Read-only entries explicitly shared with you.</p></div></div><p className="text-muted-foreground">Use these reflections to provide thoughtful, respectful support.</p></motion.div>
    {student && <Card className="p-6 mb-6 bg-gradient-to-br from-[#E9E4FF] to-[#D1FAE5] border-none rounded-2xl"><div className="flex items-center gap-4"><div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#BAE6FD] to-[#7DD3FC] flex items-center justify-center"><User className="w-7 h-7 text-white" /></div><div><h3>{student.anonymousHandle || "Anonymous Student"}</h3><p className="text-sm text-muted-foreground">Connected student</p></div></div></Card>}
    {isLoading && <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
    {!isLoading && error && <Card className="p-8 text-center bg-white/80 rounded-2xl"><AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive" /><p className="text-muted-foreground">{error}</p></Card>}
    {!isLoading && !error && entries.length === 0 && <Card className="p-12 bg-white/80 rounded-2xl text-center"><BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" /><h3 className="text-xl mb-2">No shared entries</h3><p className="text-muted-foreground">This student has not shared any diary entries with you.</p></Card>}
    {!isLoading && !error && entries.length > 0 && <div className="space-y-4">{entries.map((entry, index) => { const config = moodIcons[entry.mood || "neutral"] || moodIcons.neutral; const MoodIcon = config.icon; return <motion.div key={entry._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}><Card className="p-6 bg-white/80 border-border rounded-2xl"><div className="flex items-center gap-3 mb-4"><div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`}><MoodIcon className="w-5 h-5 text-white" /></div><div><p className="text-sm font-medium">{config.label}</p><p className="text-xs text-muted-foreground flex items-center gap-2"><Calendar className="w-3 h-3" />{formatDate(entry.createdAt)}</p></div></div><p className="whitespace-pre-wrap leading-relaxed">{entry.content}</p></Card></motion.div>; })}</div>}
  </div>;
}
