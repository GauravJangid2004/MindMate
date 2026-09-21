import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Link } from "react-router";
import { Wind } from "lucide-react";

export function WellnessHub() {
  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl mb-3">Wellness Hub</h1>
        <p className="text-muted-foreground">
          Take a moment to center yourself with guided breathing exercises.
        </p>
      </motion.div>

      {/* Breathing Exercise */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Link to="/breathing">
          <Card className="p-8 lg:p-12 bg-gradient-to-br from-[#E9E4FF] via-[#D1FAE5] to-[#E0F2FE] border-none rounded-3xl shadow-xl hover:shadow-2xl transition-all cursor-pointer group">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Wind className="w-12 h-12 text-white" />
              </div>
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-3xl mb-3">Guided Breathing Exercise</h2>
                <p className="text-muted-foreground mb-6 text-lg">
                  Feeling overwhelmed or anxious? Take a 2-minute breathing break to reset and find calm.
                </p>
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-sm">
                  <div className="bg-white/60 px-4 py-2 rounded-full">
                    <span className="font-medium">4-7-8 Relaxation</span>
                  </div>
                  <div className="bg-white/60 px-4 py-2 rounded-full">
                    <span className="font-medium">Box Breathing</span>
                  </div>
                  <div className="bg-white/60 px-4 py-2 rounded-full">
                    <span className="font-medium">Calming Breath</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      </motion.div>

      {/* Benefits Card */}
      <Card className="mt-8 p-6 lg:p-8 bg-white/80 backdrop-blur-sm border-border shadow-lg rounded-2xl">
        <h3 className="text-xl mb-4">Benefits of Breathing Exercises</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
            <div>
              <h4 className="font-medium mb-1">Reduces Stress & Anxiety</h4>
              <p className="text-sm text-muted-foreground">
                Activates your body's relaxation response
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
            <div>
              <h4 className="font-medium mb-1">Improves Focus</h4>
              <p className="text-sm text-muted-foreground">
                Clears your mind and enhances concentration
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
            <div>
              <h4 className="font-medium mb-1">Better Sleep</h4>
              <p className="text-sm text-muted-foreground">
                Helps you relax before bedtime
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
            <div>
              <h4 className="font-medium mb-1">Emotional Balance</h4>
              <p className="text-sm text-muted-foreground">
                Regulates emotions and promotes calmness
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tips Card */}
      <Card className="mt-6 p-6 bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD] border-none rounded-2xl">
        <h3 className="mb-3">💡 Quick Tips</h3>
        <ul className="space-y-2 text-sm text-foreground">
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Practice daily, even when you feel calm, to build the habit</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Find a quiet, comfortable space where you won't be disturbed</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>If you feel dizzy, return to normal breathing and try a gentler pattern</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Combine with meditation or calming music for enhanced benefits</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}