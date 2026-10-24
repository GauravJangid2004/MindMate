import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, TrendingUp, Heart, Loader2, AlertCircle } from "lucide-react";
import { mood as moodApi } from "../lib/api";
import { toast } from "sonner";

const moods = [{ emoji: "😊", label: "Great", value: 5, color: "#6EE7B7" }, { emoji: "🙂", label: "Good", value: 4, color: "#A7F3D0" }, { emoji: "😐", label: "Okay", value: 3, color: "#FDE68A" }, { emoji: "😔", label: "Low", value: 2, color: "#FDBA74" }, { emoji: "😞", label: "Bad", value: 1, color: "#FCA5A5" }];
interface MoodEntry { _id: string; moodValue: number; note?: string; createdAt: string; }

export function MoodTracker() {
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [stats, setStats] = useState({ averageMood: 0, weekEntries: 0, streak: 0 });
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadMood = async () => {
    try { setError(""); const [historyResponse, statsResponse] = await Promise.all([moodApi.getHistory(30), moodApi.getStats()]); setHistory(historyResponse.data?.entries || []); setStats(statsResponse.data?.stats || { averageMood: 0, weekEntries: 0, streak: 0 }); }
    catch (err: any) { setError(err.message || "Unable to load mood history."); }
    finally { setIsLoading(false); }
  };
  useEffect(() => { loadMood(); }, []);

  const chartData = useMemo(() => [...history].reverse().map((entry) => ({ day: new Date(entry.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), mood: entry.moodValue })), [history]);
  const handleLogMood = async () => { if (!selectedMood || isSaving) return; setIsSaving(true); try { await moodApi.logMood(selectedMood, note.trim() || undefined); setSelectedMood(null); setNote(""); await loadMood(); toast.success("Mood logged"); } catch (err: any) { toast.error(err.message || "Unable to log mood"); } finally { setIsSaving(false); } };

  return <div className="p-4 lg:p-8 max-w-6xl mx-auto"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8"><h1 className="text-3xl mb-3">Mood Tracker</h1><p className="text-muted-foreground">Track your emotional wellbeing over time and discover patterns in your mood.</p></motion.div>
    {isLoading && <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
    {!isLoading && error && <Card className="p-8 mb-8 text-center bg-white/80 rounded-2xl"><AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive" /><p className="text-muted-foreground">{error}</p><Button onClick={loadMood} variant="outline" className="mt-4 rounded-full">Try again</Button></Card>}
    {!isLoading && !error && <>
      <div className="grid md:grid-cols-3 gap-4 mb-8"><Card className="p-6 bg-gradient-to-br from-[#D1FAE5] to-[#A7F3D0] border-none rounded-2xl"><p className="text-sm text-accent-foreground mb-1">Average Mood</p><p className="text-3xl">{stats.averageMood || "—"}</p><TrendingUp className="w-10 h-10 text-accent-foreground opacity-50 mt-2" /></Card><Card className="p-6 bg-gradient-to-br from-[#E9E4FF] to-[#C4B5FD] border-none rounded-2xl"><p className="text-sm text-[#6B21A8] mb-1">Entries This Week</p><p className="text-3xl">{stats.weekEntries}</p><Calendar className="w-10 h-10 text-[#6B21A8] opacity-50 mt-2" /></Card><Card className="p-6 bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border-none rounded-2xl"><p className="text-sm text-[#92400E] mb-1">Current Streak</p><p className="text-3xl">{stats.streak ? `🔥 ${stats.streak}` : "0"}</p><Heart className="w-10 h-10 text-[#92400E] opacity-50 mt-2" /></Card></div>
      <Card className="p-6 lg:p-8 bg-white/80 border-border shadow-lg rounded-2xl mb-8"><h2 className="text-xl mb-4">How are you feeling today?</h2><div className="grid grid-cols-5 gap-3 mb-6">{moods.map((item) => <motion.button key={item.value} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectedMood(item.value)} className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${selectedMood === item.value ? "ring-4 ring-primary shadow-lg" : "bg-muted hover:bg-muted/80"}`} style={{ backgroundColor: selectedMood === item.value ? item.color : undefined }}><span className="text-3xl">{item.emoji}</span><span className="text-xs">{item.label}</span></motion.button>)}</div><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="What's on your mind? (optional)" className="w-full p-4 rounded-xl bg-muted border border-border resize-none mb-4 h-24 focus:outline-none focus:ring-2 focus:ring-primary" /><Button onClick={handleLogMood} disabled={!selectedMood || isSaving} className="w-full bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] text-white rounded-full">{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Log Mood</Button></Card>
      <Card className="p-6 lg:p-8 bg-white/80 border-border shadow-lg rounded-2xl mb-8"><h2 className="text-xl mb-6">Your Mood Journey</h2>{chartData.length === 0 ? <p className="text-center text-muted-foreground py-16">Log your first mood to see your trend.</p> : <div className="w-full" style={{ height: "320px" }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C4B5FD" stopOpacity={0.8} /><stop offset="95%" stopColor="#C4B5FD" stopOpacity={0.1} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /><XAxis dataKey="day" stroke="#9CA3AF" tick={{ fontSize: 12 }} /><YAxis stroke="#9CA3AF" domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 12 }} /><Tooltip /><Area type="monotone" dataKey="mood" stroke="#A78BFA" strokeWidth={3} fill="url(#colorMood)" /></AreaChart></ResponsiveContainer></div>}</Card>
      {history.length > 0 && <Card className="p-6 lg:p-8 bg-white/80 border-border shadow-lg rounded-2xl"><h2 className="text-xl mb-4">Recent Entries</h2><div className="space-y-4">{history.slice(0, 5).map((entry) => { const item = moods.find((candidate) => candidate.value === entry.moodValue); return <div key={entry._id} className="flex items-start gap-4 p-4 bg-muted rounded-xl"><div className="text-3xl">{item?.emoji || "😐"}</div><div className="flex-1"><div className="flex items-center justify-between mb-1"><span className="font-medium">{item?.label || "Mood"}</span><span className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</span></div>{entry.note && <p className="text-sm text-muted-foreground">{entry.note}</p>}</div></div>; })}</div></Card>}
    </>}
  </div>;
}
