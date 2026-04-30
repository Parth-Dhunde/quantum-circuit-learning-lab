import emailjs from "@emailjs/browser";
import { useState } from "react";

import { useAuth } from "../auth/AuthProvider";

export function FeedbackForm({ title = "Help improve this learning app" }: { title?: string }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const submitFeedback = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.email) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          to_email: "parth.jd.261105@gmail.com",
          from_name: name.trim() || "Anonymous learner",
          from_email: user.email,
          message: message.trim(),
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
      );
      setStatus("success");
      setName("");
      setMessage("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="glass-card p-6 sm:p-8">
      <p className="text-xs uppercase tracking-[0.3em] text-ds-accent">Feedback</p>
      <h2 className="mt-2 text-xl font-semibold text-ds-primary">{title}</h2>
      <form className="mt-5 grid gap-3" onSubmit={submitFeedback}>
        <input
          className="field-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (optional)"
        />
        <textarea
          className="field-input"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message"
          required
        />
        <button type="submit" className="btn-accent py-2.5" disabled={status === "sending" || !user?.email}>
          {status === "sending" ? "Sending..." : "Send Feedback"}
        </button>
      </form>
      {status === "success" ? <p className="mt-3 text-sm text-ds-accent">Thanks for your feedback!</p> : null}
      {status === "error" ? (
        <p className="mt-3 text-sm text-ds-danger">Unable to send feedback. Please login and try again.</p>
      ) : null}
      {user?.email ? <p className="mt-2 text-xs text-ds-muted">Sending as: {user.email}</p> : null}
    </section>
  );
}
