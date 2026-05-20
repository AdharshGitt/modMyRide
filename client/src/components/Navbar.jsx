import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchCurrentUser, setAuthToken } from "../services/api.js";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { user: u } = await fetchCurrentUser();
        setUser(u);
      } catch {
        setUser(null);
      }
    };
    checkUser();
  }, [location.pathname]); // Re-fetch on route change to keep sync

  const handleStartTuning = () => {
    setIsMobileMenuOpen(false);
    if (user) {
      navigate("/tuning");
    } else {
      navigate("/auth");
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  const handleNavigation = (path) => {
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-[#1d100e]/95 backdrop-blur-lg border-b border-white/5 h-20 flex items-center">
        <div className="w-full relative flex items-center justify-between px-6 md:px-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavigation("/")}>
            <div className="w-8 h-8 bg-[#C0392B] flex items-center justify-center rounded-sm rotate-45 transition-transform hover:rotate-[225deg] duration-500">
              <span className="material-symbols-outlined text-white -rotate-45 text-lg">speed</span>
            </div>
            <span className="font-['Oswald'] text-2xl font-black tracking-tighter uppercase text-white">ModMyRide</span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
            <button
              onClick={() => handleNavigation("/")}
              className={`font-['Oswald'] uppercase tracking-widest text-[11px] transition-colors ${
                isActive("/") ? "nav-active" : "nav-link text-zinc-400"
              }`}
            >
              Home
            </button>
            <button
              onClick={handleStartTuning}
              className={`font-['Oswald'] uppercase tracking-widest text-[11px] transition-colors ${
                isActive("/tuning") ? "nav-active" : "nav-link text-zinc-400"
              }`}
            >
              Recommendation
            </button>
            <button
              onClick={() => handleNavigation("/ai-advisor")}
              className={`font-['Oswald'] uppercase tracking-widest text-[11px] transition-colors ${
                isActive("/ai-advisor") ? "nav-active" : "nav-link text-zinc-400"
              }`}
            >
              AI Advisor
            </button>
            <button
              onClick={() => handleNavigation("/profiles")}
              className={`font-['Oswald'] uppercase tracking-widest text-[11px] transition-colors ${
                isActive("/profiles") ? "nav-active" : "nav-link text-zinc-400"
              }`}
            >
              Saved Profiles
            </button>
          </div>

          {/* Desktop Right User Menu / Sign In */}
          <div className="hidden md:flex justify-end items-center relative">
            {user ? (
              <div className="flex items-center gap-4 relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="h-9 w-9 rounded-full bg-zinc-800 machined-edge flex items-center justify-center overflow-hidden hover:border-[#C0392B] transition-all group"
                >
                  <span className="material-symbols-outlined text-zinc-500 group-hover:text-white text-base">person</span>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-12 w-64 bg-[#1A1A1A] machined-edge shadow-2xl z-50 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                    <div className="border-b border-white/5 pb-4">
                      <p className="font-['Oswald'] text-white uppercase text-xs tracking-widest mb-1">{user.username || 'User'}</p>
                      <p className="text-zinc-500 text-[10px] truncate">{user.email}</p>
                    </div>

                    <div className="space-y-1">
                      {user.role === 'admin' && (
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            navigate("/admin");
                          }}
                          className="w-full flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-white/5 p-2 transition-colors font-label-caps text-[10px] uppercase tracking-widest"
                        >
                          <span className="material-symbols-outlined text-sm">dashboard</span>
                          <span>Admin Dashboard</span>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-white/5 pt-4">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 text-[#C0392B] hover:bg-[#C0392B]/10 p-2 transition-colors font-label-caps text-[10px] uppercase tracking-widest"
                      >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        <span>Logout Account</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate("/auth")}
                className="bg-[#C0392B] hover:bg-[#a93226] text-white px-6 py-2.5 font-['Oswald'] uppercase tracking-widest text-xs transition-all shadow-[0_4px_20px_rgba(192,57,43,0.3)]"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center p-2 text-zinc-400 hover:text-white"
          >
            <span className="material-symbols-outlined text-3xl">
              {isMobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 md:hidden animate-in fade-in duration-300"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full bg-[#170b09] z-50 p-8 flex flex-col gap-8 shadow-2xl transition-transform duration-300 md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#C0392B] flex items-center justify-center rounded-sm rotate-45">
              <span className="material-symbols-outlined text-white -rotate-45 text-xs">speed</span>
            </div>
            <span className="font-['Oswald'] text-lg font-black tracking-tighter uppercase text-white">ModMyRide</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 text-zinc-400 hover:text-white"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Drawer Nav Links */}
        <div className="flex flex-col gap-5 text-left">
          <button
            onClick={() => handleNavigation("/")}
            className={`py-2 text-left font-['Oswald'] uppercase tracking-widest text-[13px] border-b border-white/5 ${
              isActive("/") ? "text-[#C0392B] font-bold" : "text-zinc-400"
            }`}
          >
            Home
          </button>
          <button
            onClick={handleStartTuning}
            className={`py-2 text-left font-['Oswald'] uppercase tracking-widest text-[13px] border-b border-white/5 ${
              isActive("/tuning") ? "text-[#C0392B] font-bold" : "text-zinc-400"
            }`}
          >
            Recommendation
          </button>
          <button
            onClick={() => handleNavigation("/ai-advisor")}
            className={`py-2 text-left font-['Oswald'] uppercase tracking-widest text-[13px] border-b border-white/5 ${
              isActive("/ai-advisor") ? "text-[#C0392B] font-bold" : "text-zinc-400"
            }`}
          >
            AI Advisor
          </button>
          <button
            onClick={() => handleNavigation("/profiles")}
            className={`py-2 text-left font-['Oswald'] uppercase tracking-widest text-[13px] border-b border-white/5 ${
              isActive("/profiles") ? "text-[#C0392B] font-bold" : "text-zinc-400"
            }`}
          >
            Saved Profiles
          </button>
        </div>

        {/* Drawer Auth & User Profile Section */}
        <div className="mt-auto pt-6 border-t border-white/5">
          {user ? (
            <div className="space-y-6 text-left">
              <div className="bg-white/5 p-4 rounded-sm border border-white/5">
                <p className="font-['Oswald'] text-white uppercase text-xs tracking-widest mb-1">{user.username || 'User'}</p>
                <p className="text-zinc-500 text-[10px] truncate">{user.email}</p>
                {user.role === 'admin' && (
                  <button
                    onClick={() => handleNavigation("/admin")}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-zinc-800 text-zinc-300 py-2 transition-colors font-label-caps text-[9px] uppercase tracking-widest border border-white/5 hover:bg-zinc-700"
                  >
                    <span className="material-symbols-outlined text-[12px]">dashboard</span>
                    <span>Admin Dashboard</span>
                  </button>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-[#C0392B]/10 hover:bg-[#C0392B]/20 text-[#C0392B] py-3 transition-colors font-['Oswald'] text-[11px] uppercase tracking-widest border border-[#C0392B]/20"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span>Logout Account</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleNavigation("/auth")}
                className="w-full bg-[#C0392B] hover:bg-[#a93226] text-white py-3.5 font-['Oswald'] uppercase tracking-widest text-xs transition-all shadow-[0_4px_20px_rgba(192,57,43,0.3)] text-center"
              >
                Login
              </button>
              <button
                onClick={() => handleNavigation("/auth?mode=register")}
                className="w-full border border-white/20 text-white hover:bg-white/5 py-3.5 font-['Oswald'] uppercase tracking-widest text-xs transition-all text-center"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
