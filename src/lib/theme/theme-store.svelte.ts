export type Theme = "dark" | "light" | "system";

export class ThemeStore {
  preference = $state<Theme>("system");

  constructor(initial: () => Theme) {
    this.preference = initial();

    this.#setInitialTheme();
    this.#trackSystemTheme();
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

  setTheme(value: Theme) {
    this.preference = value;

    document.cookie = `theme=${value}; path=/; max-age=31536000`;
  }
}
