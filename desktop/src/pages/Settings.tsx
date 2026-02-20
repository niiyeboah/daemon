import { useCallback, useEffect, useState } from "react";
import { Key, Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/hooks/useSettings";
import {
  ollamaListModels,
  openclawGetApiKeys,
  openclawRemoveApiKey,
  openclawSetApiKey,
} from "@/lib/tauri";
import { cn } from "@/lib/utils";
import type { ApiKeysStatus, ModelInfo, Theme } from "@/types";

const API_KEY_PROVIDERS = [
  {
    id: "gemini" as const,
    label: "Gemini",
    getKeyUrl: "https://aistudio.google.com/apikey",
  },
  {
    id: "openai" as const,
    label: "OpenAI",
    getKeyUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "anthropic" as const,
    label: "Claude (Anthropic)",
    getKeyUrl: "https://console.anthropic.com/settings/keys",
  },
] as const;

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
  const [apiKeys, setApiKeys] = useState<ApiKeysStatus | null>(null);
  const [apiKeyDrafts, setApiKeyDrafts] = useState<Record<string, string>>({});
  const [apiKeySaving, setApiKeySaving] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const loadApiKeys = useCallback(() => {
    openclawGetApiKeys()
      .then(setApiKeys)
      .catch(() => setApiKeys(null));
  }, []);

  useEffect(() => {
    ollamaListModels()
      .then(setModels)
      .catch(() => setModels([]));
  }, []);

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

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

        {/* API Keys (OpenClaw) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="size-4" />
              API Keys (OpenClaw)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Used by OpenClaw for cloud models. For Beelink or low-power devices,
              use these instead of local Ollama.
            </p>
            {apiKeyError && (
              <p className="text-xs text-destructive">{apiKeyError}</p>
            )}
            {API_KEY_PROVIDERS.map(({ id, label, getKeyUrl }) => {
              const status = apiKeys?.[id];
              const draft = apiKeyDrafts[id] ?? "";
              const isSaving = apiKeySaving === id;
              return (
                <div
                  key={id}
                  className="flex flex-col gap-2 rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{label}</span>
                    {status?.configured && status.masked && (
                      <span className="text-xs text-muted-foreground">
                        {status.masked}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder={status?.configured ? "Enter new key to replace" : "Paste API key"}
                      value={draft}
                      onChange={(e) => {
                        setApiKeyError(null);
                        setApiKeyDrafts((prev) => ({ ...prev, [id]: e.target.value }));
                      }}
                      className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!draft.trim() || isSaving}
                      onClick={async () => {
                        setApiKeySaving(id);
                        setApiKeyError(null);
                        try {
                          await openclawSetApiKey(id, draft.trim());
                          setApiKeyDrafts((prev) => ({ ...prev, [id]: "" }));
                          loadApiKeys();
                        } catch (err) {
                          setApiKeyError(String(err));
                        } finally {
                          setApiKeySaving(null);
                        }
                      }}
                    >
                      {isSaving ? "…" : "Save"}
                    </Button>
                    {status?.configured && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isSaving}
                        onClick={async () => {
                          setApiKeySaving(id);
                          setApiKeyError(null);
                          try {
                            await openclawRemoveApiKey(id);
                            setApiKeyDrafts((prev) => ({ ...prev, [id]: "" }));
                            loadApiKeys();
                          } catch (err) {
                            setApiKeyError(String(err));
                          } finally {
                            setApiKeySaving(null);
                          }
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <a
                    href={getKeyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline"
                  >
                    Get key
                  </a>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
