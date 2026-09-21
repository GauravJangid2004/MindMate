import { useState } from "react";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { User, Edit2, Save, Heart, MessageCircle, Activity, Shield, CheckCircle2, Copy } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Profile() {
  const { verification } = useAuth();
  const [nickname, setNickname] = useState("Anonymous User");
  const [isEditing, setIsEditing] = useState(false);
  const [handleCopied, setHandleCopied] = useState(false);

  const copyHandle = () => {
    if (verification.anonymousHandle) {
      navigator.clipboard.writeText(verification.anonymousHandle);
      setHandleCopied(true);
      setTimeout(() => setHandleCopied(false), 2000);
    }
  };
  const [preferences, setPreferences] = useState({
    fontSize: "medium",
    notifications: true,
    autoSave: true,
  });

  const stats = [
    { label: "Mood Entries", value: 12, icon: Activity, color: "from-[#C4B5FD] to-[#A78BFA]" },
    { label: "Conversations", value: 5, icon: MessageCircle, color: "from-[#BAE6FD] to-[#7DD3FC]" },
    { label: "Days Active", value: 8, icon: Heart, color: "from-[#D1FAE5] to-[#A7F3D0]" },
  ];

  const handleSave = () => {
    setIsEditing(false);
    // Save logic would go here
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl mb-3">Your Profile</h1>
        <p className="text-muted-foreground">
          Manage your anonymous profile and preferences
        </p>
      </motion.div>

      {/* Profile Card */}
      <Card className="p-6 lg:p-8 bg-white/80 backdrop-blur-sm border-border shadow-lg rounded-2xl mb-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center mb-4">
            <User className="w-12 h-12 text-white" />
          </div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="max-w-xs text-center"
              />
              <Button
                onClick={handleSave}
                size="sm"
                className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6] text-white rounded-full"
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-2xl">{nickname}</h2>
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                variant="ghost"
                className="rounded-full"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            Your identity is protected • 100% anonymous
          </p>

          {/* ZK Verified handle */}
          {verification.anonymousHandle && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-2 bg-gradient-to-r from-[#E9E4FF] to-[#D1FAE5] px-5 py-2.5 rounded-full border border-[#C4B5FD]/40">
                <Shield className="w-4 h-4 text-[#7C3AED]" />
                <span className="text-base font-bold font-mono text-[#5B21B6] tracking-wide">
                  {verification.anonymousHandle}
                </span>
                <button onClick={copyHandle} className="text-[#7C3AED] hover:text-[#5B21B6] transition-colors">
                  {handleCopied ? <CheckCircle2 className="w-4 h-4 text-[#059669]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#34D399]" />
                ZK-verified anonymous handle · Aadhaar never stored
              </p>
              {verification.zkCommitment && (
                <p className="text-[10px] text-muted-foreground font-mono">
                  ZK: {verification.zkCommitment.slice(0, 20)}…
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`p-4 bg-gradient-to-br ${stat.color} border-none rounded-xl text-white`}>
                  <Icon className="w-6 h-6 mb-2 opacity-80" />
                  <p className="text-2xl mb-1">{stat.value}</p>
                  <p className="text-sm opacity-90">{stat.label}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Preferences */}
      <Card className="p-6 lg:p-8 bg-white/80 backdrop-blur-sm border-border shadow-lg rounded-2xl mb-8">
        <h2 className="text-xl mb-4">Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
            <div>
              <h3 className="mb-1">Font Size</h3>
              <p className="text-sm text-muted-foreground">Adjust text size for better readability</p>
            </div>
            <select
              value={preferences.fontSize}
              onChange={(e) => setPreferences({ ...preferences, fontSize: e.target.value })}
              className="px-4 py-2 rounded-lg bg-white border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="xlarge">Extra Large</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
            <div>
              <h3 className="mb-1">Notifications</h3>
              <p className="text-sm text-muted-foreground">Receive reminders and updates</p>
            </div>
            <button
              onClick={() => setPreferences({ ...preferences, notifications: !preferences.notifications })}
              className={`w-12 h-6 rounded-full transition-colors ${
                preferences.notifications ? "bg-primary" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                  preferences.notifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
            <div>
              <h3 className="mb-1">Auto-save Journal Entries</h3>
              <p className="text-sm text-muted-foreground">Automatically save your thoughts</p>
            </div>
            <button
              onClick={() => setPreferences({ ...preferences, autoSave: !preferences.autoSave })}
              className={`w-12 h-6 rounded-full transition-colors ${
                preferences.autoSave ? "bg-primary" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                  preferences.autoSave ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Account Actions */}
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-border shadow-lg rounded-2xl">
        <h2 className="text-xl mb-4">Account</h2>
        <div className="space-y-3">
          <Button variant="outline" className="w-full rounded-full justify-start">
            Export My Data
          </Button>
          <Button variant="outline" className="w-full rounded-full justify-start text-destructive-foreground hover:bg-destructive/10">
            Delete Account
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Deleting your account will permanently remove all your data. This cannot be undone.
        </p>
      </Card>
    </div>
  );
}
