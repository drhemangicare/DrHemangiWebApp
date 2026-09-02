import crypto from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion when read aloud

// Both of these previously used Math.random(). V8 implements it as
// xorshift128+, which is not a CSPRNG: its internal state can be recovered
// from a handful of consecutive outputs. Reference codes are handed to
// anyone who starts a booking and OTPs are drawn from the same stream, so an
// attacker could harvest codes, solve for the state, and predict the next
// patient's login OTP. Both now come from crypto.
export function generateReferenceCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
  }
  return `DH-${code}`;
}

export function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}
