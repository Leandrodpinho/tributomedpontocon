"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <Button type="submit" disabled={isSubmitting} size="lg">
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Analisando...
        </>
      ) : (
        "Gerar Análise"
      )}
    </Button>
  );
}