import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export interface MetricProps {
  label: string;
  value: string;
  delta?: string;
  deltaVariant?: "success" | "error";
  className?: string;
}

export function Metric({ label, value, delta, deltaVariant = "success", className }: MetricProps) {
  return (
    <Card className={cn("p-5", className)}>
      <p className="text-[13px] text-text-muted">{label}</p>
      <p data-mono className="mt-2 text-3xl font-medium text-text">
        {value}
      </p>
      {delta && (
        <span
          className={cn(
            "mt-2 inline-flex rounded-full px-3 py-[5px] text-[13px] font-medium",
            deltaVariant === "success" ? "bg-success-bg text-success-text" : "bg-error-bg text-error-text",
          )}
        >
          {delta}
        </span>
      )}
    </Card>
  );
}
