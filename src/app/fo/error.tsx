"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[app]", error); }, [error]);
  return (
    <section className="border border-line bg-paper px-6 py-10 text-center" role="alert">
      <p className="label">Error</p>
      <h1 className="display text-2xl leading-tight mt-1">Terjadi kesalahan</h1>
      <p className="text-[12px] text-muted mt-2">Halaman ini gagal dimuat. Coba lagi, atau muat ulang browser bila masih gagal.</p>
      {error.digest && <p className="text-[11px] text-muted mt-1">Ref: {error.digest}</p>}
      <div className="mt-5 flex justify-center">
        <Button type="button" variant="ghost" onClick={reset}>Coba lagi</Button>
      </div>
    </section>
  );
}
