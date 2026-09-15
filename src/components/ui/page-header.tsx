export function PageHeader({ eyebrow, title, actions }: { eyebrow?: string; title: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between border-b border-line pb-3 mb-4 gap-4 flex-wrap">
      <div>
        {eyebrow && <p className="label">{eyebrow}</p>}
        <h1 className="display text-2xl leading-tight">{title}</h1>
      </div>
      {actions && <div className="flex gap-2 items-center">{actions}</div>}
    </div>
  );
}
