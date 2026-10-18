import { useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { authPath, paths } from "@/app/paths";
import { useAuth } from "@/features/auth/useAuth";
import { guestAccountAction } from "@/features/guest/guestHeaderAccount";
import { publicPackageNav } from "@/features/packages/packageNavigation";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { VnFlag } from "@/components/ui/VnFlag";

const desktopNav = [
  { to: paths.home, label: "Trang chủ", end: true },
  { to: paths.shipments, label: "Tìm chuyến hàng", end: false },
  { to: paths.about, label: "Về chúng tôi", end: false },
] as const;

const scrollKeys = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "]);

function alignAudienceHeading() {
  let cancelled = false;
  let frame = 0;
  const cancel = () => {
    cancelled = true;
  };
  const onWheel = () => cancel();
  const onTouch = () => cancel();
  const onKey = (event: KeyboardEvent) => {
    if (scrollKeys.has(event.key)) cancel();
  };
  window.addEventListener("wheel", onWheel, { passive: true, capture: true });
  window.addEventListener("touchmove", onTouch, { passive: true, capture: true });
  window.addEventListener("keydown", onKey, true);

  const align = () => {
    if (cancelled) return;
    const target = document.getElementById("audiences-title");
    if (!target) return;
    target.scrollIntoView({ block: "start", behavior: "instant" });
  };
  const alignOnce = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(align);
    });
  };

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pinReady = () => reduced || document.querySelector(".pin-spacer") !== null;
  let observer: MutationObserver | undefined;
  if (pinReady()) {
    alignOnce();
  } else {
    observer = new MutationObserver(() => {
      if (!pinReady()) return;
      observer?.disconnect();
      alignOnce();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  return () => {
    cancelled = true;
    observer?.disconnect();
    cancelAnimationFrame(frame);
    window.removeEventListener("wheel", onWheel, true);
    window.removeEventListener("touchmove", onTouch, true);
    window.removeEventListener("keydown", onKey, true);
  };
}

export function SiteHeader() {
  const location = useLocation();
  const locationKey = `${location.pathname}${location.search}`;
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const mobileOpen = openKey === locationKey;
  const menuId = useId();
  const cinematic = location.pathname === paths.home;
  const { snapshot } = useAuth();
  const role = snapshot.status === "authenticated" ? snapshot.user.role : null;
  const account = guestAccountAction(role);
  const packageNav = publicPackageNav(role);
  const accountClass = cn(
    "hidden min-h-11 items-center px-3 text-sm font-semibold min-[1200px]:inline-flex",
    account.kind === "workspace" ? "rounded-full border" : "",
    cinematic
      ? account.kind === "workspace"
        ? "border-white/40 text-white hover:bg-white/10"
        : "text-white/80 hover:text-white"
      : account.kind === "workspace"
        ? "border-navy text-navy hover:bg-canvas"
        : "text-[#475569] hover:text-navy",
  );

  useEffect(() => {
    if (!cinematic) return;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [cinematic]);

  useEffect(() => {
    if (location.pathname !== paths.home || location.hash !== "#audiences-title") return;
    return alignAudienceHeading();
  }, [location.pathname, location.hash]);

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
      <div className="guest-frame flex items-center gap-2 py-2 min-[1200px]:grid min-[1200px]:grid-cols-[1fr_auto_1fr] min-[1200px]:gap-x-2 xl:gap-x-4">
        <div className="min-[1200px]:min-w-max min-[1200px]:justify-self-start">
          <Logo tone={cinematic ? "inverse" : "default"} />
        </div>
        <nav className="hidden shrink-0 items-center gap-0.5 min-[1200px]:flex min-[1200px]:justify-self-center" aria-label="Điều hướng chính">
          <NavItem to={paths.home} end cinematic={cinematic}>
            Trang chủ
          </NavItem>
          <NavItem to={paths.shipments} cinematic={cinematic}>
            Tìm chuyến hàng
          </NavItem>
          {packageNav ? <NavItem to={packageNav.href} cinematic={cinematic}>{packageNav.label}</NavItem> : null}
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
        <div className="ml-auto flex items-center gap-1 sm:gap-2 min-[1200px]:ml-0 min-[1200px]:min-w-max min-[1200px]:justify-self-end">
          <LanguageMenu className="hidden sm:block" cinematic={cinematic} />
          <Link to={account.href} className={accountClass}>
            {account.label}
          </Link>
          <ExploreSolutions
            cinematic={cinematic}
            onNavigate={() => setOpenKey(null)}
          />
          <Link
            to={account.kind === "workspace" ? account.href : authPath("account", paths.home)}
            aria-label={account.kind === "workspace" ? "Vào khu làm việc" : "Tài khoản, yêu cầu đăng nhập"}
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
            "border-t px-5 py-3 sm:px-8 xl:px-10 min-[1200px]:hidden",
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
            {packageNav ? (
              <li>
                <MobileLink to={packageNav.href} cinematic={cinematic}>
                  {packageNav.label}
                </MobileLink>
              </li>
            ) : null}
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
            <li className={cn("mt-2 border-t pt-2 min-[1200px]:hidden", cinematic ? "border-white/10" : "border-line")}>
              <MobileLink to={account.href} cinematic={cinematic}>
                {account.label}
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

function ExploreSolutions({ cinematic, onNavigate }: { cinematic: boolean; onNavigate: () => void }) {
  const location = useLocation();

  return (
    <Link
      to={{ pathname: paths.home, hash: "#audiences-title" }}
      className={cn(
        "inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-3 text-sm font-semibold sm:px-4",
        cinematic ? "bg-[#1e3a8a] text-white ring-1 ring-white/45 hover:bg-[#172554]" : "bg-navy text-white hover:bg-navy-deep",
      )}
      onClick={(event) => {
        onNavigate();
        if (location.pathname !== paths.home) return;
        const target = document.getElementById("audiences-title");
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ block: "start", behavior: "instant" });
        window.history.replaceState(null, "", "#audiences-title");
      }}
    >
      Khám phá giải pháp
    </Link>
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
