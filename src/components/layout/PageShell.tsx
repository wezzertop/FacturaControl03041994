import type { ReactNode } from "react";
import PinLockModal from "@/components/auth/PinLockModal";
import NotificationBell from "@/components/notifications/NotificationBell";

interface PageShellProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: PageShellProps) {
  return (
    <div className="min-h-full w-full px-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:px-6 md:px-8 md:py-8 md:pb-10 xl:px-10">
      <PinLockModal />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 dark:border-white/10 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 md:block">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white md:text-3xl tracking-tight truncate">
                {title}
              </h1>
              <div className="flex items-center gap-2 md:hidden">
                <NotificationBell />
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-zinc-400 font-medium line-clamp-2 md:line-clamp-none">
              {description}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <NotificationBell />
            </div>
            {actions}
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
