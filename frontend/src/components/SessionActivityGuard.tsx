import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";

const LAST_ACTIVE_KEY = "qc-last-active";
const MAX_IDLE_MS = 24 * 60 * 60 * 1000;

export function SessionActivityGuard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const updateActivity = () => {
      try {
        localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
      } catch {
        // ignore
      }
    };

    window.addEventListener("click", updateActivity);
    window.addEventListener("keypress", updateActivity);
    updateActivity();

    return () => {
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("keypress", updateActivity);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;
    const raw = localStorage.getItem(LAST_ACTIVE_KEY);
    const lastActive = raw ? Number(raw) : Date.now();
    if (!Number.isFinite(lastActive)) return;
    if (Date.now() - lastActive <= MAX_IDLE_MS) return;

    void logout().finally(() => {
      navigate("/login?expired=1", { replace: true });
    });
  }, [logout, navigate, user]);

  return null;
}
