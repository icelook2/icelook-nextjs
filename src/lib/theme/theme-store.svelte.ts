export type Theme = "dark" | "light" | "system";
export type AccentColor =
  | "blue"
  | "green"
  | "yellow"
  | "pink"
  | "orange"
  | "purple";

export class ThemeStore {
  preference = $state<Theme>("system");
  accent = $state<AccentColor>("blue");

  constructor(initial: () => { theme: Theme; accent: AccentColor }) {
    const { theme, accent } = initial();
    this.preference = theme;
    this.accent = accent;

    this.#setInitialTheme();
    this.#trackSystemTheme();
    this.#syncAccent();
  }

  #setInitialTheme() {
    $effect(() => {
      let resolved = this.preference;

      if (this.preference === "system") {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          resolved = "dark";
        } else {
          resolved = "light";
        }
      }

      document.documentElement.classList.toggle("dark", resolved === "dark");
    });
  }

  #trackSystemTheme() {
    $effect(() => {
      if (this.preference === "system") {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const handler = () =>
          document.documentElement.classList.toggle("dark", mediaQuery.matches);

        mediaQuery.addEventListener("change", handler);

        return () => mediaQuery.removeEventListener("change", handler);
      }
    });
  }

  #syncAccent() {
    $effect(() => {
      document.documentElement.setAttribute("data-accent", this.accent);
    });
  }

  setTheme(value: Theme) {
    this.preference = value;

    document.cookie = `theme=${value}; path=/; max-age=31536000`;
  }

  setAccent(value: AccentColor) {
    this.accent = value;

    document.cookie = `accent=${value}; path=/; max-age=31536000`;
  }
}
