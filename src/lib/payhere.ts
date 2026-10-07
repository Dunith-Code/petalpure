import { createHash, timingSafeEqual } from "crypto";

const md5 = (s: string) => createHash("md5").update(s).digest("hex");

export function payhereConfig() {
  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  const secret = process.env.PAYHERE_MERCHANT_SECRET;
  const appUrl = process.env.APP_URL?.replace(/\/$/, "");
  if (!merchantId || !secret || !appUrl) throw new Error("PayHere is not configured");

  const sandbox = process.env.PAYHERE_SANDBOX !== "false";
  return {
    merchantId,
    secret,
    appUrl,
    action: sandbox ? "https://sandbox.payhere.lk/pay/checkout" : "https://www.payhere.lk/pay/checkout",
  };
}

export const formatAmount = (n: number) => n.toFixed(2); // PayHere needs 2 decimals, no thousand separators

/** Hash sent WITH the payment request */
export function checkoutHash(merchantId: string, orderId: string, amount: string, currency: string, secret: string) {
  return md5(merchantId + orderId + amount + currency + md5(secret).toUpperCase()).toUpperCase();
}

/** Signature PayHere sends BACK in the notify callback */
export function notifySignature(
  merchantId: string,
  orderId: string,
  amount: string,
  currency: string,
  statusCode: string,
  secret: string,
) {
  return md5(merchantId + orderId + amount + currency + statusCode + md5(secret).toUpperCase()).toUpperCase();
}

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a.toUpperCase());
  const y = Buffer.from(b.toUpperCase());
  return x.length === y.length && timingSafeEqual(x, y);
}