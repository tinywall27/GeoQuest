const STORAGE_PREFIX = "geoquest:";
const PREFERENCES_KEY = `${STORAGE_PREFIX}preferences:v1`;
const SCHEMA_VERSION_KEY = `${STORAGE_PREFIX}schema-version`;
const COMPLETION_PREFIX = `${STORAGE_PREFIX}completion:`;

export interface Preferences {
  textScale: "default" | "large";
  reducedMotion: boolean;
}

export interface TopicCompletion {
  slug: string;
  completedSteps: string[];
  updatedAt: string;
}

export const defaultPreferences: Preferences = {
  textScale: "default",
  reducedMotion: false,
};

function getStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function loadPreferences(): Preferences {
  const storage = getStorage();
  const stored = storage?.getItem(PREFERENCES_KEY);
  if (!stored) return defaultPreferences;
  try {
    const value = JSON.parse(stored) as Partial<Preferences>;
    return {
      textScale: value.textScale === "large" ? "large" : "default",
      reducedMotion: value.reducedMotion === true,
    };
  } catch {
    return defaultPreferences;
  }
}

export function savePreferences(preferences: Preferences): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(SCHEMA_VERSION_KEY, "1");
  storage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export function loadTopicCompletion(slug: string): TopicCompletion | undefined {
  const stored = getStorage()?.getItem(`${COMPLETION_PREFIX}${slug}`);
  if (!stored) return undefined;
  try {
    const value = JSON.parse(stored) as Partial<TopicCompletion>;
    if (value.slug !== slug || !Array.isArray(value.completedSteps)) return undefined;
    return {
      slug,
      completedSteps: value.completedSteps.filter(
        (step): step is string => typeof step === "string",
      ),
      updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
    };
  } catch {
    return undefined;
  }
}

export function saveTopicCompletion(
  slug: string,
  completedSteps: readonly string[],
): void {
  const storage = getStorage();
  if (!storage) return;
  const record: TopicCompletion = {
    slug,
    completedSteps: [...new Set(completedSteps)],
    updatedAt: new Date().toISOString(),
  };
  storage.setItem(SCHEMA_VERSION_KEY, "1");
  storage.setItem(`${COMPLETION_PREFIX}${slug}`, JSON.stringify(record));
}

export function clearTopicProgress(slug: string): void {
  getStorage()?.removeItem(`${COMPLETION_PREFIX}${slug}`);
}

export function clearAllGeoQuestData(): number {
  const storage = getStorage();
  if (!storage) return 0;
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
  const geoQuestKeys = keys.filter(
    (key): key is string => typeof key === "string" && key.startsWith(STORAGE_PREFIX),
  );
  geoQuestKeys.forEach((key) => storage.removeItem(key));
  return geoQuestKeys.length;
}

export function applyPreferences(preferences: Preferences): void {
  const root = document.documentElement;
  root.dataset.textScale = preferences.textScale;
  root.dataset.reducedMotion = preferences.reducedMotion ? "true" : "false";
}
