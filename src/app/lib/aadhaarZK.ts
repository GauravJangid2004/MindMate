/**
 * Simulated Zero-Knowledge Identity Layer
 *
 * In a real ZK system, a proof would be generated client-side that proves
 * "I know a valid Aadhaar number" without revealing the number itself.
 * Here we simulate that using SHA-256 via the Web Crypto API:
 *   - The raw Aadhaar number is NEVER stored anywhere
 *   - Only the salted hash is kept (the "ZK commitment")
 *   - The anonymous handle is deterministically derived from the hash
 */

const ZK_SALT = "MINDMATE_ZK_PROOF_V1";

/** Compute a SHA-256 commitment over Aadhaar + phone. Never stores raw Aadhaar. */
export async function computeZKCommitment(
  aadhaarNumber: string,
  phone: string
): Promise<string> {
  const stripped = aadhaarNumber.replace(/\s|-/g, "");
  const payload = `${ZK_SALT}:${stripped}:${phone}`;
  const encoded = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const HANDLE_WORDS = [
  "AURORA", "BIRCH", "CEDAR", "DAWN", "EMBER", "FERN", "GROVE", "HAVEN",
  "IRIS", "JADE", "KITE", "LUNAR", "MAPLE", "NOVA", "OPAL", "PEARL",
  "QUEST", "REEF", "SAGE", "TIDE", "UNITY", "VALE", "WAVE", "XENON",
  "YARROW", "ZENITH", "CLOUD", "DUSK", "ECHO", "FROST",
];

/** Derive a stable anonymous handle from a ZK commitment hash. */
export function deriveHandle(commitmentHex: string): string {
  const wordIdx = parseInt(commitmentHex.slice(0, 2), 16) % HANDLE_WORDS.length;
  const suffix = commitmentHex.slice(2, 6).toUpperCase();
  return `MM-${HANDLE_WORDS[wordIdx]}-${suffix}`;
}

/** Generate a 6-digit OTP (sandbox only — in prod this would be server-side). */
export function generateSandboxOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Validate Aadhaar number format (12 digits, not all same digit). */
export function validateAadhaar(raw: string): boolean {
  const digits = raw.replace(/\s|-/g, "");
  if (!/^\d{12}$/.test(digits)) return false;
  if (/^(\d)\1{11}$/.test(digits)) return false; // all same digit
  return true;
}

/** Format Aadhaar as XXXX XXXX XXXX for display. */
export function formatAadhaarDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 12);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

/** Mask Aadhaar for display: XXXX XXXX 1234 */
export function maskAadhaar(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 12);
  if (digits.length < 12) return formatAadhaarDisplay(raw);
  return `XXXX XXXX ${digits.slice(8, 12)}`;
}
