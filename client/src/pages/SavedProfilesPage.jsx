import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUser, fetchUserProfiles, deleteUserProfile, setAuthToken } from "../services/api.js";
import Navbar from "../components/Navbar.jsx";

const SavedProfilesPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [activeTab, setActiveTab] = useState("car");

  useEffect(() => {
    localStorage.setItem("modmyride_theme", "dark");
    document.body.classList.remove("light-mode");
  }, []);

  useEffect(() => {
    document.title = "ModMyRide | Saved Profiles";
    const checkUser = async () => {
      try {
        const { user: u } = await fetchCurrentUser();
        setUser(u);

        const data = await fetchUserProfiles();
        setProfiles(data.profiles);
      } catch (err) {
        console.error("Auth/Fetch Error:", err);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [navigate]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this build?")) {
      try {
        await deleteUserProfile(id);
        setProfiles(profiles.filter(p => p._id !== id));
      } catch (err) {
        console.error("Delete Error:", err);
        alert("Failed to remove profile.");
      }
    }
  };

  const handleStartTuning = () => {
    if (user) {
      if (user.role === 'admin') {
        navigate("/admin");
      } else {
        navigate("/tuning");
      }
    } else {
      navigate("/auth");
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setIsProfileMenuOpen(false);
    navigate("/");
  };

  const filteredProfiles = profiles.filter(p => (p.vehicle?.type || 'car') === activeTab);
  const carCount = profiles.filter(p => (p.vehicle?.type || 'car') === 'car').length;
  const bikeCount = profiles.filter(p => p.vehicle?.type === 'bike').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1d100e] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#C0392B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1d100e] text-[#f7ddd9] font-body-md overflow-x-hidden">
      <Navbar />

      <main className="pt-28 pb-24 max-w-7xl mx-auto px-8 md:px-16 min-h-[60vh]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
          <div>
            <h2 className="text-[#C0392B] font-['Oswald'] uppercase tracking-[0.2em] text-sm mb-4 tracking-widest">User Profile</h2>
            <h1 className="text-5xl md:text-6xl font-['Oswald'] font-black uppercase text-white tracking-tighter">Saved Profiles</h1>
          </div>
          <p className="text-zinc-500 max-w-sm text-left md:text-right font-body-sm">
            Access and manage your custom vehicle configurations and performance roadmaps.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-8 border-b border-white/5 mb-12">
          <button
            onClick={() => setActiveTab('car')}
            className={`pb-4 font-['Oswald'] uppercase tracking-[0.2em] text-xs transition-colors relative ${activeTab === 'car' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Cars ({carCount})
            <div className={`absolute bottom-0 left-0 w-full h-0.5 transition-colors ${activeTab === 'car' ? 'bg-[#C0392B]' : 'bg-transparent'}`}></div>
          </button>
          <button
            onClick={() => setActiveTab('bike')}
            className={`pb-4 font-['Oswald'] uppercase tracking-[0.2em] text-xs transition-colors relative ${activeTab === 'bike' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Bikes ({bikeCount})
            <div className={`absolute bottom-0 left-0 w-full h-0.5 transition-colors ${activeTab === 'bike' ? 'bg-[#C0392B]' : 'bg-transparent'}`}></div>
          </button>
        </div>

        {filteredProfiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProfiles.map((profile) => (
              <div key={profile._id} className="group bg-[#1A1A1A] border border-white/5 machined-edge overflow-hidden transition-all hover:border-[#C0392B]/50 hover:-translate-y-2">
                {profile.vehicle?.image ? (
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={profile.vehicle.image}
                      alt={profile.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-[#C0392B] text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">{profile.goal}</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[#242424] to-[#121212] flex items-center justify-center border-b border-white/5">
                    <span className="material-symbols-outlined text-6xl text-zinc-800/60 select-none transition-transform duration-500 group-hover:scale-110">
                      {(profile.vehicle?.type || 'car') === 'bike' ? 'motorcycle' : 'directions_car'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-[#C0392B] text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">{profile.goal}</span>
                    </div>
                  </div>
                )}
                <div className="p-8 space-y-6">
                  <div>
                    <h3 className="font-['Oswald'] text-2xl font-bold text-white uppercase mb-1 truncate">{profile.name}</h3>
                    <p className="text-zinc-500 text-sm font-['Oswald'] uppercase tracking-wider">{profile.vehicle?.make} {profile.vehicle?.model} • {profile.vehicle?.year}</p>
                  </div>

                  <div className="flex justify-between items-center text-zinc-600 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">calendar_today</span>
                      <span>{new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="text-[#C0392B] font-bold font-['Oswald']">
                      ₹{profile.totalCost.toLocaleString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <button
                      onClick={() => navigate(`/tuning?profileId=${profile._id}`)}
                      className="bg-[#C0392B] text-white py-3 font-['Oswald'] text-xs uppercase tracking-widest hover:bg-[#a93226] transition-colors"
                    >
                      View Build
                    </button>
                    <button
                      onClick={() => handleDelete(profile._id)}
                      className="border border-white/10 text-zinc-400 py-3 font-['Oswald'] text-xs uppercase tracking-widest hover:bg-white/5 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-[#1A1A1A] border border-white/5 machined-edge">
            <span className="material-symbols-outlined text-6xl text-zinc-800 mb-6">{activeTab === 'car' ? 'directions_car' : 'motorcycle'}</span>
            <h3 className="font-['Oswald'] text-2xl text-white uppercase mb-2">No Saved {activeTab}s Yet</h3>
            <p className="text-zinc-600 mb-8">Start your first {activeTab} build to see it here.</p>
            <button onClick={() => navigate("/tuning")} className="bg-[#C0392B] text-white px-8 py-3 font-['Oswald'] uppercase tracking-widest text-sm">Start Tuning</button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-[#170b09] border-t border-white/5 py-16 px-8 md:px-16">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-6 h-6 bg-[#C0392B] flex items-center justify-center rounded-sm rotate-45">
              <span className="material-symbols-outlined text-white -rotate-45 text-xs">speed</span>
            </div>
            <span className="font-['Oswald'] text-xl font-black tracking-tighter uppercase text-white">ModMyRide</span>
          </div>
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-['Oswald']">
            © 2026 MODMYRIDE. Engineered for the Indian Market.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SavedProfilesPage;
