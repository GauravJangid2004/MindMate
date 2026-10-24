import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { User, Edit2, Save, Heart, MessageCircle, Activity, Shield, CheckCircle2, Copy, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { chat, mood, users } from "../lib/api";
import { useNavigate } from "react-router";
import { toast } from "sonner";

type Preferences = { fontSize: string; notifications: boolean; autoSave: boolean };

export function Profile() {
  const navigate = useNavigate();
  const { verification, refreshUser, logout } = useAuth();
  const [nickname, setNickname] = useState("Anonymous User");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [handleCopied, setHandleCopied] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>({ fontSize: "medium", notifications: true, autoSave: true });
  const [stats, setStats] = useState({ moodEntries: 0, conversations: 0, daysActive: 0 });

  useEffect(() => {
    Promise.all([users.getProfile(), mood.getStats(), chat.getConversations()])
      .then(([profileResponse, moodResponse, conversationResponse]) => {
        const user = profileResponse.data?.user;
        if (user) {
          setNickname(user.nickname || "Anonymous User");
          if (user.preferences) setPreferences(user.preferences);
        }
        setStats({
          moodEntries: moodResponse.data?.stats?.totalEntries || 0,
          conversations: conversationResponse.data?.conversations?.length || 0,
          daysActive: moodResponse.data?.stats?.streak || 0,
        });
      })
      .catch((err: any) => toast.error(err.message || "Unable to load your profile"));
  }, []);

  const copyHandle = async () => {
    if (!verification.anonymousHandle) return;
    await navigator.clipboard.writeText(verification.anonymousHandle);
    setHandleCopied(true);
    setTimeout(() => setHandleCopied(false), 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await users.updateProfile({ nickname, preferences });
      await refreshUser();
      setIsEditing(false);
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.message || "Unable to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete your account and all associated data? This cannot be undone.")) return;
    try {
      await users.deleteAccount();
      logout();
      navigate("/login");
      toast.success("Account deleted");
    } catch (err: any) {
      toast.error(err.message || "Unable to delete account");
    }
  };

  const statCards = [
    { label: "Mood Entries", value: stats.moodEntries, Icon: Activity, color: "from-[#C4B5FD] to-[#A78BFA]" },
    { label: "Conversations", value: stats.conversations, Icon: MessageCircle, color: "from-[#BAE6FD] to-[#7DD3FC]" },
    { label: "Current Streak", value: stats.daysActive, Icon: Heart, color: "from-[#D1FAE5] to-[#A7F3D0]" },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl mb-3">Your Profile</h1>
        <p className="text-muted-foreground">Manage your anonymous profile and preferences.</p>
      </motion.div>

      <Card className="p-6 lg:p-8 bg-white/80 border-border shadow-lg rounded-2xl mb-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center mb-4"><User className="w-12 h-12 text-white" /></div>
          {isEditing ? (
            <div className="flex items-center gap-2"><Input value={nickname} onChange={(event) => setNickname(event.target.value)} className="max-w-xs text-center" maxLength={50} /><Button onClick={handleSave} disabled={isSaving} size="sm" className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] text-white rounded-full">{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}</Button></div>
          ) : (
            <div className="flex items-center gap-2"><h2 className="text-2xl">{nickname}</h2><Button onClick={() => setIsEditing(true)} size="sm" variant="ghost" className="rounded-full"><Edit2 className="w-4 h-4" /></Button></div>
          )}
          <p className="text-sm text-muted-foreground mt-2">Your identity is protected · 100% anonymous</p>
          {verification.anonymousHandle && <div className="mt-4 flex flex-col items-center gap-2"><div className="flex items-center gap-2 bg-gradient-to-r from-[#E9E4FF] to-[#D1FAE5] px-5 py-2.5 rounded-full border border-[#C4B5FD]/40"><Shield className="w-4 h-4 text-[#7C3AED]" /><span className="text-base font-bold font-mono text-[#5B21B6]">{verification.anonymousHandle}</span><button onClick={copyHandle}>{handleCopied ? <CheckCircle2 className="w-4 h-4 text-[#059669]" /> : <Copy className="w-4 h-4 text-[#7C3AED]" />}</button></div><p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-[#34D399]" />ZK-verified handle · Aadhaar never stored</p></div>}
        </div>
        <div className="grid md:grid-cols-3 gap-4">{statCards.map(({ label, value, Icon, color }) => <Card key={label} className={`p-4 bg-gradient-to-br ${color} border-none rounded-xl text-white`}><Icon className="w-6 h-6 mb-2 opacity-80" /><p className="text-2xl mb-1">{value}</p><p className="text-sm opacity-90">{label}</p></Card>)}</div>
      </Card>

      <Card className="p-6 lg:p-8 bg-white/80 border-border shadow-lg rounded-2xl mb-8">
        <h2 className="text-xl mb-4">Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-xl"><div><h3 className="mb-1">Font Size</h3><p className="text-sm text-muted-foreground">Adjust text size for better readability</p></div><select value={preferences.fontSize} onChange={(event) => setPreferences({ ...preferences, fontSize: event.target.value })} className="px-4 py-2 rounded-lg bg-white border border-border"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option><option value="xlarge">Extra Large</option></select></div>
          <div className="flex items-center justify-between p-4 bg-muted rounded-xl"><div><h3 className="mb-1">Notifications</h3><p className="text-sm text-muted-foreground">Receive reminders and updates</p></div><input type="checkbox" checked={preferences.notifications} onChange={(event) => setPreferences({ ...preferences, notifications: event.target.checked })} /></div>
          <div className="flex items-center justify-between p-4 bg-muted rounded-xl"><div><h3 className="mb-1">Auto-save Journal Entries</h3><p className="text-sm text-muted-foreground">Automatically save your thoughts</p></div><input type="checkbox" checked={preferences.autoSave} onChange={(event) => setPreferences({ ...preferences, autoSave: event.target.checked })} /></div>
        </div>
        {!isEditing && <Button onClick={handleSave} disabled={isSaving} variant="outline" className="mt-4 rounded-full">Save preferences</Button>}
      </Card>

      <Card className="p-6 bg-white/80 border-border shadow-lg rounded-2xl"><h2 className="text-xl mb-4">Account</h2><Button onClick={handleDelete} variant="outline" className="w-full rounded-full justify-start text-destructive-foreground hover:bg-destructive/10"><Trash2 className="w-4 h-4 mr-2" />Delete Account</Button><p className="text-xs text-muted-foreground mt-4">Deleting your account permanently removes your profile and associated data.</p></Card>
    </div>
  );
}
