import { Link, Outlet, useLocation } from "react-router-dom";
import { paths } from "@/app/paths";
import { Logo } from "@/components/ui/Logo";

export function AuthLayout() {
  const location = useLocation();

  if (location.pathname === paths.login) {
    return (
      <main id="noi-dung" className="min-h-screen bg-canvas">
        <Outlet />
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-2 sm:px-6">
          <Logo />
          <Link to={paths.home} className="inline-flex min-h-11 items-center text-sm font-semibold text-navy">
            Về trang chủ
          </Link>
        </div>
      </header>
      <main id="noi-dung" className="flex flex-1 items-start justify-center px-4 py-10 sm:px-6 sm:py-16">
        <Outlet />
      </main>
      <footer className="px-4 py-6 text-center text-sm text-muted">© 2026 Coldi Freight</footer>
    </div>
  );
}
