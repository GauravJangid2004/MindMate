import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { BookOpen, Calendar, Smile, Frown, Meh, Heart, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router";

interface DiaryEntry {
  id: string;
  content: string;
  timestamp: Date;
  mood?: string;
}

const moodIcons: Record<string, any> = {
  happy: { icon: Smile, color: "from-[#FEF3C7] to-[#FDE68A]", label: "Happy" },
  sad: { icon: Frown, color: "from-[#BAE6FD] to-[#7DD3FC]", label: "Sad" },
  neutral: { icon: Meh, color: "from-[#E9E4FF] to-[#C4B5FD]", label: "Neutral" },
  grateful: { icon: Heart, color: "from-[#D1FAE5] to-[#A7F3D0]", label: "Grateful" },
};

// Mock diary entries from student
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

// Mock student data based on ID
const getStudentData = (studentId: string) => {
  const students: Record<string, { name: string; course: string; age: number }> = {
    "1": { name: "Student A", course: "Computer Science", age: 19 },
    "2": { name: "Student B", course: "Business Administration", age: 21 },
    "3": { name: "Student C", course: "Psychology", age: 20 },
  };
  return students[studentId] || { name: "Anonymous Student", course: "Unknown", age: 0 };
};

export function StudentDiary() {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { elderProfile } = useAuth();
  const [entries] = useState<DiaryEntry[]>(mockEntries);

  const studentData = studentId ? getStudentData(studentId) : { name: "Anonymous Student", course: "Unknown", age: 0 };

  useEffect(() => {
    if (!elderProfile) {
      navigate("/login");
    }
  }, [elderProfile, navigate]);

  if (!elderProfile) {
    return null;
  }

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
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#BAE6FD] to-[#7DD3FC] flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl">Student's Diary</h1>
            <p className="text-sm text-muted-foreground">Read-only view of your student's private thoughts</p>
          </div>
        </div>
        <p className="text-muted-foreground">
          Your student has chosen to share their diary with you. Use these insights to provide better support and guidance.
        </p>
      </motion.div>

      {/* Student Info Card */}
      <Card className="p-6 mb-6 bg-gradient-to-br from-[#E9E4FF] to-[#D1FAE5] border-none rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#BAE6FD] to-[#7DD3FC] flex items-center justify-center">
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="mb-1">{studentData.name}</h3>
            <div className="flex gap-2 flex-wrap">
              <Badge className="bg-white/60 text-foreground hover:bg-white/60 text-xs">{studentData.course}</Badge>
              {studentData.age > 0 && (
                <Badge className="bg-white/60 text-foreground hover:bg-white/60 text-xs">{studentData.age} years</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Entries List */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <Card className="p-12 bg-white/80 backdrop-blur-sm rounded-2xl text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl mb-2">No entries yet</h3>
            <p className="text-muted-foreground">
              Your student hasn't written any diary entries yet
            </p>
          </Card>
        ) : (
          entries.map((entry, index) => {
            const MoodIcon = entry.mood ? moodIcons[entry.mood].icon : Meh;
            const moodColor = entry.mood ? moodIcons[entry.mood].color : "from-gray-400 to-gray-500";
            const moodLabel = entry.mood ? moodIcons[entry.mood].label : "Neutral";

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-white/80 backdrop-blur-sm border-border hover:shadow-lg transition-all rounded-2xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${moodColor} flex items-center justify-center`}>
                        <MoodIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">{moodLabel}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {formatDate(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed pl-13">
                    {entry.content}
                  </p>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Mentor Guidelines */}
      <Card className="mt-8 p-6 bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] border-none rounded-2xl">
        <h3 className="mb-3">💡 Mentoring Guidelines</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Use these entries to understand your student's emotional state and challenges</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Look for patterns in mood and recurring concerns</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Acknowledge their feelings in conversations - validation is powerful</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>If you notice signs of crisis, gently encourage them to seek professional help</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Respect their privacy - never share diary contents with others</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}