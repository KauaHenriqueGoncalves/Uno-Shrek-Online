type CardColor =
  | "red"
  | "green"
  | "blue"
  | "yellow";

type ColorPickerModalProps = {
  onSelect: (color: CardColor) => void;
};

const colors: Record<CardColor, string> = {
  red: "#E23E3E",
  green: "#91BE38",
  blue: "#18A5D6",
  yellow: "#FFC107",
};

export function ColorPickerModal({
  onSelect,
}: ColorPickerModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4">
      <div className="relative w-full max-w-[360px]">
        {/* Sombra 3D */}
        <div className="absolute inset-x-0 top-[6px] h-[420px] rounded-[24px] bg-[#3D291F]" />

        {/* Modal */}
        <div className="relative h-[420px] rounded-[24px] border-[4px] border-[#3D291F] bg-[#FAEFDD] px-[26px] pt-10">
          <h2 className="text-center font-display text-[24px] text-[#3D291F]">
            ESCOLHA A COR
          </h2>

          <div className="mx-auto mt-3 h-[2px] w-full bg-[#E3D1B8]" />

          <div className="mt-7 grid grid-cols-2 gap-5">
            <ColorButton
              color="red"
              background={colors.red}
              onSelect={onSelect}
            />

            <ColorButton
              color="green"
              background={colors.green}
              onSelect={onSelect}
            />

            <ColorButton
              color="blue"
              background={colors.blue}
              onSelect={onSelect}
            />

            <ColorButton
              color="yellow"
              background={colors.yellow}
              onSelect={onSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

type ColorButtonProps = {
  color: CardColor;
  background: string;
  onSelect: (color: CardColor) => void;
};

function ColorButton({
  color,
  background,
  onSelect,
}: ColorButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(color)}
      aria-label={`Escolher cor ${color}`}
      className="
        relative
        h-[130px]
        w-full
        rounded-[20px]
        border-[4px]
        border-[#3D291F]
        transition
        hover:-translate-y-1
        hover:brightness-110
        active:translate-y-[4px]
        active:shadow-none
      "
      style={{
        backgroundColor: background,
        boxShadow: "0 6px 0 #3D291F",
      }}
    >
      <span className="absolute left-[12px] right-[12px] top-[8px] h-[12px] rounded-full bg-white/30" />
    </button>
  );
}