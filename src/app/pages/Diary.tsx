import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { BookOpen, Plus, Calendar, Smile, Frown, Meh, Heart, Trash2, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import { diary } from "../lib/api";
import { toast } from "sonner";

interface DiaryEntry { _id: string; content: string; createdAt: string; mood?: string; sharedWithMentor?: boolean; }
const moodIcons: Record<string, any> = { happy: { icon: Smile, color: "from-[#FEF3C7] to-[#FDE68A]" }, sad: { icon: Frown, color: "from-[#BAE6FD] to-[#7DD3FC]" }, neutral: { icon: Meh, color: "from-[#E9E4FF] to-[#C4B5FD]" }, grateful: { icon: Heart, color: "from-[#D1FAE5] to-[#A7F3D0]" } };

export function Diary() {
  const navigate = useNavigate();
  const { studentProfile } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntryContent, setNewEntryContent] = useState("");
  const [selectedMood, setSelectedMood] = useState("neutral");
  const [shareWithMentor, setShareWithMentor] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadEntries = async () => {
    try { setError(""); const response = await diary.getEntries(); setEntries(response.data?.entries || []); }
    catch (err: any) { setError(err.message || "Unable to load your diary."); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { if (!studentProfile) navigate("/login"); else loadEntries(); }, [studentProfile, navigate]);
  if (!studentProfile) return null;

  const handleAddEntry = async () => {
    if (!newEntryContent.trim() || isSaving) return;
    setIsSaving(true);
    try { const response = await diary.createEntry(newEntryContent.trim(), selectedMood, shareWithMentor); if (response.data?.entry) setEntries((current) => [response.data!.entry, ...current]); setNewEntryContent(""); setSelectedMood("neutral"); setShowNewEntry(false); toast.success("Diary entry saved"); }
    catch (err: any) { toast.error(err.message || "Unable to save diary entry"); }
    finally { setIsSaving(false); }
  };

  const handleDeleteEntry = async (id: string) => {
    try { await diary.deleteEntry(id); setEntries((current) => current.filter((entry) => entry._id !== id)); toast.success("Diary entry deleted"); }
    catch (err: any) { toast.error(err.message || "Unable to delete diary entry"); }
  };

  const formatDate = (value: string) => new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return <div className="p-4 lg:p-8 max-w-4xl mx-auto">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center"><BookOpen className="w-6 h-6 text-white" /></div><div><h1 className="text-3xl">My Personal Diary</h1><p className="text-sm text-muted-foreground">Encrypted at rest and visible only according to your sharing choice.</p></div></div><Button onClick={() => setShowNewEntry(!showNewEntry)} className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] text-white rounded-full"><Plus className="w-4 h-4 mr-2" />New Entry</Button></div><p className="text-muted-foreground">Write about your day, feelings, thoughts, or anything on your mind.</p></motion.div>
    {showNewEntry && <Card className="p-6 mb-6 bg-white/80 border-border shadow-lg rounded-2xl"><h3 className="mb-4">New Diary Entry</h3><div className="mb-4"><label className="block text-sm mb-2">How are you feeling?</label><div className="flex gap-2">{Object.entries(moodIcons).map(([mood, { icon: Icon, color }]) => <button key={mood} onClick={() => setSelectedMood(mood)} className={`p-3 rounded-xl bg-gradient-to-br ${color} ${selectedMood === mood ? "ring-4 ring-primary scale-110" : "opacity-60"}`}><Icon className="w-6 h-6 text-white" /></button>)}</div></div><textarea value={newEntryContent} onChange={(event) => setNewEntryContent(event.target.value)} placeholder="Write your thoughts here…" className="w-full p-4 rounded-xl bg-input-background border border-border min-h-[200px] resize-none focus:outline-none focus:ring-2 focus:ring-primary" /><label className="flex items-center gap-2 text-sm mt-4"><input type="checkbox" checked={shareWithMentor} onChange={(event) => setShareWithMentor(event.target.checked)} />Allow my connected mentor to read this entry</label><div className="flex gap-2 mt-4"><Button onClick={handleAddEntry} disabled={!newEntryContent.trim() || isSaving} className="flex-1 bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0] text-accent-foreground rounded-full">{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Entry</Button><Button onClick={() => setShowNewEntry(false)} variant="outline" className="rounded-full">Cancel</Button></div></Card>}
    {isLoading && <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
    {!isLoading && error && <Card className="p-8 text-center bg-white/80 rounded-2xl"><AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive" /><p className="text-muted-foreground">{error}</p><Button onClick={loadEntries} variant="outline" className="mt-4 rounded-full">Try again</Button></Card>}
    {!isLoading && !error && entries.length === 0 && <Card className="p-12 bg-white/80 rounded-2xl text-center"><BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" /><h3 className="text-xl mb-2">No entries yet</h3><p className="text-muted-foreground">Start writing your first diary entry.</p></Card>}
    {!isLoading && !error && entries.length > 0 && <div className="space-y-4">{entries.map((entry, index) => { const config = moodIcons[entry.mood || "neutral"] || moodIcons.neutral; const MoodIcon = config.icon; return <motion.div key={entry._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}><Card className="p-6 bg-white/80 border-border hover:shadow-lg transition-all rounded-2xl group"><div className="flex items-start justify-between mb-4"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`}><MoodIcon className="w-5 h-5 text-white" /></div><p className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" />{formatDate(entry.createdAt)}</p></div><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground flex items-center gap-1">{entry.sharedWithMentor === false ? <><EyeOff className="w-3 h-3" />Private</> : <><Eye className="w-3 h-3" />Shared</>}</span><Button onClick={() => handleDeleteEntry(entry._id)} variant="ghost" size="sm" className="text-destructive-foreground hover:bg-destructive/10 rounded-full"><Trash2 className="w-4 h-4" /></Button></div></div><p className="whitespace-pre-wrap leading-relaxed">{entry.content}</p></Card></motion.div>; })}</div>}
    <Card className="mt-8 p-6 bg-gradient-to-br from-[#E9E4FF] to-[#D1FAE5] border-none rounded-2xl"><h3 className="mb-3">🔒 Your Privacy Matters</h3><p className="text-sm">Diary content is encrypted before it is stored. Each entry has its own sharing setting, and you can delete it at any time.</p></Card>
  </div>;
}
