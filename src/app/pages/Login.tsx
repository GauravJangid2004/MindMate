import { Link } from "react-router";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Heart, User, Users, Shield, Lock, CheckCircle2 } from "lucide-react";

const trustBadges = [
  { icon: Shield, label: "Zero-Knowledge Verified" },
  { icon: Lock, label: "100% Anonymous" },
  { icon: CheckCircle2, label: "Aadhaar Sandbox" },
];

export function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFCFB] via-[#F8F9FA] to-[#E9E4FF] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        {/* Logo & Welcome */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block mb-4"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center shadow-lg">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          <h1 className="text-3xl sm:text-4xl mb-3">Welcome to MindMate</h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-sm mx-auto">
            Connect generations. Share wisdom. Find support. 100% Anonymous.
          </p>
        </div>

        {/* Verification notice */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <div className="bg-gradient-to-r from-[#E9E4FF] to-[#D1FAE5] rounded-2xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center flex-shrink-0 shadow-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#4C1D95]">Identity Verification Required</p>
              <p className="text-xs text-[#5B21B6] mt-0.5">
                All accounts are verified via phone OTP + Aadhaar sandbox using zero-knowledge proof — your Aadhaar number is <strong>never stored</strong>.
              </p>
            </div>
          </div>
        </motion.div>

        {/* User Type Selection */}
        <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
          {/* Student Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 sm:p-8 bg-white/80 backdrop-blur-sm border-border hover:shadow-xl transition-all rounded-3xl h-full">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#BAE6FD] to-[#7DD3FC] flex items-center justify-center mb-4 sm:mb-6 shadow-md">
                  <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl mb-2 sm:mb-3">I'm a Student</h2>
                <p className="text-sm text-muted-foreground mb-5 sm:mb-6">
                  Connect with experienced mentors who understand your journey and can provide guidance
                </p>

                <div className="space-y-3 w-full">
                  {/* Sign Up → verify first */}
                  <Link to="/verify?next=/signup/student" className="block">
                    <Button className="w-full bg-gradient-to-r from-[#BAE6FD] to-[#7DD3FC] hover:from-[#7DD3FC] hover:to-[#0EA5E9] text-white rounded-full py-5 sm:py-6">
                      <Shield className="w-4 h-4 mr-2" />
                      Sign Up as Student
                    </Button>
                  </Link>

                  <div className="relative flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Sign In → verify first */}
                  <Link to="/verify?next=/signup/student" className="block">
                    <Button variant="outline" className="w-full rounded-full py-5 sm:py-6 text-sm border-[#BAE6FD] text-[#0EA5E9] hover:bg-[#F0F9FF]">
                      Sign In as Student
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Elder/Mentor Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 sm:p-8 bg-white/80 backdrop-blur-sm border-border hover:shadow-xl transition-all rounded-3xl h-full">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center mb-4 sm:mb-6 shadow-md">
                  <Users className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl mb-2 sm:mb-3">I'm a Mentor</h2>
                <p className="text-sm text-muted-foreground mb-5 sm:mb-6">
                  Share your life experience and wisdom to guide the next generation
                </p>

                <div className="space-y-3 w-full">
                  <Link to="/verify?next=/signup/elder" className="block">
                    <Button className="w-full bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6] text-white rounded-full py-5 sm:py-6">
                      <Shield className="w-4 h-4 mr-2" />
                      Sign Up as Mentor
                    </Button>
                  </Link>

                  <div className="relative flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <Link to="/verify?next=/signup/elder" className="block">
                    <Button variant="outline" className="w-full rounded-full py-5 sm:py-6 text-sm border-[#C4B5FD] text-[#7C3AED] hover:bg-[#F5F0FF]">
                      Sign In as Mentor
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 sm:mt-8"
        >
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-[#D1FAE5] to-[#A7F3D0] border-none rounded-2xl">
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              {trustBadges.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs sm:text-sm text-accent-foreground font-medium">
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
