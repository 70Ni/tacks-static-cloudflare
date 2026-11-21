import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

const App = () => {
  const [ready, setReady] = useState(true); // true once Supabase has a recovery session
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [error, setError] = useState("");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event === "PASSWORD_RECOVERY" ||
        (event === "INITIAL_SESSION" && session) ||
        (event === "SIGNED_IN" && session)
      ) {
        setReady(true);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setStatus("loading");
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }

    setStatus("done");
    await supabase.auth.signOut(); // make them sign in with the new password
    setTimeout(() => (window.location.href = "/login"), 2000);
  }

  if (status === "done") {
    return (
      <main style={styles.page}>
        <h1>Password updated</h1>
        <p>Taking you to sign in…</p>
      </main>
    );
  }

  if (!ready) {
    return (
      <main style={styles.page}>
        <h1>Verifying your link…</h1>
        <p>
          If this takes more than a few seconds, the link may have expired.{" "}
          <a href="/forgot-password">Request a new one</a>.
        </p>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <h1>Choose a new password</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label htmlFor="password">New password</label>
        <input
          id="password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        <label htmlFor="confirm">Confirm new password</label>
        <input
          id="confirm"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          style={styles.input}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          style={styles.button}
        >
          {status === "loading" ? "Saving…" : "Save new password"}
        </button>
        {error && (
          <p role="alert" style={styles.error}>
            {error}
          </p>
        )}
      </form>
    </main>
  );
};

export default App;

const styles: Record<string, CSSProperties> = {
  page: {
    maxWidth: 380,
    margin: "10vh auto",
    padding: 16,
    fontFamily: "system-ui, sans-serif",
  },
  form: { display: "flex", flexDirection: "column", gap: 8 },
  input: { padding: 10, fontSize: 16 },
  button: { padding: 10, fontSize: 16, marginTop: 8, cursor: "pointer" },
  error: { color: "#b00020" },
};
