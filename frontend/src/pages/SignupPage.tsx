import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";

export function SignupPage() {
  const navigate = useNavigate();
  const { user, signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to="/simulation" replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signup(email.trim(), password);
      navigate("/simulation", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[500px] flex-col gap-6 px-4 py-12 sm:px-6 lg:py-16">
      <section className="glass-card p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-ds-accent">Get started</p>
        <h1 className="mt-3 text-2xl font-semibold text-ds-primary">Create account</h1>
        <p className="mt-2 text-sm text-ds-secondary">Sign up to unlock notes, simulator, and tests.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
              placeholder="At least 6 characters"
            />
          </label>
          <button type="submit" className="btn-accent w-full py-2.5" disabled={busy}>
            {busy ? "Creating account..." : "Sign up with Email"}
          </button>
        </form>

        {error ? <p className="mt-3 text-xs text-ds-danger">{error}</p> : null}

        <p className="mt-4 text-xs text-ds-secondary">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-ds-accent hover:underline">
            Login
          </Link>
        </p>
      </section>
    </div>
  );
}
