import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { User, Check, X, Clock, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import { connections } from "../lib/api";
import { toast } from "sonner";

interface RequestItem {
  _id: string;
  createdAt: string;
  studentId: {
    _id: string;
    anonymousHandle: string;
    age?: number;
    gender?: string;
    course?: string;
    hobbies?: string[];
  };
}

export function ConnectionRequests() {
  const navigate = useNavigate();
  const { elderProfile } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setError("");
      const response = await connections.getRequests();
      setRequests(response.data?.requests || []);
    } catch (err: any) {
      setError(err.message || "Unable to load connection requests.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!elderProfile) navigate("/login");
    else loadRequests();
  }, [elderProfile, navigate]);

  if (!elderProfile) return null;

  const respond = async (requestId: string, action: "accept" | "reject") => {
    setWorkingId(requestId);
    try {
      await connections.respondToRequest(requestId, action);
      setRequests((current) => current.filter((item) => item._id !== requestId));
      toast.success(action === "accept" ? "Student connected successfully" : "Request declined");
    } catch (err: any) {
      toast.error(err.message || "Unable to update this request");
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl mb-3">Connection Requests</h1>
        <p className="text-muted-foreground">Students who would like to connect with you for guidance.</p>
      </motion.div>

      {isLoading && <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
      {!isLoading && error && <Card className="p-8 text-center bg-white/80 rounded-2xl"><AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive" /><p className="text-muted-foreground">{error}</p><Button onClick={loadRequests} variant="outline" className="mt-4 rounded-full">Try again</Button></Card>}
      {!isLoading && !error && requests.length === 0 && (
        <Card className="p-12 bg-white/80 rounded-2xl text-center"><Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" /><h3 className="text-xl mb-2">No Pending Requests</h3><p className="text-muted-foreground">New student requests will appear here.</p></Card>
      )}

      {!isLoading && !error && requests.length > 0 && <div className="space-y-4">
        {requests.map((request, index) => {
          const student = request.studentId;
          return (
            <motion.div key={request._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
              <Card className="p-6 bg-white/80 border-border rounded-2xl">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#BAE6FD] to-[#7DD3FC] flex items-center justify-center flex-shrink-0"><User className="w-7 h-7 text-white" /></div>
                    <div className="flex-1">
                      <h3 className="text-lg mb-1">{student.anonymousHandle || "Anonymous Student"}</h3>
                      <div className="flex flex-wrap gap-2 mb-3 text-sm text-muted-foreground"><span>{student.age || "Age not shared"}</span><span>•</span><span>{student.gender || "Gender not shared"}</span><span>•</span><span>{student.course || "Course not shared"}</span></div>
                      <div className="flex flex-wrap gap-2">{(student.hobbies || []).map((hobby) => <Badge key={hobby} className="bg-[#E9E4FF] text-[#6B21A8] hover:bg-[#E9E4FF] text-xs">{hobby}</Badge>)}</div>
                      <p className="text-xs text-muted-foreground mt-3">Requested {new Date(request.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 lg:flex-col">
                    <Button disabled={workingId === request._id} onClick={() => respond(request._id, "accept")} className="flex-1 bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0] text-accent-foreground rounded-full"><Check className="w-4 h-4 mr-2" />Accept</Button>
                    <Button disabled={workingId === request._id} onClick={() => respond(request._id, "reject")} variant="outline" className="flex-1 rounded-full"><X className="w-4 h-4 mr-2" />Decline</Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>}
    </div>
  );
}
