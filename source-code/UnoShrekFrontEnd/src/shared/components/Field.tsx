import type { InputHTMLAttributes, ReactNode } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  action?: ReactNode;
  hint?: ReactNode;
};

export function Field({ id, label, action, hint, ...props }: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
        {action}
      </div>
      <input
        id={id}
        {...props}
        className="h-11 w-full rounded-lg border border-ink/40 bg-white px-3 text-[15px] text-ink outline-none transition placeholder:text-ink/30 focus:border-shrek focus:ring-2 focus:ring-shrek/40"
      />
      {hint}
    </div>
  );
}