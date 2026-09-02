"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-br from-plum to-plum-mid text-blush shadow-lg mb-3">
            <span className="font-serif text-xl">H</span>
          </div>
          <h1 className="font-serif text-2xl text-plum-deep">Dr Hemangi Clinic</h1>
          <p className="text-xs tracking-[0.2em] uppercase text-muted-2 mt-1">Admin</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur rounded-3xl border border-white p-7 shadow-[0_14px_38px_rgba(74,31,53,0.09)]"
        >
          <label className="block text-xs font-semibold text-plum-mid mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 px-4 py-3 rounded-xl border border-black/10 bg-white/80 text-sm outline-none focus:border-plum focus:ring-4 focus:ring-blush/40"
            placeholder="doctor@drhemangi.clinic"
            suppressHydrationWarning
          />
          <label className="block text-xs font-semibold text-plum-mid mb-1.5">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-5 px-4 py-3 rounded-xl border border-black/10 bg-white/80 text-sm outline-none focus:border-plum focus:ring-4 focus:ring-blush/40"
            placeholder="••••••••"
            suppressHydrationWarning
          />
          {error && <p className="text-xs text-danger mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-plum text-white text-sm font-semibold shadow-lg hover:bg-plum-deep transition disabled:opacity-50"
            suppressHydrationWarning
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-center text-xs text-muted mt-6">
          Access is limited to Dr Hemangi's clinic staff. See SETUP.md to create the first admin account.
        </p>
      </div>
    </div>
  );
}
