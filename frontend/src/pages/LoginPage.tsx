import { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";

type NavLocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const sessionExpired = useMemo(() => new URLSearchParams(location.search).get("expired") === "1", [location.search]);

  const redirectTo = (location.state as NavLocationState | null)?.from?.pathname ?? "/simulation";

  if (user) {
    return <Navigate to="/simulation" replace />;
  }

  const submitEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const submitGoogleLogin = async () => {
    setError("");
    setBusy(true);
    try {
      await loginWithGoogle();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[500px] flex-col gap-6 px-4 py-12 sm:px-6 lg:py-16">
      <section className="glass-card p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-ds-accent">Welcome back</p>
        <h1 className="mt-3 text-2xl font-semibold text-ds-primary">Login</h1>
        <p className="mt-2 text-sm text-ds-secondary">Sign in to continue your quantum learning flow.</p>
        {sessionExpired ? (
          <p className="mt-2 rounded-lg border border-ds-danger-border bg-ds-danger-bg px-3 py-2 text-xs text-ds-danger">
            Session expired. Please login again.
          </p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={submitEmailLogin}>
          <label className="flex flex-col gap-1 text-xs text-ds-secondary">
            Email
            <input
              type="email"
              required
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ds-secondary">
            Password
            <input
              type="password"
              required
              minLength={6}
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          <button type="submit" className="btn-accent w-full py-2.5" disabled={busy}>
            {busy ? "Logging in..." : "Login with Email"}
          </button>
        </form>

        <button type="button" className="btn-ghost mt-3 w-full py-2.5" disabled={busy} onClick={submitGoogleLogin}>
          {busy ? "Loading..." : "Continue with Google"}
        </button>

        {error ? <p className="mt-3 text-xs text-ds-danger">{error}</p> : null}

        <p className="mt-4 text-xs text-ds-secondary">
          New user?{" "}
          <Link to="/signup" className="font-semibold text-ds-accent hover:underline">
            Create an account
          </Link>
        </p>
      </section>
    </div>
  );
}
