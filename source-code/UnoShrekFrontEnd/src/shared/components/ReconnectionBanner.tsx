type Props = {
  secondsLeft: number;
};

/**
 * Banner overlay shown when the player loses connection.
 * Matches the game's visual style (cream + brown border).
 */
export function ReconnectionBanner({ secondsLeft }: Props) {
  const pct = (secondsLeft / 60) * 100;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="flex flex-col items-center gap-5 rounded-3xl border-[4px] border-[#3D291F] bg-[#FAEFDD] px-10 py-8 shadow-[0_8px_0_#3D291F]">
        {/* Spinner */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E3D1B8] border-t-[#3D291F]" />

        <div className="text-center">
          <h2 className="font-display text-2xl text-[#3D291F]">
            RECONECTANDO...
          </h2>
          <p className="mt-1 text-sm font-bold text-[#8A7A63]">
            Sua conexão caiu. Tentando reconectar automaticamente.
          </p>
        </div>

        {/* Countdown */}
        <div className="flex flex-col items-center gap-2 w-full">
          <span className="font-display text-4xl text-[#3D291F]">
            {secondsLeft}s
          </span>

          {/* Progress bar — decreases as time runs out */}
          <div className="h-3 w-full rounded-full bg-[#E3D1B8] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#ED1C24] transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>

          <p className="text-xs font-bold text-[#8A7A63]">
            A partida será encerrada se você não reconectar a tempo.
          </p>
        </div>
      </div>
    </div>
  );
}