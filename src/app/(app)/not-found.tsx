import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="border border-line bg-paper px-6 py-10 text-center">
      <p className="label">404</p>
      <h1 className="display text-2xl leading-tight mt-1">Halaman tidak ditemukan</h1>
      <p className="text-[12px] text-muted mt-2">Data yang Anda cari sudah dihapus atau alamatnya salah.</p>
      <div className="mt-5 flex justify-center">
        <Link href="/" className="inline-flex focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent">
          <Button type="button" variant="ghost">Kembali ke Room View</Button>
        </Link>
      </div>
    </section>
  );
}
