import Razorpay from "razorpay";
import crypto from "crypto";
import { requireEnv } from "@/lib/env";

let cached: Razorpay | null = null;

export function razorpayClient(): Razorpay {
  if (cached) return cached;
  cached = new Razorpay({
    key_id: requireEnv("razorpayKeyId"),
    key_secret: requireEnv("razorpayKeySecret"),
  });
  return cached;
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = requireEnv("razorpayKeySecret");
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/** Verifies the `X-Razorpay-Signature` header on webhook payloads (raw body text). */
export function verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean {
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
