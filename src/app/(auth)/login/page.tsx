import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { SCHOOL_NAME } from "@/lib/constants";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-paper-2 p-6">
      <div className="w-full max-w-sm bg-paper border border-line p-8">
        <div className="flex items-center gap-3 mb-6">
          <Image src="/logo.png" alt={SCHOOL_NAME} width={56} height={56} priority />
          <div className="leading-tight">
            <p className="label">{SCHOOL_NAME}</p>
            <p className="text-[11px] text-muted">Hotel Front Office · Praktik Siswa</p>
          </div>
        </div>
        <h1 className="display text-3xl mb-6">Sign in</h1>
        <LoginForm />
        <p className="mt-6 text-[11px] text-muted">
          Mau jadi tamu? <Link href="/" className="text-accent-2 underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent">Buka halaman booking</Link>
        </p>
      </div>
    </main>
  );
}
