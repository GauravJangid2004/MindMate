import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, CheckCircle2, Loader2, MessageCircle, Send, Sparkles, User, Users } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { ai, connections, users } from "../lib/api";
import { toast } from "sonner";

interface Mentor {
  _id: string;
  anonymousHandle: string;
  gender?: string;
  passion?: string;
  hobbies?: string[];
}

interface MentorMatch {
  matchPercentage: number;
  matchReason: string;
  matchReasonSource: string;
  matchedThemes: string[];
  metrics: {
    semanticScore: number;
    hobbiesScore: number;
    domainScore: number;
    rerankerRank?: number;
  };
}

interface ConversationStarter {
  topic: string;
  question: string;
  source?: string;
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
  const [studentNeeds, setStudentNeeds] = useState("");
  const [matches, setMatches] = useState<Record<string, MentorMatch> | null>(null);
  const [matchError, setMatchError] = useState("");
  const [isMatching, setIsMatching] = useState(false);
  const [startersByMentor, setStartersByMentor] = useState<Record<string, ConversationStarter[]>>({});
  const [loadingStarters, setLoadingStarters] = useState<Record<string, boolean>>({});

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

  const getAiMatches = async () => {
    setIsMatching(true);
    setMatchError("");
    try {
      const response = await ai.matchMentors(studentNeeds);
      const recommendations = response.data?.recommendations || [];
      const nextMatches: Record<string, MentorMatch> = {};
      recommendations.forEach((recommendation: any) => {
        const mentorId = recommendation.mentor?._id;
        if (mentorId) nextMatches[mentorId] = recommendation;
      });
      setMatches(nextMatches);
      if (recommendations.length === 0) {
        setMatchError("There are no verified mentors to match yet.");
      }
    } catch (err: any) {
      setMatchError(err.message || "AI matching is currently unavailable.");
    } finally {
      setIsMatching(false);
    }
  };

  const getConversationStarters = async (mentorId: string) => {
    setLoadingStarters((current) => ({ ...current, [mentorId]: true }));
    try {
      const response = await ai.conversationStarters(mentorId);
      const starters = response.data?.starters;
      if (!Array.isArray(starters)) {
        throw new Error("The AI did not return conversation starters.");
      }
      setStartersByMentor((current) => ({
        ...current,
        [mentorId]: starters.map((starter: ConversationStarter) => ({
          ...starter,
          source: response.data?.source,
        })),
      }));
    } catch (err: any) {
      toast.error(err.message || "Unable to generate conversation starters.");
    } finally {
      setLoadingStarters((current) => ({ ...current, [mentorId]: false }));
    }
  };

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

  const displayedMentors = matches
    ? [...mentors].sort((a, b) => {
        const scoreA = matches[a._id]?.matchPercentage ?? -1;
        const scoreB = matches[b._id]?.matchPercentage ?? -1;
        return scoreB - scoreA;
      })
    : mentors;

  return (
    <section className="mb-8">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center flex-shrink-0">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl mb-1">Mentors</h2>
          <p className="text-sm text-muted-foreground">
            Find a supportive mentor or browse all verified profiles.
          </p>
        </div>
      </div>

      <Card className="mb-5 p-5 bg-white/80 border-border rounded-2xl">
        <label htmlFor="mentor-needs" className="block text-sm font-medium mb-2">
          What kind of support are you looking for?
        </label>
        <Textarea
          id="mentor-needs"
          value={studentNeeds}
          onChange={(event) => setStudentNeeds(event.target.value)}
          maxLength={1000}
          placeholder="For example: I would like guidance balancing my studies and hobbies."
          aria-describedby="mentor-needs-privacy"
          className="mb-2"
        />
        <p id="mentor-needs-privacy" className="text-xs text-muted-foreground mb-3">
          Your description is processed by the configured AI providers to create matches. Avoid including names, phone numbers, or other identifying details.
        </p>
        <Button
          type="button"
          onClick={() => void getAiMatches()}
          disabled={isMatching || isLoading || Boolean(error)}
          className="rounded-full bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] text-white"
        >
          {isMatching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isMatching ? "Finding matches..." : "Get AI mentor suggestions"}
        </Button>
        {matchError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {matchError}
          </p>
        )}
        {matches && !matchError && (
          <p className="mt-3 text-sm text-muted-foreground">
            AI-ranked matches are shown first. You can still browse all verified mentors below.
          </p>
        )}
      </Card>

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
          {displayedMentors.map((mentor, index) => {
            const status = requestStatus[mentor._id];
            const isConnected = connectedMentorId === mentor._id;
            const hasConnection = Boolean(connectedMentorId);
            const match = matches?.[mentor._id];

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
                      {match && (
                        <div className="mb-3 rounded-xl bg-[#F4F0FF] p-3">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-sm font-medium flex items-center gap-1">
                              <Sparkles className="w-4 h-4 text-primary" />
                              AI match
                            </span>
                            <Badge variant="secondary">{match.matchPercentage} match score</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{match.matchReason}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {match.matchReasonSource === "gemini"
                              ? "Generated by Gemini"
                              : "Template explanation"}
                          </p>
                        </div>
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
                    type="button"
                    variant="outline"
                    onClick={() => void getConversationStarters(mentor._id)}
                    disabled={Boolean(loadingStarters[mentor._id])}
                    className="w-full mt-4 rounded-full"
                  >
                    {loadingStarters[mentor._id] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MessageCircle className="w-4 h-4" />
                    )}
                    {startersByMentor[mentor._id]
                      ? "Refresh conversation ideas"
                      : "Suggest conversation starters"}
                  </Button>
                  {startersByMentor[mentor._id] && (
                        <>
                        <p className="mt-3 text-xs text-muted-foreground">
                          {startersByMentor[mentor._id][0]?.source === "gemini"
                            ? "AI-generated conversation ideas"
                            : "Built-in conversation ideas (configure Gemini for generated suggestions)"}
                        </p>
                        <ul className="mt-2 space-y-2" aria-label="AI conversation starters">
                          {startersByMentor[mentor._id].map((starter, starterIndex) => (
                        <li
                          key={`${starter.topic}-${starterIndex}`}
                          className="text-sm text-muted-foreground"
                        >
                          <span className="font-medium text-foreground">
                            {starter.topic}:{" "}
                          </span>
                          {starter.question}
                        </li>
                      ))}
                    </ul>
                    </>
                  )}

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
