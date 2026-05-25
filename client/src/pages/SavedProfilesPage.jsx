import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUser, fetchUserProfiles, deleteUserProfile, fetchCommunityBuilds, toggleBuildLike, setAuthToken } from "../services/api.js";
import Navbar from "../components/Navbar.jsx";

const SavedProfilesPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [communityBuilds, setCommunityBuilds] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("community");
  const [activeTab, setActiveTab] = useState("car");
  const [likingIds, setLikingIds] = useState(new Set());

  useEffect(() => {
    localStorage.setItem("modmyride_theme", "dark");
    document.body.classList.remove("light-mode");
  }, []);

  useEffect(() => {
    document.title = "ModMyRide | Saved Builds";

    const init = async () => {
      // Always load community builds (public)
      try {
        const communityData = await fetchCommunityBuilds();
        setCommunityBuilds(communityData.profiles || []);
      } catch (err) {
        console.error("Community Builds Error:", err);
      } finally {
        setCommunityLoading(false);
      }

      // Try to load user + their personal builds
      try {
        const { user: u } = await fetchCurrentUser();
        setUser(u);

        const data = await fetchUserProfiles();
        setProfiles(data.profiles);
      } catch {
        setUser(null);
        // If visiting community tab, that's fine — no redirect
        if (activeSection === "my-builds") {
          navigate("/auth", { state: { from: "/builds" } });
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this build?")) {
      try {
        await deleteUserProfile(id);
        setProfiles(profiles.filter(p => p._id !== id));
      } catch (err) {
        console.error("Delete Error:", err);
        alert("Failed to remove build.");
      }
    }
  };

  const handleLike = async (buildId) => {
    if (!user) {
      navigate("/auth", { state: { from: "/builds" } });
      return;
    }

    if (likingIds.has(buildId)) return;

    setLikingIds(prev => new Set(prev).add(buildId));

    try {
      const result = await toggleBuildLike(buildId);

      setCommunityBuilds(prev => prev.map(b => {
        if (b._id === buildId) {
          const newLikes = result.liked
            ? [...(b.likes || []), user._id]
            : (b.likes || []).filter(id => id !== user._id);
          return { ...b, likeCount: result.likeCount, likes: newLikes };
        }
        return b;
      }));

      setProfiles(prev => prev.map(b => {
        if (b._id === buildId) {
          return { ...b, likeCount: result.likeCount };
        }
        return b;
      }));
    } catch (err) {
      console.error("Like Error:", err);
    } finally {
      setLikingIds(prev => {
        const next = new Set(prev);
        next.delete(buildId);
        return next;
      });
    }
  };

  const handleSwitchToMyBuilds = () => {
    if (!user) {
      navigate("/auth", { state: { from: "/builds" } });
      return;
    }
    setActiveSection("my-builds");
  };

  // Filters for My Builds
  const filteredProfiles = profiles.filter(p => (p.vehicle?.type || 'car') === activeTab);
  const carCount = profiles.filter(p => (p.vehicle?.type || 'car') === 'car').length;
  const bikeCount = profiles.filter(p => p.vehicle?.type === 'bike').length;

  // Filters for Community Builds
  const filteredCommunity = communityBuilds.filter(p => {
    const type = p.vehicle?.type || p.customVehicle?.type || 'car';
    return type === activeTab;
  });
  const communityCarCount = communityBuilds.filter(p => (p.vehicle?.type || p.customVehicle?.type || 'car') === 'car').length;
  const communityBikeCount = communityBuilds.filter(p => (p.vehicle?.type || p.customVehicle?.type) === 'bike').length;

  const isLikedByUser = (build) => {
    if (!user) return false;
    return (build.likes || []).some(id => id === user._id || id?.toString?.() === user._id);
  };

  if (loading && communityLoading) {
    return (
      <div className="min-h-screen bg-[#1d100e] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#C0392B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // ========================
  // FEATURED BUILD CARD (first community build — full width hero)
  // ========================
  const renderFeaturedCard = (profile) => {
    const vehicleType = profile.vehicle?.type || profile.customVehicle?.type || 'car';
    let make = profile.vehicle?.make || profile.customVehicle?.make;
    let model = profile.vehicle?.model || profile.customVehicle?.model;

    if (!make && !model) {
      if (profile.isAiBuild || profile.name) {
        const cleanName = profile.name.replace(/ Build$/i, '');
        const parts = cleanName.split(' ');
        const split = Math.ceil(parts.length / 2);
        make = parts.slice(0, split).join(' ');
        model = parts.slice(split).join(' ');
      } else {
        make = 'Custom';
        model = 'Build';
      }
    }
    const year = profile.vehicle?.year || '';
    const image = profile.vehicle?.image || '';
    const liked = isLikedByUser(profile);

    return (
      <div key={profile._id} className="group relative bg-[#1A1A1A] border border-white/5 overflow-hidden transition-all duration-500 hover:border-[#C0392B]/40 mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left — Large Image */}
          <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[420px] overflow-hidden bg-gradient-to-br from-[#242424] to-[#121212]">
            {image ? (
              <img
                src={image}
                alt={profile.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[120px] text-zinc-800/30 transition-transform duration-500 group-hover:scale-110">
                  {vehicleType === 'bike' ? 'motorcycle' : 'directions_car'}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1A1A1A]/50 hidden lg:block"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent lg:hidden"></div>

            {/* Crown badge */}
            <div className="absolute top-5 left-5">
              <div className="flex items-center gap-2 bg-[#C0392B] px-3 py-1.5">
                <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                <span className="text-white text-[10px] font-bold font-['Oswald'] uppercase tracking-widest">Top Build</span>
              </div>
            </div>
          </div>

          {/* Right — Build Info */}
          <div className="p-10 lg:p-12 flex flex-col justify-center space-y-8">
            <div>
              <span className="bg-[#C0392B]/15 text-[#C0392B] text-[10px] font-bold px-3 py-1 uppercase tracking-widest font-['Oswald'] inline-block mb-5">{profile.goal}</span>
              <h3 className="font-['Oswald'] text-3xl lg:text-4xl font-black text-white uppercase tracking-tight mb-3">{profile.name}</h3>
              <p className="text-zinc-500 text-base font-['Oswald'] uppercase tracking-wider">
                {make} {model} {year && `• ${year}`}
              </p>
            </div>

            {profile.user?.username && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-zinc-400 text-sm">person</span>
                </div>
                <div>
                  <span className="text-white text-sm font-['Oswald'] uppercase tracking-wider">{profile.user.username}</span>
                  <p className="text-zinc-600 text-[10px]">{new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-8">
              <div>
                <p className="text-zinc-600 text-[10px] font-['Oswald'] uppercase tracking-widest mb-1">Total Cost</p>
                <p className="text-[#C0392B] font-['Oswald'] font-black text-2xl">₹{profile.totalCost?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-zinc-600 text-[10px] font-['Oswald'] uppercase tracking-widest mb-1">Likes</p>
                <p className="text-white font-['Oswald'] font-black text-2xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#C0392B] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                  {profile.likeCount || 0}
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => handleLike(profile._id)}
                disabled={likingIds.has(profile._id)}
                className={`flex items-center justify-center gap-2 px-8 py-4 font-['Oswald'] text-sm uppercase tracking-widest transition-all ${liked
                  ? 'bg-[#C0392B]/20 text-[#C0392B] border border-[#C0392B]/30'
                  : 'border border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white'
                  } ${likingIds.has(profile._id) ? 'opacity-50' : ''}`}
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={liked ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  favorite
                </span>
                {liked ? 'Liked' : 'Like'}
              </button>
              <button
                onClick={() => navigate(`/tuning?profileId=${profile._id}`)}
                className="bg-[#C0392B] text-white px-8 py-4 font-['Oswald'] text-sm uppercase tracking-widest hover:bg-[#a93226] transition-colors flex items-center gap-2"
              >
                View Build
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ========================
  // STANDARD BUILD CARD (larger 2-col layout)
  // ========================
  const renderBuildCard = (profile, showCommunityInfo = false) => {
    const vehicleType = profile.vehicle?.type || profile.customVehicle?.type || 'car';
    let make = profile.vehicle?.make || profile.customVehicle?.make;
    let model = profile.vehicle?.model || profile.customVehicle?.model;

    if (!make && !model) {
      if (profile.isAiBuild || profile.name) {
        const cleanName = profile.name.replace(/ Build$/i, '');
        const parts = cleanName.split(' ');
        const split = Math.ceil(parts.length / 2);
        make = parts.slice(0, split).join(' ');
        model = parts.slice(split).join(' ');
      } else {
        make = 'Custom';
        model = 'Build';
      }
    }
    const year = profile.vehicle?.year || '';
    const image = profile.vehicle?.image || '';
    const liked = isLikedByUser(profile);

    return (
      <div key={profile._id} className="group bg-[#1A1A1A] border border-white/5 overflow-hidden transition-all duration-500 hover:border-[#C0392B]/40 hover:-translate-y-2 hover:shadow-[0_20px_60px_-20px_rgba(192,57,43,0.25)]">
        {/* Image area — taller aspect ratio */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#242424] to-[#121212]">
          {image ? (
            <img
              src={image}
              alt={profile.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-[80px] text-zinc-800/40 transition-transform duration-500 group-hover:scale-110">
                {vehicleType === 'bike' ? 'motorcycle' : 'directions_car'}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

          {/* Goal badge */}
          <div className="absolute top-5 left-5">
            <span className="bg-[#C0392B] text-white text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest font-['Oswald']">{profile.goal}</span>
          </div>

          {/* Like count badge */}
          <div className="absolute top-5 right-5">
            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 border border-white/10">
              <span className="material-symbols-outlined text-[#C0392B] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              <span className="text-white text-[11px] font-['Oswald'] font-bold">{profile.likeCount || 0}</span>
            </div>
          </div>

          {/* Bottom overlay info on image */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="font-['Oswald'] text-2xl lg:text-3xl font-black text-white uppercase tracking-tight mb-1 drop-shadow-lg">{profile.name}</h3>
            <p className="text-zinc-300/80 text-sm font-['Oswald'] uppercase tracking-wider drop-shadow-md">
              {make} {model} {year && `• ${year}`}
            </p>
          </div>
        </div>

        {/* Card body */}
        <div className="p-6 lg:p-8 space-y-5">
          {/* User + date + cost row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showCommunityInfo && profile.user?.username ? (
                <>
                  <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-zinc-500 text-xs">person</span>
                  </div>
                  <div>
                    <span className="text-white text-xs font-['Oswald'] uppercase tracking-wider">{profile.user.username}</span>
                    <p className="text-zinc-600 text-[10px]">{new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  <span>{new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
            </div>
            <div className="text-[#C0392B] font-bold font-['Oswald'] text-lg">
              ₹{profile.totalCost?.toLocaleString()}
            </div>
          </div>

          {/* Action buttons */}
          <div className={`grid ${!showCommunityInfo ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
            <button
              onClick={() => handleLike(profile._id)}
              disabled={likingIds.has(profile._id)}
              className={`flex items-center justify-center gap-2 py-3.5 font-['Oswald'] text-xs uppercase tracking-widest transition-all ${liked
                ? 'bg-[#C0392B]/20 text-[#C0392B] border border-[#C0392B]/30'
                : 'border border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white'
                } ${likingIds.has(profile._id) ? 'opacity-50' : ''}`}
            >
              <span
                className="material-symbols-outlined text-base"
                style={liked ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                favorite
              </span>
              {liked ? 'Liked' : 'Like'}
            </button>
            <button
              onClick={() => navigate(`/tuning?profileId=${profile._id}`)}
              className="bg-[#C0392B] text-white py-3.5 font-['Oswald'] text-xs uppercase tracking-widest hover:bg-[#a93226] transition-colors"
            >
              View Build
            </button>
            {!showCommunityInfo && (
              <button
                onClick={() => handleDelete(profile._id)}
                className="border border-white/10 text-zinc-400 py-3.5 font-['Oswald'] text-xs uppercase tracking-widest hover:bg-white/5 hover:text-white transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#1d100e] text-[#f7ddd9] font-body-md overflow-x-hidden">
      <Navbar />

      <main className="pt-28 pb-24 max-w-7xl mx-auto px-8 md:px-16 min-h-[60vh]">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div>
            <h2 className="text-[#C0392B] font-['Oswald'] uppercase tracking-[0.3em] text-sm mb-4">Garage</h2>
            <h1 className="text-5xl md:text-7xl font-['Oswald'] font-black uppercase text-white tracking-tighter leading-none">Saved Builds</h1>
          </div>
          <p className="text-zinc-500 max-w-md text-left md:text-right text-sm leading-relaxed">
            Explore community builds, show some love, and manage your own creations.
          </p>
        </div>

        {/* Section Switcher — Community / My Builds */}
        <div className="flex items-center gap-0 mb-14 bg-[#1A1A1A] border border-white/5 p-1.5 w-fit">
          <button
            onClick={() => setActiveSection('community')}
            className={`px-8 py-3 font-['Oswald'] uppercase tracking-[0.2em] text-xs transition-all ${activeSection === 'community'
              ? 'bg-[#C0392B] text-white'
              : 'text-zinc-500 hover:text-white'
              }`}
          >
            Community Builds
          </button>
          <button
            onClick={handleSwitchToMyBuilds}
            className={`px-8 py-3 font-['Oswald'] uppercase tracking-[0.2em] text-xs transition-all ${activeSection === 'my-builds'
              ? 'bg-[#C0392B] text-white'
              : 'text-zinc-500 hover:text-white'
              }`}
          >
            My Builds {user && `(${profiles.length})`}
          </button>
        </div>

        {/* Vehicle Type Sub-Tabs */}
        <div className="flex items-center gap-8 border-b border-white/5 mb-10">
          <button
            onClick={() => setActiveTab('car')}
            className={`pb-4 font-['Oswald'] uppercase tracking-[0.2em] text-xs transition-colors relative ${activeTab === 'car' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Cars ({activeSection === 'community' ? communityCarCount : carCount})
            <div className={`absolute bottom-0 left-0 w-full h-0.5 transition-colors ${activeTab === 'car' ? 'bg-[#C0392B]' : 'bg-transparent'}`}></div>
          </button>
          <button
            onClick={() => setActiveTab('bike')}
            className={`pb-4 font-['Oswald'] uppercase tracking-[0.2em] text-xs transition-colors relative ${activeTab === 'bike' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Bikes ({activeSection === 'community' ? communityBikeCount : bikeCount})
            <div className={`absolute bottom-0 left-0 w-full h-0.5 transition-colors ${activeTab === 'bike' ? 'bg-[#C0392B]' : 'bg-transparent'}`}></div>
          </button>
        </div>

        {/* ===================== COMMUNITY BUILDS ===================== */}
        {activeSection === 'community' && (
          <>
            {communityLoading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-12 h-12 border-2 border-[#C0392B] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredCommunity.length > 0 ? (
              <div>
                {/* Featured first build (full width hero) */}
                {renderFeaturedCard(filteredCommunity[0])}

                {/* Remaining builds in 2-column grid */}
                {filteredCommunity.length > 1 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {filteredCommunity.slice(1).map(build => renderBuildCard(build, true))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-32 bg-[#1A1A1A] border border-white/5">
                <span className="material-symbols-outlined text-[80px] text-zinc-800 mb-6 block">{activeTab === 'car' ? 'directions_car' : 'motorcycle'}</span>
                <h3 className="font-['Oswald'] text-3xl text-white uppercase mb-3">No Community {activeTab === 'car' ? 'Car' : 'Bike'} Builds Yet</h3>
                <p className="text-zinc-600 mb-10 text-sm">Be the first to create and share a build!</p>
                <button onClick={() => navigate("/tuning")} className="bg-[#C0392B] text-white px-10 py-4 font-['Oswald'] uppercase tracking-widest text-sm hover:bg-[#a93226] transition-colors">Start Tuning</button>
              </div>
            )}
          </>
        )}

        {/* ===================== MY BUILDS ===================== */}
        {activeSection === 'my-builds' && (
          <>
            {filteredProfiles.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {filteredProfiles.map(profile => renderBuildCard(profile, false))}
              </div>
            ) : (
              <div className="text-center py-32 bg-[#1A1A1A] border border-white/5">
                <span className="material-symbols-outlined text-[80px] text-zinc-800 mb-6 block">{activeTab === 'car' ? 'directions_car' : 'motorcycle'}</span>
                <h3 className="font-['Oswald'] text-3xl text-white uppercase mb-3">No Saved {activeTab}s Yet</h3>
                <p className="text-zinc-600 mb-10 text-sm">Start your first {activeTab} build to see it here.</p>
                <button onClick={() => navigate("/tuning")} className="bg-[#C0392B] text-white px-10 py-4 font-['Oswald'] uppercase tracking-widest text-sm hover:bg-[#a93226] transition-colors">Start Tuning</button>
              </div>
            )}
          </>
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
