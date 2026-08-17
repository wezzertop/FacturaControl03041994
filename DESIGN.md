# Design System: FacturaControl

<!-- impeccable:design-schema 1 -->

## Design System & Principles

### 1. Visual Language: Financial Clarity & Precision
- **Theme**: Deep modern dark mode with glassmorphism elevation (`bg-slate-900/80 backdrop-blur-md`) and clean light mode (`bg-slate-50`).
- **Core Brand Palette**:
  - **Brand Primary**: Cerulean Blue (`#007ACC` / `bg-brand-cerulean`).
  - **Success / Income**: Emerald (`#059669` / `bg-emerald-600` / `text-emerald-600`).
  - **Danger / Expense**: Rose (`#E11D48` / `bg-rose-600` / `text-rose-600`).
  - **Warning / Credit / Debts**: Amber (`#D97706` / `bg-amber-600` / `text-amber-600`).
  - **Neutral Surfaces**: Slate/Zinc (`bg-slate-900`, `bg-zinc-950`, `border-slate-800`).

### 2. Impeccable Rules & Anti-Pattern Prevention
- **No Gray Text on Colored Backgrounds**: On active colored buttons (`bg-emerald-600`, `bg-rose-600`, etc.), text MUST always be solid high-contrast `text-white font-extrabold`.
- **No Decorative Text Gradients**: Avoid `bg-clip-text text-transparent bg-gradient` on headings or metrics. Use solid, high-contrast typography.
- **Mobile First Accessibility**:
  - Minimum touch target area: 44x44px (`min-h-[44px] min-w-[44px]`) for every button and interactive control on mobile.
  - Native bottom sheets (`rounded-t-[32px]`) for mobile dialogs and modals.
  - Visible focus rings (`focus-visible:ring-2 focus-visible:ring-brand-cerulean`) for keyboard and screen reader accessibility.

### 3. Typography & Hierarchy
- **Primary Font**: Sans-serif system font stack with heavy font weights (`font-black`, `font-extrabold`) for financial numbers and clear uppercase tracking (`tracking-wider text-xs`) for table and metric headers.
- **Currency Values**: Monospace or clean numeric tabular figures formatted in MXN (`$12,500.00 MXN`).
