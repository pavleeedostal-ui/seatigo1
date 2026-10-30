"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-paper-deep">
        <AlertTriangle className="h-6 w-6 text-danger" />
      </div>
      <h1 className="font-display text-[44px] text-ink">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-[16px] text-ink-muted">
        Please try again. If the problem persists, come back a little later.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
