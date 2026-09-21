import { useState } from "react";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  User,
  MessageCircle,
  Heart,
  CheckCircle2,
  Globe,
  Clock,
  UserCheck,
  BookOpen,
  Users,
} from "lucide-react";

// Mock connected mentors for students
const connectedMentors = [
  {
    id: 1,
    name: "Mentor Alex",
    role: "Psychology Mentor",
    specialties: ["Anxiety", "Academic Stress", "Life Transitions"],
    availability: "Available Now",
    language: "English, Spanish",
    verified: true,
    lastMessage: "How are you feeling today?",
    lastMessageTime: "2 hours ago",
  },
  {
    id: 2,
    name: "Mentor Jordan",
    role: "Life Coach",
    specialties: ["Loneliness", "Career Confusion", "Relationships"],
    availability: "Available Now",
    language: "English",
    verified: true,
    lastMessage: "Let's schedule a session",
    lastMessageTime: "1 day ago",
  },
];

// Mock connected students for mentors
const connectedStudents = [
  {
    id: 1,
    name: "Student A",
    age: 19,
    course: "Computer Science",
    hobbies: ["Reading", "Gaming", "Music"],
    recentMood: "😊",
    lastMessage: "Thank you for your support",
    lastMessageTime: "30 mins ago",
    diaryEntries: 5,
  },
  {
    id: 2,
    name: "Student B",
    age: 21,
    course: "Business Administration",
    hobbies: ["Sports", "Travel", "Photography"],
    recentMood: "😐",
    lastMessage: "I need some advice",
    lastMessageTime: "3 hours ago",
    diaryEntries: 3,
  },
  {
    id: 3,
    name: "Student C",
    age: 20,
    course: "Psychology",
    hobbies: ["Art", "Yoga", "Cooking"],
    recentMood: "🙂",
    lastMessage: "Feeling better today!",
    lastMessageTime: "5 hours ago",
    diaryEntries: 8,
  },
];

export function Connect() {
  const { userType } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter students/mentors based on search
  const filteredStudents = connectedStudents.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.hobbies.some((hobby) => hobby.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredMentors = connectedMentors.filter((mentor) =>
    mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.specialties.some((specialty) => specialty.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl mb-3">
          {userType === "elder" ? "My Students" : "My Mentors"}
        </h1>
        <p className="text-muted-foreground">
          {userType === "elder" 
            ? "Connect with your students and provide support through mentoring."
            : "Chat with your connected mentors for emotional support and guidance."}
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-6"
      >
        <div className="relative">
          <input
            type="text"
            placeholder={userType === "elder" ? "Search students..." : "Search mentors..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-4 pr-12 rounded-2xl bg-white/80 backdrop-blur-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Users className="w-5 h-5 text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2" />
        </div>
      </motion.div>

      {/* Mentor View: List of Students */}
      {userType === "elder" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="space-y-4">
            {filteredStudents.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-white/80 backdrop-blur-sm border-border hover:shadow-lg transition-all rounded-2xl">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#A7F3D0] to-[#6EE7B7] flex items-center justify-center flex-shrink-0">
                        <User className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg">{student.name}</h4>
                          <span className="text-2xl">{student.recentMood}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {student.age} years old • {student.course}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {student.hobbies.map((hobby) => (
                            <Badge
                              key={hobby}
                              className="bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5] text-xs px-2 py-1"
                            >
                              {hobby}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{student.lastMessageTime}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            <span>{student.diaryEntries} diary entries</span>
                          </div>
                        </div>
                        {student.lastMessage && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            "{student.lastMessage}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link to={`/chat/${student.id}`}>
                        <Button className="w-full lg:w-auto bg-gradient-to-r from-[#A7F3D0] to-[#6EE7B7] hover:from-[#6EE7B7] hover:to-[#34D399] text-white rounded-full px-6">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chat
                        </Button>
                      </Link>
                      <Link to={`/diary/${student.id}`}>
                        <Button variant="outline" className="w-full lg:w-auto rounded-full px-6">
                          <BookOpen className="w-4 h-4 mr-2" />
                          View Diary
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredStudents.length === 0 && (
            <Card className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl text-center">
              <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No students found matching your search."
                  : "You don't have any connected students yet. Students will appear here when they connect with you."}
              </p>
            </Card>
          )}
        </motion.div>
      )}

      {/* Student View: List of Mentors */}
      {userType === "student" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="space-y-4">
            {filteredMentors.map((mentor, index) => (
              <motion.div
                key={mentor.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-white/80 backdrop-blur-sm border-border hover:shadow-lg transition-all rounded-2xl">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center flex-shrink-0">
                        <User className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg">{mentor.name}</h4>
                          {mentor.verified && (
                            <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{mentor.role}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {mentor.specialties.map((specialty) => (
                            <Badge
                              key={specialty}
                              className="bg-[#E9E4FF] text-[#6B21A8] hover:bg-[#E9E4FF] text-xs px-2 py-1"
                            >
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{mentor.availability}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="w-4 h-4" />
                            <span>{mentor.language}</span>
                          </div>
                        </div>
                        {mentor.lastMessage && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            Last: "{mentor.lastMessage}" - {mentor.lastMessageTime}
                          </p>
                        )}
                      </div>
                    </div>
                    <Link to={`/chat/${mentor.id}`}>
                      <Button className="w-full lg:w-auto bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6] text-white rounded-full px-6">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredMentors.length === 0 && (
            <Card className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl text-center">
              <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No mentors found matching your search."
                  : "You don't have any connected mentors yet. Go to Browse Mentors to find and connect with mentors."}
              </p>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}
