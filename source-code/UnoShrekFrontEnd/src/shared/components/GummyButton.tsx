import type { ButtonHTMLAttributes } from "react";

const variants = {
  green: "bg-[#A9C938] text-[#3D291F] shadow-[0_6px_0_#3D291F]",
  cream: "bg-[#FDF8E4] text-[#4A3525] shadow-[0_6px_0_#3D291F]",
  yellow: "bg-[#FFF200] text-[#4A3525] shadow-[0_6px_0_#3D291F]",
  red: "bg-[#ED1C24] text-white shadow-[0_6px_0_#3D291F]",
  brown: "bg-[#4A3525] text-white shadow-[0_6px_0_#3D291F]",
} as const;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function GummyButton({ variant = "green", className = "", ...props }: Props) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-full border-[3px] border-[#4A3525] px-6 font-extrabold transition active:translate-y-1 active:shadow-[0_2px_0_#3D291F] ${variants[variant]} ${className}`}
    />
  );
}