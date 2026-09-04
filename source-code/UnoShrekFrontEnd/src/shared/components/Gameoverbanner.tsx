import Confetti from "react-confetti";

type Winner = {
  username: string;
  avatar?: string;
};

type Props = {
  onLeave: () => void;
  winner?: Winner | null;
};

export function GameOverBanner({ onLeave, winner }: Props) {
  if (winner) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/75 p-4">
        <Confetti
          recycle={false}
          numberOfPieces={280}
          gravity={0.18}
          initialVelocityY={18}
          tweenDuration={5000}
        />

        <div className="winner-celebration pointer-events-none absolute inset-x-0 top-1/2 h-2" aria-hidden="true">
          <span className="winner-burst winner-burst-left" />
          <span className="winner-burst winner-burst-right" />
        </div>

        <section
          className="winner-modal relative flex w-full max-w-[400px] flex-col items-center rounded-3xl border-[4px] border-[#3D291F] bg-[#FAEFDD] px-7 pb-7 pt-0 text-center shadow-[0_12px_0_#3D291F]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="winner-title"
        >
          <div className="winner-ribbon relative -top-5 flex h-16 w-[calc(100%+28px)] items-center justify-center rounded-xl border-[4px] border-[#3D291F] bg-[#E23E3E] shadow-[0_6px_0_#3D291F]">
            <span id="winner-title" className="font-display text-3xl text-[#FAEFDD] drop-shadow-[0_3px_0_#3D291F]">
              VITÓRIA!
            </span>
          </div>

          <div className="relative -mt-1">
            <div className="winner-crown absolute -top-10 left-1/2 -translate-x-1/2 text-5xl" aria-hidden="true">
              👑
            </div>
            <div className="h-24 w-24 overflow-hidden rounded-full border-[4px] border-[#3D291F] bg-white shadow-[0_5px_0_#3D291F]">
              {winner.avatar ? (
                <img
                  src={winner.avatar}
                  alt={`Foto de ${winner.username}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#9CCB45] font-display text-3xl text-[#3D291F]">
                  {winner.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <h2 className="mt-4 max-w-full truncate font-display text-3xl text-[#3D291F]">
            {winner.username}
          </h2>
          <span className="mt-2 rounded-full border-2 border-[#3D291F] bg-[#FFC107] px-5 py-1 text-sm font-extrabold text-[#3D291F]">
            VENCEDOR
          </span>

          <div className="my-6 h-[2px] w-full bg-[#E3D1B8]" />

          <button
            type="button"
            onClick={onLeave}
            className="h-14 w-full rounded-2xl border-[4px] border-[#3D291F] bg-[#E23E3E] px-6 font-display text-lg text-white shadow-[0_6px_0_#3D291F] transition active:translate-y-1 active:shadow-[0_2px_0_#3D291F]"
          >
            SAIR DA SALA
          </button>
        </section>
      </div>
    );
  }

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