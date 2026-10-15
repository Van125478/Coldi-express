import { useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { authPath, paths } from "@/app/paths";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { VnFlag } from "@/components/ui/VnFlag";

const desktopNav = [
  { to: paths.home, label: "Trang chủ", end: true },
  { to: paths.shipments, label: "Tìm chuyến hàng", end: false },
  { to: paths.about, label: "Về chúng tôi", end: false },
] as const;

export function SiteHeader() {
  const location = useLocation();
  const locationKey = `${location.pathname}${location.search}`;
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const mobileOpen = openKey === locationKey;
  const menuId = useId();
  const cinematic = location.pathname === paths.home;

  useEffect(() => {
    if (!cinematic) return;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [cinematic]);

  return (
    <header
      data-scrolled={cinematic && (scrolled || mobileOpen) ? "true" : "false"}
      className={cn(
        "border-b",
        cinematic
          ? "site-header-cinematic fixed inset-x-0 top-0 z-[80] text-white"
          : "sticky top-0 z-50 border-line bg-surface/95 backdrop-blur",
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 py-2 sm:px-6 min-[1200px]:gap-3">
        <Logo tone={cinematic ? "inverse" : "default"} />
        <nav className="hidden shrink-0 items-center gap-0.5 min-[1200px]:flex" aria-label="Điều hướng chính">
          <NavItem to={paths.home} end cinematic={cinematic}>
            Trang chủ
          </NavItem>
          <NavItem to={paths.shipments} cinematic={cinematic}>
            Tìm chuyến hàng
          </NavItem>
          <PublishLink
            className={cn(
              "whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium",
              cinematic ? "text-white/85 hover:bg-white/10 hover:text-white" : "text-ink hover:bg-canvas hover:text-navy",
            )}
          />
          <PartnerMenu cinematic={cinematic} />
          <NavItem to={paths.about} cinematic={cinematic}>
            Về chúng tôi
          </NavItem>
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <LanguageMenu className="hidden sm:block" cinematic={cinematic} />
          <Link
            to={paths.login}
            className={cn(
              "hidden min-h-11 items-center rounded-full px-4 text-sm font-semibold sm:inline-flex",
              cinematic ? "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15" : "bg-canvas text-ink ring-1 ring-line hover:bg-white",
            )}
          >
            Đăng nhập
          </Link>
          <Link
            to={paths.register}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold",
              cinematic ? "bg-white text-navy hover:bg-white/90" : "bg-navy text-white hover:bg-navy-deep",
            )}
          >
            Đăng ký
          </Link>
          <Link
            to={authPath("account", paths.home)}
            aria-label="Tài khoản, yêu cầu đăng nhập"
            className={cn(
              "hidden size-11 items-center justify-center rounded-full min-[1200px]:inline-flex",
              cinematic ? "border border-white/20 text-white hover:bg-white/10" : "border border-line text-navy hover:bg-canvas",
            )}
          >
            <Icon name="user" className="size-5" />
          </Link>
          <button
            type="button"
            className={cn(
              "inline-flex size-11 items-center justify-center rounded-xl min-[1200px]:hidden",
              cinematic ? "text-white hover:bg-white/10" : "text-navy hover:bg-canvas",
            )}
            aria-expanded={mobileOpen}
            aria-controls={menuId}
            onClick={() => setOpenKey(mobileOpen ? null : locationKey)}
          >
            <Icon name={mobileOpen ? "close" : "menu"} className="size-5" />
            <span className="sr-only">{mobileOpen ? "Đóng menu" : "Mở menu"}</span>
          </button>
        </div>
      </div>
      {mobileOpen ? (
        <nav
          id={menuId}
          className={cn(
            "border-t px-4 py-3 min-[1200px]:hidden",
            cinematic ? "site-header-menu border-white/10" : "border-line bg-surface",
          )}
          aria-label="Điều hướng di động"
        >
          <ul className="flex flex-col">
            {desktopNav.slice(0, 2).map((item) => (
              <li key={item.to}>
                <MobileLink to={item.to} end={item.end} cinematic={cinematic}>
                  {item.label}
                </MobileLink>
              </li>
            ))}
            <li>
              <PublishLink
                className={cn(
                  "flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold",
                  cinematic ? "text-white hover:bg-white/10" : "text-ink hover:bg-canvas",
                )}
              />
            </li>
            <li className={cn("px-3 pt-3 text-xs font-semibold uppercase tracking-wide", cinematic ? "text-white/60" : "text-muted")}>
              Giải pháp đối tác
            </li>
            <li>
              <MobileLink to={paths.shipperSolution} cinematic={cinematic}>
                Dành cho chủ hàng
              </MobileLink>
            </li>
            <li>
              <MobileLink to={paths.carrierSolution} cinematic={cinematic}>
                Dành cho nhà xe
              </MobileLink>
            </li>
            <li>
              <MobileLink to={paths.about} cinematic={cinematic}>
                Về chúng tôi
              </MobileLink>
            </li>
            <li className={cn("mt-2 border-t pt-2 sm:hidden", cinematic ? "border-white/10" : "border-line")}>
              <MobileLink to={paths.login} cinematic={cinematic}>
                Đăng nhập
              </MobileLink>
            </li>
            <li>
              <MobileLink to={authPath("account", paths.home)} cinematic={cinematic}>
                Tài khoản
              </MobileLink>
            </li>
          </ul>
          <div className={cn("mt-3 border-t px-3 pt-3 sm:hidden", cinematic ? "border-white/10" : "border-line")}>
            <p className={cn("text-sm font-semibold", cinematic ? "text-white" : "text-ink")}>Ngôn ngữ: Tiếng Việt</p>
            <p className={cn("mt-1 text-sm", cinematic ? "text-white/70" : "text-muted")}>English chưa có bản dịch cho trang khách.</p>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

function NavItem({ to, end = false, cinematic = false, children }: { to: string; end?: boolean; cinematic?: boolean; children: string }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium",
          cinematic
            ? isActive
              ? "text-white"
              : "text-white/75 hover:bg-white/10 hover:text-white"
            : isActive
              ? "text-navy"
              : "text-ink hover:bg-canvas hover:text-navy",
        )
      }
    >
      {children}
    </NavLink>
  );
}

function MobileLink({
  to,
  end = false,
  cinematic = false,
  children,
}: {
  to: string;
  end?: boolean;
  cinematic?: boolean;
  children: string;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold",
          cinematic
            ? isActive
              ? "bg-white/10 text-white"
              : "text-white/85 hover:bg-white/10"
            : isActive
              ? "bg-canvas text-navy"
              : "text-ink hover:bg-canvas",
        )
      }
    >
      {children}
    </NavLink>
  );
}

function PublishLink({ className }: { className: string }) {
  return (
    <Link to={authPath("publish", paths.publish)} className={className}>
      Đăng đơn hàng
    </Link>
  );
}

function PartnerMenu({ cinematic = false }: { cinematic?: boolean }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className={cn(
          "inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded-lg px-2.5 text-sm font-medium",
          cinematic ? "text-white/85 hover:bg-white/10 hover:text-white" : "text-ink hover:bg-canvas hover:text-navy",
        )}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        Giải pháp đối tác
        <Icon name="chevron" className="size-4" />
      </button>
      {open ? (
        <div id={menuId} className="absolute left-0 top-full z-20 w-72 pt-2">
          <ul className="rounded-2xl border border-line bg-surface p-2 shadow-lg">
            <li>
              <Link
                to={paths.shipperSolution}
                className="block rounded-xl px-3 py-3 hover:bg-canvas"
                onClick={() => setOpen(false)}
              >
                <span className="block text-sm font-semibold text-ink">Dành cho chủ hàng</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">Đăng và theo dõi đơn vận tải lạnh.</span>
              </Link>
            </li>
            <li>
              <Link
                to={paths.carrierSolution}
                className="block rounded-xl px-3 py-3 hover:bg-canvas"
                onClick={() => setOpen(false)}
              >
                <span className="block text-sm font-semibold text-ink">Dành cho nhà xe</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">Tự nhận chuyến, rồi tự gán xe và tài xế.</span>
              </Link>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function LanguageMenu({ className, cinematic = false }: { className?: string; cinematic?: boolean }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-semibold",
          cinematic ? "text-white hover:bg-white/10" : "text-ink hover:bg-canvas",
        )}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Chọn ngôn ngữ"
        onClick={() => setOpen((value) => !value)}
      >
        <VnFlag />
        VN
        <Icon name="chevron" className="size-4" />
      </button>
      {open ? (
        <div id={menuId} className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-line bg-surface p-2 shadow-lg">
          <p className="rounded-xl bg-canvas px-3 py-2 text-sm font-semibold text-navy">Tiếng Việt · đang dùng</p>
          <p className="px-3 py-2 text-sm leading-relaxed text-muted">English chưa có bản dịch cho trang khách.</p>
          <button type="button" className="mt-1 min-h-11 w-full rounded-xl px-3 text-left text-sm font-semibold text-ink hover:bg-canvas" onClick={() => setOpen(false)}>
            Đóng
          </button>
        </div>
      ) : null}
    </div>
  );
}
