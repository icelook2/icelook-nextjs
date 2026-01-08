"use client";

import { useState } from "react";
import { OtpInput } from "@/lib/ui/otp-input";

export default function TestPage() {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="mb-2 text-2xl font-bold">OTP Input Test</h1>
        <p className="text-muted">Enter your verification code</p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <OtpInput
          value={value}
          onChange={setValue}
          error={error}
          autoFocus
          onComplete={() => alert(`Code entered: ${value}`)}
        />

        <p className="text-sm text-muted">Value: {value || "(empty)"}</p>

        <button
          type="button"
          onClick={() => setError(!error)}
          className="rounded-lg bg-accent px-4 py-2 text-white"
        >
          Toggle Error State
        </button>
      </div>
    </div>
  );
}
