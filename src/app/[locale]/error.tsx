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
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background">
        <AlertTriangle className="h-6 w-6 text-danger" />
      </div>
      <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-ink">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-[15px] text-ink-muted">
        Please try again. If the problem persists, come back a little later.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
