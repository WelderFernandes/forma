"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OfflineRetry() {
  return (
    <Button variant="brand" onClick={() => window.location.reload()}>
      <RotateCw className="size-4" />
      Tentar novamente
    </Button>
  );
}
