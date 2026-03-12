import { Session, User } from "better-auth/types";

interface Auth {
  session: Session | null;
  user: User | null;
}

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      theme: "dark" | "light" | "system";
      accent: "blue" | "green" | "yellow" | "pink" | "orange" | "purple";
      auth: Auth;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
