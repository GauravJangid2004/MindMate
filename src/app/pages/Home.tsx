import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  MessageCircle,
  Activity,
  Heart,
  Users,
  Shield,
  BookOpen,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

const moods = [
  { emoji: "😊", label: "Happy", color: "from-[#FEF3C7] to-[#FDE68A]" },
  { emoji: "😢", label: "Sad", color: "from-[#BAE6FD] to-[#7DD3FC]" },
  { emoji: "😰", label: "Anxious", color: "from-[#C4B5FD] to-[#A78BFA]" },
  { emoji: "😔", label: "Lonely", color: "from-[#E9D5FF] to-[#D8B4FE]" },
  { emoji: "😫", label: "Stressed", color: "from-[#FECACA] to-[#FCA5A5]" },
  { emoji: "😌", label: "Calm", color: "from-[#D1FAE5] to-[#A7F3D0]" },
];

const supportiveMessages = [
  "Every storm runs out of rain. Keep going.",
  "You are stronger than you think.",
  "It's okay not to be okay sometimes.",
  "Small steps forward are still progress.",
  "Your feelings are valid and important.",
];

export function Home() {
  const { isAuthenticated, userType, studentProfile, elderProfile } = useAuth();
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [currentMessage] = useState(
    supportiveMessages[Math.floor(Math.random() * supportiveMessages.length)]
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const hasConnectedMentor = studentProfile?.connectedMentorId;

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    // Simulate showing supportive response
    setTimeout(() => {
      setSelectedMood(null);
    }, 3000);
  };

  // Update quick actions based on connection status
  const getQuickActions = () => {
    if (userType === "elder") {
      return [
        {
          icon: Users,
          title: "View Requests",
          description: "See students who want to connect",
          link: "/requests",
          color: "from-[#C4B5FD] to-[#A78BFA]",
        },
        {
          icon: MessageCircle,
          title: "My Students",
          description: "Chat with connected students",
          link: "/connect",
          color: "from-[#BAE6FD] to-[#7DD3FC]",
        },
        {
          icon: Activity,
          title: "Breathing Exercise",
          description: "Calm your mind in 2 minutes",
          link: "/breathing",
          color: "from-[#D1FAE5] to-[#A7F3D0]",
        },
        {
          icon: BookOpen,
          title: "Community Support",
          description: "Share encouraging stories",
          link: "/community",
          color: "from-[#FEF3C7] to-[#FDE68A]",
        },
      ];
    }

    if (hasConnectedMentor) {
      return [
        {
          icon: MessageCircle,
          title: "Chat with Mentor",
          description: "Connect with your mentor",
          link: "/connect",
          color: "from-[#C4B5FD] to-[#A78BFA]",
        },
        {
          icon: Activity,
          title: "Breathing Exercise",
          description: "Calm your mind in 2 minutes",
          link: "/breathing",
          color: "from-[#BAE6FD] to-[#7DD3FC]",
        },
        {
          icon: BookOpen,
          title: "Wellness Resources",
          description: "Self-help tools and guidance",
          link: "/wellness",
          color: "from-[#D1FAE5] to-[#A7F3D0]",
        },
        {
          icon: Users,
          title: "Community Support",
          description: "Read encouraging stories",
          link: "/community",
          color: "from-[#FEF3C7] to-[#FDE68A]",
        },
      ];
    }

    return [
      {
        icon: Shield,
        title: "Connect with Mentor",
        description: "Complete QR connection",
        link: "/qr-connection",
        color: "from-[#C4B5FD] to-[#A78BFA]",
      },
      {
        icon: Activity,
        title: "Breathing Exercise",
        description: "Calm your mind in 2 minutes",
        link: "/breathing",
        color: "from-[#BAE6FD] to-[#7DD3FC]",
      },
      {
        icon: BookOpen,
        title: "Wellness Resources",
        description: "Self-help tools and guidance",
        link: "/wellness",
        color: "from-[#D1FAE5] to-[#A7F3D0]",
      },
      {
        icon: Users,
        title: "Community Support",
        description: "Read encouraging stories",
        link: "/community",
        color: "from-[#FEF3C7] to-[#FDE68A]",
      },
    ];
  };

  const displayActions = getQuickActions();

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6 sm:mb-10 mt-4 sm:mt-8"
      >
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="inline-block mb-4"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </motion.div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl mb-3 sm:mb-4 text-foreground">You Are Not Alone</h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-4 sm:mb-6">
          Welcome to your safe space. Whether you're a student facing academic stress or someone
          seeking emotional support, we're here for you.
        </p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-[#E9E4FF] to-[#D1FAE5] rounded-2xl p-4 max-w-md mx-auto"
        >
          <p className="text-sm text-foreground italic">"{currentMessage}"</p>
        </motion.div>
      </motion.div>

      {/* Quick Mood Check */}
      <Card className="mb-6 p-4 sm:p-6 bg-white/80 backdrop-blur-sm border-border shadow-lg rounded-2xl">
        <h2 className="text-xl mb-4 text-center">How are you feeling today?</h2>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {moods.map((mood, index) => (
            <motion.button
              key={mood.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleMoodSelect(mood.label)}
              className={`p-4 rounded-2xl bg-gradient-to-br ${mood.color} flex flex-col items-center gap-2 transition-all hover:shadow-lg ${
                selectedMood === mood.label ? "ring-4 ring-primary" : ""
              }`}
            >
              <span className="text-3xl">{mood.emoji}</span>
              <span className="text-sm">{mood.label}</span>
            </motion.button>
          ))}
        </div>
        {selectedMood && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-gradient-to-r from-[#C4B5FD]/20 to-[#A78BFA]/20 rounded-xl text-center"
          >
            <p className="text-sm text-foreground">
              Thank you for sharing. {selectedMood === "Happy" && "We're glad you're feeling good!"}
              {selectedMood === "Sad" && "It's okay to feel this way. Would you like to talk to someone?"}
              {selectedMood === "Anxious" && "Let's try some breathing exercises together."}
              {selectedMood === "Lonely" && "You're not alone. Our community is here for you."}
              {selectedMood === "Stressed" && "Take a deep breath. We have resources to help."}
              {selectedMood === "Calm" && "Wonderful! Keep nurturing that peace."}
            </p>
          </motion.div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {displayActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Link to={action.link}>
                <Card className="p-4 sm:p-6 bg-white/80 backdrop-blur-sm border-border hover:shadow-xl transition-all rounded-2xl group cursor-pointer h-full">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-sm sm:text-lg mb-1 sm:mb-2 font-medium">{action.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">{action.description}</p>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center"
      >
        {userType === "student" && !hasConnectedMentor ? (
          <Link to="/qr-connection">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6] text-white shadow-lg rounded-full px-6 py-4 sm:px-8 sm:py-6 text-base sm:text-lg"
            >
              <Shield className="w-5 h-5 mr-2" />
              Complete QR Connection
            </Button>
          </Link>
        ) : userType === "student" ? (
          <Link to="/connect">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6] text-white shadow-lg rounded-full px-6 py-4 sm:px-8 sm:py-6 text-base sm:text-lg"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Chat with Mentor
            </Button>
          </Link>
        ) : (
          <Link to="/requests">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6] text-white shadow-lg rounded-full px-6 py-4 sm:px-8 sm:py-6 text-base sm:text-lg"
            >
              <Users className="w-5 h-5 mr-2" />
              View Connection Requests
            </Button>
          </Link>
        )}
        <p className="text-sm text-muted-foreground mt-4">
          100% anonymous · {userType === "elder" ? "Guide with wisdom" : "Compassionate listeners"} · Safe space
        </p>
      </motion.div>

      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 right-10 w-32 h-32 rounded-full bg-gradient-to-br from-[#C4B5FD]/20 to-[#A78BFA]/20 blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 20, 0],
            x: [0, -10, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-20 left-10 w-40 h-40 rounded-full bg-gradient-to-br from-[#D1FAE5]/20 to-[#A7F3D0]/20 blur-3xl"
        />
      </div>
    </div>
  );
}