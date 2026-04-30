import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-12 sm:px-6 lg:max-w-[1400px] lg:px-8 lg:py-16 2xl:max-w-[1600px]">
      <section className="glass-card p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-ds-accent">404</p>
        <h1 className="mt-3 text-2xl font-semibold text-ds-primary">Page not found</h1>
        <p className="mt-2 text-sm text-ds-secondary">The page you requested does not exist.</p>
        <div className="mt-5">
          <Link to="/" className="btn-accent inline-flex px-5 py-2.5">
            Go to Home
          </Link>
        </div>
      </section>
    </div>
  );
}
