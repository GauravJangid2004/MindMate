import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { QrCode, CheckCircle2, AlertCircle, RefreshCw, User, Scan } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import { QRCodeSVG } from "qrcode.react";

export function QRConnection() {
  const navigate = useNavigate();
  const { userType, studentProfile, elderProfile, updateStudentMentor } = useAuth();
  const [step, setStep] = useState<"generate" | "scan" | "success">("generate");
  const [qrCode] = useState("QR_" + Math.random().toString(36).substring(7).toUpperCase());
  const [scanning, setScanning] = useState(false);

  const profile = userType === "student" ? studentProfile : elderProfile;

  useEffect(() => {
    if (!profile) {
      navigate("/login");
    }
  }, [profile, navigate]);

  if (!profile) {
    return null;
  }

  const handleScanComplete = () => {
    // Simulate successful scan
    setStep("success");
    if (userType === "student" && elderProfile) {
      updateStudentMentor("elder_1"); // In real app, this would be the scanned mentor ID
    }
    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFCFB] via-[#F8F9FA] to-[#E9E4FF] p-4 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl mb-3">Connect via QR Code</h1>
          <p className="text-muted-foreground">
            {userType === "student" 
              ? "Share your QR code with your mentor to complete the connection"
              : "Share your QR code with the student to complete the connection"}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Show QR Code */}
          <Card className="p-8 bg-white/80 backdrop-blur-sm border-border shadow-lg rounded-3xl">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg mb-4">Your QR Code</h3>
              <div className="bg-white p-6 rounded-2xl mb-4 inline-block">
                <QRCodeSVG value={qrCode} size={200} level="H" />
              </div>
              <div className="flex items-center gap-2 justify-center mb-2">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${userType === 'student' ? 'from-[#BAE6FD] to-[#7DD3FC]' : 'from-[#C4B5FD] to-[#A78BFA]'} flex items-center justify-center`}>
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Anonymous {userType === "student" ? "Student" : "Mentor"}</p>
                  <p className="text-xs text-muted-foreground">
                    {userType === "student" ? "Student" : "Mentor"}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Ask your {userType === "student" ? "mentor" : "student"} to scan this code
              </p>
            </div>
          </Card>

          {/* Scan QR Code */}
          <Card className="p-8 bg-white/80 backdrop-blur-sm border-border shadow-lg rounded-3xl">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-[#D1FAE5] to-[#A7F3D0] flex items-center justify-center mb-4">
                <Scan className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg mb-4">Scan {userType === "student" ? "Mentor's" : "Student's"} QR</h3>
              {!scanning ? (
                <>
                  <div className="bg-muted rounded-2xl p-12 mb-4">
                    <QrCode className="w-24 h-24 mx-auto text-muted-foreground opacity-30" />
                  </div>
                  <Button
                    onClick={() => setScanning(true)}
                    className="w-full bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0] hover:from-[#A7F3D0] hover:to-[#6EE7B7] text-accent-foreground rounded-full"
                  >
                    <Scan className="w-4 h-4 mr-2" />
                    Open Scanner
                  </Button>
                </>
              ) : (
                <>
                  <div className="bg-gradient-to-br from-[#1E293B] to-[#334155] rounded-2xl p-8 mb-4 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{
                          y: [-100, 100],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-full h-1 bg-[#10B981] shadow-lg shadow-[#10B981]/50"
                      />
                    </div>
                    <QrCode className="w-24 h-24 mx-auto text-white opacity-20" />
                  </div>
                  <Button
                    onClick={handleScanComplete}
                    className="w-full bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0] hover:from-[#A7F3D0] hover:to-[#6EE7B7] text-accent-foreground rounded-full mb-2"
                  >
                    Simulate Scan Complete
                  </Button>
                  <Button
                    onClick={() => setScanning(false)}
                    variant="ghost"
                    className="w-full rounded-full"
                  >
                    Cancel
                  </Button>
                </>
              )}
              <p className="text-sm text-muted-foreground mt-4">
                Point your camera at their QR code to connect
              </p>
            </div>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mt-6 p-6 bg-gradient-to-br from-[#E9E4FF] to-[#D1FAE5] border-none rounded-2xl">
          <h3 className="mb-3">How it works</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="text-primary">1.</span>
              <span>One person shows their QR code</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">2.</span>
              <span>The other person scans it using the scanner</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">3.</span>
              <span>Once connected, you can start chatting securely</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}