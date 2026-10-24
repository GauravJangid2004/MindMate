import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { MentorDirectory } from "../components/MentorDirectory";
import { useAuth } from "../context/AuthContext";

export function SelectMentor() {
  const navigate = useNavigate();
  const { studentProfile } = useAuth();

  useEffect(() => {
    if (!studentProfile) navigate("/login");
  }, [studentProfile, navigate]);

  if (!studentProfile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFCFB] via-[#F8F9FA] to-[#E9E4FF] p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl mb-3">Select Your Mentor</h1>
            <p className="text-muted-foreground">Choose a verified mentor and send a request directly from their card.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => navigate("/")} className="rounded-full self-start">
            Skip for now
          </Button>
        </div>

        <MentorDirectory connectedMentorId={studentProfile.connectedMentorId} />
      </div>
    </div>
  );
}
