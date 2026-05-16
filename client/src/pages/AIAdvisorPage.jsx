import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUser, fetchVehicles, fetchAIRecommendation, setAuthToken } from "../services/api.js";

const AIAdvisorPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState({
    brand: "",
    model: "",
    engine: "",
    budget: "",
    usageStyle: ""
  });

  const resultsRef = useMemo(() => ({ current: null }), []);

  const placeholders = [
    "Best turbo setup under ₹1 lakh?",
    "Daily-drivable Stage 2 build for my Fortuner",
    "Need better mileage and low-end torque",
    "Can stock clutch handle Stage 2?",
    "Best tires for wet grip?",
    "Safe mods for long highway trips",
    "Best exhaust setup with moderate sound",
    "Need +40 HP under ₹80k"
  ];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem("modmyride_theme", "dark");
    document.body.classList.remove("light-mode");
    
    const fetchData = async () => {
      try {
        const { user: u } = await fetchCurrentUser();
        setUser(u);
        const vData = await fetchVehicles();
        if (vData && vData.vehicles) {
          console.log("Vehicles loaded:", vData.vehicles.length);
          setVehicles(vData.vehicles);
        } else {
          console.error("Invalid vehicle data:", vData);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setIsProfileMenuOpen(false);
    navigate("/");
  };

  const availableBrands = useMemo(() => {
    return [...new Set(vehicles.map(v => v.make))].sort();
  }, [vehicles]);

  const availableModels = useMemo(() => {
    return [...new Set(vehicles.filter(v => v.make === selection.brand).map(v => v.model))].sort();
  }, [vehicles, selection.brand]);

  const handleGenerate = async () => {
    if (!query && !selection.brand) return;
    
    setGenerating(true);
    setAiResult(null); // Clear previous results
    try {
      console.log("Fetching AI Recommendation for query:", query);
      const response = await fetchAIRecommendation({
        query,
        ...selection
      });
      
      if (response.success && response.data) {
        const result = response.data;
        setAiResult(result);
        
        // Auto-fill form from AI extraction
        if (result.extractedParams) {
          setSelection(prev => ({
            ...prev,
            brand: result.extractedParams.brand || prev.brand,
            model: result.extractedParams.model || prev.model,
            budget: result.extractedParams.budget || (result.extractedParams.budget_range ? result.extractedParams.budget_range : prev.budget),
          }));
        }

        if (!result.missingInfo) {
          setTimeout(() => {
            window.scrollTo({
              top: document.getElementById('ai-results-section')?.offsetTop - 100,
              behavior: 'smooth'
            });
          }, 100);
        }
      } else {
        throw new Error(response.message || "Invalid AI response");
      }
    } catch (err) {
      console.error("AI Generation Error:", err);
      alert("Performance Core Timeout: Please refine your query.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1d100e] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C0392B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1d100e] text-[#f7ddd9] font-body-md overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#1d100e]/90 backdrop-blur-lg border-b border-white/5 h-20 flex items-center">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between px-8 md:px-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 bg-[#C0392B] flex items-center justify-center rounded-sm rotate-45">
              <span className="material-symbols-outlined text-white -rotate-45 text-lg">speed</span>
            </div>
            <span className="font-['Oswald'] text-2xl font-black tracking-tighter uppercase text-white">ModMyRide</span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <button onClick={() => navigate("/")} className="font-['Oswald'] uppercase tracking-widest text-[11px] text-zinc-400 hover:text-white transition-colors">Home</button>
            <button onClick={() => navigate("/tuning")} className="font-['Oswald'] uppercase tracking-widest text-[11px] text-zinc-400 hover:text-white transition-colors">Recommendation</button>
            <button className="font-['Oswald'] uppercase tracking-widest text-[11px] text-white border-b-2 border-[#C0392B] pb-1">AI Advisor</button>
            <button onClick={() => navigate("/profiles")} className="font-['Oswald'] uppercase tracking-widest text-[11px] text-zinc-400 hover:text-white transition-colors">Saved Profiles</button>
          </div>

          {user ? (
            <div className="flex items-center gap-4 relative">
              <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden hover:border-[#C0392B] transition-all group">
                <span className="material-symbols-outlined text-zinc-500 group-hover:text-white text-base">person</span>
              </button>
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-12 w-64 bg-[#1A1A1A] shadow-2xl z-50 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                   <div className="border-b border-white/5 pb-4">
                    <p className="font-['Oswald'] text-white uppercase text-xs tracking-widest mb-1">{user.username}</p>
                    <p className="text-zinc-500 text-[10px] truncate">{user.email}</p>
                  </div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 text-[#C0392B] hover:bg-[#C0392B]/10 p-2 transition-colors font-label-caps text-[10px] uppercase tracking-widest">
                    <span className="material-symbols-outlined text-sm">logout</span>
                    <span>Logout Account</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => navigate("/auth")} className="bg-[#C0392B] text-white px-6 py-2.5 font-['Oswald'] uppercase tracking-widest text-xs">Sign In</button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-28 pb-24 px-8 md:px-16 max-w-7xl mx-auto">
        <div className="text-center space-y-6 mb-16 animate-in fade-in slide-in-from-bottom duration-700">
          <h2 className="text-[#C0392B] font-['Oswald'] uppercase tracking-[0.4em] text-sm font-bold">NEXT-GEN TUNING</h2>
          <h1 className="text-5xl md:text-7xl font-['Oswald'] font-black uppercase text-white tracking-tight leading-tight">
            AI Performance Advisor
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-3xl mx-auto">
            Describe your vehicle, goals, and budget. The AI will generate the best performance roadmap.
          </p>
        </div>

        <div className="bg-[#111111] border border-white/5 machined-edge relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#C0392B]"></div>
          
            {/* Left: Build Intent (Text) - Now Full Width */}
            <div className="lg:col-span-12 p-8 md:p-12 space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-['Oswald'] text-2xl font-black uppercase text-white tracking-widest">Build Intent</h3>
                  <p className="text-zinc-500 text-xs">Describe your vehicle, performance goals, and budget below.</p>
                </div>
                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 machined-edge">
                  <span className="material-symbols-outlined text-[#C0392B] text-sm animate-pulse">psychology</span>
                  <span className="font-['Oswald'] text-[10px] uppercase tracking-widest text-zinc-400">Neural Engine Ready</span>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#C0392B]/20 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 rounded-lg blur"></div>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholders[placeholderIndex]}
                  className="relative w-full bg-[#0A0A0A] border border-white/10 p-8 text-white font-['Inter'] text-lg outline-none focus:border-[#C0392B] transition-all min-h-[350px] placeholder:text-zinc-800 resize-none leading-relaxed shadow-2xl"
                ></textarea>
                
                <div className="absolute bottom-6 right-8 flex items-center gap-4 text-zinc-700">
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] uppercase tracking-[0.2em] font-bold">Natural Language Processor</span>
                    <span className="text-[7px] uppercase tracking-[0.1em]">Optimized for Automotive Tuning</span>
                  </div>
                </div>
              </div>
          </div>
        </div>

        {/* AI Missing Info / Question Area */}
        {aiResult?.missingInfo && (
          <div className="bg-[#C0392B]/10 border border-[#C0392B]/30 p-8 machined-edge animate-in fade-in zoom-in duration-500 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="material-symbols-outlined text-[#C0392B] animate-bounce">chat_bubble</span>
              <h4 className="font-['Oswald'] text-sm font-bold uppercase text-white tracking-widest">Incomplete Specifications</h4>
            </div>
            <p className="text-zinc-300 text-lg font-['Inter'] italic mb-6 leading-relaxed">
              "{aiResult.question}"
            </p>
            <div className="flex items-center gap-2 text-[10px] text-zinc-600 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-[#C0392B] rounded-full"></span>
              Awaiting further technical data
            </div>
          </div>
        )}

        <div className="flex justify-center">
          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || (!query && !selection.brand)}
            className={`w-full py-6 font-['Oswald'] font-bold uppercase tracking-[0.3em] text-lg transition-all flex items-center justify-center gap-4 ${generating || (!query && !selection.brand) ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-[#C0392B] text-white hover:bg-[#a93226] hover:shadow-[0_0_40px_rgba(192,57,43,0.3)]'}`}
          >
            {generating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing Database...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">auto_awesome</span>
                <span>GENERATE AI BUILD</span>
              </>
            )}
          </button>
        </div>

        {/* AI Results Dashboard */}
        {aiResult && (
          <div id="ai-results-section" className="mt-20 space-y-10 animate-in fade-in slide-in-from-bottom duration-1000">
            {/* Header / Score Strip */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#C0392B]/10 border border-[#C0392B]/20 p-6 machined-edge">
              <div className="space-y-1">
                <h3 className="font-['Oswald'] text-2xl font-black uppercase text-white tracking-tight flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#C0392B]">verified</span>
                  Analysis Complete
                </h3>
                <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em]">Build Reference: AI-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">Build Efficiency</p>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-[#C0392B]" style={{ width: `${aiResult.performanceStats?.buildScore || 0}%` }}></div>
                    </div>
                    <span className="font-['Oswald'] text-white font-bold">{aiResult.performanceStats?.buildScore || 0}%</span>
                  </div>
                </div>
                <div className="h-10 w-[1px] bg-white/10 hidden md:block"></div>
                <button 
                  onClick={() => navigate("/tuning", { state: { aiResult } })}
                  className="bg-[#C0392B] text-white px-6 py-2 font-['Oswald'] uppercase text-[10px] tracking-widest hover:bg-[#a93226] transition-all"
                >
                  Apply Build
                </button>
              </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left 8: Summary & Roadmap */}
              <div className="lg:col-span-8 space-y-12">
                {/* Summary Card */}
                <div className="bg-[#111111] border border-white/5 p-10 md:p-12 machined-edge space-y-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5">
                    <span className="material-symbols-outlined text-[120px]">format_quote</span>
                  </div>
                  <div className="space-y-4 relative z-10">
                    <h4 className="font-['Oswald'] text-xs font-bold uppercase tracking-widest text-[#C0392B]">Expert Summary</h4>
                    <p className="text-2xl font-['Inter'] font-light text-white leading-tight italic max-w-2xl">
                      "{aiResult.summary}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-white/5 relative z-10">
                    <div className="space-y-4">
                      <h5 className="font-label-caps text-[9px] text-zinc-600 uppercase tracking-[0.2em]">Mechanical Impact</h5>
                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(aiResult.impact || {}).map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center py-2 border-b border-white/[0.03]">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{key}</span>
                            <span className="text-[11px] text-white font-medium">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-6">
                      <h5 className="font-label-caps text-[9px] text-zinc-600 uppercase tracking-[0.2em]">Build Core</h5>
                      <div className="flex flex-wrap gap-2">
                        {aiResult.priority?.map((p, i) => (
                          <span key={i} className="px-3 py-1.5 bg-zinc-900 border border-white/10 text-zinc-400 text-[9px] uppercase tracking-widest font-bold flex items-center gap-2">
                            <span className="w-1 h-1 bg-[#C0392B] rounded-full"></span>
                            {p}
                          </span>
                        ))}
                      </div>
                      <div className="p-4 bg-zinc-900/50 border border-white/5 space-y-3">
                         <div className="flex justify-between items-center">
                            <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Reliability</span>
                            <span className="text-[10px] text-white font-bold">{aiResult.performanceStats?.reliabilityScore}%</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Daily Drive</span>
                            <span className="text-[10px] text-white font-bold">{aiResult.performanceStats?.dailyUsability}%</span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full-Width Roadmap */}
                <div className="bg-[#111111] border border-white/5 p-8 machined-edge">
                  <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                    <h4 className="font-['Oswald'] text-xs font-bold uppercase tracking-widest text-white">Stage Evolution Roadmap</h4>
                    <div className="flex gap-4">
                      {["Concept", "Stage 1", "Stage 2", "Extreme"].map(s => (
                        <div key={s} className="w-1 h-1 bg-zinc-800 rounded-full"></div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {aiResult.stages?.map((stage, i) => (
                      <div key={i} className="space-y-5">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-[10px] font-bold text-[#C0392B]">0{i+1}</span>
                          <h5 className="text-white font-['Oswald'] font-bold text-xs uppercase tracking-widest">{stage.label}</h5>
                        </div>
                        <ul className="space-y-3 pl-9">
                          {stage.parts?.map((part, j) => (
                            <li key={j} className="text-zinc-500 text-[10px] leading-relaxed group hover:text-zinc-300 transition-colors">
                              {part}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right 4: Parts List */}
              <div className="lg:col-span-4 space-y-10">
                <div className="bg-[#111111] border border-white/5 p-6 machined-edge space-y-6">
                   <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <h4 className="font-['Oswald'] text-xs font-bold uppercase tracking-widest text-white">Component List</h4>
                    <span className="text-[9px] text-[#C0392B] font-bold uppercase px-2 py-0.5 border border-[#C0392B]/30">{aiResult.recommendedUpgrades?.length || 0} Parts</span>
                  </div>
                  <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                    {aiResult.recommendedUpgrades?.map((part, i) => (
                      <div key={i} className="p-5 bg-zinc-900/50 border border-white/5 hover:border-[#C0392B]/30 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-[#C0392B]/5 -mr-8 -mt-8 rotate-45 group-hover:bg-[#C0392B]/10 transition-colors"></div>
                        <div className="relative z-10 space-y-3">
                           <div>
                              <p className="text-[7px] text-[#C0392B] font-label-caps mb-1 tracking-[0.2em]">{part.category || "UPGRADE"}</p>
                              <h5 className="text-white font-bold text-[11px] uppercase group-hover:text-[#C0392B] transition-colors font-['Oswald'] leading-tight">
                                {part.name || "Mechanical Component"}
                              </h5>
                           </div>
                           <p className="text-zinc-500 text-[10px] leading-relaxed italic font-['Inter'] border-l border-white/5 pl-3">
                             {part.reasoning}
                           </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warnings */}
                {aiResult.warnings?.length > 0 && (
                  <div className="bg-[#C0392B]/5 border border-[#C0392B]/20 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#C0392B] text-lg">error</span>
                      <p className="font-['Oswald'] text-[10px] font-bold uppercase text-white tracking-widest">Engineering Warnings</p>
                    </div>
                    <ul className="text-zinc-500 text-[10px] space-y-2">
                      {aiResult.warnings.map((w, i) => <li key={i} className="pl-3 border-l border-[#C0392B]/30">{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI Features Description */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          {[
            { icon: "database", title: "Real Data", desc: "AI analyzes actual parts and vehicles from our MongoDB database." },
            { icon: "security", title: "Safety First", desc: "Compatibility logic ensures all recommended parts fit your specific build." },
            { icon: "bolt", title: "Performance", desc: "Estimated gains calculated using mechanical engineering multipliers." }
          ].map((feat, i) => (
            <div key={i} className="p-6 bg-white/5 machined-edge flex flex-col items-center text-center gap-4">
              <span className="material-symbols-outlined text-[#C0392B] text-3xl">{feat.icon}</span>
              <h4 className="font-['Oswald'] uppercase font-bold text-sm tracking-widest">{feat.title}</h4>
              <p className="text-zinc-500 text-xs">{feat.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AIAdvisorPage;
