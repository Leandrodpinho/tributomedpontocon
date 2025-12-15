import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SubmitButtonProps = {
  children?: ReactNode;
  className?: string;
  isLoading?: boolean;
};

export function SubmitButton({ children = "Gerar Análise", className, isLoading }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isSubmitting = pending || isLoading;

  return (
    <Button type="submit" disabled={isSubmitting} size="lg" className={cn("font-semibold", className)}>
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Analisando...
        </>
      ) : (
        children
      )}
    </Button>
  );
}
