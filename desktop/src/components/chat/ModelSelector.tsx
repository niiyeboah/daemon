import { useOllamaModels, useModelSelector } from "@/hooks/useOllama";
import { ChevronDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ModelSelector() {
  const { models, refresh } = useOllamaModels();
  const { model, setModel } = useModelSelector();

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="appearance-none rounded-md border bg-background pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
        >
          {models.length === 0 && <option value={model}>{model}</option>}
          {models.map((m) => (
            <option key={m.name} value={m.name}>
              {m.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
      </div>
      <Button variant="ghost" size="icon-xs" onClick={refresh} title="Refresh models">
        <RefreshCw className="size-3" />
      </Button>
    </div>
  );
}
