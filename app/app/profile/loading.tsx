import { MacWindow } from "@/components/layout/mac-window";

export default function ProfileLoading() {
  return (
    <div className="space-y-2">
      <MacWindow title="Profile" subtitle="Account details, security controls, and activity">
        <div className="space-y-2">
          <div className="h-8 w-[260px] rounded-[var(--radius-control)] bg-black/5 dark:bg-white/[0.08]" />
          <div className="h-24 rounded-[var(--radius-panel)] bg-black/5 dark:bg-white/[0.08]" />
          <div className="h-24 rounded-[var(--radius-panel)] bg-black/5 dark:bg-white/[0.08]" />
        </div>
      </MacWindow>
    </div>
  );
}
