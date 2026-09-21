import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Phone, Shield, Lock, AlertCircle, Heart, ExternalLink } from "lucide-react";

const crisisResources = [
  {
    name: "National Suicide Prevention Lifeline",
    phone: "988",
    description: "24/7 free and confidential support",
    available: "24/7",
  },
  {
    name: "Crisis Text Line",
    phone: "Text HOME to 741741",
    description: "Free 24/7 crisis support via text",
    available: "24/7",
  },
  {
    name: "Student Counseling Services",
    phone: "Campus Extension: 3456",
    description: "Professional counseling for students",
    available: "Mon-Fri, 9AM-5PM",
  },
  {
    name: "SAMHSA National Helpline",
    phone: "1-800-662-4357",
    description: "Mental health and substance abuse support",
    available: "24/7",
  },
];

const safetyFeatures = [
  {
    icon: Lock,
    title: "Complete Anonymity",
    description: "No real names, photos, or personal information required. Your identity is protected.",
  },
  {
    icon: Shield,
    title: "Verified Mentors",
    description: "All mentors are screened, trained, and committed to providing safe support.",
  },
  {
    icon: AlertCircle,
    title: "AI Content Moderation",
    description: "Our system monitors for harmful content and alerts trained professionals when needed.",
  },
  {
    icon: Heart,
    title: "Crisis Detection",
    description: "If you express severe distress, we prioritize connecting you with immediate help.",
  },
];

export function Safety() {
  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl mb-3">Safety & Privacy</h1>
        <p className="text-muted-foreground">
          Your wellbeing and privacy are our top priorities. Learn how we keep you safe.
        </p>
      </motion.div>

      {/* Emergency Alert */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-8"
      >
        <Card className="p-6 lg:p-8 bg-gradient-to-br from-[#FCA5A5] to-[#F87171] border-none rounded-3xl shadow-xl text-white">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-2xl mb-2">In Immediate Crisis?</h2>
              <p className="mb-4 opacity-90">
                If you're having thoughts of self-harm or suicide, please reach out for immediate help.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="tel:988">
                  <Button className="bg-white text-[#DC2626] hover:bg-white/90">
                    <Phone className="w-5 h-5 mr-2" />
                    Call 988 Now
                  </Button>
                </a>
                <Button
                  variant="outline"
                  className="bg-white/20 border-white/50 text-white hover:bg-white/30"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Find Local Resources
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Crisis Resources */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">Crisis & Support Resources</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {crisisResources.map((resource, index) => (
            <motion.div
              key={resource.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-border hover:shadow-lg transition-all rounded-2xl h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#BAE6FD] to-[#7DD3FC] flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2">{resource.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                    <div className="flex flex-col gap-2">
                      <a
                        href={`tel:${resource.phone.replace(/[^0-9]/g, "")}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {resource.phone}
                      </a>
                      <span className="text-xs text-muted-foreground">{resource.available}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Safety Features */}
      <div className="mb-8">
        <h2 className="text-2xl mb-4">How We Keep You Safe</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {safetyFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-white/80 backdrop-blur-sm border-border rounded-2xl h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Community Guidelines */}
      <Card className="p-6 lg:p-8 bg-gradient-to-br from-[#E9E4FF] to-[#D1FAE5] border-none rounded-2xl mb-8">
        <h2 className="text-2xl mb-4">Community Guidelines</h2>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <span className="text-primary">✓</span>
            <div>
              <strong>Be Respectful:</strong> Treat everyone with kindness and understanding
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-primary">✓</span>
            <div>
              <strong>Stay Anonymous:</strong> Don't share personal information or ask others to reveal theirs
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-primary">✓</span>
            <div>
              <strong>No Judgment:</strong> Create a safe, supportive space for everyone
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-primary">✓</span>
            <div>
              <strong>Report Concerns:</strong> If you see harmful content, use the report feature
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-primary">✓</span>
            <div>
              <strong>Seek Professional Help:</strong> We're here to support, but not replace professional care
            </div>
          </div>
        </div>
      </Card>

      {/* Privacy Policy */}
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-border rounded-2xl">
        <h3 className="mb-3">Your Privacy Matters</h3>
        <p className="text-sm text-muted-foreground mb-4">
          We use industry-standard encryption to protect all conversations. Your data is never sold
          or shared with third parties. You can delete your account and all associated data at any time.
        </p>
        <Button variant="outline" className="rounded-full">
          Read Full Privacy Policy
        </Button>
      </Card>
    </div>
  );
}
