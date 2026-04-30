import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";
import { ThemeToggle } from "./ThemeToggle";

const linkBase =
  "rounded-lg px-3 py-2 text-sm font-medium transition-[background-color,color,transform] duration-200 hover:scale-[1.01]";

function navClass({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return `${linkBase} bg-ds-surface text-ds-primary`;
  }
  return `${linkBase} text-ds-secondary hover:bg-ds-surface hover:text-ds-primary`;
}

export function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickAway = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onClickAway);
    return () => window.removeEventListener("mousedown", onClickAway);
  }, [menuOpen]);

  return (
    <div className="sticky top-0 z-[95] w-full bg-[color:var(--color-bg)]/90 backdrop-blur">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-3 sm:px-6 lg:px-8 xl:max-w-[1400px] 2xl:max-w-[1600px]">
        <div className="glass-card flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-[150px] items-center gap-3">
            <span className="text-lg font-semibold uppercase tracking-[0.36em] text-ds-accent sm:text-xl dark:text-accent-glow">
              Quantum Lab
            </span>
          </div>
          <nav className="flex flex-1 flex-wrap items-center justify-center gap-1">
            <NavLink to="/" className={navClass} end>
              Home
            </NavLink>
            {user ? (
              <>
                <NavLink to="/simulation" className={navClass}>
                  Simulation
                </NavLink>
                <NavLink to="/notes" className={navClass}>
                  Notes
                </NavLink>
                <NavLink to="/test" className={navClass}>
                  Test
                </NavLink>
                <NavLink to="/about" className={navClass}>
                  About
                </NavLink>
              </>
            ) : (
              <NavLink to="/login" className={navClass}>
                Login
              </NavLink>
            )}
          </nav>
          <div className="relative flex min-w-[120px] items-center justify-end gap-2" ref={menuRef}>
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-ds-accent text-sm font-semibold text-white"
                  aria-label="Open user menu"
                >
                  {user.email?.charAt(0).toUpperCase() ?? "U"}
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 top-10 z-[120] w-52 glass-card p-2">
                    <p className="truncate px-2 py-1 text-xs text-ds-secondary">{user.email}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        void logout();
                      }}
                      className="btn-ghost mt-1 w-full px-3 py-1.5 text-xs"
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </>
            ) : null}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}

