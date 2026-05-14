import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchCurrentUser, fetchVehicles, fetchUpgrades, saveUserProfile, fetchUserProfileById, setAuthToken } from "../services/api.js";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const formatIndianCurrency = (num) => {
  if (!num) return "0";
  return new Intl.NumberFormat('en-IN').format(num);
};

// Helper to extract numeric values from strings (e.g., "15 HP" -> 15)
const getNumericGain = (val, stringVal) => {
  if (typeof val === 'number' && val !== 0) return val;
  if (!stringVal) return 0;
  const match = stringVal.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
};

const TuningPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get("profileId");
  const [user, setUser] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [upgrades, setUpgrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [selection, setSelection] = useState({
    type: "car",
    brand: "",
    model: "",
    year: "",
    fuelType: "",
    transmission: "",
    goal: "",
    budget: 0,
    driverName: ""
  });
  const [mode, setMode] = useState("auto"); // "auto" or "manual"
  const [manualSelection, setManualSelection] = useState([]);
  const [activeCategory, setActiveCategory] = useState("Air Intake");

  useEffect(() => {
    localStorage.setItem("modmyride_theme", "dark");
    document.body.classList.remove("light-mode");
  }, []);

  useEffect(() => {
    document.title = "ModMyRide | Performance Recommendation";
    const fetchData = async () => {
      try {
        const { user: u } = await fetchCurrentUser();
        setUser(u);
        
        const [vData, uData] = await Promise.all([
          fetchVehicles(),
          fetchUpgrades()
        ]);
        
        setVehicles(vData.vehicles || []);
        setUpgrades(uData.upgrades || []);

        // Handle direct profile view
        if (profileId) {
          try {
            const { profile } = await fetchUserProfileById(profileId);
            if (profile && profile.vehicle) {
              setSelection({
                type: profile.vehicle.type || "car",
                brand: profile.vehicle.make || "",
                model: profile.vehicle.model || "",
                year: profile.vehicle.year || "",
                fuelType: profile.vehicle.fuelType || "",
                transmission: profile.vehicle.transmission || "",
                goal: profile.goal || "Performance",
                budget: profile.totalBudget || 50000,
                driverName: profile.name || ""
              });
              setStep(4);
            }
          } catch (err) {
            console.error("Profile Load Error:", err);
          }
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate, profileId]);



  const handleStartTuning = () => {
    if (user) {
      if (user.role === 'admin') {
        navigate("/admin");
      } else {
        setStep(1); // Reset to step 1 if already on tuning page
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

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => v.type.toLowerCase() === selection.type.toLowerCase());
  }, [vehicles, selection.type]);

  const availableBrands = useMemo(() => {
    return [...new Set(filteredVehicles.map(v => v.make))].sort();
  }, [filteredVehicles]);

  const availableModels = useMemo(() => {
    const models = filteredVehicles
      .filter(v => v.make === selection.brand)
      .map(v => v.model);
    return [...new Set(models)].sort();
  }, [filteredVehicles, selection.brand]);

  const availableYears = useMemo(() => {
    const years = filteredVehicles
      .filter(v => v.make === selection.brand && v.model === selection.model)
      .map(v => v.year);
    return [...new Set(years)].sort((a, b) => b - a);
  }, [filteredVehicles, selection.brand, selection.model]);

  const availableFuels = useMemo(() => {
    const fuels = filteredVehicles
      .filter(v => v.make === selection.brand && v.model === selection.model && v.year === selection.year)
      .map(v => v.fuelType);
    return [...new Set(fuels)].filter(Boolean).sort();
  }, [filteredVehicles, selection.brand, selection.model, selection.year]);

  const availableTransmissions = useMemo(() => {
    const trans = filteredVehicles
      .filter(v => v.make === selection.brand && v.model === selection.model && v.year === selection.year && v.fuelType === selection.fuelType)
      .map(v => v.transmission);
    return [...new Set(trans)].filter(Boolean).sort();
  }, [filteredVehicles, selection.brand, selection.model, selection.year, selection.fuelType]);

  const selectedVehicle = useMemo(() => {
    return filteredVehicles.find(v => 
      v.make === selection.brand && 
      v.model === selection.model && 
      v.year === selection.year &&
      v.fuelType === selection.fuelType &&
      v.transmission === selection.transmission
    );
  }, [filteredVehicles, selection.brand, selection.model, selection.year, selection.fuelType, selection.transmission]);

  useEffect(() => {
    if (selection.type === 'bike' && selection.year) {
      if (availableFuels.length > 0 && !selection.fuelType) {
        setSelection(s => ({ ...s, fuelType: availableFuels[0] }));
      }
    }
  }, [selection.type, selection.year, availableFuels]);

  useEffect(() => {
    if (selection.type === 'bike' && selection.fuelType) {
      if (availableTransmissions.length > 0 && !selection.transmission) {
        setSelection(s => ({ ...s, transmission: availableTransmissions[0] }));
      }
    }
  }, [selection.type, selection.fuelType, availableTransmissions]);

  // Recommendation Engine Logic
  const getScoredUpgrades = (categoryUpgrades) => {
    return categoryUpgrades.map(u => {
      let score = 0;
      let reasons = [];
      
      const hpGain = getNumericGain(u.performanceGainHP, u.performanceGain);
      const torqueGain = getNumericGain(u.torqueGainNM, u.torque);
      
      if (hpGain > 0) {
        score += hpGain * 4;
        reasons.push(`+${hpGain} HP boost`);
      }
      
      if (torqueGain > 0) {
        score += torqueGain * 2;
        reasons.push(`Increases low-end torque`);
      }
      
      if (u.goals.includes(selection.goal)) {
        score += 50;
        reasons.push(`Perfect for ${selection.goal}`);
      }
      
      const priceRatio = u.price / selection.budget;
      score -= priceRatio * 20;

      return { 
        ...u, 
        totalScore: Math.round(score),
        reason: reasons.slice(0, 2).join(" • ") || "Balanced upgrade",
        parsedHP: hpGain,
        parsedTorque: torqueGain
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  };

  const autoBuild = useMemo(() => {
    if (!selectedVehicle) return [];
    
    const categories = ["Air Intake", "Exhaust Systems", "ECU & Tuning", "Suspension", "Brakes", "Wheels & Tyres", "Lighting"];
    const build = [];
    let currentBudget = selection.budget;

    // First filter all compatible parts STRICTLY by Goal and Vehicle
    const compatible = upgrades.filter(u => 
      u.type.toLowerCase() === selection.type.toLowerCase() &&
      u.goals.includes(selection.goal) && // STRICT GOAL FILTER
      (!u.compatibleVehicles?.length || u.compatibleVehicles.includes(selectedVehicle._id)) &&
      (!u.stage || u.stage !== "Stage 3" || selection.budget > 100000)
    );

    categories.forEach(cat => {
      const catParts = compatible.filter(p => p.category === cat);
      const scored = getScoredUpgrades(catParts);
      
      if (scored.length > 0) {
        const best = scored[0];
        if (best.price <= currentBudget) {
          build.push(best);
          currentBudget -= best.price;
        }
      }
    });

    return build;
  }, [upgrades, selectedVehicle, selection.type, selection.goal, selection.budget]);

  const manualCategories = useMemo(() => {
    if (!selectedVehicle) return [];
    const compatible = upgrades.filter(u => 
      u.type.toLowerCase() === selection.type.toLowerCase() &&
      u.goals.includes(selection.goal) &&
      (!u.compatibleVehicles?.length || u.compatibleVehicles.includes(selectedVehicle._id))
    );
    const cats = [...new Set(compatible.map(u => u.category))];
    const order = ["Air Intake", "Exhaust Systems", "ECU & Tuning", "Suspension", "Brakes", "Wheels & Tyres", "Lighting"];
    return order.filter(cat => cats.includes(cat));
  }, [upgrades, selectedVehicle, selection.type, selection.goal]);

  useEffect(() => {
    if (manualCategories.length > 0 && !manualCategories.includes(activeCategory)) {
      setActiveCategory(manualCategories[0]);
    }
  }, [manualCategories, activeCategory]);

  const activeBuild = useMemo(() => {
    return mode === "auto" ? autoBuild : manualSelection;
  }, [mode, autoBuild, manualSelection]);

  const performanceStats = useMemo(() => {
    if (!selectedVehicle) return null;

    const stockHP = selectedVehicle.stockPower || 0;
    const stockTorque = selectedVehicle.torqueNM || getNumericGain(0, selectedVehicle.torque) || 300;
    
    const totalHPGain = activeBuild.reduce((sum, u) => sum + getNumericGain(u.performanceGainHP, u.performanceGain), 0);
    const totalTorqueGain = activeBuild.reduce((sum, u) => sum + getNumericGain(u.torqueGainNM, u.torque), 0);
    const totalMileageImpact = activeBuild.reduce((sum, u) => sum + (u.mileageImpact || 0), 0);
    
    const tunedHP = stockHP + totalHPGain;
    const tunedTorque = stockTorque + totalTorqueGain;
    
    const budgetUsed = activeBuild.reduce((sum, u) => sum + u.price, 0);
    const budgetRemaining = selection.budget - budgetUsed;
    
    const buildScore = Math.min(100, Math.round(
      (totalHPGain / (stockHP * 0.4) * 40) + 
      (totalTorqueGain / (stockTorque * 0.4) * 30) + 
      (activeBuild.length / 7 * 30)
    ));

    return {
      stockHP,
      tunedHP,
      stockTorque,
      tunedTorque,
      totalHPGain,
      totalTorqueGain,
      totalMileageImpact,
      budgetUsed,
      budgetRemaining,
      buildScore,
      hpIncreasePercent: Math.round((totalHPGain / stockHP) * 100) || 0
    };
  }, [selectedVehicle, activeBuild, selection.budget]);

  const totalCost = performanceStats?.budgetUsed || 0;

  const steps = [
    { num: 1, label: "SELECT VEHICLE" },
    { num: 2, label: "GOAL" },
    { num: 3, label: "BUDGET" },
    { num: 4, label: "RESULTS" }
  ];

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSaveBuild = async () => {
    if (!selectedVehicle) return;
    
    setSaving(true);
    try {
      await saveUserProfile({
        name: selection.driverName || `${selectedVehicle.make} ${selectedVehicle.model} Build`,
        vehicleId: selectedVehicle._id,
        upgradeIds: activeBuild.map(u => u._id),
        goal: selection.goal,
        totalBudget: selection.budget,
        totalCost: totalCost
      });
      navigate("/profiles");
    } catch (err) {
      console.error("Save Build Error:", err);
      if (err.response?.status === 401) {
        navigate("/auth");
      } else {
        alert("Failed to save build. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const isStepValid = (n) => {
    if (n === 1) return !!(selection.brand && selection.model && selection.year && (selection.type === 'bike' || (selection.fuelType && selection.transmission)));
    if (n === 2) return !!selection.goal;
    if (n === 3) return selection.budget >= 10000;
    return true;
  };

  const renderStepper = () => (
    <div className="flex items-center justify-center gap-10 mb-20 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[1px] bg-zinc-800/50 -z-10"></div>
      {steps.map((s) => {
        const valid = isStepValid(s.num);
        return (
          <div 
            key={s.num} 
            onClick={() => setStep(s.num)}
            className="flex flex-col items-center gap-4 cursor-pointer group"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-['Oswald'] text-sm font-bold border-2 transition-all duration-300 ${step === s.num ? 'bg-[#C0392B] border-[#C0392B] text-white shadow-[0_0_15px_rgba(192,57,43,0.5)] scale-110' : (s.num < step && valid) ? 'bg-[#1d100e] border-[#C0392B]/50 text-[#C0392B]' : 'bg-[#1d100e] border-zinc-800 text-zinc-600 group-hover:border-zinc-700'}`}>
              {s.num < step ? (
                valid ? (
                  <span className="material-symbols-outlined text-sm font-bold">check</span>
                ) : (
                  <span className="material-symbols-outlined text-sm font-bold">close</span>
                )
              ) : (
                s.num
              )}
            </div>
            <span className={`font-['Oswald'] text-[10px] uppercase tracking-[0.2em] transition-colors duration-300 ${step === s.num ? 'text-white' : valid ? 'text-zinc-400' : 'text-zinc-600 group-hover:text-zinc-400'}`}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom duration-500">
      <div className="flex items-center gap-4">
        <div className="w-1 h-8 bg-[#C0392B]"></div>
        <h2 className="text-3xl font-['Oswald'] font-bold uppercase text-white tracking-tight">Step 1: Vehicle Configuration</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { id: 'car', title: 'CAR', desc: 'Hatchbacks, Sedans, SUVs & Performance Coupes' },
          { id: 'bike', title: 'BIKE', desc: 'Street, Sport, Cruisers & Adventure Tourers' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setSelection({...selection, type: item.id, brand: "", model: "", year: ""})}
            className={`relative p-10 machined-edge flex flex-col items-start gap-4 transition-all duration-300 group ${selection.type === item.id ? 'bg-[#C0392B]/10 border-[#C0392B]/50 shadow-[inset_0_0_40px_rgba(192,57,43,0.1)]' : 'bg-[#111111] hover:bg-[#1A1A1A] border-white/5'}`}
          >
            {selection.type === item.id && (
              <div className="absolute top-0 right-0 p-2">
                <div className="bg-[#C0392B] text-white font-label-caps text-[8px] px-3 py-1 uppercase tracking-widest">Selected</div>
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className={`w-1 h-12 transition-all ${selection.type === item.id ? 'bg-[#C0392B]' : 'bg-zinc-800 group-hover:bg-zinc-700'}`}></div>
              <div className="text-left">
                <h3 className="font-['Oswald'] text-2xl font-bold uppercase text-white tracking-tight">{item.title}</h3>
                <p className="text-zinc-500 text-[10px] font-label-caps tracking-widest uppercase opacity-60 mt-1">{item.id} Category</p>
              </div>
            </div>
            <p className="text-zinc-500 text-xs font-body-sm max-w-xs mt-2 leading-relaxed">{item.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
        <div className="space-y-3">
          <label className="block font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Select Brand</label>
          <div className="relative">
            <select 
              className="w-full bg-[#111111] border border-white/10 p-4 pr-12 text-white outline-none focus:border-[#C0392B] appearance-none"
              value={selection.brand}
              onChange={(e) => setSelection({...selection, brand: e.target.value, model: "", year: ""})}
            >
              <option value="">Choose Brand</option>
              {availableBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">expand_more</span>
          </div>
        </div>
        <div className="space-y-3">
          <label className="block font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Model Name</label>
          <div className="relative">
            <select 
              className="w-full bg-[#111111] border border-white/10 p-4 pr-12 text-white outline-none focus:border-[#C0392B] appearance-none"
              value={selection.model}
              onChange={(e) => setSelection({...selection, model: e.target.value, year: ""})}
              disabled={!selection.brand}
            >
              <option value="">Choose Model</option>
              {availableModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">expand_more</span>
          </div>
        </div>
        <div className="space-y-3">
          <label className="block font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Manufacturing Year</label>
          <div className="relative">
            <select 
              className="w-full bg-[#111111] border border-white/10 p-4 pr-12 text-white outline-none focus:border-[#C0392B] appearance-none"
              value={selection.year}
              onChange={(e) => setSelection({...selection, year: e.target.value})}
              disabled={!selection.model}
            >
              <option value="">Choose Year</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">expand_more</span>
          </div>
        </div>

        {selection.type === 'car' ? (
          <>
            <div className="space-y-3">
              <label className="block font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Engine Type</label>
              <div className="relative">
                <select 
                  className="w-full bg-[#111111] border border-white/10 p-4 pr-12 text-white outline-none focus:border-[#C0392B] appearance-none"
                  value={selection.fuelType}
                  onChange={(e) => setSelection({...selection, fuelType: e.target.value, transmission: ""})}
                  disabled={!selection.year}
                >
                  <option value="">Choose Engine</option>
                  {availableFuels.map(fuel => (
                    <option key={fuel} value={fuel}>{fuel}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">expand_more</span>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Transmission</label>
              <div className="relative">
                <select 
                  className="w-full bg-[#111111] border border-white/10 p-4 pr-12 text-white outline-none focus:border-[#C0392B] appearance-none"
                  value={selection.transmission}
                  onChange={(e) => setSelection({...selection, transmission: e.target.value})}
                  disabled={!selection.fuelType}
                >
                  <option value="">Choose Transmission</option>
                  {availableTransmissions.map(trans => (
                    <option key={trans} value={trans}>{trans}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">expand_more</span>
              </div>
            </div>
          </>
        ) : (
          <div className="md:col-span-1 flex items-end">
             <div className="bg-[#C0392B]/5 border border-[#C0392B]/20 p-4 w-full machined-edge flex items-center gap-4">
                <span className="material-symbols-outlined text-[#C0392B]">info</span>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest leading-relaxed">Engine and Transmission for bikes are automatically optimized.</p>
             </div>
          </div>
        )}
      </div>

      <button
        onClick={handleNext}
        disabled={!selection.brand || !selection.model || !selection.year || (selection.type === 'car' && (!selection.fuelType || !selection.transmission))}
        className={`w-full py-4 font-['Oswald'] font-bold uppercase tracking-[0.2em] text-sm transition-all machined-edge ${(!selection.brand || !selection.model || !selection.year || (selection.type === 'car' && (!selection.fuelType || !selection.transmission))) ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-[#C0392B] text-white hover:bg-[#a93226] hover:shadow-[0_0_30px_rgba(192,57,43,0.3)]'}`}
      >
        Continue to Goal
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom duration-500">
      <div className="flex items-center gap-4">
        <div className="w-1 h-8 bg-[#C0392B]"></div>
        <h2 className="text-3xl font-['Oswald'] font-bold uppercase text-white tracking-tight">Step 2: Define Your Goal</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { id: 'Performance', label: 'Maximum Power', desc: 'HP & Torque', icon: 'speed' },
          { id: 'Better Mileage', label: 'Eco-Efficiency', desc: 'Fuel Economy', icon: 'eco' },
          { id: 'Handling', label: 'Precision Control', desc: 'Suspension', icon: 'auto_graph' },
          { id: 'Off-Road', label: 'Tough Terrain', desc: 'Adventure', icon: 'landscape' },
          { id: 'Lighting Improvements', label: 'Night Visibility', desc: 'Safety', icon: 'highlight' }
        ].map(goal => (
          <button
            key={goal.id}
            onClick={() => setSelection({...selection, goal: goal.id})}
            className={`p-6 machined-edge flex flex-col items-start gap-4 transition-all group ${selection.goal === goal.id ? 'bg-[#C0392B]/10 border-[#C0392B]/50' : 'bg-[#111111] hover:bg-[#1A1A1A] border-white/5'}`}
          >
            <div className={`w-10 h-10 flex items-center justify-center transition-all ${selection.goal === goal.id ? 'bg-[#C0392B] text-white' : 'bg-zinc-900 text-zinc-600 group-hover:text-white'}`}>
              <span className="material-symbols-outlined text-xl">{goal.icon}</span>
            </div>
            <div className="text-left">
              <h3 className={`font-['Oswald'] text-sm font-bold uppercase tracking-widest mb-1 transition-colors ${selection.goal === goal.id ? 'text-white' : 'text-zinc-400'}`}>{goal.label}</h3>
              <p className="text-[9px] text-zinc-600 font-label-caps uppercase">{goal.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <button onClick={handleBack} className="flex-1 py-4 border border-white/10 text-white font-['Oswald'] uppercase tracking-widest text-sm hover:bg-white/5 transition-all">Back</button>
        <button 
          onClick={handleNext} 
          disabled={!selection.goal}
          className={`flex-[2] py-4 font-['Oswald'] uppercase tracking-widest text-sm transition-all ${!selection.goal ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-[#C0392B] text-white hover:bg-[#a93226]'}`}
        >
          Continue to Budget
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom duration-500">
      <div className="flex items-center gap-4">
        <div className="w-1 h-8 bg-[#C0392B]"></div>
        <h2 className="text-3xl font-['Oswald'] font-bold uppercase text-white tracking-tight">Step 3: Budget & Identity</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#111111] machined-edge p-8 space-y-8">
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <label className="font-label-caps text-zinc-600 uppercase tracking-widest text-[9px] block mb-2">Max Investment Range</label>
                <div className="flex items-center gap-2 group/input">
                  <span className="text-3xl font-['Oswald'] font-black text-[#C0392B]">₹</span>
                  <input 
                    type="text"
                    value={formatIndianCurrency(selection.budget)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value.replace(/,/g, '')) || 0;
                      setSelection({...selection, budget: val});
                    }}
                    placeholder="Enter Amount"
                    className="bg-transparent border-b border-transparent focus:border-[#C0392B] outline-none text-3xl font-['Oswald'] font-black text-white w-full max-w-[300px] transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                {selection.budget > 0 && selection.budget < 10000 && (
                  <p className="text-[9px] text-[#C0392B] uppercase font-bold mt-1">Min. ₹10,000 required</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-[9px] font-label-caps text-zinc-700 uppercase">Tuning Limit</span>
              </div>
            </div>
            
            <div className="relative pt-4">
              <input 
                type="range" 
                min="10000" 
                max="500000" 
                step="1000"
                value={selection.budget > 500000 ? 500000 : selection.budget < 10000 ? 10000 : selection.budget}
                onChange={(e) => setSelection({...selection, budget: parseInt(e.target.value)})}
                className="w-full h-1.5 bg-zinc-900 rounded-none appearance-none cursor-pointer accent-[#C0392B]"
              />
              <div className="flex justify-between mt-4 text-[9px] font-label-caps text-zinc-700 tracking-[0.2em]">
                <span>₹{formatIndianCurrency(10000)}</span>
                <span>₹{formatIndianCurrency(250000)}</span>
                <span>₹{formatIndianCurrency(500000)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#111111] machined-edge p-8 flex flex-col justify-center">
          <label className="block font-label-caps text-zinc-600 uppercase tracking-widest text-[9px] mb-4">Build Identity / Workshop Tag</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="e.g. PROJECT NIGHT-FURY"
              value={selection.driverName}
              onChange={(e) => setSelection({...selection, driverName: e.target.value})}
              className="w-full bg-[#0A0A0A] border border-white/5 p-5 text-white font-['Oswald'] uppercase tracking-widest text-sm outline-none focus:border-[#C0392B] transition-all placeholder:text-zinc-800"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#C0392B]"></div>
          </div>
          <p className="mt-4 text-zinc-700 text-[10px] font-label-caps uppercase">This will be shown on your build summary</p>
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={handleBack} className="flex-1 py-4 border border-white/10 text-white font-['Oswald'] uppercase tracking-widest text-sm hover:bg-white/5 transition-all">Back</button>
        <button 
          onClick={handleNext} 
          disabled={!selection.budget || selection.budget < 10000}
          className={`flex-[2] py-4 font-['Oswald'] uppercase tracking-widest text-sm transition-all ${(!selection.budget || selection.budget < 10000) ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-[#C0392B] text-white hover:bg-[#a93226]'}`}
        >
          Continue to Generate
        </button>
      </div>
    </div>
  );

  const renderResults = () => {
    const missingVehicle = !selectedVehicle;
    const missingGoal = !selection.goal;
    const missingBudget = selection.budget < 10000;

    if (missingVehicle || missingGoal || missingBudget) {
      return (
        <div className="text-center py-24 animate-in fade-in zoom-in duration-700 bg-[#111111] machined-edge max-w-2xl mx-auto">
          <span className="material-symbols-outlined text-6xl text-[#C0392B] mb-6">tune</span>
          <h2 className="text-2xl font-['Oswald'] text-white uppercase tracking-wider">Configuration Incomplete</h2>
          <p className="text-zinc-500 mt-4 font-body-md max-w-sm mx-auto leading-relaxed">
            Please define your {missingVehicle && <strong>Vehicle Details</strong>}
            {missingVehicle && (missingGoal || missingBudget) && " , "}
            {missingGoal && <strong>Build Goal</strong>}
            {missingGoal && missingBudget && " and "}
            {missingBudget && <strong>Budget Range</strong>} to generate your custom performance roadmap.
          </p>
          <div className="flex justify-center gap-4 mt-10">
            {missingVehicle && <button onClick={() => setStep(1)} className="px-8 py-3 border border-white/10 text-white font-['Oswald'] uppercase text-xs tracking-widest hover:bg-white/5 transition-all">Select Vehicle</button>}
            {missingGoal && <button onClick={() => setStep(2)} className="px-8 py-3 border border-white/10 text-white font-['Oswald'] uppercase text-xs tracking-widest hover:bg-white/5 transition-all">Set Goal</button>}
            {missingBudget && <button onClick={() => setStep(3)} className="px-8 py-3 bg-[#C0392B] text-white font-['Oswald'] uppercase text-xs tracking-widest hover:bg-[#a93226] transition-all">Set Budget</button>}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="w-1.5 h-16 bg-[#C0392B]"></div>
            <div>
              <h1 className="text-5xl md:text-6xl font-['Oswald'] font-black uppercase text-white tracking-tighter leading-tight">
                {selectedVehicle.make} {selectedVehicle.model}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-zinc-600 font-label-caps tracking-[0.2em] text-[10px] uppercase">Stage {performanceStats.hpIncreasePercent > 25 ? '3' : performanceStats.hpIncreasePercent > 15 ? '2' : '1'} Performance Build</span>
                <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
                <span className="text-[#C0392B] font-label-caps text-[10px] uppercase tracking-widest">{selection.goal} Config</span>
              </div>
            </div>
          </div>

          <div className="flex bg-[#111111] p-1.5 machined-edge rounded-none border border-white/5">
            <button 
              onClick={() => setMode("auto")}
              className={`px-8 py-3 font-['Oswald'] text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${mode === "auto" ? 'bg-[#C0392B] text-white shadow-[0_0_20px_rgba(192,57,43,0.3)]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Smart Auto
            </button>
            <button 
              onClick={() => setMode("manual")}
              className={`px-8 py-3 font-['Oswald'] text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${mode === "manual" ? 'bg-[#C0392B] text-white shadow-[0_0_20px_rgba(192,57,43,0.3)]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Manual Custom
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Performance Metrics */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#111111] machined-edge p-6 flex flex-col justify-between h-40">
                <p className="text-zinc-600 font-label-caps text-[9px] uppercase tracking-widest">Build Score</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-['Oswald'] font-bold text-white">{performanceStats.buildScore}</span>
                  <span className="text-zinc-700 font-['Oswald'] text-sm">/100</span>
                </div>
                <div className="h-1 bg-zinc-900 overflow-hidden">
                  <div className="h-full bg-[#C0392B] transition-all duration-1000" style={{ width: `${performanceStats.buildScore}%` }}></div>
                </div>
              </div>
              
              <div className="bg-[#111111] machined-edge p-6 flex flex-col justify-between h-40">
                <p className="text-zinc-600 font-label-caps text-[9px] uppercase tracking-widest">Power Gain</p>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-['Oswald'] font-bold text-white">{performanceStats.tunedHP}</span>
                    <span className="text-zinc-700 font-['Oswald'] text-sm">HP</span>
                  </div>
                  <span className="text-[#27AE60] text-[10px] font-bold mt-1">+{performanceStats.hpIncreasePercent}% VS STOCK</span>
                </div>
                <div className="flex justify-between text-[8px] font-label-caps text-zinc-700">
                  <span>STOCK: {performanceStats.stockHP}HP</span>
                </div>
              </div>

              <div className="bg-[#111111] machined-edge p-6 flex flex-col justify-between h-40">
                <p className="text-zinc-600 font-label-caps text-[9px] uppercase tracking-widest">Torque Gain</p>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-['Oswald'] font-bold text-white">{performanceStats.tunedTorque}</span>
                    <span className="text-zinc-700 font-['Oswald'] text-sm">NM</span>
                  </div>
                  <span className="text-[#27AE60] text-[10px] font-bold mt-1">+{performanceStats.tunedTorque - performanceStats.stockTorque}NM GAIN</span>
                </div>
                <div className="flex justify-between text-[8px] font-label-caps text-zinc-700">
                  <span>STOCK: {performanceStats.stockTorque}NM</span>
                </div>
              </div>
            </div>

            {/* Visual Performance Charts */}
            <div className="bg-[#111111] machined-edge p-8 space-y-8">
              <h4 className="text-white font-['Oswald'] font-bold uppercase text-xs tracking-widest mb-6 border-b border-white/5 pb-4">Performance Comparison</h4>
              
              {[
                { label: 'HORSEPOWER', stock: performanceStats.stockHP, tuned: performanceStats.tunedHP, color: '#C0392B', max: Math.max(performanceStats.tunedHP, performanceStats.stockHP * 1.5) },
                { label: 'TORQUE (NM)', stock: performanceStats.stockTorque, tuned: performanceStats.tunedTorque, color: '#FF6B35', max: Math.max(performanceStats.tunedTorque, performanceStats.stockTorque * 1.5) },
                { label: 'BUILD BALANCE', stock: 50, tuned: performanceStats.buildScore, color: '#27AE60', max: 100 }
              ].map((chart, i) => (
                <div key={i} className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-zinc-600 font-label-caps text-[10px] tracking-widest">{chart.label}</span>
                    <div className="flex items-center gap-4">
                       <span className="text-[9px] text-zinc-700 font-label-caps uppercase">Stock: {chart.stock}</span>
                       <span className="text-xs text-white font-['Oswald']">{chart.tuned}</span>
                    </div>
                  </div>
                  <div className="relative h-4 bg-zinc-900/50">
                    <div 
                      className="absolute top-0 left-0 h-full bg-zinc-800 transition-all duration-1000 ease-out" 
                      style={{ width: `${(chart.stock / chart.max) * 100}%` }}
                    ></div>
                    <div 
                      className="absolute top-0 left-0 h-full opacity-80 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(192,57,43,0.3)]" 
                      style={{ width: `${(chart.tuned / chart.max) * 100}%`, backgroundColor: chart.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Smart Warnings */}
            {(performanceStats.hpIncreasePercent > 20 || performanceStats.tunedHP > 200) && (
              <div className="bg-[#C0392B]/5 border border-[#C0392B]/20 p-6 flex items-start gap-4">
                <span className="material-symbols-outlined text-[#C0392B]">warning</span>
                <div>
                  <h5 className="text-white font-['Oswald'] font-bold text-xs uppercase mb-1">Safety Recommendation</h5>
                  <p className="text-zinc-500 text-[11px] leading-relaxed">
                    Significant power increase detected (+{performanceStats.hpIncreasePercent}%). 
                    We highly recommend upgrading your <strong>Braking System</strong> and <strong>Suspension</strong> to handle the increased load.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Build List / Custom Selector */}
          <div className="space-y-6">
            <div className="bg-[#111111] machined-edge p-6">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-white font-['Oswald'] font-bold uppercase text-xs tracking-widest">
                  {mode === "auto" ? "Recommended Package" : "Custom Configuration"}
                </h4>
                <span className="text-[10px] text-zinc-600 font-label-caps">{activeBuild.length} Parts</span>
              </div>

              {mode === "manual" && (
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                  {manualCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`whitespace-nowrap px-3 py-1.5 text-[9px] font-label-caps tracking-widest border transition-all ${activeCategory === cat ? 'bg-[#C0392B] border-[#C0392B] text-white' : 'border-white/5 text-zinc-500 hover:border-white/20'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-3 min-h-[300px]">
                {mode === "auto" ? (
                  activeBuild.map((part, i) => (
                    <div key={i} className="group p-4 bg-zinc-900/50 border border-white/5 hover:border-[#C0392B]/30 transition-all">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="text-[8px] text-[#C0392B] font-label-caps">{part.category}</p>
                          <h5 className="text-white font-bold text-[11px] uppercase tracking-tight">{part.name}</h5>
                        </div>
                        <p className="text-white font-['Oswald'] text-[11px]">₹{part.price.toLocaleString()}</p>
                      </div>
                      <p className="text-zinc-600 text-[9px] font-body-sm mt-1">{part.reason}</p>
                    </div>
                  ))
                ) : (
                  <div className="space-y-4">
                    {/* Manual Category Browser */}
                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {upgrades
                        .filter(u => 
                          u.category === activeCategory && 
                          u.type.toLowerCase() === selection.type.toLowerCase() &&
                          u.goals.includes(selection.goal) && // STRICT GOAL FILTER
                          (!u.compatibleVehicles?.length || u.compatibleVehicles.includes(selectedVehicle._id))
                        )
                        .map((part, i) => {
                          const isSelected = manualSelection.find(s => s._id === part._id);
                          
                          return (
                            <div 
                              key={i} 
                              onClick={() => {
                                if (isSelected) {
                                  setManualSelection(prev => prev.filter(s => s._id !== part._id));
                                } else {
                                  // Remove any other part in same category
                                  setManualSelection(prev => [...prev.filter(s => s.category !== part.category), part]);
                                }
                              }}
                              className={`p-4 border cursor-pointer transition-all ${isSelected ? 'bg-[#C0392B]/10 border-[#C0392B]/50' : 'bg-[#1d100e] border-white/5 hover:border-white/20'}`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="text-white font-bold text-[11px] uppercase">{part.name}</h5>
                                <p className="text-white font-['Oswald'] text-[11px]">₹{part.price.toLocaleString()}</p>
                              </div>
                              <div className="flex gap-4 text-[9px] font-label-caps text-zinc-600">
                                {part.performanceGainHP > 0 && <span className="text-[#27AE60]">+{part.performanceGainHP}HP</span>}
                                {part.torqueGainNM > 0 && <span className="text-[#FF6B35]">+{part.torqueGainNM}NM</span>}
                                <span>{part.stage}</span>
                              </div>
                            </div>
                          );
                        })}
                      {upgrades.filter(u => 
                        u.category === activeCategory && 
                        u.type.toLowerCase() === selection.type.toLowerCase() &&
                        u.goals.includes(selection.goal)
                      ).length === 0 && (
                        <p className="text-zinc-600 text-[10px] text-center py-8 italic uppercase tracking-widest">No compatible components found for your {selection.goal} goal</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Live Budget enforcement */}
              <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600 font-label-caps text-[9px] uppercase tracking-widest">Total Investment</span>
                  <span className={`text-xl font-['Oswald'] font-bold ${performanceStats.budgetRemaining < 0 ? 'text-[#C0392B]' : 'text-white'}`}>
                    ₹{totalCost.toLocaleString()}
                  </span>
                </div>
                
                {performanceStats.budgetRemaining < 0 && (
                  <div className="bg-[#C0392B]/10 border border-[#C0392B]/20 p-3 text-center">
                    <p className="text-[#C0392B] font-label-caps text-[10px] uppercase tracking-widest">
                      Budget Exceeded by ₹{Math.abs(performanceStats.budgetRemaining).toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={handleSaveBuild}
                    disabled={saving || (performanceStats.budgetRemaining < 0 && mode === "manual")}
                    className="py-3 bg-white text-black font-['Oswald'] font-bold uppercase text-[10px] tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Build'}
                  </button>
                  <button className="py-3 bg-[#C0392B] text-white font-['Oswald'] font-bold uppercase text-[10px] tracking-widest hover:bg-[#a93226] transition-all">
                    Get Parts
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-8">
          <button onClick={() => setStep(1)} className="text-zinc-600 hover:text-white transition-colors font-label-caps text-[10px] uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">refresh</span>
            Start New Configuration
          </button>
        </div>
      </div>
    );
  };



  return (
    <div className="min-h-screen bg-[#1d100e] text-[#f7ddd9] font-body-md overflow-x-hidden">
      {/* Navbar (Same as Landing) */}
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
            <button onClick={handleStartTuning} className="font-['Oswald'] uppercase tracking-widest text-[11px] text-white border-b-2 border-[#C0392B] pb-1 transition-colors">Recommendation</button>
            <button onClick={() => navigate("/profiles")} className="font-['Oswald'] uppercase tracking-widest text-[11px] text-zinc-400 hover:text-white transition-colors">Saved Profiles</button>
          </div>

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
                      onClick={() => navigate("/admin")}
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
            Sign In
          </button>
        )}
        </div>
      </nav>

      <main className="pt-28 pb-24 max-w-7xl mx-auto px-8 md:px-16 min-h-[60vh]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 animate-pulse">
            <div className="w-12 h-12 border-2 border-[#C0392B] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-['Oswald'] uppercase tracking-[0.2em] text-xs text-zinc-600">Initializing Engine...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-16">
               <h1 className="text-4xl md:text-6xl font-['Oswald'] font-black uppercase tracking-tighter mb-10 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-zinc-500">
                 Performance Recommendation
               </h1>
               {renderStepper()}
            </div>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderResults()}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#170b09] border-t border-white/5 py-16 px-8 md:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-[#C0392B] flex items-center justify-center rounded-sm rotate-45">
                <span className="material-symbols-outlined text-white -rotate-45 text-xs">speed</span>
              </div>
              <span className="font-['Oswald'] text-xl font-black tracking-tighter uppercase text-white">ModMyRide</span>
            </div>
            <p className="text-zinc-500 text-sm mb-6">
              The definitive tuning platform for the modern Indian motorist. Precision engineered for performance enthusiasts.
            </p>
          </div>

          <div>
            <h4 className="font-['Oswald'] uppercase tracking-widest text-xs text-white mb-6">Explore</h4>
            <ul className="space-y-4">
              <li><button onClick={() => navigate("/")} className="text-zinc-500 hover:text-[#C0392B] text-sm transition-colors text-left">About Us</button></li>
              <li><button onClick={() => navigate("/")} className="text-zinc-500 hover:text-[#C0392B] text-sm transition-colors text-left">Performance Guide</button></li>
              <li><button onClick={handleStartTuning} className="text-zinc-500 hover:text-[#C0392B] text-sm transition-colors text-left">Recommendations</button></li>
            </ul>
          </div>

          <div></div>
          <div></div>
        </div>
        <div className="pt-8 border-t border-white/5 text-center">
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-['Oswald']">
            © 2026 MODMYRIDE. Engineered for the Indian Market.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TuningPage;
