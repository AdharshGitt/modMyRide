import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAdminUsers, fetchAdminStats, fetchCurrentUser, setAuthToken, deleteAdminUser } from "../services/api.js";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, adminUsers: 0, regularUsers: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    const init = async () => {
      try {
        const { user } = await fetchCurrentUser();
        if (user.role !== "admin") {
          navigate("/");
          return;
        }

        const [usersData, statsData] = await Promise.all([
          fetchAdminUsers(),
          fetchAdminStats()
        ]);
        
        setUsers(usersData.users);
        setStats(statsData);
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

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <h2>ModMyRide</h2>
          <span className="badge">Admin</span>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item active">Dashboard Overview</button>
          <button className="nav-item" onClick={() => alert("Vehicles coming soon!")}>Vehicles</button>
          <button className="nav-item" onClick={() => alert("Upgrades coming soon!")}>Upgrades</button>
          <button className="nav-item" onClick={handleLogout} style={{ marginTop: "auto", color: "#fca5a5" }}>Logout</button>
        </nav>
      </aside>

      <main className="admin-main">
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
      </main>
    </div>
  );
};

export default AdminDashboard;
