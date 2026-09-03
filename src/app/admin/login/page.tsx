"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  supabaseBrowser,
  isSupabaseBrowserConfigured,
  missingSupabaseBrowserEnv,
} from "@/lib/supabase/browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const configured = isSupabaseBrowserConfigured();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      /* Wrapped so a configuration problem, a network drop or anything else
         thrown in here becomes a message on the form. Previously an
         unconfigured client threw straight out of the handler and Next showed
         its runtime-error overlay, which tells the doctor nothing she can
         act on. */
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in. Please try again.");
    } finally {
      setLoading(false);
    }
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

        {/* Say it BEFORE the password is typed. The keys are missing at page
            load, so waiting for a failed submit to reveal it wastes the
            doctor's time and looks like her password was wrong. */}
        {!configured && (
          <div className="mb-4 rounded-2xl border border-warn/30 bg-warn/10 p-4">
            <p className="text-sm font-semibold text-plum-deep">This site is not connected to its database yet</p>
            <p className="text-xs text-plum-mid mt-1.5 leading-relaxed">
              Sign-in is unavailable because {missingSupabaseBrowserEnv().join(" and ")}{" "}
              {missingSupabaseBrowserEnv().length > 1 ? "are" : "is"} not set.
            </p>
            <ol className="text-xs text-plum-mid mt-2.5 space-y-1 list-decimal list-inside leading-relaxed">
              <li>
                Copy <code className="font-mono text-[11px]">.env.example</code> to{" "}
                <code className="font-mono text-[11px]">.env.local</code> in the project root.
              </li>
              <li>Paste the Project URL and anon key from Supabase → Project Settings → API.</li>
              <li>
                <b>Restart the dev server.</b> Values beginning{" "}
                <code className="font-mono text-[11px]">NEXT_PUBLIC_</code> are baked in when the app builds, so
                editing the file while it is running changes nothing.
              </li>
            </ol>
          </div>
        )}

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
            /* Disabled while unconfigured: there is no password that can work,
               so letting it be pressed only produces a failure that looks
               like the credentials were wrong. */
            disabled={loading || !configured}
            title={!configured ? "Set the Supabase environment variables first" : undefined}
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
