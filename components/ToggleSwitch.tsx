import clsx from "clsx";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id: string;
}

export function ToggleSwitch({ checked, onChange, label, id }: ToggleSwitchProps) {
  return (
    <label
      htmlFor={id}
      className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--soft-border)] bg-white/30 px-3 py-2 text-sm text-[var(--text-main)] backdrop-blur-xl dark:bg-black/20"
    >
      <span>{label}</span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative h-6 w-11 rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
          checked
            ? "border-transparent bg-[var(--accent)]"
            : "border-[var(--soft-border)] bg-white/60 dark:bg-black/30",
        )}
      >
        <span
          className={clsx(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
    </label>
  );
}
