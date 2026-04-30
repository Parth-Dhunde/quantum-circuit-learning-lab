import type { ReactNode } from "react";
import { Component } from "react";

type Props = {
  children: ReactNode;
  title?: string;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(err: unknown) {
    // Keep logging for debugging; UI shows a stable fallback.
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught error", err);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <section className="glass-card flex flex-col gap-3 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-ds-accent dark:text-cyan-glow">Simulator</p>
        <h2 className="text-xl font-semibold text-ds-primary">{this.props.title ?? "Something went wrong"}</h2>
        <p className="text-sm text-ds-secondary">Something went wrong. Try again.</p>
        <button
          type="button"
          className="btn-ghost mt-2 w-fit px-4 py-2.5"
          onClick={() => this.setState({ hasError: false })}
        >
          Try again
        </button>
      </section>
    );
  }
}

