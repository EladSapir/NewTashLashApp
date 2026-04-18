"use client";

import { FormEvent, useState } from "react";
import { Lock } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";

export function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const locale = useLocale();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);

    if (response.ok) {
      router.push("/admin/dashboard", { locale });
      return;
    }
    setError("Invalid password");
  };

  return (
    <form
      onSubmit={submit}
      className="mt-10 rounded-card border border-mauve/15 bg-white/90 p-6 shadow-soft backdrop-blur"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-burgundy text-white">
          <Lock className="h-4 w-4" />
        </span>
        <h1 className="font-display text-xl font-bold text-burgundy">Admin Login</h1>
      </div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full rounded-xl border border-mauve/25 bg-white px-3 py-3 focus:border-mauve focus:outline-none"
      />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full rounded-full bg-burgundy py-3 font-semibold text-white shadow-soft transition hover:bg-mauve disabled:opacity-60"
      >
        {loading ? "..." : "Login"}
      </button>
    </form>
  );
}
