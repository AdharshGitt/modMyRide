import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUser, fetchVehicles, fetchUpgrades } from "../services/api.js";

const TuningPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [upgrades, setUpgrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [selection, setSelection] = useState({
    type: "car",
    brand: "",
    model: "",
    year: "",
    fuelType: "",
    transmission: "",
    goal: "Performance",
    budget: 50000,
    driverName: ""
  });

  useEffect(() => {
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
      } catch (err) {
        console.error("Fetch Error:", err);
        // navigate("/auth"); // Only if strictly required
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => v.type.toLowerCase() === selection.type.toLowerCase());
  }, [vehicles, selection.type]);

  const availableBrands = useMemo(() => {
    return [...new Set(filteredVehicles.map(v => v.make))].sort();
  }, [filteredVehicles]);

  const availableModels = useMemo(() => {
    return filteredVehicles
      .filter(v => v.make === selection.brand)
      .map(v => v.model)
      .sort();
  }, [filteredVehicles, selection.brand]);

  const availableYears = useMemo(() => {
    return filteredVehicles
      .filter(v => v.make === selection.brand && v.model === selection.model)
      .map(v => v.year)
      .sort((a, b) => b - a);
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

  const recommendedUpgrades = useMemo(() => {
    if (!selectedVehicle) return [];
    
    // Filter upgrades by vehicle type and goal
    return upgrades.filter(u => 
      u.type.toLowerCase() === selection.type.toLowerCase() &&
      u.goals.includes(selection.goal) &&
      (!u.compatibleFuels?.length || u.compatibleFuels.includes(selection.fuelType)) &&
      (!u.compatibleTransmissions?.length || u.compatibleTransmissions.includes(selection.transmission)) &&
      u.price <= selection.budget
    ).slice(0, 6); // Limit to 6 as per UI
  }, [upgrades, selectedVehicle, selection.type, selection.goal, selection.budget, selection.fuelType, selection.transmission]);

  const totalCost = useMemo(() => {
    return recommendedUpgrades.reduce((sum, u) => sum + u.price, 0);
  }, [recommendedUpgrades]);

  const steps = [
    { num: 1, label: "SELECT VEHICLE" },
    { num: 2, label: "GOAL" },
    { num: 3, label: "BUDGET" },
    { num: 4, label: "RESULTS" }
  ];

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const renderStepper = () => (
    <div className="flex items-center justify-center gap-12 mb-20 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md h-px bg-zinc-800 -z-10"></div>
      {steps.map((s) => (
        <div key={s.num} className="flex flex-col items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-['Oswald'] text-sm font-bold border-2 transition-all ${step === s.num ? 'bg-[#C0392B] border-[#C0392B] text-white' : step > s.num ? 'bg-zinc-800 border-zinc-800 text-zinc-500' : 'bg-[#1d100e] border-zinc-800 text-zinc-600'}`}>
            {s.num}
          </div>
          <span className={`font-['Oswald'] text-[10px] uppercase tracking-widest transition-colors ${step === s.num ? 'text-[#C0392B]' : 'text-zinc-600'}`}>{s.label}</span>
        </div>
      ))}
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
          { id: 'car', title: 'CAR', desc: 'Hatchbacks, Sedans, SUVs & Performance Coupes', icon: 'directions_car' },
          { id: 'bike', title: 'BIKE', desc: 'Street, Sport, Cruisers & Adventure Tourers', icon: 'motorcycle' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setSelection({...selection, type: item.id, brand: "", model: "", year: ""})}
            className={`relative p-12 machined-edge flex flex-col items-center gap-6 transition-all group ${selection.type === item.id ? 'border-[#C0392B]/50 bg-[#2a1c1a]/30' : 'bg-[#1A1A1A] hover:bg-[#242424]'}`}
          >
            {selection.type === item.id && (
              <span className="absolute top-4 right-4 bg-[#C0392B] text-white font-label-caps text-[8px] px-2 py-1 uppercase">Selected</span>
            )}
            <div className="w-32 h-32 bg-zinc-800 flex items-center justify-center mb-2">
               <span className="material-symbols-outlined text-5xl opacity-20">{item.icon}</span>
            </div>
            <div className="text-center">
              <h3 className="font-['Oswald'] text-2xl font-bold uppercase text-white mb-2">{item.title}</h3>
              <p className="text-zinc-500 text-xs font-body-sm max-w-[200px]">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
        <div className="space-y-3">
          <label className="block font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Select Brand</label>
          <div className="relative">
            <select 
              className="w-full bg-[#111111] border border-white/10 p-4 text-white outline-none focus:border-[#C0392B] appearance-none"
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
              className="w-full bg-[#111111] border border-white/10 p-4 text-white outline-none focus:border-[#C0392B] appearance-none"
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
              className="w-full bg-[#111111] border border-white/10 p-4 text-white outline-none focus:border-[#C0392B] appearance-none"
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
        <div className="space-y-3">
          <label className="block font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Engine Type</label>
          <div className="relative">
            <select 
              className="w-full bg-[#111111] border border-white/10 p-4 text-white outline-none focus:border-[#C0392B] appearance-none"
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
              className="w-full bg-[#111111] border border-white/10 p-4 text-white outline-none focus:border-[#C0392B] appearance-none"
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
      </div>

      <button
        onClick={handleNext}
        disabled={!selection.brand || !selection.model || !selection.year || !selection.fuelType || !selection.transmission}
        className={`w-full py-6 font-['Oswald'] font-bold uppercase tracking-[0.2em] transition-all machined-edge ${(!selection.brand || !selection.model || !selection.year || !selection.fuelType || !selection.transmission) ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-[#C0392B] text-white hover:bg-[#a93226] hover:shadow-[0_0_30px_rgba(192,57,43,0.3)]'}`}
      >
        Continue to Goals
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom duration-500">
      <div className="flex items-center gap-4">
        <div className="w-1 h-8 bg-[#C0392B]"></div>
        <h2 className="text-3xl font-['Oswald'] font-bold uppercase text-white tracking-tight">Step 2: Define Your Goal</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { id: 'Performance', label: 'Performance', icon: 'speed' },
          { id: 'Better Mileage', label: 'Better Mileage', icon: 'eco' },
          { id: 'Handling', label: 'Handling', icon: 'auto_graph' },
          { id: 'Off-Road', label: 'Off-Road', icon: 'landscape' },
          { id: 'Lighting Improvements', label: 'Lighting Improvements', icon: 'highlight' }
        ].map(goal => (
          <button
            key={goal.id}
            onClick={() => setSelection({...selection, goal: goal.id})}
            className={`p-8 machined-edge flex flex-col items-center gap-4 transition-all ${selection.goal === goal.id ? 'bg-[#2a1c1a]/30 border-[#C0392B]/50' : 'bg-[#1A1A1A] hover:bg-[#242424]'}`}
          >
            <span className={`material-symbols-outlined text-2xl ${selection.goal === goal.id ? 'text-[#C0392B]' : 'text-zinc-600'}`}>{goal.icon}</span>
            <span className={`font-['Oswald'] text-[10px] font-bold uppercase tracking-widest ${selection.goal === goal.id ? 'text-[#C0392B]' : 'text-zinc-600'}`}>{goal.label}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <button onClick={handleBack} className="flex-1 py-4 border border-white/10 text-white font-['Oswald'] uppercase tracking-widest text-sm hover:bg-white/5 transition-all">Back</button>
        <button onClick={handleNext} className="flex-[2] py-4 bg-[#C0392B] text-white font-['Oswald'] uppercase tracking-widest text-sm hover:bg-[#a93226] transition-all">Continue to Budget</button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom duration-500">
      <div className="flex items-center gap-4">
        <div className="w-1 h-8 bg-[#C0392B]"></div>
        <h2 className="text-3xl font-['Oswald'] font-bold uppercase text-white tracking-tight">Step 3: Budget & Identity</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Monthly Budget Range</label>
              <span className="text-lg font-['Oswald'] font-bold text-[#C0392B]">₹{selection.budget.toLocaleString()}</span>
            </div>
            <input 
              type="range" 
              min="15000" 
              max="200000" 
              step="5000"
              value={selection.budget}
              onChange={(e) => setSelection({...selection, budget: parseInt(e.target.value)})}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#C0392B]"
            />
            <div className="flex justify-between text-[10px] font-label-caps text-zinc-700">
              <span>15,000</span>
              <span>₹2,00,000</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Driver Name / Workshop Tag</label>
          <input 
            type="text" 
            placeholder="e.g. Project Night-Fury"
            value={selection.driverName}
            onChange={(e) => setSelection({...selection, driverName: e.target.value})}
            className="w-full bg-[#111111] border border-white/5 p-4 text-white outline-none focus:border-[#C0392B] font-body-sm italic placeholder:text-zinc-800"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={handleBack} className="flex-1 py-4 border border-white/10 text-white font-['Oswald'] uppercase tracking-widest text-sm hover:bg-white/5 transition-all">Back</button>
        <button onClick={handleNext} className="flex-[2] py-4 bg-[#C0392B] text-white font-['Oswald'] uppercase tracking-widest text-sm hover:bg-[#a93226] transition-all">Generate My Build</button>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!selectedVehicle) {
      return (
        <div className="text-center py-20 animate-in fade-in zoom-in duration-700">
          <h2 className="text-2xl font-['Oswald'] text-white uppercase">Vehicle Data Missing</h2>
          <p className="text-zinc-500 mt-4 font-body-sm">Please go back and select a valid vehicle configuration.</p>
          <button onClick={() => setStep(1)} className="mt-8 px-8 py-3 bg-[#C0392B] text-white font-['Oswald'] uppercase text-xs tracking-widest hover:bg-[#a93226] transition-all">Go Back</button>
        </div>
      );
    }

    return (
      <>
        <div className="bg-[#111111] machined-edge p-8 md:p-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <h1 className="text-5xl md:text-6xl font-['Oswald'] font-black uppercase text-white tracking-tighter leading-tight">{selectedVehicle.make} {selectedVehicle.model}</h1>
              <p className="text-zinc-600 font-label-caps tracking-[0.2em] text-xs mt-2">PROPOSED STAGE 2 BUILD</p>
            </div>
            <div className="bg-[#C0392B]/10 border border-[#C0392B]/30 px-6 py-2">
               <span className="text-[#C0392B] font-['Oswald'] font-bold text-xs uppercase tracking-widest">Goal: {selection.goal}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-10">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-[#1d100e] border border-white/5 p-8">
                  <p className="text-zinc-600 font-label-caps text-[10px] uppercase tracking-widest mb-4">Stock Power</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-['Oswald'] font-bold text-white">{selectedVehicle.stockPower || 117}</span>
                    <span className="text-zinc-700 font-['Oswald'] text-sm">HP</span>
                  </div>
                </div>
                <div className="bg-[#1d100e] border border-[#C0392B]/20 p-8">
                  <p className="text-[#C0392B] font-label-caps text-[10px] uppercase tracking-widest mb-4">Modded Power</p>
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-['Oswald'] font-bold text-white">
                        {Math.round((selectedVehicle.stockPower || 117) * 1.26)}
                      </span>
                      <span className="text-zinc-700 font-['Oswald'] text-sm">HP</span>
                    </div>
                    <span className="text-[#27AE60] text-[10px] font-bold mt-1">+26% GAIN</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {[
                  { label: 'POWER DELIVERY (HP)', before: selectedVehicle.stockPower || '117', after: Math.round((selectedVehicle.stockPower || 117) * 1.26), percent: 75, color: '#C0392B' },
                  { label: 'TORQUE RESPONSE (NM)', before: '300', after: '385', percent: 65, color: '#FF6B35' },
                  { label: 'FUEL EFFICIENCY (KMPL)', before: '15.2', after: '14.8', percent: 40, color: '#444' }
                ].map((stat, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-zinc-600 font-label-caps text-[10px] tracking-widest">{stat.label}</span>
                      <span className="text-white font-['Oswald'] text-xs">{stat.before} ➜ <span className={i === 2 ? 'text-zinc-400' : 'text-[#C0392B]'}>{stat.after}</span></span>
                    </div>
                    <div className="h-1.5 bg-zinc-900 w-full">
                      <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${stat.percent}%`, backgroundColor: stat.color }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-zinc-500 font-label-caps text-[10px] uppercase tracking-widest mb-4">Recommended Upgrades ({recommendedUpgrades.length})</h3>
              <div className="space-y-2">
                {recommendedUpgrades.length > 0 ? recommendedUpgrades.map((part, i) => (
                  <div key={i} className="flex justify-between items-center p-5 bg-[#1d100e] machined-edge group hover:border-[#C0392B]/30 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-zinc-700 text-lg group-hover:text-[#C0392B] transition-colors">settings</span>
                      <h4 className="text-white font-bold uppercase tracking-wide text-xs">{part.name}</h4>
                    </div>
                    <span className="text-[#C0392B] font-['Oswald'] text-xs">₹{part.price.toLocaleString()}</span>
                  </div>
                )) : (
                  <p className="text-zinc-700 text-xs italic p-4">No upgrades found for this budget and goal.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-16 bg-gradient-to-r from-[#C0392B] to-[#FF6B35] p-1 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden">
            <div className="px-8 py-6">
              <p className="text-white/60 font-label-caps text-[10px] uppercase tracking-widest mb-1">Estimated Total Project Cost</p>
              <h2 className="text-white font-['Oswald'] text-4xl font-bold uppercase">₹{totalCost.toLocaleString()}</h2>
            </div>
            <div className="flex gap-4 px-8 pb-6 sm:pb-0">
              <button className="px-8 py-3 bg-white text-[#1d100e] font-['Oswald'] font-bold uppercase text-xs tracking-widest hover:bg-white/90 transition-all">Save Build</button>
              <button className="px-8 py-3 bg-[#1d100e] text-white font-['Oswald'] font-bold uppercase text-xs tracking-widest hover:bg-black transition-all">Connect to Tuner</button>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-8">
          <button onClick={() => setStep(1)} className="text-zinc-600 hover:text-white transition-colors font-label-caps text-[10px] uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">refresh</span>
            Start New Calculation
          </button>
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1d100e] flex items-center justify-center">
        <div className="spinner"></div>
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
          <button onClick={() => navigate("/")} className="font-['Oswald'] uppercase tracking-widest text-[10px] text-zinc-400 hover:text-white transition-colors">Home</button>
          <button className="font-['Oswald'] uppercase tracking-widest text-[10px] text-[#C0392B] transition-colors border-b-2 border-[#C0392B] pb-1">Recommend</button>
          <button className="font-['Oswald'] uppercase tracking-widest text-[10px] text-zinc-400 hover:text-white transition-colors">Saved Profiles</button>
        </div>

        <div className="flex items-center gap-6">
           <button onClick={() => navigate("/auth")} className="font-['Oswald'] uppercase tracking-widest text-[10px] text-zinc-400 hover:text-white transition-colors">Login</button>
           <button onClick={() => navigate("/auth")} className="bg-[#C0392B] text-white px-5 py-2 font-['Oswald'] uppercase tracking-widest text-[10px] hover:bg-[#a93226] transition-all">Register</button>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-8 md:px-16 max-w-7xl mx-auto">
        <div className="text-center mb-16">
           <h1 className="text-5xl md:text-6xl font-['Oswald'] font-black uppercase text-white tracking-tighter mb-12">Performance Recommendation</h1>
           {renderStepper()}
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderResults()}
      </main>

      {/* Footer */}
      <footer className="bg-[#170b09] border-t border-white/5 py-20 px-8 md:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          <div>
            <h2 className="font-['Oswald'] text-xl font-black tracking-tighter uppercase text-white mb-6">ModMyRide</h2>
            <p className="text-zinc-600 text-[10px] leading-relaxed mb-8">
              © 2024 MODMYRIDE. Engineered for the Indian Market. Precision tuning and performance optimization for enthusiasts.
            </p>
          </div>
          <div>
             <h4 className="font-['Oswald'] uppercase tracking-widest text-[10px] text-white mb-8">Platform</h4>
             <ul className="space-y-4">
                <li><button className="text-zinc-600 hover:text-[#C0392B] text-[10px] uppercase font-bold transition-colors">About Us</button></li>
                <li><button className="text-zinc-600 hover:text-[#C0392B] text-[10px] uppercase font-bold transition-colors">Performance Guide</button></li>
             </ul>
          </div>
          <div>
             <h4 className="font-['Oswald'] uppercase tracking-widest text-[10px] text-white mb-8">Legal</h4>
             <ul className="space-y-4">
                <li><button className="text-zinc-600 hover:text-[#C0392B] text-[10px] uppercase font-bold transition-colors">Privacy</button></li>
                <li><button className="text-zinc-600 hover:text-[#C0392B] text-[10px] uppercase font-bold transition-colors">Terms</button></li>
             </ul>
          </div>
          <div>
             <h4 className="font-['Oswald'] uppercase tracking-widest text-[10px] text-white mb-8">Newsletter</h4>
             <div className="flex">
                <input type="email" placeholder="Your email" className="bg-[#111111] border border-white/5 px-4 py-3 text-white text-[10px] w-full outline-none focus:border-[#C0392B]" />
                <button className="bg-[#C0392B] text-white px-4 py-3 font-['Oswald'] font-bold text-[10px] uppercase">Join</button>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TuningPage;
