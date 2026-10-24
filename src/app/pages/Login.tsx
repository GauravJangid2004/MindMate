import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Lock,
  Phone,
  Shield,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { auth as authApi } from "../lib/api";

const mindmateLogo = "/mindmate-logo.jpeg";

type AccountType = "student" | "elder";
type SignInStep = "phone" | "otp";

const trustBadges = [
  { icon: Shield, label: "Phone OTP Verified" },
  { icon: Lock, label: "100% Anonymous" },
  { icon: CheckCircle2, label: "Secure Sign In" },
];

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const requestedAccountType = searchParams.get("accountType");
  const requestedRole = requestedAccountType === "elder" || requestedAccountType === "mentor" ? "elder" : "student";
  const [accountType, setAccountType] = useState<AccountType>(requestedRole);
  const [step, setStep] = useState<SignInStep>("phone");
  const [phone, setPhone] = useState(() => (searchParams.get("phone") || "").replace(/\D/g, "").slice(0, 10));
  const [otp, setOtp] = useState("");
  const [sandboxOTP, setSandboxOTP] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedPhone = phone.replace(/\D/g, "");

  const signupPathFor = (type: AccountType) =>
    type === "elder" ? "/signup/mentor" : "/signup/student";

  const redirectToSignup = (type: AccountType = accountType) => {
    const params = new URLSearchParams({
      next: signupPathFor(type),
      mode: "signup",
      accountType: type === "elder" ? "mentor" : "student",
      phone: normalizedPhone,
    });
    navigate(`/verify?${params.toString()}`);
  };

  const sendOTP = async () => {
    if (normalizedPhone.length !== 10 || isSubmitting) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const registration = await authApi.checkPhone(normalizedPhone);
      const registeredType = registration.data?.userType as AccountType | null;

      if (!registration.data?.isRegistered || !registeredType) {
        toast.info("This phone number is not registered yet. Let's create your account.");
        redirectToSignup(accountType);
        return;
      }

      if (registeredType !== accountType) {
        setAccountType(registeredType);
        toast.info(
          `This phone number is registered as a ${registeredType === "elder" ? "mentor" : "student"}. We switched the account type for you.`
        );
      }

      const response = await authApi.sendOTP(normalizedPhone);
      setSandboxOTP(response.sandbox?.otp || "");
      setOtp("");
      setStep("otp");
      toast.success(
        response.sandbox?.otp
          ? "OTP generated. Use the sandbox code shown below."
          : "OTP sent to your phone."
      );
    } catch (err: any) {
      toast.error(err.message || "Unable to send OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const signIn = async () => {
    if (otp.length !== 6 || isSubmitting) {
      toast.error("Please enter the 6-digit OTP.");
      return;
    }

    setIsSubmitting(true);
    try {
      const otpResponse = await authApi.verifyOTP(normalizedPhone, otp);
      const registeredType = otpResponse.data?.userType as AccountType | null;

      if (!otpResponse.data?.isRegistered || !registeredType) {
        toast.info("This phone number is not registered yet. Let's create your account.");
        redirectToSignup(accountType);
        return;
      }

      const loginType = registeredType || accountType;
      if (loginType !== accountType) setAccountType(loginType);

      const response = await authApi.login(normalizedPhone, undefined, loginType);

      if (!response.success || !response.data?.token || !response.data.user) {
        throw new Error(response.message || "Unable to sign in.");
      }

      loginWithToken(response.data.token, response.data.user);
      toast.success("Welcome back to MindMate!");
      navigate("/");
    } catch (err: any) {
      if (err.status === 404) {
        toast.info("No account found for this phone number. Let's create your account.");
        redirectToSignup(accountType);
      } else if (err.status === 403) {
        toast.error(err.message || "This phone number belongs to another account type.");
      } else {
        toast.error(err.message || "Unable to sign in. Please check the OTP and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSignIn = () => {
    setStep("phone");
    setOtp("");
    setSandboxOTP("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFCFB] via-[#F8F9FA] to-[#E9E4FF] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="inline-block mb-3"
          >
            <img
              src={mindmateLogo}
              alt="MindMate — Real talks. Real connection. Zero judgement."
              className="w-full max-w-[360px] sm:max-w-[420px] h-auto mx-auto rounded-3xl object-contain"
            />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl mb-3">Welcome back to MindMate</h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto">
            Sign in with your registered phone number and a one-time password.
          </p>
        </div>

        <Card className="p-6 sm:p-8 bg-white/85 backdrop-blur-sm border-border shadow-xl rounded-3xl mb-6 max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#BAE6FD] to-[#7DD3FC] flex items-center justify-center">
              {step === "phone" ? <Phone className="w-6 h-6 text-white" /> : <Lock className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold">Sign in to your account</h2>
              <p className="text-sm text-muted-foreground">
                {step === "phone" ? "Choose your account type and request an OTP" : `Enter the OTP sent to +91 ${normalizedPhone}`}
              </p>
            </div>
          </div>

          {step === "phone" ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">I am signing in as</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountType("student")}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${accountType === "student" ? "border-[#7DD3FC] bg-[#F0F9FF] ring-2 ring-[#BAE6FD]/50" : "border-border hover:border-[#BAE6FD]"}`}
                  >
                    <User className="w-5 h-5 text-[#0EA5E9] mb-2" />
                    <span className="text-sm font-semibold block">Student</span>
                    <span className="text-xs text-muted-foreground">Find support</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("elder")}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${accountType === "elder" ? "border-[#A78BFA] bg-[#F5F0FF] ring-2 ring-[#C4B5FD]/50" : "border-border hover:border-[#C4B5FD]"}`}
                  >
                    <Users className="w-5 h-5 text-[#7C3AED] mb-2" />
                    <span className="text-sm font-semibold block">Mentor</span>
                    <span className="text-xs text-muted-foreground">Share wisdom</span>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="signin-phone" className="block text-sm font-medium mb-2">Registered phone number</label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 rounded-xl bg-muted border border-border text-sm text-muted-foreground font-medium select-none">🇮🇳 +91</div>
                  <Input
                    id="signin-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                    onKeyDown={(event) => event.key === "Enter" && sendOTP()}
                    placeholder="98765 43210"
                    className="rounded-xl flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Only users already registered in MindMate can sign in.</p>
              </div>

              <Button onClick={sendOTP} disabled={normalizedPhone.length !== 10 || isSubmitting} className="w-full bg-gradient-to-r from-[#BAE6FD] to-[#7DD3FC] hover:from-[#7DD3FC] hover:to-[#0EA5E9] text-white rounded-full py-5 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Phone className="w-4 h-4 mr-2" />}
                Send OTP
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {sandboxOTP && (
                <div className="p-4 bg-[#F0FDF4] border border-[#86EFAC] rounded-2xl">
                  <p className="text-xs text-[#166534] font-medium mb-1">🧪 Sandbox OTP</p>
                  <p className="text-3xl font-bold tracking-[0.3em] text-[#15803D] font-mono">{sandboxOTP}</p>
                  <p className="text-xs text-[#166534] mt-1">Development mode: the local API generated this code for testing.</p>
                </div>
              )}

              <div>
                <label htmlFor="signin-otp" className="block text-sm font-medium mb-2">6-digit OTP</label>
                <Input
                  id="signin-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(event) => event.key === "Enter" && signIn()}
                  placeholder="123456"
                  className="rounded-xl text-center text-xl tracking-[0.5em] font-mono"
                />
              </div>

              <Button onClick={signIn} disabled={otp.length !== 6 || isSubmitting} className="w-full bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6] text-white rounded-full py-5 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Sign In
              </Button>

              <button type="button" onClick={resetSignIn} className="w-full text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Change phone number
              </button>
            </div>
          )}
        </Card>

        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">New to MindMate? Create an account</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
            <Card className="p-6 sm:p-8 bg-white/80 backdrop-blur-sm border-border hover:shadow-xl transition-all rounded-3xl">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#BAE6FD] to-[#7DD3FC] flex items-center justify-center mb-4 shadow-md"><User className="w-8 h-8 text-white" /></div>
                <h2 className="text-xl sm:text-2xl mb-2">Create a Student Account</h2>
                <p className="text-sm text-muted-foreground mb-5">Complete phone OTP and identity verification, then find support from an experienced mentor.</p>
                <Link to="/verify?next=/signup/student&mode=signup" className="block w-full"><Button className="w-full bg-gradient-to-r from-[#BAE6FD] to-[#7DD3FC] hover:from-[#7DD3FC] hover:to-[#0EA5E9] text-white rounded-full py-5"><Shield className="w-4 h-4 mr-2" />Sign Up as Student</Button></Link>
              </div>
            </Card>

            <Card className="p-6 sm:p-8 bg-white/80 backdrop-blur-sm border-border hover:shadow-xl transition-all rounded-3xl">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center mb-4 shadow-md"><Users className="w-8 h-8 text-white" /></div>
                <h2 className="text-xl sm:text-2xl mb-2">Create a Mentor Account</h2>
                <p className="text-sm text-muted-foreground mb-5">Complete verification and share your experience with students in a safe, anonymous space.</p>
                <Link to="/verify?next=/signup/mentor&mode=signup&accountType=mentor" className="block w-full"><Button className="w-full bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6] text-white rounded-full py-5"><Shield className="w-4 h-4 mr-2" />Sign Up as Mentor</Button></Link>
              </div>
            </Card>
          </div>
        </div>

        <Card className="p-4 sm:p-6 bg-gradient-to-br from-[#D1FAE5] to-[#A7F3D0] border-none rounded-2xl">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {trustBadges.map(({ icon: Icon, label }) => <div key={label} className="flex items-center gap-1.5 text-xs sm:text-sm text-accent-foreground font-medium"><Icon className="w-4 h-4" />{label}</div>)}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
