import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUser, fetchUserProfiles, deleteUserProfile } from "../services/api.js";

const SavedProfilesPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1d100e] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#C0392B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1d100e] text-[#f7ddd9] font-body-md overflow-x-hidden">
      {/* Navbar (Same as Landing) */}
      <nav className="fixed top-0 w-full z-50 bg-[#1d100e]/80 backdrop-blur-md border-b border-white/5 h-20 flex items-center justify-between px-8 md:px-16">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 bg-[#C0392B] flex items-center justify-center rounded-sm rotate-45">
            <span className="material-symbols-outlined text-white -rotate-45 text-lg">speed</span>
          </div>
          <span className="font-['Oswald'] text-2xl font-black tracking-tighter uppercase text-white">ModMyRide</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => navigate("/")} className="font-['Oswald'] uppercase tracking-widest text-xs text-zinc-400 hover:text-white transition-colors">Home</button>
          <button onClick={handleStartTuning} className="font-['Oswald'] uppercase tracking-widest text-xs text-zinc-400 hover:text-white transition-colors">Recommendation</button>
          <button onClick={() => navigate("/profiles")} className="font-['Oswald'] uppercase tracking-widest text-xs text-white border-b-2 border-[#C0392B] pb-1 transition-colors">Saved Profiles</button>
        </div>

        <button 
          onClick={handleStartTuning}
          className="bg-[#C0392B] hover:bg-[#a93226] text-white px-6 py-2.5 font-['Oswald'] uppercase tracking-widest text-xs transition-all shadow-[0_4px_20px_rgba(192,57,43,0.3)]"
        >
          {user ? 'Dashboard' : 'Get Started'}
        </button>
      </nav>

      <main className="pt-32 pb-24 px-8 md:px-16 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <h2 className="text-[#C0392B] font-['Oswald'] uppercase tracking-[0.2em] text-sm mb-4 tracking-widest">User Profile</h2>
            <h1 className="text-5xl md:text-6xl font-['Oswald'] font-black uppercase text-white tracking-tighter">Saved Profiles</h1>
          </div>
          <p className="text-zinc-500 max-w-sm text-right font-body-sm">
            Access and manage your custom vehicle configurations and performance roadmaps.
          </p>
        </div>

        {profiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {profiles.map((profile) => (
              <div key={profile._id} className="group bg-[#1A1A1A] border border-white/5 machined-edge overflow-hidden transition-all hover:border-[#C0392B]/50 hover:-translate-y-2">
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={profile.image || (profile.vehicle.type === 'bike' ? "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800" : "https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?auto=format&fit=crop&q=80&w=800")} 
                    alt={profile.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-[#C0392B] text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">{profile.goal}</span>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div>
                    <h3 className="font-['Oswald'] text-2xl font-bold text-white uppercase mb-1 truncate">{profile.name}</h3>
                    <p className="text-zinc-500 text-sm font-['Oswald'] uppercase tracking-wider">{profile.vehicle.make} {profile.vehicle.model} • {profile.vehicle.year}</p>
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
             <span className="material-symbols-outlined text-6xl text-zinc-800 mb-6">inventory_2</span>
             <h3 className="font-['Oswald'] text-2xl text-white uppercase mb-2">No Saved Profiles Yet</h3>
             <p className="text-zinc-600 mb-8">Start your first build to see it here.</p>
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
            © 2024 MODMYRIDE. Engineered for the Indian Market.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SavedProfilesPage;
