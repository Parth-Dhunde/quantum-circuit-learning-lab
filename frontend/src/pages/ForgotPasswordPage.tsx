import { useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setBusy(true);
    try {
      await resetPassword(trimmed);
      setSuccess("If an account exists for that email, a password reset link has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[500px] flex-col gap-6 px-4 py-12 sm:px-6 lg:py-16">
      <section className="glass-card p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-ds-accent">Account recovery</p>
        <h1 className="mt-3 text-2xl font-semibold text-ds-primary">Reset password</h1>
        <p className="mt-2 text-sm text-ds-secondary">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-xs text-ds-secondary" htmlFor="reset-email">
            Email
            <input
              id="reset-email"
              type="email"
              required
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <button type="submit" className="btn-accent w-full py-2.5" disabled={busy}>
            {busy ? "Sending..." : "Send reset link"}
          </button>
        </form>

        {error ? <p className="mt-3 text-xs text-ds-danger">{error}</p> : null}
        {success ? <p className="mt-3 text-xs text-ds-accent">{success}</p> : null}

        <p className="mt-4 text-xs text-ds-secondary">
          Remember your password?{" "}
          <Link to="/login" className="font-semibold text-ds-accent hover:underline">
            Back to login
          </Link>
        </p>
      </section>
    </div>
  );
}
