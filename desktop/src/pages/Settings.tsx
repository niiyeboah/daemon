import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/hooks/useSettings";
import { ollamaListModels } from "@/lib/tauri";
import { cn } from "@/lib/utils";
import type { ModelInfo, Theme } from "@/types";

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ElementType }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function Settings() {
  const {
    theme,
    defaultModel,
    systemPrompt,
    loaded,
    setTheme,
    setDefaultModel,
    setSystemPrompt,
  } = useSettings();

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [promptDraft, setPromptDraft] = useState(systemPrompt);

  useEffect(() => {
    ollamaListModels()
      .then(setModels)
      .catch(() => setModels([]));
  }, []);

  // Sync draft when settings load
  useEffect(() => {
    if (loaded) setPromptDraft(systemPrompt);
  }, [loaded, systemPrompt]);

  if (!loaded) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure your Daemon experience
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl">
        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Theme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors",
                    theme === value
                      ? "border-primary bg-primary/5 font-medium"
                      : "hover:bg-accent"
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Default Model */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Default Model</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {models.length > 0 ? (
                models.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))
              ) : (
                <option value={defaultModel}>{defaultModel}</option>
              )}
            </select>
            <p className="text-xs text-muted-foreground mt-2">
              Model used for new chat conversations.
            </p>
          </CardContent>
        </Card>

        {/* System Prompt */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={promptDraft}
              onChange={(e) => setPromptDraft(e.target.value)}
              rows={5}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-y min-h-[100px]"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Prepended to every conversation as the system message.
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={promptDraft === systemPrompt}
                onClick={() => setSystemPrompt(promptDraft)}
              >
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
