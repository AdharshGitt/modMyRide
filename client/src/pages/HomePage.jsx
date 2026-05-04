import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button/index.jsx";
import { InputLabel } from "../components/InputLabel/index.jsx";
import {
  fetchCurrentUser,
  getHealthStatus,
  loginUser,
  registerUser,
  setAuthToken
} from "../services/api.js";

const HomePage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [apiStatus, setApiStatus] = useState("Checking API…");

  const loadSession = useCallback(async () => {
    try {
      const { user: u } = await fetchCurrentUser();
      setUser(u);
      if (u.role === "admin") navigate("/admin");
    } catch {
      setAuthToken(null);
      setUser(null);
    } finally {
      setSessionChecked(true);
    }
  }, [navigate]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await getHealthStatus();
        setApiStatus(res.message);
      } catch {
        setApiStatus("API unavailable");
      }
    };
    run();
  }, []);

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const data = await registerUser(email, password);
        setAuthToken(data.token);
        setUser(data.user);
        if (data.user.role === "admin") navigate("/admin");
      } else {
        const data = await loginUser(email, password);
        setAuthToken(data.token);
        setUser(data.user);
        if (data.user.role === "admin") navigate("/admin");
      }
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
  };

  if (!sessionChecked) {
    return (
      <div className="auth-shell">
        <div className="auth-card auth-card--loading">
          <p className="auth-muted">Loading…</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <main className="auth-shell">
        <div className="auth-card auth-card--wide">
          <p className="auth-brand">ModMyRide</p>
          <h1 className="auth-title">You are signed in</h1>
          <p className="auth-sub">
            Signed in as <strong>{user.email}</strong>
          </p>
          <p className="auth-muted">Backend: {apiStatus}</p>
          <div className="auth-actions">
            {user.role === "admin" && (
              <Button type="button" onClick={() => navigate("/admin")} className="btn-primary">
                Admin Dashboard
              </Button>
            )}
            <Button type="button" onClick={handleLogout} className="btn-secondary">
              Sign out
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <p className="auth-brand">ModMyRide</p>
        <h1 className="auth-title">{mode === "login" ? "Welcome back" : "Create an account"}</h1>
        <p className="auth-sub">
          {mode === "login"
            ? "Sign in to continue building your ride."
            : "Join to save mods and track your build."}
        </p>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            className={`auth-tab ${mode === "login" ? "auth-tab--active" : ""}`}
            onClick={() => switchMode("login")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "signup" ? "auth-tab--active" : ""}`}
            onClick={() => switchMode("signup")}
          >
            Sign up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error ? (
            <div className="auth-banner auth-banner--error" role="alert">
              {error}
            </div>
          ) : null}

          <InputLabel
            htmlFor="auth-email"
            type="email"
            name="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            disabled={loading}
          >
            Email
          </InputLabel>

          <InputLabel
            htmlFor="auth-password"
            type="password"
            name="password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            placeholder="••••••••"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            disabled={loading}
          >
            Password
          </InputLabel>

          {mode === "signup" ? (
            <InputLabel
              htmlFor="auth-confirm"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(ev) => setConfirmPassword(ev.target.value)}
              placeholder="Repeat password"
              autoComplete="new-password"
              required
              disabled={loading}
            >
              Confirm password
            </InputLabel>
          ) : null}

          <Button type="submit" disabled={loading} className="btn-primary btn-block">
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="auth-footer">
          {mode === "login" ? (
            <>
              New here?{" "}
              <button type="button" className="auth-link" onClick={() => switchMode("signup")}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" className="auth-link" onClick={() => switchMode("login")}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
};

export default HomePage;
