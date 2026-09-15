import { cn } from "@/lib/cn";

export function Panel({ title, actions, className, children }: { title: string; actions?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("border border-line bg-paper", className)}>
      <header className="flex items-center justify-between px-3 py-2 border-b border-line-soft">
        <h3 className="label text-accent-2">{title}</h3>
        {actions}
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}
