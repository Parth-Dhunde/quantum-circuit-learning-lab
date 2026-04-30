import { useThemeStore } from "../theme/themeStore";

export function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn-theme-toggle"
      aria-label={mode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={mode === "dark" ? "Light theme" : "Dark theme"}
    >
      <span className="sr-only">Toggle color theme</span>
      <span aria-hidden className="text-base leading-none">
        {mode === "dark" ? "☀️" : "🌙"}
      </span>
      <span className="hidden text-xs font-medium sm:inline">{mode === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}
