import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SettingsContextType = {
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  toggleDarkMode: () => void;
  effectsEnabled: boolean;
  setEffectsEnabled: (enabled: boolean) => void;
  toggleEffects: () => void;
  musicEnabled: boolean;
  setMusicEnabled: (enabled: boolean) => void;
  toggleMusic: () => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

type SettingsProviderProps = {
  children: ReactNode;
};

export function SettingsProvider({
  children,
}: SettingsProviderProps) {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem("urro-dark-mode") === "true";
  });

  const [effectsEnabled, setEffectsEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return window.localStorage.getItem("urro-effects-enabled") !== "false";
  });

  const [musicEnabled, setMusicEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return window.localStorage.getItem("urro-music-enabled") !== "false";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem("urro-dark-mode", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    window.localStorage.setItem(
      "urro-effects-enabled",
      String(effectsEnabled),
    );
  }, [effectsEnabled]);

  useEffect(() => {
    window.localStorage.setItem(
      "urro-music-enabled",
      String(musicEnabled),
    );
  }, [musicEnabled]);

  const toggleDarkMode = () => {
    setDarkMode((previous) => !previous);
  };

  const toggleEffects = () => {
    setEffectsEnabled((previous) => !previous);
  };

  const toggleMusic = () => {
    setMusicEnabled((previous) => !previous);
  };

  const value = useMemo(
    () => ({
      darkMode,
      setDarkMode,
      toggleDarkMode,
      effectsEnabled,
      setEffectsEnabled,
      toggleEffects,
      musicEnabled,
      setMusicEnabled,
      toggleMusic,
    }),
    [darkMode, effectsEnabled, musicEnabled],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error(
      "useSettings deve ser usado dentro de um SettingsProvider",
    );
  }

  return context;
}