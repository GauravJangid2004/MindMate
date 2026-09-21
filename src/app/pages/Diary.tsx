import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { BookOpen, Plus, Calendar, Smile, Frown, Meh, Heart, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";

interface DiaryEntry {
  id: string;
  content: string;
  timestamp: Date;
  mood?: string;
}

const moodIcons: Record<string, any> = {
  happy: { icon: Smile, color: "from-[#FEF3C7] to-[#FDE68A]" },
  sad: { icon: Frown, color: "from-[#BAE6FD] to-[#7DD3FC]" },
  neutral: { icon: Meh, color: "from-[#E9E4FF] to-[#C4B5FD]" },
  grateful: { icon: Heart, color: "from-[#D1FAE5] to-[#A7F3D0]" },
};

// Mock diary entries
const mockEntries: DiaryEntry[] = [
  {
    id: "1",
    content: "Today was challenging with my exams, but I managed to stay calm. I used the breathing exercises and it really helped me focus. I'm grateful for having this space to express myself.",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    mood: "grateful",
  },
  {
    id: "2",
    content: "Feeling a bit overwhelmed with assignments and deadlines. Sometimes I wonder if I'm doing enough. But I know I'm trying my best, and that's what matters.",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    mood: "sad",
  },
  {
    id: "3",
    content: "Had a great conversation with my mentor today. They shared some really helpful advice about time management. Feeling more hopeful about my future!",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    mood: "happy",
  },
];

export function Diary() {
  const navigate = useNavigate();
  const { studentProfile } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>(mockEntries);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntryContent, setNewEntryContent] = useState("");
  const [selectedMood, setSelectedMood] = useState<string>("neutral");

  useEffect(() => {
    if (!studentProfile) {
      navigate("/login");
    }
  }, [studentProfile, navigate]);

  if (!studentProfile) {
    return null;
  }

  const handleAddEntry = () => {
    if (newEntryContent.trim()) {
      const newEntry: DiaryEntry = {
        id: Date.now().toString(),
        content: newEntryContent,
        timestamp: new Date(),
        mood: selectedMood,
      };
      setEntries([newEntry, ...entries]);
      setNewEntryContent("");
      setSelectedMood("neutral");
      setShowNewEntry(false);
    }
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter((entry) => entry.id !== id));
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl">My Personal Diary</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Private — visible only to you and your mentor</p>
            </div>
          </div>
          <Button
            onClick={() => setShowNewEntry(!showNewEntry)}
            className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6] text-white rounded-full self-start sm:self-auto flex-shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </Button>
        </div>
        <p className="text-muted-foreground">
          Write about your day, feelings, thoughts, or anything that's on your mind. This is your safe space.
        </p>
      </motion.div>

      {/* New Entry Form */}
      {showNewEntry && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="p-6 mb-6 bg-white/80 backdrop-blur-sm border-border shadow-lg rounded-2xl">
            <h3 className="mb-4">New Diary Entry</h3>
            
            {/* Mood Selector */}
            <div className="mb-4">
              <label className="block text-sm mb-2">How are you feeling?</label>
              <div className="flex gap-2">
                {Object.entries(moodIcons).map(([mood, { icon: Icon, color }]) => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    className={`p-3 rounded-xl bg-gradient-to-br ${color} transition-all ${
                      selectedMood === mood ? "ring-4 ring-primary scale-110" : "opacity-60"
                    }`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </button>
                ))}
              </div>
            </div>

            {/* Content Input */}
            <textarea
              value={newEntryContent}
              onChange={(e) => setNewEntryContent(e.target.value)}
              placeholder="Write your thoughts here... No one is judging, this is your safe space."
              className="w-full p-4 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary min-h-[200px] resize-none"
            />

            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleAddEntry}
                disabled={!newEntryContent.trim()}
                className="flex-1 bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0] hover:from-[#A7F3D0] hover:to-[#6EE7B7] text-accent-foreground rounded-full"
              >
                Save Entry
              </Button>
              <Button
                onClick={() => {
                  setShowNewEntry(false);
                  setNewEntryContent("");
                  setSelectedMood("neutral");
                }}
                variant="outline"
                className="rounded-full"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Entries List */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <Card className="p-12 bg-white/80 backdrop-blur-sm rounded-2xl text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl mb-2">No entries yet</h3>
            <p className="text-muted-foreground mb-4">
              Start writing your first diary entry to express your thoughts and feelings
            </p>
            <Button
              onClick={() => setShowNewEntry(true)}
              className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6] text-white rounded-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Write First Entry
            </Button>
          </Card>
        ) : (
          entries.map((entry, index) => {
            const MoodIcon = entry.mood ? moodIcons[entry.mood].icon : Meh;
            const moodColor = entry.mood ? moodIcons[entry.mood].color : "from-gray-400 to-gray-500";

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-white/80 backdrop-blur-sm border-border hover:shadow-lg transition-all rounded-2xl group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${moodColor} flex items-center justify-center`}>
                        <MoodIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDeleteEntry(entry.id)}
                      variant="ghost"
                      size="sm"
                      className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-destructive-foreground hover:bg-destructive/10 rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Info Card */}
      <Card className="mt-8 p-6 bg-gradient-to-br from-[#E9E4FF] to-[#D1FAE5] border-none rounded-2xl">
        <h3 className="mb-3">🔒 Your Privacy Matters</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>These entries are completely private and only visible to you and your connected mentor</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Your mentor can read your entries to better understand and support you</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Write freely - this is a judgment-free zone for self-expression</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>You can delete any entry at any time</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}