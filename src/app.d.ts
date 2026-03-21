import type { Auth } from "$lib/server/auth";

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user: Auth["$Infer"]["Session"]["user"] | null;
      session: Auth["$Infer"]["Session"]["session"] | null;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}
