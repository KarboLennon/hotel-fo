"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const path = usePathname();
  const active = href === "/" ? path === "/" : path.startsWith(href);
  return (
    <Link href={href} aria-current={active ? "page" : undefined}
      className={cn("label py-1 border-b-2 border-transparent hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
        active && "text-ink border-accent")}>
      {children}
    </Link>
  );
}
