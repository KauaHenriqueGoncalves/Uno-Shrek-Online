import { useState } from "react";
import { useSettings } from "../context/SettingsContext";
import { GummyButton } from "./GummyButton";

type ToggleKey = "effects" | "music" | "dark" | "colorblind" | "reduceMotion";

type Section = {
  title: string;
  items: { key: ToggleKey; label: string }[];
};

const sections: Section[] = [
  {
    title: "ÁUDIO",
    items: [
      { key: "effects", label: "Efeitos Sonoros" },
      { key: "music", label: "Música do Pântano" },
    ],
  },
  {
    title: "ACESSIBILIDADE",
    items: [
      { key: "dark", label: "Modo Escuro" },
      { key: "colorblind", label: "Modo Daltonismo" },
      { key: "reduceMotion", label: "Reduzir Animações" },
    ],
  },
];

type Props = {
  exitLabel: string;
  onExit: () => void;
  onClose: () => void;
};

export function SettingsModal({
  exitLabel,
  onExit,
  onClose,
}: Props) {
  const {
    darkMode,
    toggleDarkMode,
    effectsEnabled,
    toggleEffects,
    musicEnabled,
    toggleMusic,
  } = useSettings();

  const [toggles, setToggles] = useState<
    Record<Exclude<ToggleKey, "dark" | "effects" | "music">, boolean>
  >({
    colorblind: false,
    reduceMotion: false,
  });

  const toggle = (
    key: Exclude<ToggleKey, "dark" | "effects" | "music">,
  ) => {
    setToggles((prev) => {
      const next = {
        ...prev,
        [key]: !prev[key],
      };

      console.log(
        "[URRO][settings]",
        JSON.stringify({
          action: "toggle",
          [key]: next[key],
        }),
      );

      return next;
    });
  };

  const handleToggle = (key: ToggleKey) => {
    if (key === "dark") {
      toggleDarkMode();

      console.log(
        "[URRO][settings]",
        JSON.stringify({
          action: "toggle",
          dark: !darkMode,
        }),
      );

      return;
    }

    if (key === "effects") {
      toggleEffects();
      return;
    }

    if (key === "music") {
      toggleMusic();
      return;
    }

    toggle(key);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border-4 border-[#3D291F] bg-[#FAEFDD] px-8 py-7 shadow-[0_10px_0_#3D291F]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-center font-display text-2xl tracking-wide text-[#3D291F]">
          CONFIGURAÇÕES
        </h2>

        <hr className="my-4 border-[#E3D1B8]" />

        {sections.map((section) => (
          <section key={section.title} className="mt-5">
            <h3 className="text-xs font-bold tracking-[0.2em] text-[#A89279]">
              {section.title}
            </h3>

            <div className="mt-3 flex flex-col gap-4">
              {section.items.map(({ key, label }) => {
                const enabled =
                  key === "dark"
                    ? darkMode
                    : key === "effects"
                      ? effectsEnabled
                      : key === "music"
                        ? musicEnabled
                        : toggles[key];

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between"
                  >
                    <span className="text-lg font-extrabold text-[#3D291F]">
                      {label}
                    </span>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      aria-label={label}
                      onClick={() => handleToggle(key)}
                      className={`relative h-9 w-[4.5rem] rounded-full border-[3px] border-[#3D291F] transition-colors ${
                        enabled
                          ? "bg-[#A5CD50]"
                          : "bg-transparent"
                      }`}
                    >
                      <span
                        className={`absolute top-[3px] h-6 w-6 rounded-full border-[3px] border-[#3D291F] bg-white transition-all ${
                          enabled
                            ? "left-[calc(100%-1.7rem)]"
                            : "left-[3px]"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <section className="mt-5">
          <h3 className="text-xs font-bold tracking-[0.2em] text-[#A89279]">
            CONTA
          </h3>

          <GummyButton
            variant="red"
            onClick={onExit}
            className="mt-3 h-12 w-full rounded-2xl font-display text-base tracking-wide"
          >
            {exitLabel}
          </GummyButton>
        </section>

        <div className="mt-6 flex gap-4">
          <GummyButton
            variant="cream"
            onClick={onClose}
            className="h-12 flex-1 rounded-2xl font-display text-base"
          >
            CANCELAR
          </GummyButton>

          <GummyButton
            variant="green"
            onClick={onClose}
            className="h-12 flex-1 rounded-2xl font-display text-base"
          >
            PRONTO!
          </GummyButton>
        </div>
      </div>
    </div>
  );
}