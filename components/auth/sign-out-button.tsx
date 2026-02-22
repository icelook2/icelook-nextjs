"use client";

import { useState } from "react";
import { signOutAction } from "@/app/auth/actions";
import { Button } from "@/lib/ui/button";

export function SignOutButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setIsSubmitting(true);
    setError(null);

    const result = await signOutAction();
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
  }

  return (
    <div className="space-y-3">
      <Button onClick={handleSignOut} loading={isSubmitting}>
        Sign out
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
