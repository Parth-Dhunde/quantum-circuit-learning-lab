import { FeedbackForm } from "../components/FeedbackForm";

export function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 lg:max-w-[1400px] lg:px-8 lg:py-16 2xl:max-w-[1600px]">
      <div className="flex w-full flex-col gap-6">
      <section className="glass-card p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.4em] text-ds-accent">About</p>
        <h1 className="mt-3 text-3xl font-semibold text-ds-primary sm:text-4xl">Quantum Learning Web App</h1>
      </section>

      <section className="glass-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-ds-primary">About the Platform</h2>
        <p className="mt-3 text-sm leading-relaxed text-ds-secondary">
          This platform brings notes, simulation, and quizzes into one place so you can learn a concept and try it right away.
        </p>
      </section>

      <section className="glass-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-ds-primary">Learning Philosophy</h2>
        <p className="mt-3 text-sm leading-relaxed text-ds-secondary">
          The idea is simple: read, try, then check yourself. You do not need to understand everything on day one. Start small and build confidence one topic at a time.
        </p>
      </section>

      <section className="glass-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-ds-primary">What You Can Do</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { title: "Learn", text: "Use module based notes with practical prompts and short checks." },
            { title: "Simulate", text: "Build and run circuits yourself to see how states and outcomes change." },
            { title: "Test", text: "Start quiz sessions by topic and track your progress over time." },
          ].map((item) => (
            <div key={item.title} className="panel-inset p-4">
              <h3 className="text-lg font-semibold text-ds-primary">{item.title}</h3>
              <p className="mt-2 text-sm text-ds-secondary">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-ds-primary">Why This Exists</h2>
        <p className="mt-3 text-sm leading-relaxed text-ds-secondary">
          This project exists to make quantum learning feel less intimidating and more hands on. If you have ever felt stuck with theory only, this app is for you. Try building your first circuit and see what happens.
        </p>
      </section>

      <footer className="glass-card p-6 text-center text-xs text-ds-muted sm:p-8">
        Built by Parth Dhunde for accessible, interactive quantum education.
      </footer>

      <FeedbackForm title="Share your thoughts about the platform" />
      </div>
    </div>
  );
}
