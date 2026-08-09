import { useEffect, useState } from "react";
import {
  applyPreferences,
  loadPreferences,
  savePreferences,
  type Preferences,
} from "./storage";

export function usePreferences(): [Preferences, (next: Preferences) => void] {
  const [preferences, setPreferences] = useState(loadPreferences);

  useEffect(() => {
    applyPreferences(preferences);
  }, [preferences]);

  function updatePreferences(next: Preferences): void {
    savePreferences(next);
    setPreferences(next);
  }

  return [preferences, updatePreferences];
}
