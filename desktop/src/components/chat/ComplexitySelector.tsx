import { useSettings } from "@/hooks/useSettings";
import { ChevronDown } from "lucide-react";

export function ComplexitySelector() {
  const { taskComplexity, setTaskComplexity } = useSettings();

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={taskComplexity}
          onChange={(e) => setTaskComplexity(e.target.value as "simple" | "standard" | "complex")}
          className="appearance-none rounded-md border bg-background pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
        >
          <option value="simple">Quick (Gemini 2.0 Flash)</option>
          <option value="standard">Standard (Gemini 2.5 Flash)</option>
          <option value="complex">Complex (Claude 3.5 Sonnet)</option>
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}
