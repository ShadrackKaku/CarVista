/**
 * Window-level UI events.
 *
 * The command palette and the auth dialog are each mounted once, near the root
 * of the tree. Anything anywhere — a header button, a "sign in to save this"
 * prompt on a vehicle card, a keyboard shortcut — opens them by dispatching an
 * event rather than by threading state through context or props.
 */

export const OPEN_COMMAND_PALETTE = "carvista:open-command-palette";
export const OPEN_AUTH_DIALOG = "carvista:open-auth-dialog";

export type AuthDialogMode = "login" | "register";

export interface AuthDialogOptions {
  /** Which tab to land on. Defaults to sign-in. */
  mode?: AuthDialogMode;
  /** Where to send the user once they're through. */
  callbackUrl?: string;
}

/** Open the ⌘K palette. Safe to call from anywhere on the client. */
export function openCommandPalette() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE));
}

/** Open the sign-in / create-account dialog. */
export function openAuthDialog(options: AuthDialogOptions = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AuthDialogOptions>(OPEN_AUTH_DIALOG, { detail: options }));
}
