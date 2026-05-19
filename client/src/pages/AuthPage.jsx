import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  fetchCurrentUser,
  getHealthStatus,
  loginUser,
  registerUser,
  setAuthToken
} from "../services/api.js";

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [apiStatus, setApiStatus] = useState("Checking API…");

  useEffect(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam === "register" || modeParam === "signup") {
      setMode("signup");
    } else {
      setMode("login");
    }
  }, [searchParams]);

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
    setUsername("");
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
        const data = await registerUser(email, password, username);
        setAuthToken(data.token);
        setUser(data.user);
        if (data.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/tuning");
        }
      } else {
        const data = await loginUser(email, password);
        setAuthToken(data.token);
        setUser(data.user);
        if (data.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/tuning");
        }
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
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setError("");
  };

  if (!sessionChecked) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-near-black text-white font-['Oswald'] tracking-widest">
        <p>INITIALIZING SYSTEM...</p>
      </div>
    );
  }

  if (user) {
    return (
      <main className="flex h-screen w-full items-center justify-center bg-[#1d100e] text-[#f7ddd9] font-body-md">
        <div className="bg-[#1A1A1A] machined-edge p-8 w-full max-w-md flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-[#C0392B] font-['Oswald'] uppercase tracking-widest text-sm mb-2">ModMyRide</h2>
            <h1 className="text-3xl font-bold text-white font-['Oswald'] uppercase tracking-tight">You are signed in</h1>
          </div>
          <div className="text-center text-zinc-400 space-y-2">
            <p>Signed in as <strong className="text-white">{user.email}</strong></p>
            <p className="text-xs">Backend: {apiStatus}</p>
          </div>
          <div className="flex flex-col gap-3 mt-4">
            {user.role === "admin" && (
              <button 
                onClick={() => navigate("/admin")} 
                className="w-full py-3 bg-[#C0392B] text-white font-label-caps tracking-widest hover:bg-[#a93226] transition-colors uppercase text-sm"
              >
                Admin Dashboard
              </button>
            )}
            <button 
              onClick={handleLogout} 
              className="w-full py-3 border border-white/10 text-white font-label-caps tracking-widest hover:bg-white/5 transition-colors uppercase text-sm"
            >
              Sign out
            </button>
            <button 
              onClick={() => navigate("/")} 
              className="w-full py-3 text-zinc-400 font-label-caps tracking-widest hover:text-white transition-colors uppercase text-xs"
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen w-full items-center justify-center bg-[#1d100e] text-[#f7ddd9] font-body-md px-4">
      <div className="bg-[#1A1A1A] machined-edge p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-[#C0392B] font-['Oswald'] uppercase tracking-widest text-sm mb-2">ModMyRide</h2>
          <h1 className="text-3xl font-bold text-white font-['Oswald'] uppercase tracking-tight">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">
            {mode === "login"
              ? "Log in to continue building your ride."
              : "Join to save mods and track your build."}
          </p>
        </div>

        <div className="flex mb-8 border-b border-white/10">
          <button
            type="button"
            className={`flex-1 pb-3 font-label-caps uppercase tracking-widest text-sm transition-colors ${mode === "login" ? "text-[#C0392B] border-b-2 border-[#C0392B]" : "text-zinc-500 hover:text-white"}`}
            onClick={() => switchMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`flex-1 pb-3 font-label-caps uppercase tracking-widest text-sm transition-colors ${mode === "signup" ? "text-[#C0392B] border-b-2 border-[#C0392B]" : "text-zinc-500 hover:text-white"}`}
            onClick={() => switchMode("signup")}
          >
            Register
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-[#C0392B]/10 border border-[#C0392B]/20 text-[#C0392B] px-4 py-3 text-sm" role="alert">
              {error}
            </div>
          )}

          {mode === "signup" && (
            <div className="space-y-2">
              <label className="block font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Username</label>
              <input
                type="text"
                name="username"
                value={username}
                onChange={(ev) => setUsername(ev.target.value)}
                placeholder="Your Name"
                required
                disabled={loading}
                className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm disabled:opacity-50"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="block font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={loading}
              className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label className="block font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Password</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              disabled={loading}
              className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm disabled:opacity-50"
            />
          </div>

          {mode === "signup" && (
            <div className="space-y-2">
              <label className="block font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(ev) => setConfirmPassword(ev.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
                required
                disabled={loading}
                className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm disabled:opacity-50"
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3 mt-4 bg-[#C0392B] text-white font-label-caps tracking-widest hover:bg-[#a93226] transition-colors uppercase text-sm disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "login" ? "Log in" : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-zinc-500 text-sm">
          {mode === "login" ? (
            <>
              New here?{" "}
              <button type="button" className="text-[#C0392B] hover:underline" onClick={() => switchMode("signup")}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" className="text-[#C0392B] hover:underline" onClick={() => switchMode("login")}>
                Login
              </button>
            </>
          )}
        </p>
        <div className="mt-4 text-center">
          <button onClick={() => navigate("/")} className="text-zinc-500 hover:text-white transition-colors text-xs uppercase tracking-widest font-label-caps">
            Back to Home
          </button>
        </div>
      </div>
    </main>
  );
};

export default AuthPage;
