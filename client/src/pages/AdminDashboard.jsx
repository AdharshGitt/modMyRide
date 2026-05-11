import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Tabs from "../components/Tabs.jsx";
import Pagination from "../components/Pagination.jsx";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Label
} from 'recharts';
import { 
  fetchAdminUsers, 
  fetchAdminStats, 
  fetchCurrentUser, 
  setAuthToken, 
  deleteAdminUser,
  updateAdminUser,
  fetchAdminVehicles,
  createAdminVehicle,
  updateAdminVehicle,
  deleteAdminVehicle,
  fetchAdminUpgrades,
  createAdminUpgrade,
  updateAdminUpgrade,
  deleteAdminUpgrade
} from "../services/api.js";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [overviewActiveTab, setOverviewActiveTab] = useState("users");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("modmyride_theme") || "dark");
  const [adminProfile, setAdminProfile] = useState({ email: "", username: "", role: "" });
  const [growthTimeframe, setGrowthTimeframe] = useState("6m");
  const [partsTimeframe, setPartsTimeframe] = useState("month");
  const isLight = theme === "light";
  const chartTextColor = isLight ? "#475569" : "#94a3b8";
  const chartGridColor = isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)";
  const cardBg = isLight ? "bg-white" : "bg-[#1A1A1A]";
  const tableHeaderBg = isLight ? "bg-[#f8fafc]" : "bg-[#111111]";
  const [userPage, setUserPage] = useState(1);
  const [vehicleTab, setVehicleTab] = useState("cars");
  const [carPage, setCarPage] = useState(1);
  const [bikePage, setBikePage] = useState(1);
  const [upgradeTab, setUpgradeTab] = useState("carUpgrades");
  const [carUpgradePage, setCarUpgradePage] = useState(1);
  const [bikeUpgradePage, setBikeUpgradePage] = useState(1);
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    adminUsers: 0, 
    regularUsers: 0,
    vehicleDistribution: { cars: 0, bikes: 0 },
    partsActivity: [],
    activeUsersToday: 0,
    userGrowth: []
  });
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [upgrades, setUpgrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({ _id: "", email: "", role: "user" });
  const [isEditingUser, setIsEditingUser] = useState(false);

  // Vehicle Modal State
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState({ type: "car", make: "", model: "", year: "", engine: "", fuelType: "Petrol", transmission: "Manual", stockPower: "", imageUrl: "" });
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);

  // Upgrade Modal State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [currentUpgrade, setCurrentUpgrade] = useState({ name: "", type: "car", category: "Engine", price: "", performanceGain: "", imageUrl: "", compatibleVehicles: [], compatibleFuels: [], compatibleTransmissions: [], goals: [], stage: "Universal" });
  const [isEditingUpgrade, setIsEditingUpgrade] = useState(false);

  const handleLogout = () => {
    setAuthToken(null);
    navigate("/");
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteAdminUser(userId);
      setUsers(users.filter((u) => u._id !== userId));
      setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1, regularUsers: prev.regularUsers - 1 }));
    } catch (err) {
      alert("Failed to delete user. They may be an admin.");
    }
  };

  // --- User Handlers ---
  const handleOpenUserModal = (user = null) => {
    if (user) {
      setCurrentUser({ _id: user._id, email: user.email, role: user.role });
      setIsEditingUser(true);
    } else {
      setCurrentUser({ _id: "", email: "", role: "user" });
      setIsEditingUser(false);
    }
    setIsUserModalOpen(true);
  };

  const handleCloseUserModal = () => setIsUserModalOpen(false);

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditingUser && currentUser._id) {
        const updated = await updateAdminUser(currentUser._id, currentUser);
        setUsers(users.map(u => u._id === currentUser._id ? updated.user : u));
      }
      handleCloseUserModal();
    } catch (err) {
      alert("Failed to save user: " + (err.response?.data?.message || err.message));
    }
  };

  // --- Vehicle Handlers ---
  const handleOpenVehicleModal = (vehicle = null) => {
    if (vehicle) {
      setCurrentVehicle(vehicle);
      setIsEditingVehicle(true);
    } else {
      setCurrentVehicle({ type: "car", make: "", model: "", year: "", engine: "", fuelType: "Petrol", transmission: "Manual", stockPower: "", imageUrl: "" });
      setIsEditingVehicle(false);
    }
    setIsVehicleModalOpen(true);
  };

  const handleCloseVehicleModal = () => setIsVehicleModalOpen(false);

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditingVehicle) {
        const updated = await updateAdminVehicle(currentVehicle._id, currentVehicle);
        setVehicles(vehicles.map(v => v._id === updated.vehicle._id ? updated.vehicle : v));
      } else {
        const created = await createAdminVehicle(currentVehicle);
        setVehicles([created.vehicle, ...vehicles]);
      }
      handleCloseVehicleModal();
    } catch (err) {
      alert("Failed to save vehicle: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?")) return;
    try {
      await deleteAdminVehicle(id);
      setVehicles(vehicles.filter((v) => v._id !== id));
    } catch (err) {
      alert("Failed to delete vehicle.");
    }
  };

  // --- Upgrade Handlers ---
  const handleOpenUpgradeModal = (upgrade = null) => {
    if (upgrade) {
      setCurrentUpgrade({
        ...upgrade,
        compatibleVehicles: upgrade.compatibleVehicles.map(v => v._id || v)
      });
      setIsEditingUpgrade(true);
    } else {
      setCurrentUpgrade({ name: "", type: "car", category: "Engine", price: "", performanceGain: "", imageUrl: "", compatibleVehicles: [], compatibleFuels: [], compatibleTransmissions: [], goals: [], stage: "Universal" });
      setIsEditingUpgrade(false);
    }
    setIsUpgradeModalOpen(true);
  };

  const handleCloseUpgradeModal = () => setIsUpgradeModalOpen(false);

  const handleUpgradeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditingUpgrade) {
        const updated = await updateAdminUpgrade(currentUpgrade._id, currentUpgrade);
        setUpgrades(upgrades.map(u => u._id === updated.upgrade._id ? updated.upgrade : u));
      } else {
        const created = await createAdminUpgrade(currentUpgrade);
        setUpgrades([created.upgrade, ...upgrades]);
      }
      handleCloseUpgradeModal();
    } catch (err) {
      alert("Failed to save upgrade: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteUpgrade = async (id) => {
    if (!window.confirm("Are you sure you want to delete this upgrade?")) return;
    try {
      await deleteAdminUpgrade(id);
      setUpgrades(upgrades.filter((u) => u._id !== id));
    } catch (err) {
      alert("Failed to delete upgrade.");
    }
  };

  const handleUpgradeVehicleSelection = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setCurrentUpgrade({...currentUpgrade, compatibleVehicles: selectedOptions});
  };

  const handleUpgradeGoalSelection = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setCurrentUpgrade({...currentUpgrade, goals: selectedOptions});
  };

  const handleUpgradeFuelSelection = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setCurrentUpgrade({...currentUpgrade, compatibleFuels: selectedOptions});
  };

  const handleUpgradeTransmissionSelection = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setCurrentUpgrade({...currentUpgrade, compatibleTransmissions: selectedOptions});
  };

  useEffect(() => {
    localStorage.setItem("modmyride_theme", theme);
    if (theme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  }, [theme]);

  useEffect(() => {
    const init = async () => {
      try {
        const { user } = await fetchCurrentUser();
        if (user.role !== "admin") {
          navigate("/");
          return;
        }

        const [usersData, statsData, vehiclesData, upgradesData] = await Promise.all([
          fetchAdminUsers(),
          fetchAdminStats(),
          fetchAdminVehicles(),
          fetchAdminUpgrades()
        ]);
        
        setUsers(usersData.users);
        setStats(statsData);
        setVehicles(vehiclesData.vehicles);
        setUpgrades(upgradesData.upgrades);
        setAdminProfile(user);
      } catch (err) {
        setError("Access denied or failed to load data.");
        setTimeout(() => navigate("/"), 2000);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-near-black text-white font-['Oswald'] tracking-widest">
        <p>INITIALIZING SYSTEM...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-near-black text-[#C0392B] font-['Oswald'] tracking-widest">
        <p>{error}</p>
      </div>
    );
  }

  const renderVehicleTable = (vehicleList, title) => (
    <div className="bg-[#1A1A1A] machined-edge rounded-none overflow-hidden mb-8">
      <div className="p-6 border-b border-white/5">
        <h3 className="font-h3 text-white uppercase tracking-wider">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left font-body-sm">
          <thead className="bg-[#111111] border-b border-white/5">
            <tr>
              <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Make</th>
              <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Model</th>
              <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Year</th>
              <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Trim</th>
              <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Engine</th>
              <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Stock Pwr</th>
              <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {vehicleList.length === 0 ? (
              <tr className="bg-[#111111]">
                <td colSpan="7" className="px-6 py-8 text-center text-zinc-500 font-label-caps uppercase tracking-widest">No {title.toLowerCase()} found.</td>
              </tr>
            ) : (
              vehicleList.map((vehicle) => (
                <tr key={vehicle._id} className="bg-[#111111] hover:bg-[#242424] transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{vehicle.make}</td>
                  <td className="px-6 py-4 text-zinc-400">{vehicle.model}</td>
                  <td className="px-6 py-4 text-white">{vehicle.year}</td>
                  <td className="px-6 py-4 text-zinc-400">{vehicle.trim || "-"}</td>
                  <td className="px-6 py-4 text-white">{vehicle.engine || "-"}</td>
                  <td className="px-6 py-4 text-white font-mono text-xs">{vehicle.stockPower ? `${vehicle.stockPower} HP` : "-"}</td>
                  <td className="px-6 py-4 flex gap-3">
                    <button className="text-orange-500 hover:underline font-label-caps text-[10px] uppercase" onClick={() => handleOpenVehicleModal(vehicle)}>Edit</button>
                    <button className="text-[#C0392B] hover:underline font-label-caps text-[10px] uppercase" onClick={() => handleDeleteVehicle(vehicle._id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUpgradeTable = (upgradeList, title) => (
    <div className="bg-[#1A1A1A] machined-edge rounded-none overflow-hidden mb-8">
      <div className="p-6 border-b border-white/5">
        <h3 className="font-h3 text-white uppercase tracking-wider">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left font-body-sm">
          <thead className="bg-[#111111] border-b border-white/5">
            <tr>
              <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Name</th>
              <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Category</th>
              <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Price</th>
              <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Gain</th>
              <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Compatibility</th>
              <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Stage</th>
              <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Goals</th>
              <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {upgradeList.length === 0 ? (
              <tr className="bg-[#111111]">
                <td colSpan="8" className="px-6 py-8 text-center text-zinc-500 font-label-caps uppercase tracking-widest">No {title.toLowerCase()} found.</td>
              </tr>
            ) : (
              upgradeList.map((upgrade) => (
                <tr key={upgrade._id} className="bg-[#111111] hover:bg-[#242424] transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{upgrade.name}</td>
                  <td className="px-6 py-4 text-zinc-400">{upgrade.category}</td>
                  <td className="px-6 py-4 text-white">INR {upgrade.price}</td>
                  <td className="px-6 py-4 text-green-500">{upgrade.performanceGain || "-"}</td>
                  <td className="px-6 py-4 text-zinc-400">{upgrade.compatibleVehicles.length} vehicle(s)</td>
                  <td className="px-6 py-4 text-white font-label-caps text-[10px] uppercase">{upgrade.stage || "-"}</td>
                  <td className="px-6 py-4 text-zinc-400 text-xs">{upgrade.goals?.join(", ") || "-"}</td>
                  <td className="px-6 py-4 flex gap-3">
                    <button className="text-orange-500 hover:underline font-label-caps text-[10px] uppercase" onClick={() => handleOpenUpgradeModal(upgrade)}>Edit</button>
                    <button className="text-[#C0392B] hover:underline font-label-caps text-[10px] uppercase" onClick={() => handleDeleteUpgrade(upgrade._id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Filter vehicles by the currently selected upgrade type for the modal
  const compatibleVehiclesOptions = vehicles.filter(v => v.type === currentUpgrade.type);

  return (
    <div className="flex h-screen w-full bg-near-black text-on-surface font-body-md overflow-hidden">
      {/* SideNavBar */}
      <aside className="bg-[#1A1A1A] w-64 border-r border-white/5 shadow-[4px_0_0_0_#000000] flex flex-col h-full p-4 gap-2 shrink-0">
        <div className="mb-8 px-3">
          <div className="text-xl font-black text-white font-['Oswald'] uppercase tracking-tight">ADMIN DASHBOARD</div>
        </div>
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-['Oswald'] uppercase font-medium tracking-tight ${activeTab === "overview" ? "bg-[#C0392B] text-white shadow-lg" : "text-zinc-400 hover:text-[#C0392B] hover:bg-[#242424]"}`}
          >
            <span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-['Oswald'] uppercase font-medium tracking-tight ${activeTab === "users" ? "bg-[#C0392B] text-white shadow-lg" : "text-zinc-400 hover:text-[#C0392B] hover:bg-[#242424]"}`}
          >
            <span className="material-symbols-outlined" data-icon="people">people</span>
            <span>User Management</span>
          </button>
          <button 
            onClick={() => setActiveTab("vehicles")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-['Oswald'] uppercase font-medium tracking-tight ${activeTab === "vehicles" ? "bg-[#C0392B] text-white shadow-lg" : "text-zinc-400 hover:text-[#C0392B] hover:bg-[#242424]"}`}
          >
            <span className="material-symbols-outlined" data-icon="directions_car">directions_car</span>
            <span>Vehicles</span>
          </button>
          <button 
            onClick={() => setActiveTab("upgrades")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-['Oswald'] uppercase font-medium tracking-tight ${activeTab === "upgrades" ? "bg-[#C0392B] text-white shadow-lg" : "text-zinc-400 hover:text-[#C0392B] hover:bg-[#242424]"}`}
          >
            <span className="material-symbols-outlined" data-icon="manufacturing">manufacturing</span>
            <span>Parts Catalog</span>
          </button>
        </nav>
        <div className="mt-auto border-t border-white/5 pt-4">
          <button onClick={handleLogout} className="w-full text-zinc-400 hover:text-[#C0392B] hover:bg-[#242424] flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-['Oswald'] uppercase font-medium tracking-tight">
            <span className="material-symbols-outlined" data-icon="logout">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* TopAppBar */}
        <header className="bg-[#0A0A0A] border-b border-white/10 flex justify-between items-center w-full px-6 h-16 shrink-0">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-[#C0392B] font-['Oswald'] uppercase tracking-tighter">MODMYRIDE</h1>
          </div>
          <div className="flex items-center gap-4 relative">
            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="h-9 w-9 rounded-full bg-zinc-800 machined-edge flex items-center justify-center overflow-hidden hover:border-[#C0392B] transition-all group"
            >
              <span className="material-symbols-outlined text-zinc-500 group-hover:text-white text-base">person</span>
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 top-12 w-64 bg-[#1A1A1A] machined-edge shadow-2xl z-50 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="border-b border-white/5 pb-4">
                  <p className="font-['Oswald'] text-white uppercase text-xs tracking-widest mb-1">{adminProfile.username || 'Admin User'}</p>
                  <p className="text-zinc-500 text-[10px] truncate">{adminProfile.email}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <span className="material-symbols-outlined text-sm">{theme === 'dark' ? 'dark_mode' : 'light_mode'}</span>
                      <span className="text-[11px] uppercase font-label-caps tracking-wider">Appearance</span>
                    </div>
                    <button 
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="w-10 h-5 rounded-full bg-zinc-800 relative p-1 transition-colors"
                    >
                      <div className={`h-3 w-3 rounded-full bg-[#C0392B] transition-all duration-300 ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </button>
                  </div>
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
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {activeTab === "overview" && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
                <div className="bg-[#1A1A1A] machined-edge p-6 rounded-none relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-label-caps text-zinc-500 uppercase text-[10px] tracking-widest">Total Users</p>
                    <span className="material-symbols-outlined text-[#C0392B] text-lg opacity-50">groups</span>
                  </div>
                  <h2 className="font-h1 text-4xl text-white">{stats.totalUsers}</h2>
                  <p className="text-zinc-600 text-[9px] mt-1 uppercase font-label-caps tracking-tighter">All registered users</p>
                </div>
                <div className="bg-[#1A1A1A] machined-edge p-6 rounded-none relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-label-caps text-zinc-500 uppercase text-[10px] tracking-widest">Regular Users</p>
                    <span className="material-symbols-outlined text-[#C0392B] text-lg opacity-50">person</span>
                  </div>
                  <h2 className="font-h1 text-4xl text-white">{stats.regularUsers}</h2>
                  <p className="text-zinc-600 text-[9px] mt-1 uppercase font-label-caps tracking-tighter">Non-admin users</p>
                </div>
                <div className="bg-[#1A1A1A] machined-edge p-6 rounded-none relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-label-caps text-zinc-500 uppercase text-[10px] tracking-widest">Admins</p>
                    <span className="material-symbols-outlined text-[#C0392B] text-lg opacity-50">security</span>
                  </div>
                  <h2 className="font-h1 text-4xl text-white">{stats.adminUsers}</h2>
                  <p className="text-zinc-600 text-[9px] mt-1 uppercase font-label-caps tracking-tighter">Total admin accounts</p>
                </div>
                <div className="bg-[#1A1A1A] machined-edge p-6 rounded-none relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-label-caps text-zinc-500 uppercase text-[10px] tracking-widest">Cars</p>
                    <span className="material-symbols-outlined text-[#C0392B] text-lg opacity-50">directions_car</span>
                  </div>
                  <h2 className="font-h1 text-4xl text-white">{stats.vehicleDistribution.cars}</h2>
                  <p className="text-zinc-600 text-[9px] mt-1 uppercase font-label-caps tracking-tighter">Total cars listed</p>
                </div>
                <div className="bg-[#1A1A1A] machined-edge p-6 rounded-none relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-label-caps text-zinc-500 uppercase text-[10px] tracking-widest">Bikes</p>
                    <span className="material-symbols-outlined text-[#C0392B] text-lg opacity-50">motorcycle</span>
                  </div>
                  <h2 className="font-h1 text-4xl text-white">{stats.vehicleDistribution.bikes}</h2>
                  <p className="text-zinc-600 text-[9px] mt-1 uppercase font-label-caps tracking-tighter">Total bikes listed</p>
                </div>
                <div className="bg-[#1A1A1A] machined-edge p-6 rounded-none relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-label-caps text-zinc-500 uppercase text-[10px] tracking-widest">Total Parts</p>
                    <span className="material-symbols-outlined text-[#C0392B] text-lg opacity-50">settings</span>
                  </div>
                  <h2 className="font-h1 text-4xl text-white">{upgrades.length}</h2>
                  <p className="text-zinc-600 text-[9px] mt-1 uppercase font-label-caps tracking-tighter">Total parts available</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* User Growth Chart */}
                    <div className="bg-[#1A1A1A] machined-edge p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="font-h3 text-white uppercase tracking-wider text-sm">User Growth <span className="text-[10px] text-zinc-500 font-normal ml-2">(New users over time)</span></h3>
                        <div className="relative flex items-center group">
                          <select 
                            value={growthTimeframe}
                            onChange={(e) => setGrowthTimeframe(e.target.value)}
                            className="appearance-none bg-zinc-900 border border-white/5 text-zinc-400 text-[10px] pl-3 pr-8 py-1.5 rounded-none outline-none font-label-caps cursor-pointer hover:border-[#C0392B]/50 transition-all"
                            style={{ 
                              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='${isLight ? '%23475569' : '%23666'}'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 0.5rem center',
                              backgroundSize: '1em'
                            }}
                          >
                            <option value="6m">Last 6 Months</option>
                            <option value="12m">Last 12 Months</option>
                            <option value="all">All Time</option>
                          </select>
                        </div>
                      </div>
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={stats.userGrowth}>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                            <XAxis 
                              dataKey="month" 
                              stroke={chartTextColor} 
                              fontSize={10} 
                              tickLine={false} 
                              axisLine={false}
                              dy={10}
                            />
                            <YAxis 
                              stroke={chartTextColor} 
                              fontSize={10} 
                              tickLine={false} 
                              axisLine={false}
                              dx={-10}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: isLight ? '#fff' : '#111', border: `1px solid ${isLight ? '#e2e8f0' : '#333'}`, fontSize: '12px', color: isLight ? '#0f172a' : '#fff' }}
                              itemStyle={{ color: '#C0392B' }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="count" 
                              name="Users Joined"
                              stroke="#C0392B" 
                              strokeWidth={3} 
                              dot={{ r: 4, fill: '#C0392B', strokeWidth: 0 }}
                              activeDot={{ r: 6, fill: '#fff', stroke: '#C0392B', strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Vehicle Distribution Chart */}
                    <div className="bg-[#1A1A1A] machined-edge p-6">
                      <h3 className="font-h3 text-white uppercase tracking-wider text-sm mb-6">Vehicles</h3>
                      <div className="h-[250px] w-full flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Cars', value: stats.vehicleDistribution.cars },
                                { name: 'Bikes', value: stats.vehicleDistribution.bikes }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={75}
                              outerRadius={90}
                              paddingAngle={4}
                              dataKey="value"
                              stroke="none"
                              cornerRadius={4}
                            >
                              <Cell fill="#C0392B" />
                              <Cell fill="#27272a" />
                              <Label 
                                content={({ viewBox }) => {
                                  const { cx, cy } = viewBox;
                                  return (
                                    <g>
                                      <text x={cx} y={cy - 10} textAnchor="middle">
                                        <tspan 
                                          x={cx} 
                                          dy="-2" 
                                          fill={isLight ? "#0f172a" : "#fff"} 
                                          fontSize="38" 
                                          fontWeight="bold" 
                                          style={{ fontFamily: 'Oswald' }}
                                        >
                                          {stats.vehicleDistribution.cars + stats.vehicleDistribution.bikes}
                                        </tspan>
                                        <tspan 
                                          x={cx} 
                                          dy="22" 
                                          fill="#71717a" 
                                          fontSize="9" 
                                          fontWeight="600" 
                                          style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                        >
                                          ACTIVE UNITS
                                        </tspan>
                                      </text>
                                    </g>
                                  );
                                }}
                              />
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: isLight ? '#fff' : '#111', border: `1px solid ${isLight ? '#e2e8f0' : '#333'}`, fontSize: '12px', color: isLight ? '#0f172a' : '#fff' }}
                            />
                            <Legend 
                              verticalAlign="bottom" 
                              align="center" 
                              iconType="circle"
                              wrapperStyle={{ paddingTop: '20px' }}
                              formatter={(value) => (
                                <span className="text-zinc-500 text-[11px] uppercase font-label-caps tracking-wider ml-1">
                                  {value}
                                </span>
                              )}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Parts Catalog Activity Chart */}
                    <div className="bg-[#1A1A1A] machined-edge p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="font-h3 text-white uppercase tracking-wider text-sm">Parts Category</h3>
                        <div className="relative flex items-center group">
                          <select 
                            value={partsTimeframe}
                            onChange={(e) => setPartsTimeframe(e.target.value)}
                            className="appearance-none bg-zinc-900 border border-white/5 text-zinc-400 text-[10px] pl-3 pr-8 py-1.5 rounded-none outline-none font-label-caps cursor-pointer hover:border-[#C0392B]/50 transition-all"
                            style={{ 
                              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='${isLight ? '%23475569' : '%23666'}'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 0.5rem center',
                              backgroundSize: '1em'
                            }}
                          >
                            <option value="month">This Month</option>
                            <option value="quarter">This Quarter</option>
                            <option value="year">This Year</option>
                          </select>
                        </div>
                      </div>
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.partsActivity}>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                            <XAxis 
                              dataKey="category" 
                              stroke={chartTextColor} 
                              fontSize={8} 
                              tickLine={false} 
                              axisLine={false}
                              interval={0}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis 
                              stroke={chartTextColor} 
                              fontSize={10} 
                              tickLine={false} 
                              axisLine={false}
                              dx={-10}
                            />
                            <Tooltip 
                              cursor={{ fill: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.05)' }}
                              contentStyle={{ backgroundColor: isLight ? '#fff' : '#111', border: `1px solid ${isLight ? '#e2e8f0' : '#333'}`, fontSize: '12px', color: isLight ? '#0f172a' : '#fff' }}
                            />
                            <Bar 
                              dataKey="count" 
                              name="Parts Added"
                              fill="#C0392B" 
                              radius={[4, 4, 0, 0]}
                              barSize={30}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>
                </div>

              {/* Overview Tabs */}
              <div className="mt-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="h-px w-8 bg-[#C0392B]"></span>
                  <h2 className="font-h3 text-white uppercase tracking-widest text-xs">Recent Activity</h2>
                </div>
                <Tabs
                  tabs={[
                    { id: "users", label: "Users" },
                    { id: "vehicles", label: "Vehicles" },
                    { id: "parts", label: "Parts" }
                  ]}
                  activeTab={overviewActiveTab}
                  setActiveTab={setOverviewActiveTab}
                />
              </div>

              {/* Tab Content */}
              {overviewActiveTab === "users" && (
                <div className="bg-[#1A1A1A] machined-edge rounded-none overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-body-sm">
                      <thead className="bg-[#111111] border-b border-white/5">
                        <tr>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">ID</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Email</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Role</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {users.slice(0, 5).map((user) => (
                          <tr key={user._id} className="bg-[#111111] hover:bg-[#242424] transition-colors">
                            <td className="px-6 py-4 text-[#C0392B] font-mono">{user._id.slice(-6)}</td>
                            <td className="px-6 py-4 text-white font-medium">{user.email}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-label-caps uppercase ${user.role === 'admin' ? 'bg-[#C0392B]/10 text-[#C0392B]' : 'bg-zinc-800 text-zinc-400'}`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-zinc-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {overviewActiveTab === "vehicles" && (
                <div className="bg-[#1A1A1A] machined-edge rounded-none overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-body-sm">
                      <thead className="bg-[#111111] border-b border-white/5">
                        <tr>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Make</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Model</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Year</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Type</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Power</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {vehicles.slice(0, 5).map((vehicle) => (
                          <tr key={vehicle._id} className="bg-[#111111] hover:bg-[#242424] transition-colors">
                            <td className="px-6 py-4 text-white font-medium">{vehicle.make}</td>
                            <td className="px-6 py-4 text-zinc-400">{vehicle.model}</td>
                            <td className="px-6 py-4 text-white">{vehicle.year}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-label-caps uppercase ${vehicle.type === 'car' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                                {vehicle.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-white font-mono text-xs">{vehicle.stockPower ? `${vehicle.stockPower} HP` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {overviewActiveTab === "parts" && (
                <div className="bg-[#1A1A1A] machined-edge rounded-none overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-body-sm">
                      <thead className="bg-[#111111] border-b border-white/5">
                        <tr>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Name</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Category</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Price</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Type</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Gain</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {upgrades.slice(0, 5).map((upgrade) => (
                          <tr key={upgrade._id} className="bg-[#111111] hover:bg-[#242424] transition-colors">
                            <td className="px-6 py-4 text-white font-medium">{upgrade.name}</td>
                            <td className="px-6 py-4 text-zinc-400">{upgrade.category}</td>
                            <td className="px-6 py-4 text-white">INR {upgrade.price}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-label-caps uppercase ${upgrade.type === 'car' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                                {upgrade.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-green-500">{upgrade.performanceGain || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "users" && (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="font-h2 text-white uppercase tracking-wider">User Management</h1>
                  <p className="text-zinc-400 text-sm">Manage user accounts and permissions.</p>
                </div>
              </div>
              <div className="bg-[#1A1A1A] machined-edge rounded-none overflow-hidden">
                <div className="p-6 border-b border-white/5">
                  <h3 className="font-h3 text-white uppercase tracking-wider">All Users</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-body-sm">
                    <thead className="bg-[#111111] border-b border-white/5">
                      <tr>
                        <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">ID</th>
                        <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Email</th>
                        <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Role</th>
                        <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Joined</th>
                        <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.slice((userPage - 1) * 10, userPage * 10).map((user) => (
                        <tr key={user._id} className="bg-[#111111] hover:bg-[#242424] transition-colors">
                          <td className="px-6 py-4 text-[#C0392B] font-mono">{user._id.slice(-6)}</td>
                          <td className="px-6 py-4 text-white font-medium">{user.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-label-caps uppercase ${user.role === 'admin' ? 'bg-[#C0392B]/10 text-[#C0392B]' : 'bg-zinc-800 text-zinc-400'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-zinc-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 flex gap-3">
                            <button className="text-orange-500 hover:underline font-label-caps text-[10px] uppercase" onClick={() => handleOpenUserModal(user)}>Edit</button>
                            {user.role !== "admin" && (
                              <button className="text-[#C0392B] hover:underline font-label-caps text-[10px] uppercase" onClick={() => handleDeleteUser(user._id)}>Delete</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={userPage}
                  totalPages={Math.ceil(users.length / 10)}
                  onPageChange={setUserPage}
                />
              </div>
            </>
          )}

          {activeTab === "vehicles" && (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="font-h2 text-white uppercase tracking-wider">Vehicle Database</h1>
                  <p className="text-zinc-400 text-sm">Manage supported vehicles in the ModMyRide platform.</p>
                </div>
                <button onClick={() => handleOpenVehicleModal()} className="bg-[#C0392B] text-white px-6 py-2 rounded-none font-label-caps tracking-widest hover:bg-[#a93226] transition-colors">
                  + Add Vehicle
                </button>
              </div>

              {/* Vehicle Tabs */}
              <Tabs
                tabs={[
                  { id: "cars", label: "Cars" },
                  { id: "bikes", label: "Bikes" }
                ]}
                activeTab={vehicleTab}
                setActiveTab={setVehicleTab}
              />

              {/* Cars Tab Content */}
              {vehicleTab === "cars" && (
                <div className="bg-[#1A1A1A] machined-edge rounded-none overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-body-sm">
                      <thead className="bg-[#111111] border-b border-white/5">
                        <tr>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Make</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Model</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Year</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Fuel</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Trans</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Engine</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Stock Pwr</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {vehicles.filter(v => v.type === 'car').slice((carPage - 1) * 10, carPage * 10).map((vehicle) => (
                          <tr key={vehicle._id} className="bg-[#111111] hover:bg-[#242424] transition-colors">
                            <td className="px-6 py-4 text-white font-medium">{vehicle.make}</td>
                            <td className="px-6 py-4 text-zinc-400">{vehicle.model}</td>
                            <td className="px-6 py-4 text-white">{vehicle.year}</td>
                            <td className="px-6 py-4 text-zinc-400 text-[10px] uppercase font-bold">{vehicle.fuelType || "-"}</td>
                            <td className="px-6 py-4 text-zinc-400 text-[10px] uppercase font-bold">{vehicle.transmission || "-"}</td>
                            <td className="px-6 py-4 text-white">{vehicle.engine || "-"}</td>
                            <td className="px-6 py-4 text-white font-mono text-xs">{vehicle.stockPower ? `${vehicle.stockPower} HP` : "-"}</td>
                            <td className="px-6 py-4 flex gap-3">
                              <button className="text-orange-500 hover:underline font-label-caps text-[10px] uppercase" onClick={() => handleOpenVehicleModal(vehicle)}>Edit</button>
                              <button className="text-[#C0392B] hover:underline font-label-caps text-[10px] uppercase" onClick={() => handleDeleteVehicle(vehicle._id)}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    currentPage={carPage}
                    totalPages={Math.ceil(vehicles.filter(v => v.type === 'car').length / 10)}
                    onPageChange={setCarPage}
                  />
                </div>
              )}

              {/* Bikes Tab Content */}
              {vehicleTab === "bikes" && (
                <div className="bg-[#1A1A1A] machined-edge rounded-none overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-body-sm">
                      <thead className="bg-[#111111] border-b border-white/5">
                        <tr>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Make</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Model</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Year</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Fuel</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Trans</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Engine</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Stock Pwr</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {vehicles.filter(v => v.type === 'bike').slice((bikePage - 1) * 10, bikePage * 10).map((vehicle) => (
                          <tr key={vehicle._id} className="bg-[#111111] hover:bg-[#242424] transition-colors">
                            <td className="px-6 py-4 text-white font-medium">{vehicle.make}</td>
                            <td className="px-6 py-4 text-zinc-400">{vehicle.model}</td>
                            <td className="px-6 py-4 text-white">{vehicle.year}</td>
                            <td className="px-6 py-4 text-zinc-400 text-[10px] uppercase font-bold">{vehicle.fuelType || "-"}</td>
                            <td className="px-6 py-4 text-zinc-400 text-[10px] uppercase font-bold">{vehicle.transmission || "-"}</td>
                            <td className="px-6 py-4 text-white">{vehicle.engine || "-"}</td>
                            <td className="px-6 py-4 text-white font-mono text-xs">{vehicle.stockPower ? `${vehicle.stockPower} HP` : "-"}</td>
                            <td className="px-6 py-4 flex gap-3">
                              <button className="text-orange-500 hover:underline font-label-caps text-[10px] uppercase" onClick={() => handleOpenVehicleModal(vehicle)}>Edit</button>
                              <button className="text-[#C0392B] hover:underline font-label-caps text-[10px] uppercase" onClick={() => handleDeleteVehicle(vehicle._id)}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    currentPage={bikePage}
                    totalPages={Math.ceil(vehicles.filter(v => v.type === 'bike').length / 10)}
                    onPageChange={setBikePage}
                  />
                </div>
              )}
            </>
          )}

          {activeTab === "upgrades" && (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="font-h2 text-white uppercase tracking-wider">Upgrades Database</h1>
                  <p className="text-zinc-400 text-sm">Manage performance parts and visual upgrades.</p>
                </div>
                <button onClick={() => handleOpenUpgradeModal()} className="bg-[#C0392B] text-white px-6 py-2 rounded-none font-label-caps tracking-widest hover:bg-[#a93226] transition-colors">
                  + Add Upgrade
                </button>
              </div>

              {/* Upgrades Tabs */}
              <Tabs
                tabs={[
                  { id: "carUpgrades", label: "Car Upgrades" },
                  { id: "bikeUpgrades", label: "Bike Upgrades" }
                ]}
                activeTab={upgradeTab}
                setActiveTab={setUpgradeTab}
              />

              {/* Car Upgrades Tab Content */}
              {upgradeTab === "carUpgrades" && (
                <div className="bg-[#1A1A1A] machined-edge rounded-none overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-body-sm">
                      <thead className="bg-[#111111] border-b border-white/5">
                        <tr>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Name</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Category</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Price</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Compatibility</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Stage</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Goals</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Gain</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {upgrades.filter(u => u.type === 'car').slice((carUpgradePage - 1) * 10, carUpgradePage * 10).map((upgrade) => (
                          <tr key={upgrade._id} className="bg-[#111111] hover:bg-[#242424] transition-colors">
                            <td className="px-6 py-4 text-white font-medium">{upgrade.name}</td>
                            <td className="px-6 py-4 text-zinc-400">{upgrade.category}</td>
                            <td className="px-6 py-4 text-white">INR {upgrade.price}</td>
                            <td className="px-6 py-4 text-zinc-400">{upgrade.compatibleVehicles.length} vehicle(s)</td>
                            <td className="px-6 py-4 text-white font-label-caps text-[10px] uppercase">{upgrade.stage || "-"}</td>
                            <td className="px-6 py-4 text-zinc-400 text-xs">{upgrade.goals?.join(", ") || "-"}</td>
                            <td className="px-6 py-4 text-green-500">{upgrade.performanceGain || "-"}</td>
                            <td className="px-6 py-4 flex gap-3">
                              <button className="text-orange-500 hover:underline font-label-caps text-[10px] uppercase" onClick={() => handleOpenUpgradeModal(upgrade)}>Edit</button>
                              <button className="text-[#C0392B] hover:underline font-label-caps text-[10px] uppercase" onClick={() => handleDeleteUpgrade(upgrade._id)}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    currentPage={carUpgradePage}
                    totalPages={Math.ceil(upgrades.filter(u => u.type === 'car').length / 10)}
                    onPageChange={setCarUpgradePage}
                  />
                </div>
              )}

              {/* Bike Upgrades Tab Content */}
              {upgradeTab === "bikeUpgrades" && (
                <div className="bg-[#1A1A1A] machined-edge rounded-none overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-body-sm">
                      <thead className="bg-[#111111] border-b border-white/5">
                        <tr>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Name</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Category</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Price</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Compatibility</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Stage</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Goals</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Gain</th>
                          <th className="px-6 py-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {upgrades.filter(u => u.type === 'bike').slice((bikeUpgradePage - 1) * 10, bikeUpgradePage * 10).map((upgrade) => (
                          <tr key={upgrade._id} className="bg-[#111111] hover:bg-[#242424] transition-colors">
                            <td className="px-6 py-4 text-white font-medium">{upgrade.name}</td>
                            <td className="px-6 py-4 text-zinc-400">{upgrade.category}</td>
                            <td className="px-6 py-4 text-white">INR {upgrade.price}</td>
                            <td className="px-6 py-4 text-zinc-400">{upgrade.compatibleVehicles.length} vehicle(s)</td>
                            <td className="px-6 py-4 text-white font-label-caps text-[10px] uppercase">{upgrade.stage || "-"}</td>
                            <td className="px-6 py-4 text-zinc-400 text-xs">{upgrade.goals?.join(", ") || "-"}</td>
                            <td className="px-6 py-4 text-green-500">{upgrade.performanceGain || "-"}</td>
                            <td className="px-6 py-4 flex gap-3">
                              <button className="text-orange-500 hover:underline font-label-caps text-[10px] uppercase" onClick={() => handleOpenUpgradeModal(upgrade)}>Edit</button>
                              <button className="text-[#C0392B] hover:underline font-label-caps text-[10px] uppercase" onClick={() => handleDeleteUpgrade(upgrade._id)}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    currentPage={bikeUpgradePage}
                    totalPages={Math.ceil(upgrades.filter(u => u.type === 'bike').length / 10)}
                    onPageChange={setBikeUpgradePage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* User Form Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleCloseUserModal}>
          <div className="bg-[#1A1A1A] machined-edge w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#111111] sticky top-0 z-10">
              <h2 className="font-h3 text-white uppercase tracking-wider">Edit User</h2>
              <button className="text-zinc-500 hover:text-[#C0392B] transition-colors" onClick={handleCloseUserModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Email *</label>
                <input 
                  type="email" 
                  required 
                  value={currentUser.email} 
                  onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                  placeholder="user@example.com" 
                  className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Role *</label>
                <select 
                  required 
                  value={currentUser.role} 
                  onChange={(e) => setCurrentUser({...currentUser, role: e.target.value})}
                  className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                <button type="button" className="px-6 py-2 border border-white/10 text-white font-label-caps tracking-widest hover:bg-white/5 transition-colors uppercase text-sm" onClick={handleCloseUserModal}>Cancel</button>
                <button type="submit" className="px-6 py-2 bg-[#C0392B] text-white font-label-caps tracking-widest hover:bg-[#a93226] transition-colors uppercase text-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Form Modal */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleCloseVehicleModal}>
          <div className="bg-[#1A1A1A] machined-edge w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#111111] sticky top-0 z-10">
              <h2 className="font-h3 text-white uppercase tracking-wider">{isEditingVehicle ? "Edit Vehicle" : "Add Vehicle"}</h2>
              <button className="text-zinc-500 hover:text-[#C0392B] transition-colors" onClick={handleCloseVehicleModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleVehicleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="md:col-span-2 space-y-2">
                  <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Type *</label>
                  <select 
                    required 
                    value={currentVehicle.type} 
                    onChange={(e) => setCurrentVehicle({...currentVehicle, type: e.target.value})}
                    className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm"
                  >
                    <option value="car">Car</option>
                    <option value="bike">Bike</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Make *</label>
                  <input 
                    type="text" 
                    required 
                    value={currentVehicle.make} 
                    onChange={(e) => setCurrentVehicle({...currentVehicle, make: e.target.value})}
                    placeholder={currentVehicle.type === 'car' ? "e.g: Ford" : "e.g: Hero"} 
                    className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Model *</label>
                  <input 
                    type="text" 
                    required 
                    value={currentVehicle.model} 
                    onChange={(e) => setCurrentVehicle({...currentVehicle, model: e.target.value})}
                    placeholder={currentVehicle.type === 'car' ? "e.g: Ikon" : "e.g: Xpulse"}
                    className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Year *</label>
                  <input 
                    type="text" 
                    required 
                    value={currentVehicle.year} 
                    onChange={(e) => setCurrentVehicle({...currentVehicle, year: e.target.value})}
                    placeholder={currentVehicle.type === 'car' ? "e.g: 2020 or 2020-2025" : "e.g: 2025 or 2020-2025"}
                    className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm"
                  />
                  <small className="text-zinc-500 text-xs block">Enter single year (e.g: 2025) or year range (e.g: 2020-2025)</small>
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Fuel Type *</label>
                  <select 
                    required 
                    value={currentVehicle.fuelType} 
                    onChange={(e) => setCurrentVehicle({...currentVehicle, fuelType: e.target.value})}
                    className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Transmission *</label>
                  <select 
                    required 
                    value={currentVehicle.transmission} 
                    onChange={(e) => setCurrentVehicle({...currentVehicle, transmission: e.target.value})}
                    className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Engine</label>
                  <input 
                    type="text" 
                    value={currentVehicle.engine} 
                    onChange={(e) => setCurrentVehicle({...currentVehicle, engine: e.target.value})}
                    placeholder={currentVehicle.type === 'car' ? "e.g: 1.4L Turbo or 1.3L NA" : "e.g: 200cc or 210cc"}
                    className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Stock Power (HP/PS)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    value={currentVehicle.stockPower} 
                    onChange={(e) => setCurrentVehicle({...currentVehicle, stockPower: parseFloat(e.target.value)})}
                    placeholder="e.g: 130.5"
                    className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm"
                  />
                  <small className="text-zinc-500 text-xs block">Enter decimal values for precise horsepower (e.g: 130.5)</small>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Image URL</label>
                  <input 
                    type="url" 
                    value={currentVehicle.imageUrl} 
                    onChange={(e) => setCurrentVehicle({...currentVehicle, imageUrl: e.target.value})}
                    placeholder="https://..."
                    className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                <button type="button" className="px-6 py-2 border border-white/10 text-white font-label-caps tracking-widest hover:bg-white/5 transition-colors uppercase text-sm" onClick={handleCloseVehicleModal}>Cancel</button>
                <button type="submit" className="px-6 py-2 bg-[#C0392B] text-white font-label-caps tracking-widest hover:bg-[#a93226] transition-colors uppercase text-sm">{isEditingVehicle ? "Save Changes" : "Create Vehicle"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade Form Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleCloseUpgradeModal}>
          <div className="bg-[#1A1A1A] machined-edge w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#111111] sticky top-0 z-10">
              <h2 className="font-h3 text-white uppercase tracking-wider">{isEditingUpgrade ? "Edit Upgrade" : "Add Upgrade"}</h2>
              <button className="text-zinc-500 hover:text-[#C0392B] transition-colors" onClick={handleCloseUpgradeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleUpgradeSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="md:col-span-2 space-y-2">
                  <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Type *</label>
                  <select 
                    required 
                    value={currentUpgrade.type} 
                    onChange={(e) => {
                      setCurrentUpgrade({
                        ...currentUpgrade, 
                        type: e.target.value,
                        compatibleVehicles: [] 
                      });
                    }}
                    className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm"
                  >
                    <option value="car">Car Part</option>
                    <option value="bike">Bike Part</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={currentUpgrade.name} 
                    onChange={(e) => setCurrentUpgrade({...currentUpgrade, name: e.target.value})}
                    placeholder="e.g: BMC Air Filter"
                    className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Category *</label>
                  <select 
                    required 
                    value={currentUpgrade.category} 
                    onChange={(e) => {
                      const newCat = e.target.value;
                      const mappedGoals = {
                        "Air Intake": ["Performance", "Better Mileage"],
                        "Exhaust Systems": ["Performance"],
                        "ECU & Tuning": ["Performance", "Better Mileage"],
                        "Suspension": ["Handling"],
                        "Brakes": ["Handling"],
                        "Off-Road Accessories": ["Off-Road"],
                        "Wheels & Tyres": ["Handling", "Off-Road"],
                        "Lighting": ["Lighting Improvements"]
                      }[newCat] || [];
                      
                      setCurrentUpgrade({
                        ...currentUpgrade, 
                        category: newCat,
                        goals: [...new Set([...currentUpgrade.goals, ...mappedGoals])]
                      });
                    }}
                    className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm"
                  >
                    <option value="Air Intake">Air Intake - Performance and Better Mileage</option>
                    <option value="Exhaust Systems">Exhaust Systems - Performance</option>
                    <option value="ECU & Tuning">ECU & Tuning - Performance and Better Mileage</option>
                    <option value="Suspension">Suspension - Handling</option>
                    <option value="Brakes">Brakes - Handling</option>
                    <option value="Off-Road Accessories">Off-Road Accessories - Off Road</option>
                    <option value="Wheels & Tyres">Wheels & Tyres - Handling and Off road</option>
                    <option value="Lighting">Lighting - Lighting</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Price (INR) *</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    step="0.01"
                    value={currentUpgrade.price} 
                    onChange={(e) => setCurrentUpgrade({...currentUpgrade, price: parseFloat(e.target.value)})}
                    placeholder="500-5,00,000"
                    className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm"
                  />
                </div>
                
                {["Engine", "Exhaust"].includes(currentUpgrade.category) && (
                  <div className="space-y-2">
                    <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Performance Gain</label>
                    <input 
                      type="text" 
                      value={currentUpgrade.performanceGain} 
                      onChange={(e) => setCurrentUpgrade({...currentUpgrade, performanceGain: e.target.value})}
                      placeholder="+15hp or -5hp"
                      className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm"
                    />
                  </div>
                )}

                <div className="md:col-span-2 space-y-2">
                  <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Compatible Vehicles (Hold Ctrl/Cmd to select multiple)</label>
                  <select 
                    multiple
                    value={currentUpgrade.compatibleVehicles} 
                    onChange={handleUpgradeVehicleSelection}
                    className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm min-h-[120px]"
                  >
                    {compatibleVehiclesOptions.length === 0 ? (
                      <option disabled className="text-zinc-500">No {currentUpgrade.type}s found in database.</option>
                    ) : (
                      compatibleVehiclesOptions.map(v => (
                        <option key={v._id} value={v._id} className="py-1">
                          {v.year} {v.make} {v.model} {v.trim ? `(${v.trim})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                  <small className="text-zinc-500 text-xs block">
                    Only showing vehicles of type: {currentUpgrade.type.toUpperCase()}
                  </small>
                </div>

                <div className="space-y-2">
                  <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Build Stage</label>
                  <select 
                    value={currentUpgrade.stage} 
                    onChange={(e) => setCurrentUpgrade({...currentUpgrade, stage: e.target.value})}
                    className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm"
                  >
                    <option value="Universal">Universal</option>
                    <option value="Stage 1">Stage 1</option>
                    <option value="Stage 2">Stage 2</option>
                    <option value="Stage 3">Stage 3</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Goals (Hold Ctrl/Cmd to select multiple)</label>
                  <select 
                    multiple
                    value={currentUpgrade.goals} 
                    onChange={handleUpgradeGoalSelection}
                    className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm min-h-[120px]"
                  >
                    <option value="Performance" className="py-1">Performance</option>
                    <option value="Better Mileage" className="py-1">Better Mileage</option>
                    <option value="Handling" className="py-1">Handling</option>
                    <option value="Off-Road" className="py-1">Off-Road</option>
                    <option value="Lighting Improvements" className="py-1">Lighting Improvements</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Compatible Engine Types (Empty = All)</label>
                  <select 
                    multiple
                    value={currentUpgrade.compatibleFuels} 
                    onChange={handleUpgradeFuelSelection}
                    className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm min-h-[80px]"
                  >
                    <option value="Petrol" className="py-1">Petrol</option>
                    <option value="Diesel" className="py-1">Diesel</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Compatible Transmissions (Empty = All)</label>
                  <select 
                    multiple
                    value={currentUpgrade.compatibleTransmissions} 
                    onChange={handleUpgradeTransmissionSelection}
                    className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm min-h-[80px]"
                  >
                    <option value="Manual" className="py-1">Manual</option>
                    <option value="Automatic" className="py-1">Automatic</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Image URL</label>
                  <input 
                    type="url" 
                    value={currentUpgrade.imageUrl} 
                    onChange={(e) => setCurrentUpgrade({...currentUpgrade, imageUrl: e.target.value})}
                    placeholder="https://..."
                    className="w-full bg-[#111111] border border-white/10 rounded-none px-4 py-3 text-white focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] outline-none transition-all font-body-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                <button type="button" className="px-6 py-2 border border-white/10 text-white font-label-caps tracking-widest hover:bg-white/5 transition-colors uppercase text-sm" onClick={handleCloseUpgradeModal}>Cancel</button>
                <button type="submit" className="px-6 py-2 bg-[#C0392B] text-white font-label-caps tracking-widest hover:bg-[#a93226] transition-colors uppercase text-sm">{isEditingUpgrade ? "Save Changes" : "Create Upgrade"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
