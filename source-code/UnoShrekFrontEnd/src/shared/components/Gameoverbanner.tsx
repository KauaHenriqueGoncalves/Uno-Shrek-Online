type Props = {
  onLeave: () => void;
};

/**
 * Shown when the server ends the game due to inactivity (all players disconnected).
 */
export function GameOverBanner({ onLeave }: Props) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="flex flex-col items-center gap-5 rounded-3xl border-[4px] border-[#3D291F] bg-[#FAEFDD] px-10 py-8 shadow-[0_8px_0_#3D291F]">
        <span className="text-5xl">😢</span>

        <div className="text-center">
          <h2 className="font-display text-2xl text-[#ED1C24]">
            PARTIDA ENCERRADA
          </h2>
          <p className="mt-2 text-sm font-bold text-[#8A7A63]">
            O tempo de reconexão esgotou.<br />
            A partida foi encerrada por inatividade.
          </p>
        </div>

        <button
          type="button"
          onClick={onLeave}
          className="rounded-2xl border-[3px] border-[#3D291F] bg-[#ED1C24] px-8 py-3 font-display text-lg text-white shadow-[0_4px_0_#3D291F] active:translate-y-1"
        >
          VOLTAR AO LOBBY
        </button>
      </div>
    </div>
  );
}