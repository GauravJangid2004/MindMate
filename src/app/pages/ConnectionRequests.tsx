import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { User, Check, X, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Mock requests data
const mockRequests = [
  {
    id: "req_1",
    studentId: "student_1",
    studentAge: 20,
    studentGender: "Male",
    studentCourse: "Computer Science",
    studentHobbies: ["Gaming", "Reading", "Music"],
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    status: "pending",
  },
  {
    id: "req_2",
    studentId: "student_2",
    studentAge: 22,
    studentGender: "Female",
    studentCourse: "Psychology",
    studentHobbies: ["Art", "Yoga", "Writing"],
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    status: "pending",
  },
];

export function ConnectionRequests() {
  const navigate = useNavigate();
  const { elderProfile } = useAuth();
  const [requests, setRequests] = useState(mockRequests);
  const [acceptedRequest, setAcceptedRequest] = useState<string | null>(null);

  useEffect(() => {
    if (!elderProfile) {
      navigate("/login");
    }
  }, [elderProfile, navigate]);

  const handleAccept = (requestId: string) => {
    setRequests(requests.map((req) => 
      req.id === requestId ? { ...req, status: "accepted" } : req
    ));
    setAcceptedRequest(requestId);
    setTimeout(() => {
      navigate("/qr-connection");
    }, 1500);
  };

  const handleReject = (requestId: string) => {
    setRequests(requests.filter((req) => req.id !== requestId));
  };

  if (!elderProfile) {
    return null;
  }

  const pendingRequests = requests.filter((req) => req.status === "pending");

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl mb-3">Connection Requests</h1>
        <p className="text-muted-foreground">
          Students who would like to connect with you for guidance
        </p>
      </motion.div>

      {pendingRequests.length === 0 ? (
        <Card className="p-12 bg-white/80 backdrop-blur-sm rounded-2xl text-center">
          <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl mb-2">No Pending Requests</h3>
          <p className="text-muted-foreground">
            You'll see connection requests from students here
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-border rounded-2xl">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#BAE6FD] to-[#7DD3FC] flex items-center justify-center flex-shrink-0">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg mb-1">Anonymous Student</h3>
                      <div className="flex flex-wrap gap-2 mb-3 text-sm text-muted-foreground">
                        <span>{request.studentAge} years</span>
                        <span>•</span>
                        <span>{request.studentGender}</span>
                        <span>•</span>
                        <span>{request.studentCourse}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {request.studentHobbies.map((hobby) => (
                          <Badge
                            key={hobby}
                            className="bg-[#E9E4FF] text-[#6B21A8] hover:bg-[#E9E4FF] text-xs"
                          >
                            {hobby}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Requested {Math.floor((Date.now() - request.timestamp.getTime()) / (1000 * 60 * 60))} hours ago
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 lg:flex-col">
                    <Button
                      onClick={() => handleAccept(request.id)}
                      className="flex-1 bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0] hover:from-[#A7F3D0] hover:to-[#6EE7B7] text-accent-foreground rounded-full"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleReject(request.id)}
                      variant="outline"
                      className="flex-1 rounded-full text-destructive-foreground hover:bg-destructive/10"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}