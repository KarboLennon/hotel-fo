import { requireUser } from "@/server/session";
import { TopNav } from "@/components/nav/top-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <TopNav user={user} />
      <main className="px-6 py-5">{children}</main>
    </>
  );
}
