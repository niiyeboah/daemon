import { Button } from "@/components/ui/button";
import { BASE_MODEL_OPTIONS } from "@/store/constants";
import { cn } from "@/lib/utils";

interface ChooseBaseModelStepProps {
  selectedBaseModel: string;
  onSelect: (modelId: string) => void;
  onNext: () => void;
  status: string;
}

export function ChooseBaseModelStep({
  selectedBaseModel,
  onSelect,
  onNext,
  status,
}: ChooseBaseModelStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose the base model to download and use for Daemon. Qwen2.5-Coder-7B
        is recommended for M4 Mac Mini 16GB.
      </p>

      <div className="space-y-2">
        {BASE_MODEL_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            className={cn(
              "flex w-full flex-col items-start rounded-lg border px-4 py-3 text-left transition-colors sm:flex-row sm:items-center sm:gap-3",
              selectedBaseModel === opt.id
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            )}
          >
            <span className="font-medium">{opt.label}</span>
            <span className="text-xs text-muted-foreground">{opt.note}</span>
          </button>
        ))}
      </div>

      {(status === "pending" || status === "done") && (
        <Button onClick={onNext} className="w-full">
          Continue
        </Button>
      )}
    </div>
  );
}
