import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Play, Pause, RotateCcw, Volume2, VolumeOff } from "lucide-react";

const breathingPatterns = [
  { name: "4-7-8 Relaxation", inhale: 4, hold: 7, exhale: 8, cycles: 4 },
  { name: "Box Breathing", inhale: 4, hold: 4, exhale: 4, cycles: 5 },
  { name: "Calming Breath", inhale: 4, hold: 2, exhale: 6, cycles: 6 },
];

export function BreathingExercise() {
  const [selectedPattern, setSelectedPattern] = useState(breathingPatterns[0]);
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [countdown, setCountdown] = useState(selectedPattern.inhale);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) return prev - 1;

        // Move to next phase
        if (currentPhase === "inhale") {
          setCurrentPhase("hold");
          return selectedPattern.hold;
        } else if (currentPhase === "hold") {
          setCurrentPhase("exhale");
          return selectedPattern.exhale;
        } else {
          // Completed one cycle
          if (currentCycle >= selectedPattern.cycles) {
            setIsActive(false);
            setCurrentCycle(1);
            setCurrentPhase("inhale");
            return selectedPattern.inhale;
          }
          setCurrentCycle((c) => c + 1);
          setCurrentPhase("inhale");
          return selectedPattern.inhale;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, currentPhase, currentCycle, selectedPattern]);

  const handleStart = () => {
    setIsActive(true);
    setCurrentPhase("inhale");
    setCountdown(selectedPattern.inhale);
    setCurrentCycle(1);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setCurrentPhase("inhale");
    setCountdown(selectedPattern.inhale);
    setCurrentCycle(1);
  };

  const getCircleScale = () => {
    const baseScale = 0.6;
    const maxScale = 1.2;
    
    if (currentPhase === "inhale") {
      return maxScale;
    } else if (currentPhase === "exhale") {
      return baseScale;
    }
    return (baseScale + maxScale) / 2;
  };

  const getPhaseText = () => {
    if (currentPhase === "inhale") return "Breathe In";
    if (currentPhase === "hold") return "Hold";
    return "Breathe Out";
  };

  const getPhaseColor = () => {
    if (currentPhase === "inhale") return "from-[#BAE6FD] to-[#7DD3FC]";
    if (currentPhase === "hold") return "from-[#FEF3C7] to-[#FDE68A]";
    return "from-[#D1FAE5] to-[#A7F3D0]";
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl mb-3">Guided Breathing</h1>
        <p className="text-muted-foreground">
          Take a few minutes to calm your mind and reduce stress through guided breathing exercises.
        </p>
      </motion.div>

      {/* Pattern Selection */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {breathingPatterns.map((pattern) => (
          <Card
            key={pattern.name}
            onClick={() => {
              if (!isActive) {
                setSelectedPattern(pattern);
                setCountdown(pattern.inhale);
              }
            }}
            className={`p-4 cursor-pointer transition-all rounded-2xl ${
              selectedPattern.name === pattern.name
                ? "ring-4 ring-primary bg-gradient-to-br from-[#E9E4FF] to-[#D1FAE5] shadow-lg"
                : "bg-white/80 backdrop-blur-sm hover:shadow-md"
            } ${isActive ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <h3 className="mb-2">{pattern.name}</h3>
            <p className="text-sm text-muted-foreground">
              {pattern.inhale}s in · {pattern.hold}s hold · {pattern.exhale}s out
            </p>
            <p className="text-xs text-muted-foreground mt-1">{pattern.cycles} cycles</p>
          </Card>
        ))}
      </div>

      {/* Breathing Animation */}
      <Card className="p-8 lg:p-12 bg-gradient-to-br from-white to-[#F8F9FA] rounded-3xl shadow-xl mb-6">
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-md aspect-square flex items-center justify-center mb-8">
            {/* Animated Circle */}
            <motion.div
              animate={{
                scale: isActive ? getCircleScale() : 0.8,
              }}
              transition={{
                duration: currentPhase === "inhale" ? selectedPattern.inhale :
                          currentPhase === "hold" ? selectedPattern.hold :
                          selectedPattern.exhale,
                ease: "easeInOut",
              }}
              className={`absolute w-64 h-64 rounded-full bg-gradient-to-br ${getPhaseColor()} blur-2xl opacity-60`}
            />
            <motion.div
              animate={{
                scale: isActive ? getCircleScale() : 0.9,
              }}
              transition={{
                duration: currentPhase === "inhale" ? selectedPattern.inhale :
                          currentPhase === "hold" ? selectedPattern.hold :
                          selectedPattern.exhale,
                ease: "easeInOut",
              }}
              className={`relative w-48 h-48 rounded-full bg-gradient-to-br ${getPhaseColor()} shadow-2xl flex flex-col items-center justify-center`}
            >
              <span className="text-6xl mb-2">{countdown}</span>
              <span className="text-sm uppercase tracking-wider opacity-80">{getPhaseText()}</span>
            </motion.div>
          </div>

          {/* Progress */}
          <div className="text-center mb-6">
            <p className="text-muted-foreground mb-2">
              Cycle {currentCycle} of {selectedPattern.cycles}
            </p>
            <div className="flex gap-2 justify-center">
              {Array.from({ length: selectedPattern.cycles }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i < currentCycle - 1
                      ? "bg-primary"
                      : i === currentCycle - 1 && isActive
                      ? "bg-primary animate-pulse"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4">
            {!isActive ? (
              <Button
                onClick={handleStart}
                size="lg"
                className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6] text-white rounded-full px-8"
              >
                <Play className="w-5 h-5 mr-2" />
                Start
              </Button>
            ) : (
              <Button
                onClick={handlePause}
                size="lg"
                className="bg-gradient-to-r from-[#FCA5A5] to-[#F87171] hover:from-[#F87171] hover:to-[#EF4444] text-white rounded-full px-8"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
            )}
            <Button
              onClick={handleReset}
              size="lg"
              variant="outline"
              className="rounded-full px-6"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset
            </Button>
            <Button
              onClick={() => setSoundEnabled(!soundEnabled)}
              size="lg"
              variant="outline"
              className="rounded-full px-4"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeOff className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-gradient-to-br from-[#E9E4FF] to-[#D1FAE5] border-none rounded-2xl">
        <h3 className="mb-3">How to Practice</h3>
        <ul className="space-y-2 text-sm text-foreground">
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Find a comfortable seated position</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Keep your back straight and shoulders relaxed</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Breathe through your nose when possible</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Focus on the rhythm and let go of other thoughts</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>If you feel dizzy, return to normal breathing</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
