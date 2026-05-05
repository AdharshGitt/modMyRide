import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  fetchAdminUsers, 
  fetchAdminStats, 
  fetchCurrentUser, 
  setAuthToken, 
  deleteAdminUser,
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
  const [stats, setStats] = useState({ totalUsers: 0, adminUsers: 0, regularUsers: 0 });
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [upgrades, setUpgrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Vehicle Modal State
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState({ type: "car", make: "", model: "", year: "", trim: "", engine: "", imageUrl: "" });
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);

  // Upgrade Modal State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [currentUpgrade, setCurrentUpgrade] = useState({ name: "", type: "car", category: "Engine", price: "", performanceGain: "", imageUrl: "", compatibleVehicles: [] });
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

  // --- Vehicle Handlers ---
  const handleOpenVehicleModal = (vehicle = null) => {
    if (vehicle) {
      setCurrentVehicle(vehicle);
      setIsEditingVehicle(true);
    } else {
      setCurrentVehicle({ type: "car", make: "", model: "", year: "", trim: "", engine: "", imageUrl: "" });
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
      setCurrentUpgrade({ name: "", type: "car", category: "Engine", price: "", performanceGain: "", imageUrl: "", compatibleVehicles: [] });
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
      <div className="admin-layout">
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-layout">
        <div className="admin-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const renderVehicleTable = (vehicleList, title) => (
    <div style={{ marginBottom: "2.5rem" }}>
      <h3 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "1rem" }}>{title}</h3>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Make</th>
              <th>Model</th>
              <th>Year</th>
              <th>Trim</th>
              <th>Engine</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicleList.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>No {title.toLowerCase()} found.</td>
              </tr>
            ) : (
              vehicleList.map((vehicle) => (
                <tr key={vehicle._id}>
                  <td>{vehicle.make}</td>
                  <td>{vehicle.model}</td>
                  <td>{vehicle.year}</td>
                  <td>{vehicle.trim || "-"}</td>
                  <td>{vehicle.engine || "-"}</td>
                  <td>
                    <button className="admin-action-btn edit" onClick={() => handleOpenVehicleModal(vehicle)}>Edit</button>
                    <button className="admin-action-btn delete" onClick={() => handleDeleteVehicle(vehicle._id)}>Delete</button>
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
    <div style={{ marginBottom: "2.5rem" }}>
      <h3 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "1rem" }}>{title}</h3>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Gain</th>
              <th>Compatibility</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {upgradeList.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>No {title.toLowerCase()} found.</td>
              </tr>
            ) : (
              upgradeList.map((upgrade) => (
                <tr key={upgrade._id}>
                  <td>{upgrade.name}</td>
                  <td>{upgrade.category}</td>
                  <td>${upgrade.price}</td>
                  <td>{upgrade.performanceGain || "-"}</td>
                  <td>{upgrade.compatibleVehicles.length} vehicle(s)</td>
                  <td>
                    <button className="admin-action-btn edit" onClick={() => handleOpenUpgradeModal(upgrade)}>Edit</button>
                    <button className="admin-action-btn delete" onClick={() => handleDeleteUpgrade(upgrade._id)}>Delete</button>
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
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <h2>ModMyRide</h2>
          <span className="badge">Admin</span>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === "overview" ? "active" : ""}`} 
            onClick={() => setActiveTab("overview")}
          >
            Dashboard Overview
          </button>
          <button 
            className={`nav-item ${activeTab === "vehicles" ? "active" : ""}`} 
            onClick={() => setActiveTab("vehicles")}
          >
            Vehicles
          </button>
          <button 
            className={`nav-item ${activeTab === "upgrades" ? "active" : ""}`} 
            onClick={() => setActiveTab("upgrades")}
          >
            Upgrades
          </button>
          <button className="nav-item" onClick={handleLogout} style={{ marginTop: "auto", color: "#fca5a5" }}>Logout</button>
        </nav>
      </aside>

      <main className="admin-main">
        {activeTab === "overview" && (
          <>
            <header className="admin-header">
              <h1>Dashboard Overview</h1>
              <p>Manage users and monitor system health.</p>
            </header>

            <section className="stats-grid">
              <div className="stat-card">
                <h3>Total Users</h3>
                <p className="stat-value">{stats.totalUsers}</p>
                <div className="stat-icon users-icon"></div>
              </div>
              <div className="stat-card">
                <h3>Administrators</h3>
                <p className="stat-value">{stats.adminUsers}</p>
                <div className="stat-icon admin-icon"></div>
              </div>
              <div className="stat-card">
                <h3>Regular Users</h3>
                <p className="stat-value">{stats.regularUsers}</p>
                <div className="stat-icon regular-icon"></div>
              </div>
            </section>

            <section className="users-section">
              <h2>Recent Users</h2>
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td className="mono">{user._id.slice(-6)}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          {user.role !== "admin" && (
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              style={{ background: "none", border: "none", color: "#fca5a5", cursor: "pointer", fontSize: "0.85rem", textDecoration: "underline" }}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {activeTab === "vehicles" && (
          <>
            <header className="admin-header">
              <h1>Vehicle Database</h1>
              <p>Manage supported vehicles in the ModMyRide platform.</p>
            </header>

            <section className="users-section">
              <div className="flex-between">
                <h2>All Vehicles</h2>
                <button className="admin-btn primary" onClick={() => handleOpenVehicleModal()}>
                  + Add Vehicle
                </button>
              </div>
              
              {renderVehicleTable(vehicles.filter(v => v.type === 'car'), 'Cars')}
              {renderVehicleTable(vehicles.filter(v => v.type === 'bike'), 'Bikes')}

            </section>
          </>
        )}

        {activeTab === "upgrades" && (
          <>
            <header className="admin-header">
              <h1>Upgrades Database</h1>
              <p>Manage performance parts and visual upgrades.</p>
            </header>

            <section className="users-section">
              <div className="flex-between">
                <h2>All Upgrades</h2>
                <button className="admin-btn primary" onClick={() => handleOpenUpgradeModal()}>
                  + Add Upgrade
                </button>
              </div>
              
              {renderUpgradeTable(upgrades.filter(u => u.type === 'car'), 'Car Upgrades')}
              {renderUpgradeTable(upgrades.filter(u => u.type === 'bike'), 'Bike Upgrades')}

            </section>
          </>
        )}
      </main>

      {/* Vehicle Form Modal */}
      {isVehicleModalOpen && (
        <div className="modal-overlay" onClick={handleCloseVehicleModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditingVehicle ? "Edit Vehicle" : "Add Vehicle"}</h2>
              <button className="close-btn" onClick={handleCloseVehicleModal}>&times;</button>
            </div>
            <form onSubmit={handleVehicleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Type *</label>
                  <select 
                    required 
                    value={currentVehicle.type} 
                    onChange={(e) => setCurrentVehicle({...currentVehicle, type: e.target.value})}
                    style={{ 
                      width: "100%", padding: "0.75rem", background: "rgba(15, 23, 42, 0.6)", 
                      border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", 
                      color: "#f8fafc", fontFamily: "inherit", outline: "none" 
                    }}
                  >
                    <option value="car">Car</option>
                    <option value="bike">Bike</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Make *</label>
                  <input 
                    type="text" 
                    required 
                    value={currentVehicle.make} 
                    onChange={(e) => setCurrentVehicle({...currentVehicle, make: e.target.value})}
                    placeholder={currentVehicle.type === 'car' ? "e.g: Ford" : "e.g: Hero"} 
                  />
                </div>
                <div className="form-group">
                  <label>Model *</label>
                  <input 
                    type="text" 
                    required 
                    value={currentVehicle.model} 
                    onChange={(e) => setCurrentVehicle({...currentVehicle, model: e.target.value})}
                    placeholder={currentVehicle.type === 'car' ? "e.g: Ikon" : "e.g: Xpulse"}
                  />
                </div>
                <div className="form-group">
                  <label>Year *</label>
                  <input 
                    type="number" 
                    required 
                    min="1900"
                    max="2027"
                    value={currentVehicle.year} 
                    onChange={(e) => setCurrentVehicle({...currentVehicle, year: e.target.value})}
                    placeholder={currentVehicle.type === 'car' ? "e.g: 2009" : "e.g: 2025"}
                  />
                </div>
                <div className="form-group">
                  <label>Trim</label>
                  <input 
                    type="text" 
                    value={currentVehicle.trim} 
                    onChange={(e) => setCurrentVehicle({...currentVehicle, trim: e.target.value})}
                    placeholder={currentVehicle.type === 'car' ? "e.g: Manual or Automatic" : "e.g: 2v or 4v"}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Engine</label>
                  <input 
                    type="text" 
                    value={currentVehicle.engine} 
                    onChange={(e) => setCurrentVehicle({...currentVehicle, engine: e.target.value})}
                    placeholder={currentVehicle.type === 'car' ? "e.g: 1.4L Turbo or 1.3L NA" : "e.g: 200cc or 210cc"}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Image URL</label>
                  <input 
                    type="url" 
                    value={currentVehicle.imageUrl} 
                    onChange={(e) => setCurrentVehicle({...currentVehicle, imageUrl: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="admin-btn secondary" onClick={handleCloseVehicleModal}>Cancel</button>
                <button type="submit" className="admin-btn primary">{isEditingVehicle ? "Save Changes" : "Create Vehicle"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade Form Modal */}
      {isUpgradeModalOpen && (
        <div className="modal-overlay" onClick={handleCloseUpgradeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditingUpgrade ? "Edit Upgrade" : "Add Upgrade"}</h2>
              <button className="close-btn" onClick={handleCloseUpgradeModal}>&times;</button>
            </div>
            <form onSubmit={handleUpgradeSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Type *</label>
                  <select 
                    required 
                    value={currentUpgrade.type} 
                    onChange={(e) => {
                      // If type changes, clear out compatible vehicles
                      setCurrentUpgrade({
                        ...currentUpgrade, 
                        type: e.target.value,
                        compatibleVehicles: [] 
                      });
                    }}
                    style={{ 
                      width: "100%", padding: "0.75rem", background: "rgba(15, 23, 42, 0.6)", 
                      border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", 
                      color: "#f8fafc", fontFamily: "inherit", outline: "none" 
                    }}
                  >
                    <option value="car">Car Part</option>
                    <option value="bike">Bike Part</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={currentUpgrade.name} 
                    onChange={(e) => setCurrentUpgrade({...currentUpgrade, name: e.target.value})}
                    placeholder="e.g: BMC Air Filter"
                  />
                </div>
                
                <div className="form-group">
                  <label>Category *</label>
                  <select 
                    required 
                    value={currentUpgrade.category} 
                    onChange={(e) => setCurrentUpgrade({...currentUpgrade, category: e.target.value})}
                    style={{ 
                      width: "100%", padding: "0.75rem", background: "rgba(15, 23, 42, 0.6)", 
                      border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", 
                      color: "#f8fafc", fontFamily: "inherit", outline: "none" 
                    }}
                  >
                    <option value="Engine">Engine</option>
                    <option value="Exhaust">Exhaust</option>
                    <option value="Suspension">Suspension</option>
                    <option value="Brakes">Brakes</option>
                    <option value="Wheels">Wheels</option>
                    <option value="Aesthetics">Aesthetics</option>
                    <option value="Lights">Lights</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Price (INR) *</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    step="0.01"
                    value={currentUpgrade.price} 
                    onChange={(e) => setCurrentUpgrade({...currentUpgrade, price: parseFloat(e.target.value)})}
                    placeholder="500-5,00,000"
                  />
                </div>
                
                {["Engine", "Exhaust"].includes(currentUpgrade.category) && (
                  <div className="form-group">
                    <label>Performance Gain</label>
                    <input 
                      type="text" 
                      value={currentUpgrade.performanceGain} 
                      onChange={(e) => setCurrentUpgrade({...currentUpgrade, performanceGain: e.target.value})}
                      placeholder="+15hp or -5hp"
                    />
                  </div>
                )}

                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Compatible Vehicles (Hold Ctrl/Cmd to select multiple)</label>
                  <select 
                    multiple
                    value={currentUpgrade.compatibleVehicles} 
                    onChange={handleUpgradeVehicleSelection}
                    style={{ 
                      width: "100%", padding: "0.75rem", background: "rgba(15, 23, 42, 0.6)", 
                      border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", 
                      color: "#f8fafc", fontFamily: "inherit", outline: "none", minHeight: "120px"
                    }}
                  >
                    {compatibleVehiclesOptions.length === 0 ? (
                      <option disabled>No {currentUpgrade.type}s found in database.</option>
                    ) : (
                      compatibleVehiclesOptions.map(v => (
                        <option key={v._id} value={v._id}>
                          {v.year} {v.make} {v.model} {v.trim ? `(${v.trim})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                  <small style={{ color: "#94a3b8", display: "block", marginTop: "0.5rem" }}>
                    Only showing vehicles of type: {currentUpgrade.type.toUpperCase()}
                  </small>
                </div>

                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Image URL</label>
                  <input 
                    type="url" 
                    value={currentUpgrade.imageUrl} 
                    onChange={(e) => setCurrentUpgrade({...currentUpgrade, imageUrl: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="admin-btn secondary" onClick={handleCloseUpgradeModal}>Cancel</button>
                <button type="submit" className="admin-btn primary">{isEditingUpgrade ? "Save Changes" : "Create Upgrade"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
