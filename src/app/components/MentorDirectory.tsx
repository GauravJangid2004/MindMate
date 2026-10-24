import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, CheckCircle2, Loader2, Send, User, Users } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { connections, users } from "../lib/api";
import { toast } from "sonner";

interface Mentor {
  _id: string;
  anonymousHandle: string;
  gender?: string;
  passion?: string;
  hobbies?: string[];
}

type RequestStatus = "sending" | "sent";

interface MentorDirectoryProps {
  connectedMentorId?: string;
}

/**
 * Shows every verified mentor returned by the backend and lets a student
 * send a request directly from the mentor card.
 */
export function MentorDirectory({ connectedMentorId }: MentorDirectoryProps) {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [requestStatus, setRequestStatus] = useState<Record<string, RequestStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    users.listMentors()
      .then((response) => {
        if (!active) return;
        setMentors(response.data?.mentors || []);
        setError("");
      })
      .catch((err: any) => {
        if (active) setError(err.message || "Unable to load mentors.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const sendRequest = async (mentorId: string) => {
    if (requestStatus[mentorId] || connectedMentorId) return;

    setRequestStatus((current) => ({ ...current, [mentorId]: "sending" }));
    try {
      await connections.sendRequest(mentorId);
      setRequestStatus((current) => ({ ...current, [mentorId]: "sent" }));
      toast.success("Mentor request sent");
    } catch (err: any) {
      if (err.status === 409) {
        // The request may already exist from an earlier visit. Keep the card
        // disabled so the user cannot accidentally submit it repeatedly.
        setRequestStatus((current) => ({ ...current, [mentorId]: "sent" }));
        toast.info(err.message || "A request already exists for this mentor.");
      } else {
        setRequestStatus((current) => {
          const next = { ...current };
          delete next[mentorId];
          return next;
        });
        toast.error(err.message || "Unable to send the mentor request.");
      }
    }
  };

  return (
    <section className="mb-8">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center flex-shrink-0">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl mb-1">Mentors</h2>
          <p className="text-sm text-muted-foreground">
            Browse all verified mentors and send a request with one click.
          </p>
        </div>
      </div>

      {isLoading && (
        <Card className="p-10 bg-white/80 border-border rounded-2xl">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </Card>
      )}

      {!isLoading && error && (
        <Card className="p-8 text-center bg-white/80 border-border rounded-2xl">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive" />
          <p className="text-muted-foreground">{error}</p>
        </Card>
      )}

      {!isLoading && !error && mentors.length === 0 && (
        <Card className="p-10 text-center bg-white/80 border-border rounded-2xl">
          <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <h3 className="text-xl mb-2">No mentors available yet</h3>
          <p className="text-muted-foreground">Verified mentors will appear here.</p>
        </Card>
      )}

      {!isLoading && !error && mentors.length > 0 && (
        <div className="grid md:grid-cols-2 gap-5">
          {mentors.map((mentor, index) => {
            const status = requestStatus[mentor._id];
            const isConnected = connectedMentorId === mentor._id;
            const hasConnection = Boolean(connectedMentorId);

            return (
              <motion.div
                key={mentor._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full p-5 bg-white/80 border-border hover:shadow-lg transition-all rounded-2xl">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center flex-shrink-0">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg mb-1 truncate">
                        {mentor.anonymousHandle || "Anonymous Mentor"}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {mentor.gender || "Verified mentor"}
                      </p>
                      {mentor.passion && (
                        <p className="text-sm mb-3">
                          <strong>Expertise:</strong> {mentor.passion}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {(mentor.hobbies || []).map((hobby) => (
                          <Badge
                            key={hobby}
                            className="bg-[#E9E4FF] text-[#6B21A8] hover:bg-[#E9E4FF] text-xs"
                          >
                            {hobby}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => void sendRequest(mentor._id)}
                    disabled={Boolean(status) || hasConnection}
                    className="w-full mt-5 bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] text-white rounded-full"
                  >
                    {status === "sending" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : status === "sent" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {isConnected
                      ? "Connected"
                      : status === "sending"
                      ? "Sending request..."
                      : status === "sent"
                      ? "Request sent"
                      : hasConnection
                      ? "Already connected"
                      : "Send request"}
                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
