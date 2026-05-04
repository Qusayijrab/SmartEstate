"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Building2 } from "lucide-react";
import { clsx } from "clsx";
import type { SessionUser } from "@/lib/session";
import { initials } from "@/lib/utils";

type NavLink = { href: string; label: string };

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/property-estimator", label: "Property AI" },
  { href: "/land", label: "Land AI" },
  { href: "/loans", label: "Loan AI" },
  { href: "/areas", label: "Area Insights" },
  { href: "/marketplace", label: "Marketplace" },
];

export function SiteNav({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.refresh();
    router.push("/");
  }

  const role = (user?.role || "buyer").toLowerCase();
  const roleClass =
    role === "seller"
      ? "bg-[rgba(255,107,107,0.14)] text-[#ff8a8a] border-[rgba(255,107,107,0.24)]"
      : role === "investor"
      ? "bg-[rgba(214,178,93,0.16)] text-[#f3dfaa] border-[rgba(214,178,93,0.26)]"
      : "bg-[rgba(71,209,140,0.14)] text-[#47d18c] border-[rgba(71,209,140,0.24)]";

  return (
    <header
      className="sticky top-0 z-30 w-full py-[22px]"
      style={{
        backdropFilter: "blur(14px)",
        background:
          "linear-gradient(180deg, rgba(2,8,22,.72), rgba(2,8,22,.32))",
        borderBottom: "1px solid rgba(255,255,255,.06)",
      }}
    >
      <div className="container flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 font-extrabold text-white tracking-wide">
          <span
            className="grid h-[42px] w-[42px] place-items-center rounded-xl text-[18px] text-[#f3dfaa]"
            style={{
              background:
                "linear-gradient(135deg, rgba(214,178,93,0.22), rgba(255,255,255,0.08))",
              border: "1px solid rgba(214,178,93,0.24)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <Building2 size={20} strokeWidth={1.8} />
          </span>
          <span>SmartEstate</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-3">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "rounded-full px-3 py-2 text-sm transition",
                  isActive
                    ? "text-[var(--gold)]"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            );
          })}

          {!user ? (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="rounded-full px-3 py-2 text-sm text-white/70 transition hover:text-white hover:bg-white/5"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-full px-4 py-2.5 text-sm font-bold text-[#111] shadow-[0_10px_30px_rgba(214,178,93,0.22)] transition hover:-translate-y-0.5"
                style={{
                  background:
                    "linear-gradient(135deg, #d6b25d, #f3dfaa)",
                }}
              >
                Create Account
              </Link>
            </div>
          ) : (
            <div className="relative" ref={wrapperRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((o) => !o);
                }}
                className="grid h-[42px] w-[42px] place-items-center rounded-full font-extrabold text-[#111] shadow-[0_10px_24px_rgba(214,178,93,0.24)] transition hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #d6b25d, #f3dfaa)",
                }}
                aria-label="Open profile menu"
              >
                {initials(user.fullName)}
              </button>

              {open ? (
                <div
                  className="absolute right-0 top-[56px] z-50 flex w-[300px] flex-col gap-4 rounded-[22px] border border-white/8 bg-[rgba(9,18,35,0.96)] p-[18px] shadow-[0_24px_54px_rgba(0,0,0,.35)] backdrop-blur-xl"
                >
                  <div className="flex gap-3">
                    <div
                      className="grid h-[52px] w-[52px] flex-none place-items-center rounded-full font-extrabold text-[#111]"
                      style={{
                        background:
                          "linear-gradient(135deg, #d6b25d, #f3dfaa)",
                      }}
                    >
                      {initials(user.fullName)}
                    </div>
                    <div className="min-w-0">
                      <strong className="block text-[15px] text-white">
                        {user.fullName || "SmartEstate User"}
                      </strong>
                      <span className="block truncate text-[13px] text-white/60">
                        {user.email}
                      </span>
                      <span
                        className={clsx(
                          "mt-2.5 inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider",
                          roleClass
                        )}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className="rounded-xl px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/5 hover:text-white"
                    >
                      My Dashboard
                    </Link>
                    <Link
                      href="/post-property"
                      onClick={() => setOpen(false)}
                      className="rounded-xl px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/5 hover:text-white"
                    >
                      Post a Property
                    </Link>
                    <Link
                      href="/compare"
                      onClick={() => setOpen(false)}
                      className="rounded-xl px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/5 hover:text-white"
                    >
                      Compare List
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-xl px-3 py-2.5 text-left text-sm text-white/75 transition hover:bg-white/5 hover:text-white"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
