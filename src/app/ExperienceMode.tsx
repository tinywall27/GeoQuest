import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";
import { useSearchParams } from "react-router-dom";

export type ExperienceMode = "exploration" | "classroom";

interface ExperienceModeValue {
  mode: ExperienceMode;
  isClassroom: boolean;
  setMode: (mode: ExperienceMode) => void;
}

const ExperienceModeContext = createContext<ExperienceModeValue | undefined>(undefined);

export function ExperienceModeProvider({ children }: PropsWithChildren): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode: ExperienceMode =
    searchParams.get("mode") === "classroom" ? "classroom" : "exploration";

  const value = useMemo<ExperienceModeValue>(
    () => ({
      mode,
      isClassroom: mode === "classroom",
      setMode(nextMode) {
        const next = new URLSearchParams(searchParams);
        if (nextMode === "classroom") next.set("mode", "classroom");
        else next.delete("mode");
        setSearchParams(next, { replace: true });
      },
    }),
    [mode, searchParams, setSearchParams],
  );

  return (
    <ExperienceModeContext.Provider value={value}>
      {children}
    </ExperienceModeContext.Provider>
  );
}

export function useExperienceMode(): ExperienceModeValue {
  const context = useContext(ExperienceModeContext);
  if (!context) {
    throw new Error("useExperienceMode 必须在 ExperienceModeProvider 中使用");
  }
  return context;
}
