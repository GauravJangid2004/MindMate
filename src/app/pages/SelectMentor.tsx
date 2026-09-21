import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { User, Send, CheckCircle2, Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Mock mentors data
const mockMentors = [
  {
    id: "elder_1",
    gender: "Female",
    passion: "Career Guidance & Life Coaching",
    hobbies: ["Reading", "Gardening", "Cooking"],
    experience: "25 years in Education",
    available: true,
  },
  {
    id: "elder_2",
    gender: "Male",
    passion: "Technology & Innovation",
    hobbies: ["Chess", "Photography", "Travel"],
    experience: "30 years in IT Industry",
    available: true,
  },
  {
    id: "elder_3",
    gender: "Female",
    passion: "Mental Health & Wellness",
    hobbies: ["Yoga", "Meditation", "Art"],
    experience: "20 years as Psychologist",
    available: false,
  },
  {
    id: "elder_4",
    gender: "Male",
    passion: "Business & Entrepreneurship",
    hobbies: ["Golf", "Writing", "Mentoring"],
    experience: "35 years in Business",
    available: true,
  },
];

export function SelectMentor() {
  const navigate = useNavigate();
  const { studentProfile } = useAuth();
  const [mentors, setMentors] = useState(mockMentors);
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    if (!studentProfile) {
      navigate("/login");
    }
  }, [studentProfile, navigate]);

  if (!studentProfile) {
    return null;
  }

  const handleSendRequest = () => {
    if (selectedMentor) {
      // In real app, this would send a request to the backend
      setRequestSent(true);
      setTimeout(() => {
        navigate("/");
      }, 2000);
    }
  };

  if (requestSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDFCFB] via-[#F8F9FA] to-[#E9E4FF] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#D1FAE5] to-[#A7F3D0] flex items-center justify-center shadow-lg mb-6">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl mb-3">Request Sent!</h2>
          <p className="text-muted-foreground mb-4">
            Your connection request has been sent. You'll be notified when the mentor accepts.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFCFB] via-[#F8F9FA] to-[#E9E4FF] p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl mb-3">Select Your Mentor</h1>
          <p className="text-muted-foreground">
            Choose a mentor who aligns with your interests and goals. Send a connection request to start your journey.
          </p>
        </motion.div>

        {/* Mentors Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {mentors.map((mentor, index) => (
            <motion.div
              key={mentor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                onClick={() => mentor.available && setSelectedMentor(mentor.id)}
                className={`p-6 cursor-pointer transition-all rounded-2xl ${
                  selectedMentor === mentor.id
                    ? "ring-4 ring-primary shadow-xl bg-white"
                    : mentor.available
                    ? "bg-white/80 backdrop-blur-sm hover:shadow-lg"
                    : "bg-gray-100 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center flex-shrink-0">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg mb-1">Anonymous Mentor</h3>
                        <p className="text-sm text-muted-foreground">{mentor.gender}</p>
                      </div>
                      {!mentor.available && (
                        <Badge className="bg-muted text-muted-foreground">Unavailable</Badge>
                      )}
                    </div>
                    <div className="mb-3">
                      <p className="text-sm mb-2">
                        <strong>Passion:</strong> {mentor.passion}
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">{mentor.experience}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {mentor.hobbies.map((hobby) => (
                        <Badge
                          key={hobby}
                          className="bg-[#E9E4FF] text-[#6B21A8] hover:bg-[#E9E4FF] text-xs"
                        >
                          {hobby}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Selected Mentor Action */}
        {selectedMentor && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-20 lg:bottom-8 left-0 right-0 px-4 z-50"
          >
            <Card className="max-w-2xl mx-auto p-6 bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] border-none rounded-2xl shadow-2xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-white text-center sm:text-left">
                  <h3 className="mb-1">Ready to connect?</h3>
                  <p className="text-sm opacity-90">
                    Send a request to this mentor
                  </p>
                </div>
                <Button
                  onClick={handleSendRequest}
                  className="bg-white text-primary hover:bg-white/90 rounded-full px-8"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Request
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}