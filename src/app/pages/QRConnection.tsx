import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Loader2,
  QrCode,
  RefreshCw,
  Scan,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { connections } from "../lib/api";
import { toast } from "sonner";

function extractQRToken(value: string) {
  const trimmed = value.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "mindmate:" && parsed.hostname === "connect") {
      return parsed.searchParams.get("token") || "";
    }
  } catch {
    // A raw token is also supported for copy/paste compatibility.
  }
  return trimmed;
}

export function QRConnection() {
  const navigate = useNavigate();
  const { userType, studentProfile, elderProfile, refreshUser } = useAuth();
  const [qrToken, setQrToken] = useState("");
  const [qrPayload, setQrPayload] = useState("");
  const [scanToken, setScanToken] = useState("");
  const [isGenerating, setIsGenerating] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const scannedTokenRef = useRef("");
  const profile = userType === "student" ? studentProfile : elderProfile;

  const generate = async () => {
    setIsGenerating(true);
    try {
      const response = await connections.generateQR();
      setQrToken(response.data?.qrToken || "");
      setQrPayload(response.data?.qrPayload || response.data?.qrToken || "");
    } catch (err: any) {
      toast.error(err.message || "Unable to generate a connection code");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (profile) generate();
  }, [profile]);

  if (!profile) return null;

  const scan = async (value = scanToken) => {
    const token = extractQRToken(value);
    if (!token || isScanning) return;

    setIsScanning(true);
    try {
      const response = await connections.scanQR(token);
      await refreshUser();
      setScannerOpen(false);
      setScanToken("");
      scannedTokenRef.current = "";
      setSuccess(true);
      toast.success(response.message || "Connection established");
      setTimeout(() => navigate("/"), 1200);
    } catch (err: any) {
      scannedTokenRef.current = "";
      toast.error(err.message || "Invalid or expired connection code");
    } finally {
      setIsScanning(false);
    }
  };

  const handleDetectedCode = (detectedCodes: Array<{ rawValue: string }>) => {
    const value = detectedCodes[0]?.rawValue || "";
    const token = extractQRToken(value);
    if (!token || isScanning || scannedTokenRef.current === token) return;
    scannedTokenRef.current = token;
    setScanToken(value);
    void scan(value);
  };

  const copyToken = async () => {
    if (!qrPayload) return;
    await navigator.clipboard.writeText(qrPayload);
    toast.success("QR connection code copied");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFCFB] via-[#F8F9FA] to-[#E9E4FF] p-4 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <h1 className="text-3xl mb-3">Connect via QR Code</h1>
          <p className="text-muted-foreground">Show your code or scan the other person’s code to create a real student–mentor connection.</p>
        </motion.div>

        {success && <Card className="p-8 mb-6 text-center bg-gradient-to-br from-[#D1FAE5] to-[#A7F3D0] border-none rounded-3xl"><CheckCircle2 className="w-14 h-14 mx-auto mb-3 text-emerald-600" /><h2 className="text-2xl">Connection established</h2><p className="text-muted-foreground mt-2">Taking you back to your dashboard…</p></Card>}

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-8 bg-white/80 border-border shadow-lg rounded-3xl">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center mb-4"><QrCode className="w-6 h-6 text-white" /></div>
              <h3 className="text-lg mb-4">Your connection code</h3>
              {isGenerating ? <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : qrPayload ? <><div className="bg-white p-6 rounded-2xl mb-4 inline-block"><QRCodeSVG value={qrPayload} size={220} level="H" includeMargin /></div><p className="text-xs text-muted-foreground break-all mb-3">This code expires in 10 minutes.</p><div className="flex gap-2 justify-center"><Button onClick={copyToken} variant="outline" className="rounded-full"><Copy className="w-4 h-4 mr-2" />Copy code</Button><Button onClick={generate} variant="outline" className="rounded-full"><RefreshCw className="w-4 h-4 mr-2" />New code</Button></div></> : <p className="text-sm text-muted-foreground py-16">No code available.</p>}
              <div className="flex items-center gap-2 justify-center mt-4"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center"><User className="w-5 h-5 text-white" /></div><p className="font-medium">Anonymous {userType === "student" ? "Student" : "Mentor"}</p></div>
            </div>
          </Card>

          <Card className="p-8 bg-white/80 border-border shadow-lg rounded-3xl">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-[#D1FAE5] to-[#A7F3D0] flex items-center justify-center mb-4"><Scan className="w-6 h-6 text-white" /></div>
              <h3 className="text-lg mb-4">Scan the other person’s code</h3>
              {scannerOpen ? <div className="mb-4 overflow-hidden rounded-2xl bg-slate-900"><Scanner onScan={handleDetectedCode} onError={(error) => toast.error(error.message || "Unable to access the camera")} constraints={{ facingMode: "environment" }} paused={isScanning} styles={{ container: { width: "100%" }, video: { width: "100%" } }} /></div> : <div className="bg-muted rounded-2xl p-8 mb-4"><QrCode className="w-24 h-24 mx-auto text-muted-foreground opacity-30" /></div>}
              <Button onClick={() => setScannerOpen((open) => !open)} disabled={isScanning} variant="outline" className="w-full rounded-full mb-3"><Scan className="w-4 h-4 mr-2" />{scannerOpen ? "Close camera" : "Open camera scanner"}</Button>
              <div className="relative flex items-center gap-2 my-3"><div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">or paste code</span><div className="flex-1 h-px bg-border" /></div>
              <Input value={scanToken} onChange={(event) => setScanToken(event.target.value)} placeholder="Paste the QR code or token" className="rounded-xl mb-3" />
              <Button onClick={() => void scan()} disabled={!scanToken.trim() || isScanning} className="w-full bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0] text-accent-foreground rounded-full">{isScanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}Complete connection</Button>
              <p className="text-xs text-muted-foreground mt-4">Camera scanning requires HTTPS or localhost and browser camera permission.</p>
            </div>
          </Card>
        </div>

        <Card className="mt-6 p-6 bg-gradient-to-br from-[#E9E4FF] to-[#D1FAE5] border-none rounded-2xl"><h3 className="mb-3">How it works</h3><ul className="space-y-2 text-sm"><li className="flex gap-2"><span className="text-primary">1.</span><span>Generate your short-lived code and show it to the other person.</span></li><li className="flex gap-2"><span className="text-primary">2.</span><span>They open the camera scanner or paste the copied payload.</span></li><li className="flex gap-2"><span className="text-primary">3.</span><span>The server validates the token, role pairing, expiry, and existing connections before creating the private chat.</span></li></ul><p className="text-xs text-muted-foreground mt-4 flex gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />A student can have one mentor connection. A mentor can connect with multiple students.</p></Card>
      </div>
    </div>
  );
}
