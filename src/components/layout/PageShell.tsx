import type { ReactNode } from "react";

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
    <div className="min-h-full w-full px-4 py-5 pb-24 sm:px-6 md:px-8 md:py-8 md:pb-10 xl:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 dark:border-white/10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            {eyebrow ? (
              <p className="mb-2 text-xs font-semibold uppercase text-brand-cerulean">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-2xl font-semibold text-slate-950 dark:text-white md:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              {description}
            </p>
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
        </header>
        {children}
      </div>
    </div>
  );
}
