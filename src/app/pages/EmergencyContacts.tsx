import { useState } from "react";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Phone, Plus, Trash2, AlertCircle, Heart, User } from "lucide-react";
import { Badge } from "../components/ui/badge";

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

const MINDMATE_HELPLINE = "1-800-MINDMATE";
const CRISIS_HELPLINE = "988"; // National Suicide Prevention Lifeline

export function EmergencyContacts() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    {
      id: "1",
      name: "Mom",
      relationship: "Parent",
      phone: "+1 234-567-8900",
    },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    relationship: "",
    phone: "",
  });

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (newContact.name && newContact.phone) {
      const contact: EmergencyContact = {
        id: Date.now().toString(),
        ...newContact,
      };
      setContacts([...contacts, contact]);
      setNewContact({ name: "", relationship: "", phone: "" });
      setShowAddForm(false);
    }
  };

  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter((contact) => contact.id !== id));
  };

  const handleCall = (phone: string) => {
    // In a real app, this would initiate a call
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FECACA] to-[#FCA5A5] flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl">Emergency Contacts</h1>
            <p className="text-sm text-muted-foreground">
              Quick access to people who can help when you need support
            </p>
          </div>
        </div>
      </motion.div>

      {/* Official Helplines */}
      <Card className="mb-6 p-6 bg-gradient-to-br from-[#FECACA] to-[#FCA5A5] border-none shadow-lg rounded-2xl">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-white flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h2 className="text-xl text-white mb-2">Crisis & Support Helplines</h2>
            <p className="text-sm text-white/90 mb-4">
              Available 24/7 - Free, confidential support
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white/20 backdrop-blur-sm rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">National Crisis Lifeline</h3>
                <p className="text-sm text-white/80">24/7 Crisis Support</p>
              </div>
              <Button
                onClick={() => handleCall(CRISIS_HELPLINE)}
                className="bg-white text-destructive hover:bg-white/90 rounded-full"
              >
                <Phone className="w-4 h-4 mr-2" />
                {CRISIS_HELPLINE}
              </Button>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white/20 backdrop-blur-sm rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">MindMate Helpline</h3>
                <p className="text-sm text-white/80">Mental Wellness Support</p>
              </div>
              <Button
                onClick={() => handleCall(MINDMATE_HELPLINE)}
                className="bg-white text-primary hover:bg-white/90 rounded-full"
              >
                <Phone className="w-4 h-4 mr-2" />
                {MINDMATE_HELPLINE}
              </Button>
            </div>
          </motion.div>
        </div>
      </Card>

      {/* Personal Emergency Contacts */}
      <Card className="mb-6 p-6 bg-white/80 backdrop-blur-sm border-border shadow-lg rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl mb-1">Your Emergency Contacts</h2>
            <p className="text-sm text-muted-foreground">
              Add trusted people you can reach out to in times of need
            </p>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] hover:from-[#A78BFA] hover:to-[#8B5CF6] text-white rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>

        {/* Add Contact Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6"
          >
            <Card className="p-4 bg-gradient-to-br from-[#E9E4FF] to-[#F8F9FA] border-none">
              <form onSubmit={handleAddContact} className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Name</label>
                  <Input
                    required
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    placeholder="e.g., Mom, Best Friend, Dr. Smith"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Relationship</label>
                  <Input
                    value={newContact.relationship}
                    onChange={(e) =>
                      setNewContact({ ...newContact, relationship: e.target.value })
                    }
                    placeholder="e.g., Parent, Friend, Therapist"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Phone Number</label>
                  <Input
                    required
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    placeholder="+1 234-567-8900"
                    className="rounded-xl"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0] hover:from-[#A7F3D0] hover:to-[#6EE7B7] text-accent-foreground rounded-full"
                  >
                    Save Contact
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewContact({ name: "", relationship: "", phone: "" });
                    }}
                    variant="outline"
                    className="rounded-full"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        {/* Contacts List */}
        <div className="space-y-3">
          {contacts.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No emergency contacts added yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add people you trust to reach out to when you need support
              </p>
            </div>
          ) : (
            contacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4 bg-gradient-to-br from-[#F8F9FA] to-[#E9E4FF] border-border hover:shadow-md transition-all rounded-xl group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{contact.name}</h3>
                        {contact.relationship && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-white/60 text-foreground border-none"
                          >
                            {contact.relationship}
                          </Badge>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">{contact.phone}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleCall(contact.phone)}
                        className="bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0] hover:from-[#A7F3D0] hover:to-[#6EE7B7] text-accent-foreground rounded-full"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </Button>
                      <Button
                        onClick={() => handleDeleteContact(contact.id)}
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive-foreground hover:bg-destructive/10 rounded-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-6 bg-gradient-to-br from-[#E9E4FF] to-[#D1FAE5] border-none rounded-2xl">
        <h3 className="mb-3">💡 When to Reach Out</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>
              If you're experiencing thoughts of self-harm or suicide, call the Crisis Lifeline
              immediately
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>For emotional support and mental wellness guidance, contact MindMate Helpline</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>
              Reach out to your personal contacts when you need someone familiar to talk to
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Remember: Asking for help is a sign of strength, not weakness</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
