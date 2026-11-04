import type { ReactNode } from "react";

export function LegalPage({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <article className="panel mx-auto max-w-3xl space-y-4 p-6 leading-8 sm:p-10 [&_h2]:mt-6 [&_h2]:font-serif [&_h2]:text-lg [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc">
      <h1 className="font-serif text-3xl font-bold tracking-wider">{title}</h1>
      {updated && <p className="text-sm text-muted">更新日期：{updated}</p>}
      {children}
    </article>
  );
}
