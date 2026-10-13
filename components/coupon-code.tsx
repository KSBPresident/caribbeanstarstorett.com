"use client";

import { useState } from "react";

export function CouponCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="coupon-code-row">
      <code>{code}</code>
      <button type="button" className="identity-secondary" onClick={copyCode}>{copied ? "Copied" : "Copy code"}</button>
    </div>
  );
}
