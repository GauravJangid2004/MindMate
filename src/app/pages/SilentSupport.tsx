import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Volume2, VolumeOff, RefreshCw, Sparkles } from "lucide-react";

const calmingQuotes = [
  "You are enough, just as you are.",
  "This moment is temporary. You will get through this.",
  "Breathe. You're doing better than you think.",
  "It's okay to rest. You don't have to be productive all the time.",
  "Your feelings are valid, and so are you.",
  "Tomorrow is a new day, full of new possibilities.",
  "You are not alone in this journey.",
  "Be gentle with yourself. You're doing the best you can.",
  "Small steps forward are still progress.",
  "You deserve peace and happiness.",
];

const groundingExercises = [
  "Name 5 things you can see around you",
  "Name 4 things you can touch",
  "Name 3 things you can hear",
  "Name 2 things you can smell",
  "Name 1 thing you can taste",
];

const affirmations = [
  "I am safe in this moment",
  "I choose to let go of what I cannot control",
  "I am worthy of love and care",
  "I trust in my ability to handle challenges",
  "I am growing and learning every day",
];

export function SilentSupport() {
  const [currentQuote, setCurrentQuote] = useState(calmingQuotes[0]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [breathingActive, setBreathingActive] = useState(false);

  useEffect(() => {
    // Rotate quotes every 10 seconds
    const interval = setInterval(() => {
      setCurrentQuote(calmingQuotes[Math.floor(Math.random() * calmingQuotes.length)]);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const refreshQuote = () => {
    const newQuote = calmingQuotes[Math.floor(Math.random() * calmingQuotes.length)];
    setCurrentQuote(newQuote);
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl mb-3">Silent Support</h1>
        <p className="text-muted-foreground">
          Sometimes you don't need words. Just presence, comfort, and calm.
        </p>
      </motion.div>

      {/* Breathing Animation */}
      <Card className="p-8 lg:p-12 bg-gradient-to-br from-white to-[#F8F9FA] rounded-3xl shadow-xl mb-6">
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-sm aspect-square flex items-center justify-center mb-8">
            <motion.div
              animate={{
                scale: breathingActive ? [0.8, 1.2, 0.8] : 1,
                opacity: breathingActive ? [0.3, 0.6, 0.3] : 0.4,
              }}
              transition={{
                duration: 8,
                repeat: breathingActive ? Infinity : 0,
                ease: "easeInOut",
              }}
              className="absolute w-64 h-64 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] blur-3xl"
            />
            <motion.div
              animate={{
                scale: breathingActive ? [0.9, 1.1, 0.9] : 1,
              }}
              transition={{
                duration: 8,
                repeat: breathingActive ? Infinity : 0,
                ease: "easeInOut",
              }}
              className="relative w-48 h-48 rounded-full bg-gradient-to-br from-[#BAE6FD] to-[#7DD3FC] shadow-2xl flex items-center justify-center"
            >
              <Sparkles className="w-12 h-12 text-white" />
            </motion.div>
          </div>
          <Button
            onClick={() => setBreathingActive(!breathingActive)}
            className={`rounded-full px-8 ${
              breathingActive
                ? "bg-gradient-to-r from-[#FCA5A5] to-[#F87171] hover:from-[#F87171] hover:to-[#EF4444]"
                : "bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6]"
            } text-white`}
          >
            {breathingActive ? "Pause" : "Start Breathing Circle"}
          </Button>
        </div>
      </Card>

      {/* Calming Quote */}
      <motion.div
        key={currentQuote}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-8 lg:p-10 bg-gradient-to-br from-[#E9E4FF] to-[#D1FAE5] border-none rounded-3xl shadow-lg mb-6 text-center">
          <p className="text-xl lg:text-2xl text-foreground italic mb-4">"{currentQuote}"</p>
          <Button
            onClick={refreshQuote}
            variant="ghost"
            className="rounded-full text-muted-foreground hover:text-primary"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            New Message
          </Button>
        </Card>
      </motion.div>

      {/* Grounding Exercise */}
      <Card className="p-6 lg:p-8 bg-white/80 backdrop-blur-sm border-border shadow-lg rounded-2xl mb-6">
        <h2 className="text-xl mb-4">5-4-3-2-1 Grounding Technique</h2>
        <p className="text-sm text-muted-foreground mb-6">
          When you feel overwhelmed, slowly focus on your senses:
        </p>
        <div className="space-y-3">
          {groundingExercises.map((exercise, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setCurrentExerciseIndex(index)}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                currentExerciseIndex === index
                  ? "bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] text-white shadow-lg"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              <p className="text-sm">{exercise}</p>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Affirmations */}
      <Card className="p-6 lg:p-8 bg-gradient-to-br from-[#D1FAE5] to-[#A7F3D0] border-none rounded-2xl mb-6">
        <h2 className="text-xl mb-4 text-accent-foreground">Gentle Affirmations</h2>
        <div className="space-y-2">
          {affirmations.map((affirmation, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.15 }}
              className="flex items-center gap-3 text-accent-foreground"
            >
              <div className="w-2 h-2 rounded-full bg-accent-foreground/50" />
              <p className="text-sm">{affirmation}</p>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Sound Control */}
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-border rounded-2xl text-center">
        <Button
          onClick={() => setSoundEnabled(!soundEnabled)}
          variant="outline"
          className="rounded-full px-6"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-5 h-5 mr-2" />
              Calming Sounds On
            </>
          ) : (
            <>
              <VolumeOff className="w-5 h-5 mr-2" />
              Enable Calming Sounds
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          Gentle nature sounds can help create a peaceful environment
        </p>
      </Card>

      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 right-10 w-40 h-40 rounded-full bg-gradient-to-br from-[#C4B5FD]/10 to-[#A78BFA]/10 blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 30, 0],
            x: [0, -15, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-1/4 left-10 w-48 h-48 rounded-full bg-gradient-to-br from-[#D1FAE5]/10 to-[#A7F3D0]/10 blur-3xl"
        />
      </div>
    </div>
  );
}
