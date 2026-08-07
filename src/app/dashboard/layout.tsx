import Link from "next/link";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/container";
import { signOutAction } from "@/app/dashboard/actions";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas-alt">
      <header className="border-b border-line bg-canvas">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="shrink-0">
            <Logo />
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink-muted transition-colors hover:text-ink"
            >
              <LogOut size={15} />
              Déconnexion
            </button>
          </form>
        </Container>
      </header>
      <main className="py-14 md:py-20">
        <Container>{children}</Container>
      </main>
    </div>
  );
}
