"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form key={state.attempt ?? 0} action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="label">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          defaultValue={state.email ?? ""}
          className="input"
          dir="ltr"
        />
      </label>
      <label className="block">
        <span className="label">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          autoFocus={!!state.email}
          className="input"
          dir="ltr"
        />
      </label>
      {state.error && (
        <p role="alert" className="rounded-xl bg-crimson/10 p-3 text-sm text-crimson">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
