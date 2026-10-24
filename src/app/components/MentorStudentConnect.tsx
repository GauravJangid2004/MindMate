import { useRef, useState } from "react";
import { Link } from "react-router";
import { Scanner } from "@yudiel/react-qr-scanner";
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, QrCode, Scan } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { connections } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

function extractQRToken(value: string) {
  const trimmed = value.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "mindmate:" && parsed.hostname === "connect") {
      return parsed.searchParams.get("token") || "";
    }
  } catch {
    // Raw token values are accepted as well.
  }
  return trimmed;
}

/** Homepage connection controls for mentors receiving a student's code. */
export function MentorStudentConnect() {
  const { refreshUser } = useAuth();
  const [scanToken, setScanToken] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [success, setSuccess] = useState(false);
  const scannedTokenRef = useRef("");

  const scan = async (value = scanToken) => {
    const token = extractQRToken(value);
    if (!token || isScanning) return;

    setIsScanning(true);
    try {
      const response = await connections.scanQR(token);
      try {
        await refreshUser();
      } catch {
        // The connection is already saved; a profile refresh is only a UI aid.
      }
      setSuccess(true);
      setScannerOpen(false);
      setScanToken("");
      scannedTokenRef.current = "";
      toast.success(response.message || "Student connected successfully");
    } catch (err: any) {
      scannedTokenRef.current = "";
      toast.error(err.message || "Invalid or expired student connection code");
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

  return (
    <Card className="mb-8 p-6 sm:p-8 bg-gradient-to-br from-[#E9E4FF] to-[#D1FAE5] border-none shadow-lg rounded-3xl">
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C4B5FD] to-[#A78BFA] flex items-center justify-center">
              <Scan className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl">Connect with a student</h2>
              <p className="text-sm text-muted-foreground">Scan a student’s QR code or enter their token.</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Ask the student to open their QR connection page and show or copy their code.
          </p>
        </div>

        <div className="w-full lg:max-w-md">
          {success ? (
            <div className="p-5 rounded-2xl bg-white/80 border border-emerald-200 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-600" />
              <p className="font-semibold">Student connected successfully</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">You can now find the student in your connections.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button onClick={() => setSuccess(false)} variant="outline" className="rounded-full">
                  Connect another student
                </Button>
                <Button asChild className="rounded-full bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] text-white">
                  <Link to="/connect">View students</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {scannerOpen ? (
                <div className="mb-3 overflow-hidden rounded-2xl bg-slate-900">
                  <Scanner
                    onScan={handleDetectedCode}
                    onError={(error) => toast.error(error.message || "Unable to access the camera")}
                    constraints={{ facingMode: "environment" }}
                    paused={isScanning}
                    styles={{ container: { width: "100%" }, video: { width: "100%" } }}
                  />
                </div>
              ) : (
                <div className="mb-3 rounded-2xl bg-white/60 p-6 text-center">
                  <QrCode className="w-16 h-16 mx-auto text-[#A78BFA] opacity-60" />
                </div>
              )}

              <Button
                onClick={() => setScannerOpen((open) => !open)}
                disabled={isScanning}
                variant="outline"
                className="w-full rounded-full mb-3 bg-white/70"
              >
                <Scan className="w-4 h-4" />
                {scannerOpen ? "Close camera scanner" : "Scan student QR code"}
              </Button>

              <div className="relative flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-white/70" />
                <span className="text-xs text-muted-foreground">or enter token code</span>
                <div className="flex-1 h-px bg-white/70" />
              </div>

              <Input
                value={scanToken}
                onChange={(event) => setScanToken(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void scan();
                }}
                placeholder="Paste QR payload or token code"
                className="rounded-xl bg-white/80 mb-3"
              />
              <Button
                onClick={() => void scan()}
                disabled={!scanToken.trim() || isScanning}
                className="w-full rounded-full bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA] text-white"
              >
                {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isScanning ? "Connecting..." : "Connect student"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <p className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Camera works on localhost or HTTPS. Raw tokens and full QR payloads are accepted.
        </p>
        <Button asChild variant="link" className="h-auto p-0 text-[#6D28D9]">
          <Link to="/qr-connection">
            Open full QR page <ExternalLink className="w-3 h-3" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
