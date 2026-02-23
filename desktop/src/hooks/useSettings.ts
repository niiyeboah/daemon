import { useState, useCallback, useEffect } from "react";
import { load } from "@tauri-apps/plugin-store";
import type { Theme, TaskComplexity } from "@/types";
import { DEFAULT_TASK_COMPLEXITY, DEFAULT_SYSTEM_PROMPT } from "@/store/constants";

const STORE_PATH = "settings.json";

interface SettingsState {
  theme: Theme;
  systemPrompt: string;
  openrouterApiKey: string;
  taskComplexity: TaskComplexity;
}

const DEFAULTS: SettingsState = {
  theme: "system",
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  openrouterApiKey: "",
  taskComplexity: DEFAULT_TASK_COMPLEXITY as TaskComplexity,
};

export function useSettings() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  // Load settings from store on mount
  useEffect(() => {
    (async () => {
      try {
        const store = await load(STORE_PATH, { defaults: {}, autoSave: true });
        const theme = await store.get<Theme>("theme");
        const systemPrompt = await store.get<string>("systemPrompt");
        const openrouterApiKey = await store.get<string>("openrouterApiKey");
        const taskComplexity = await store.get<TaskComplexity>("taskComplexity");

        setSettings({
          theme: theme ?? DEFAULTS.theme,
          systemPrompt: systemPrompt ?? DEFAULTS.systemPrompt,
          openrouterApiKey: openrouterApiKey ?? DEFAULTS.openrouterApiKey,
          taskComplexity: taskComplexity ?? DEFAULTS.taskComplexity,
        });
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    if (!loaded) return;
    applyTheme(settings.theme);
  }, [settings.theme, loaded]);

  const updateSetting = useCallback(
    async <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      try {
        const store = await load(STORE_PATH, { defaults: {}, autoSave: true });
        await store.set(key, value);
      } catch (err) {
        console.error(`Failed to save setting ${key}:`, err);
      }
    },
    []
  );

  const setTheme = useCallback(
    (theme: Theme) => updateSetting("theme", theme),
    [updateSetting]
  );

  const setSystemPrompt = useCallback(
    (prompt: string) => updateSetting("systemPrompt", prompt),
    [updateSetting]
  );

  const setOpenrouterApiKey = useCallback(
    (key: string) => updateSetting("openrouterApiKey", key),
    [updateSetting]
  );

  const setTaskComplexity = useCallback(
    (complexity: TaskComplexity) => updateSetting("taskComplexity", complexity),
    [updateSetting]
  );

  return {
    ...settings,
    loaded,
    setTheme,
    setSystemPrompt,
    setOpenrouterApiKey,
    setTaskComplexity,
  };
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    // system
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    if (prefersDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
}
