import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("Demo User");
  const [email, setEmail] = useState("student@univ.edu");
  const [password, setPassword] = useState("bacon123");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (mode === "login") {
      await login({ email, password });
    } else {
      await register({ fullName, email, password });
    }

    navigate("/");
  }

  return (
    <div className="auth-page">
      <div className="blob blob-one" />
      <div className="blob blob-two" />

      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="auth-kicker">University Community</p>
        <h1>{mode === "login" ? "Welcome Back" : "Create Account"}</h1>
        <p className="auth-hint">
          Demo accounts: student@univ.edu and admin@univ.edu, password: bacon123
        </p>

        {mode === "register" && (
          <label>
            Full Name
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error && <p className="error-text">{error}</p>}

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Register"}
        </button>

        <button
          className="ghost-btn"
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Need an account? Register" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
