import { useState } from "react";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, TrendingUp, Smile, Frown, Meh, Heart } from "lucide-react";

const moods = [
  { emoji: "😊", label: "Great", value: 5, color: "#6EE7B7" },
  { emoji: "🙂", label: "Good", value: 4, color: "#A7F3D0" },
  { emoji: "😐", label: "Okay", value: 3, color: "#FDE68A" },
  { emoji: "😔", label: "Low", value: 2, color: "#FDBA74" },
  { emoji: "😞", label: "Bad", value: 1, color: "#FCA5A5" },
];

// Mock data for the past 7 days
const generateMockData = () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day, index) => ({
    id: index,
    day,
    mood: Math.floor(Math.random() * 3) + 2, // Random mood between 2-5
    energy: Math.floor(Math.random() * 4) + 2,
    stress: Math.floor(Math.random() * 3) + 1,
  }));
};

export function MoodTracker() {
  const [mockData] = useState(generateMockData());
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [entries, setEntries] = useState<Array<{ mood: number; note: string; date: string }>>(
    []
  );

  const handleLogMood = () => {
    if (selectedMood) {
      const newEntry = {
        mood: selectedMood,
        note,
        date: new Date().toLocaleString(),
      };
      setEntries([newEntry, ...entries]);
      setSelectedMood(null);
      setNote("");
    }
  };

  const averageMood = entries.length > 0
    ? (entries.reduce((sum, entry) => sum + entry.mood, 0) / entries.length).toFixed(1)
    : "N/A";

  const getMoodEmoji = (value: number) => {
    const mood = moods.find((m) => m.value === Math.round(value));
    return mood?.emoji || "😐";
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl mb-3">Mood Tracker</h1>
        <p className="text-muted-foreground">
          Track your emotional wellbeing over time and discover patterns in your mood.
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6 bg-gradient-to-br from-[#D1FAE5] to-[#A7F3D0] border-none rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-accent-foreground mb-1">Average Mood</p>
              <p className="text-3xl">{averageMood}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-accent-foreground opacity-50" />
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-[#E9E4FF] to-[#C4B5FD] border-none rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#6B21A8] mb-1">Entries This Week</p>
              <p className="text-3xl">{entries.length}</p>
            </div>
            <Calendar className="w-10 h-10 text-[#6B21A8] opacity-50" />
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border-none rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#92400E] mb-1">Current Streak</p>
              <p className="text-3xl">{entries.length > 0 ? "🔥 " + Math.min(entries.length, 7) : "0"}</p>
            </div>
            <Heart className="w-10 h-10 text-[#92400E] opacity-50" />
          </div>
        </Card>
      </div>

      {/* Log Today's Mood */}
      <Card className="p-6 lg:p-8 bg-white/80 backdrop-blur-sm border-border shadow-lg rounded-2xl mb-8">
        <h2 className="text-xl mb-4">How are you feeling today?</h2>
        <div className="grid grid-cols-5 gap-3 mb-6">
          {moods.map((mood, index) => (
            <motion.button
              key={mood.value}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedMood(mood.value)}
              className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${
                selectedMood === mood.value
                  ? "ring-4 ring-primary shadow-lg"
                  : "bg-muted hover:bg-muted/80"
              }`}
              style={{
                backgroundColor: selectedMood === mood.value ? mood.color : undefined,
              }}
            >
              <span className="text-3xl">{mood.emoji}</span>
              <span className="text-xs">{mood.label}</span>
            </motion.button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What's on your mind? (optional)"
          className="w-full p-4 rounded-xl bg-muted border border-border resize-none mb-4 h-24 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button
          onClick={handleLogMood}
          disabled={!selectedMood}
          className="w-full bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6] text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Log Mood
        </Button>
      </Card>

      {/* Mood Chart */}
      <Card className="p-6 lg:p-8 bg-white/80 backdrop-blur-sm border-border shadow-lg rounded-2xl mb-8">
        <h2 className="text-xl mb-6">Your Mood Journey</h2>
        <div className="w-full" style={{ height: '320px', minHeight: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C4B5FD" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#C4B5FD" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="day" 
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#9CA3AF" 
                domain={[0, 5]} 
                ticks={[1, 2, 3, 4, 5]}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="mood"
                stroke="#A78BFA"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorMood)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#A78BFA]" />
            <span>Mood Level</span>
          </div>
        </div>
      </Card>

      {/* Recent Entries */}
      {entries.length > 0 && (
        <Card className="p-6 lg:p-8 bg-white/80 backdrop-blur-sm border-border shadow-lg rounded-2xl">
          <h2 className="text-xl mb-4">Recent Entries</h2>
          <div className="space-y-4">
            {entries.slice(0, 5).map((entry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 p-4 bg-muted rounded-xl"
              >
                <div className="text-3xl">{moods.find((m) => m.value === entry.mood)?.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">
                      {moods.find((m) => m.value === entry.mood)?.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{entry.date}</span>
                  </div>
                  {entry.note && <p className="text-sm text-muted-foreground">{entry.note}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Insights */}
      <Card className="mt-8 p-6 bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD] border-none rounded-2xl">
        <h3 className="mb-3">💡 Insights</h3>
        <ul className="space-y-2 text-sm text-foreground">
          <li className="flex gap-2">
            <span>•</span>
            <span>Tracking your mood daily helps identify patterns and triggers</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Notice what activities or situations improve your wellbeing</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Share your mood trends with a mentor for personalized support</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}