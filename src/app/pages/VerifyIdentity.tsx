import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Shield,
  Phone,
  CheckCircle2,
  Lock,
  RefreshCw,
  ChevronRight,
  Eye,
  EyeOff,
  Fingerprint,
  Sparkles,
  AlertCircle,
  Copy,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import {
  computeZKCommitment,
  deriveHandle,
  validateAadhaar,
  formatAadhaarDisplay,
  maskAadhaar,
} from "../lib/aadhaarZK";
import { auth as authApi } from "../lib/api";

type Step = "phone" | "otp" | "aadhaar" | "zk-computing" | "success";

const STEP_ORDER: Step[] = ["phone", "otp", "aadhaar", "zk-computing", "success"];
const STEP_LABELS = ["Phone", "OTP", "Aadhaar", "Verify", "Done"];

function StepIndicator({ current }: { current: Step }) {
  const idx = STEP_ORDER.indexOf(current);
  return (
    <div className="flex items-center gap-1 sm:gap-2 mb-8">
      {STEP_LABELS.map((label, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={label} className="flex items-center gap-1 sm:gap-2 flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                  done
                    ? "bg-gradient-to-br from-[#6EE7B7] to-[#34D399] text-white shadow-sm"
                    : active
                    ? "bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] text-white shadow-md shadow-violet-200"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`text-[10px] font-medium hidden sm:block ${
                  active ? "text-[#A78BFA]" : done ? "text-[#34D399]" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`flex-1 h-0.5 rounded-full transition-all duration-500 mb-4 sm:mb-5 ${
                  i < idx ? "bg-gradient-to-r from-[#6EE7B7] to-[#34D399]" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** 6-box OTP input component */
function OTPInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKey = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleChange = (idx: number, char: string) => {
    const digit = char.replace(/\D/g, "").slice(-1);
    const arr = value.split("").slice(0, 6);
    arr[idx] = digit;
    const next = arr.join("").slice(0, 6);
    onChange(next);
    if (digit && idx < 5) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    inputs.current[focusIdx]?.focus();
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-lg font-bold rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-[#C4B5FD] disabled:opacity-50 ${
            value[i]
              ? "border-[#A78BFA] bg-[#F5F0FF] text-[#6D28D9]"
              : "border-border bg-input-background text-foreground"
          }`}
        />
      ))}
    </div>
  );
}

/** Animated hash stream for ZK computation display */
function HashStream({ hash }: { hash: string }) {
  const rows = 5;
  const cols = 16;
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setRevealed((p) => Math.min(p + 4, hash.length));
    }, 60);
    return () => clearInterval(t);
  }, [hash]);

  const chunks: string[] = [];
  for (let i = 0; i < rows * cols; i += 2) {
    chunks.push(hash.slice(i, i + 2) || "??");
  }

  return (
    <div className="font-mono text-xs leading-relaxed overflow-hidden rounded-xl bg-[#0F0A1E] p-4 select-none">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-1 mb-1 flex-wrap">
          {Array.from({ length: cols }).map((_, c) => {
            const idx = r * cols + c;
            const isRevealed = idx * 2 < revealed;
            return (
              <motion.span
                key={c}
                animate={{ opacity: isRevealed ? 1 : 0.15 }}
                transition={{ duration: 0.3 }}
                className={`${
                  isRevealed ? "text-[#A78BFA]" : "text-[#3D2F6B]"
                }`}
              >
                {chunks[idx] ?? "??"}
              </motion.span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function VerifyIdentity() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyUser } = useAuth();
  const nextRoute = searchParams.get("next") ?? "/signup/student";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [sandboxOTP, setSandboxOTP] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [aadhaar, setAadhaar] = useState("");
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [aadhaarError, setAadhaarError] = useState("");
  const [zkHash, setZkHash] = useState("");
  const [handle, setHandle] = useState("");
  const [copied, setCopied] = useState(false);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setInterval(() => setResendCountdown((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [resendCountdown]);

  const sendOTP = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }
    try {
      const response = await authApi.sendOTP(digits);
      // In sandbox mode, the backend returns the OTP in the response
      if (response.data?.sandbox?.otp) {
        setSandboxOTP(response.data.sandbox.otp);
      }
      setOtp("");
      setOtpError(false);
      setResendCountdown(60);
      setStep("otp");
      toast.success("OTP sent! Check the sandbox box below.", { duration: 3000 });
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP. Please try again.");
    }
  };

  const handleVerifyOTP = async () => {
    const digits = phone.replace(/\D/g, "");
    try {
      await authApi.verifyOTP(digits, otp);
      setOtpError(false);
      setStep("aadhaar");
    } catch (err: any) {
      setOtpError(true);
      toast.error(err.message || "Incorrect OTP. Please try again.");
    }
  };

  const generateZKProof = async () => {
    const cleaned = aadhaar.replace(/\s/g, "");
    if (!validateAadhaar(cleaned)) {
      setAadhaarError("Please enter a valid 12-digit Aadhaar number.");
      return;
    }
    setAadhaarError("");
    setStep("zk-computing");

    try {
      // Simulate ZK computation delay
      await new Promise((r) => setTimeout(r, 800));
      const commitment = await computeZKCommitment(cleaned, phone.replace(/\D/g, ""));
      const anonymousHandle = deriveHandle(commitment);
      setZkHash(commitment);
      setHandle(anonymousHandle);
      await new Promise((r) => setTimeout(r, 2400)); // show animation
      setStep("success");
    } catch {
      toast.error("Verification failed. Please try again.");
      setStep("aadhaar");
    }
  };

  const copyHandle = () => {
    navigator.clipboard.writeText(handle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const proceed = () => {
    verifyUser(phone.replace(/\D/g, ""), zkHash, handle);
    navigate(nextRoute);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFCFB] via-[#F8F9FA] to-[#E9E4FF] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center shadow-md">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-foreground">MindMate</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mt-3">
            Identity Verification
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Secure, anonymous, zero-knowledge verified
          </p>
        </div>

        <StepIndicator current={step} />

        <AnimatePresence mode="wait">
          {/* ── Step 1: Phone ── */}
          {step === "phone" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="p-6 sm:p-8 bg-white/85 backdrop-blur-sm border-border shadow-xl rounded-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#BAE6FD] to-[#7DD3FC] flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Mobile Verification</h2>
                    <p className="text-sm text-muted-foreground">We'll send a one-time password</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 rounded-xl bg-muted border border-border text-sm text-muted-foreground font-medium select-none">
                        🇮🇳 +91
                      </div>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="98765 43210"
                        className="rounded-xl flex-1"
                        onKeyDown={(e) => e.key === "Enter" && sendOTP()}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      OTP will be sent to this number via SMS (sandbox mode)
                    </p>
                  </div>

                  <Button
                    onClick={sendOTP}
                    disabled={phone.replace(/\D/g, "").length < 10}
                    className="w-full bg-gradient-to-r from-[#BAE6FD] to-[#7DD3FC] hover:from-[#7DD3FC] hover:to-[#0EA5E9] text-white rounded-full py-5 disabled:opacity-50"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Send OTP
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-[#FFF7ED] border border-orange-200 rounded-2xl">
                  <p className="text-xs text-orange-700 flex gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Sandbox Mode:</strong> No real SMS is sent. The OTP will appear on screen after you click Send.
                    </span>
                  </p>
                </div>
              </Card>
            </motion.div>
          )}

          {/* ── Step 2: OTP ── */}
          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="p-6 sm:p-8 bg-white/85 backdrop-blur-sm border-border shadow-xl rounded-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center flex-shrink-0">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Enter OTP</h2>
                    <p className="text-sm text-muted-foreground">
                      Sent to +91 {phone.slice(0, 5)}•••••
                    </p>
                  </div>
                </div>

                {/* Sandbox OTP reveal */}
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-[#F0FDF4] border border-[#86EFAC] rounded-2xl"
                >
                  <p className="text-xs text-[#166534] font-medium mb-1">
                    🧪 Sandbox OTP (visible in demo only)
                  </p>
                  <p className="text-3xl font-bold tracking-[0.3em] text-[#15803D] font-mono">
                    {sandboxOTP}
                  </p>
                  <p className="text-xs text-[#166534] mt-1">
                    In production this would arrive via SMS
                  </p>
                </motion.div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-3 text-center">
                      Enter 6-digit code
                    </label>
                    <OTPInput value={otp} onChange={setOtp} />
                    {otpError && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-red-500 text-center mt-2"
                      >
                        Incorrect OTP. Please try again.
                      </motion.p>
                    )}
                  </div>

                  <Button
                    onClick={handleVerifyOTP}
                    disabled={otp.length < 6}
                    className="w-full bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6] text-white rounded-full py-5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Verify OTP
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      onClick={() => setStep("phone")}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ← Change number
                    </button>
                    {resendCountdown > 0 ? (
                      <span className="text-muted-foreground">
                        Resend in {resendCountdown}s
                      </span>
                    ) : (
                      <button
                        onClick={sendOTP}
                        className="text-[#A78BFA] hover:text-[#8B5CF6] font-medium flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* ── Step 3: Aadhaar ── */}
          {step === "aadhaar" && (
            <motion.div
              key="aadhaar"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="p-6 sm:p-8 bg-white/85 backdrop-blur-sm border-border shadow-xl rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FDE68A] to-[#F59E0B] flex items-center justify-center flex-shrink-0">
                    <Fingerprint className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Aadhaar Sandbox</h2>
                    <p className="text-sm text-muted-foreground">Zero-knowledge proof generation</p>
                  </div>
                </div>

                {/* ZK explanation */}
                <div className="mb-5 p-4 bg-gradient-to-br from-[#E9E4FF] to-[#EDE9FE] rounded-2xl border border-[#C4B5FD]/40">
                  <div className="flex gap-2">
                    <Shield className="w-5 h-5 text-[#7C3AED] flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-[#4C1D95] space-y-1">
                      <p className="font-semibold text-sm">How Zero-Knowledge works here</p>
                      <p>Your Aadhaar number is <strong>never stored</strong>. We compute a cryptographic commitment (SHA-256 hash with a private salt) entirely in your browser.</p>
                      <p>Only the hash travels — like proving you know a secret without revealing it.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Aadhaar Number
                    </label>
                    <div className="relative">
                      <Input
                        type={showAadhaar ? "text" : "password"}
                        inputMode="numeric"
                        value={showAadhaar ? formatAadhaarDisplay(aadhaar) : aadhaar}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
                          setAadhaar(raw);
                          setAadhaarError("");
                        }}
                        placeholder="XXXX XXXX XXXX"
                        className="rounded-xl pr-12 font-mono tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAadhaar(!showAadhaar)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showAadhaar ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {aadhaarError && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-red-500 mt-1 flex gap-1 items-center"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {aadhaarError}
                      </motion.p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {aadhaar.length}/12 digits · {showAadhaar ? "Visible" : "Hidden"} · Never stored
                    </p>
                  </div>

                  {/* Sandbox note */}
                  <div className="p-3 bg-[#FFF7ED] border border-orange-200 rounded-xl">
                    <p className="text-xs text-orange-700 flex gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Sandbox:</strong> Enter any 12-digit number (e.g. 1234 5678 9012). No real Aadhaar is used.
                      </span>
                    </p>
                  </div>

                  <Button
                    onClick={generateZKProof}
                    disabled={aadhaar.length < 12}
                    className="w-full bg-gradient-to-r from-[#FDE68A] to-[#F59E0B] hover:from-[#F59E0B] hover:to-[#D97706] text-white rounded-full py-5 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Zero-Knowledge Proof
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* ── Step 4: ZK Computing ── */}
          {step === "zk-computing" && (
            <motion.div
              key="zk-computing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6 sm:p-8 bg-white/85 backdrop-blur-sm border-border shadow-xl rounded-3xl">
                <div className="text-center mb-5">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center shadow-lg mb-4"
                  >
                    <Shield className="w-7 h-7 text-white" />
                  </motion.div>
                  <h2 className="text-xl font-semibold mb-1">Generating ZK Proof</h2>
                  <p className="text-sm text-muted-foreground">
                    Computing cryptographic commitment in your browser…
                  </p>
                </div>

                <HashStream hash={zkHash || "a3f9c12e847b6d05f291e4ac7830bd146f52c98d3e7a1049bc25f68d"} />

                <div className="mt-5 space-y-2">
                  {[
                    "Stripping Aadhaar from memory…",
                    "Applying MINDMATE_ZK_PROOF_V1 salt…",
                    "Computing SHA-256 commitment…",
                    "Deriving anonymous handle…",
                  ].map((msg, i) => (
                    <motion.div
                      key={msg}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.5 }}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.5 + 0.3 }}
                        className="w-4 h-4 rounded-full bg-gradient-to-br from-[#6EE7B7] to-[#34D399] flex items-center justify-center flex-shrink-0"
                      >
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </motion.div>
                      {msg}
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* ── Step 5: Success ── */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, type: "spring", damping: 20 }}
            >
              <Card className="p-6 sm:p-8 bg-white/85 backdrop-blur-sm border-border shadow-xl rounded-3xl">
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15, stiffness: 300 }}
                    className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#6EE7B7] to-[#34D399] flex items-center justify-center shadow-xl shadow-green-200 mb-4"
                  >
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-semibold text-foreground mb-1">
                    Identity Verified!
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Your anonymous handle has been created
                  </p>
                </div>

                {/* Handle display */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6 p-5 bg-gradient-to-br from-[#E9E4FF] to-[#D1FAE5] rounded-2xl text-center border border-[#C4B5FD]/30"
                >
                  <p className="text-xs font-medium text-[#7C3AED] mb-2 uppercase tracking-wider">
                    Your Anonymous Handle
                  </p>
                  <p className="text-3xl font-bold font-mono text-[#5B21B6] tracking-wider mb-3">
                    {handle}
                  </p>
                  <button
                    onClick={copyHandle}
                    className="inline-flex items-center gap-1.5 text-xs text-[#7C3AED] hover:text-[#5B21B6] font-medium transition-colors bg-white/60 px-3 py-1.5 rounded-full"
                  >
                    {copied ? (
                      <><CheckCircle2 className="w-3.5 h-3.5" /> Copied!</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> Copy handle</>
                    )}
                  </button>
                </motion.div>

                {/* ZK proof details */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mb-6 p-4 bg-muted rounded-2xl space-y-3"
                >
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Verification Summary
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Phone verified</span>
                      <span className="text-[#34D399] font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> +91 {phone.slice(0, 5)}•••••
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Aadhaar stored</span>
                      <span className="text-[#34D399] font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Never (ZK proof only)
                      </span>
                    </div>
                    <div className="flex justify-between text-xs items-start gap-2">
                      <span className="text-muted-foreground flex-shrink-0">ZK commitment</span>
                      <span className="text-[#A78BFA] font-mono text-[10px] break-all text-right">
                        {zkHash.slice(0, 24)}…
                      </span>
                    </div>
                  </div>
                </motion.div>

                <div className="flex items-start gap-2 mb-6 p-3 bg-[#FFF7ED] border border-orange-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-700">
                    Save your handle <strong>{handle}</strong>. It's your anonymous identity on MindMate — no names, ever.
                  </p>
                </div>

                <Button
                  onClick={proceed}
                  className="w-full bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6] text-white rounded-full py-5 shadow-lg shadow-violet-200"
                >
                  Continue to Profile Setup
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground"
        >
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Zero-Knowledge Proof</span>
          <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> End-to-End Encrypted</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Aadhaar Sandbox</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
