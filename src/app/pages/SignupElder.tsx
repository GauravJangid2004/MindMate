import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Users, Shield, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { auth as authApi } from "../lib/api";
import { toast } from "sonner";

export function SignupElder() {
  const navigate = useNavigate();
  const { loginWithToken, verification } = useAuth();
  const [formData, setFormData] = useState({
    gender: "",
    passion: "",
    hobbies: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await authApi.register({
        phone: verification.phone || '',
        zkCommitment: verification.zkCommitment || '',
        anonymousHandle: verification.anonymousHandle || '',
        userType: 'elder',
        profile: {
          gender: formData.gender,
          passion: formData.passion,
          hobbies: formData.hobbies.split(",").map((h) => h.trim()).filter(Boolean),
        },
      });

      if (response.success && response.data) {
        loginWithToken(response.data.token, response.data.user);
        toast.success('Registration successful!');
        navigate("/");
      }
    } catch (err: any) {
      if (err.status === 409) {
        try {
          const loginResponse = await authApi.login(
            verification.phone || '',
            verification.zkCommitment || ''
          );
          if (loginResponse.success && loginResponse.data) {
            loginWithToken(loginResponse.data.token, loginResponse.data.user);
            toast.success('Welcome back!');
            navigate("/");
          }
        } catch {
          toast.error('Login failed. Please try again.');
        }
      } else {
        toast.error(err.message || 'Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFCFB] via-[#F8F9FA] to-[#E9E4FF] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center shadow-lg mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl mb-2">Mentor Sign Up</h1>
          <p className="text-muted-foreground">Share your wisdom - stay anonymous!</p>
          {verification.anonymousHandle && (
            <div className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0] px-4 py-2 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span className="text-sm font-semibold text-[#065F46] font-mono">{verification.anonymousHandle}</span>
              <Shield className="w-4 h-4 text-[#059669]" />
            </div>
          )}
        </div>

        <Card className="p-8 bg-white/80 backdrop-blur-sm border-border shadow-xl rounded-3xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Gender</label>
              <select
                required
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full p-3 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">Your Passion/Expertise</label>
              <Input
                required
                value={formData.passion}
                onChange={(e) => setFormData({ ...formData, passion: e.target.value })}
                placeholder="e.g., Teaching, Career Guidance, Life Coaching"
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground mt-1">
                What do you love to share with others?
              </p>
            </div>

            <div>
              <label className="block text-sm mb-2">Hobbies & Interests</label>
              <Input
                required
                value={formData.hobbies}
                onChange={(e) => setFormData({ ...formData, hobbies: e.target.value })}
                placeholder="e.g., Gardening, Reading, Travel (comma separated)"
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate multiple hobbies with commas
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6] text-white rounded-full py-6 mt-6"
            >
              Complete Sign Up
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link to="/signin/elder" className="text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}