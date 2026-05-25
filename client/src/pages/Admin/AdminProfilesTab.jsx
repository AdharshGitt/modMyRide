import React, { useState, useEffect } from 'react';
import { fetchAdminProfiles, updateAdminProfile, deleteAdminProfile } from '../../services/api';
import Pagination from '../../components/Pagination';

const AdminProfilesTab = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [page, setPage] = useState(1);
  
  const [editForm, setEditForm] = useState({
    name: "",
    goal: ""
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminProfiles();
      setProfiles(data.profiles || []);
      setError("");
    } catch (err) {
      console.error("Error loading profiles:", err);
      setError("Failed to load saved builds");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (profile) => {
    setSelectedProfile(profile);
    setEditForm({
      name: profile.name || "",
      goal: profile.goal || ""
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (profile) => {
    setSelectedProfile(profile);
    setIsDeleteModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateAdminProfile(selectedProfile._id, editForm);
      await loadProfiles();
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update build. Please try again.");
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedProfile) return;
    try {
      await deleteAdminProfile(selectedProfile._id);
      await loadProfiles();
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error("Failed to delete profile", err);
      alert("Failed to delete build. Please try again.");
    }
  };

  // Helper to extract vehicle name safely
  const getVehicleName = (profile) => {
    let make = profile.vehicle?.make || profile.customVehicle?.make;
    let model = profile.vehicle?.model || profile.customVehicle?.model;

    if (!make && !model) {
      if (profile.isAiBuild || profile.name) {
        const cleanName = (profile.name || "").replace(/ Build$/i, '');
        const parts = cleanName.split(' ');
        const split = Math.ceil(parts.length / 2);
        make = parts.slice(0, split).join(' ');
        model = parts.slice(split).join(' ');
      } else {
        make = 'Custom';
        model = 'Build';
      }
    }
    return `${make || ""} ${model || ""}`.trim();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-[#C0392B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-['Oswald'] font-black uppercase text-white tracking-tighter">Manage Builds</h2>
          <p className="text-zinc-500 font-label-caps text-[10px] tracking-widest mt-1">Review community configurations</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded font-body-sm text-sm flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      {/* Builds Table */}
      <div className="bg-[#1A1A1A] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="p-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Build Info</th>
                <th className="p-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">User</th>
                <th className="p-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px]">Stats</th>
                <th className="p-4 font-label-caps text-zinc-500 uppercase tracking-widest text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-zinc-500 font-['Oswald'] uppercase tracking-widest">
                    No builds found.
                  </td>
                </tr>
              ) : (
                profiles.slice((page - 1) * 10, page * 10).map((profile) => (
                  <tr key={profile._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {profile.vehicle?.image ? (
                            <img src={profile.vehicle.image} alt="vehicle" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-zinc-600">
                              {profile.vehicle?.type === 'bike' ? 'motorcycle' : 'directions_car'}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-['Oswald'] text-white font-bold uppercase tracking-wider">{profile.name}</span>
                            {profile.isAiBuild && (
                              <span className="bg-[#C0392B]/20 text-[#C0392B] px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">AI</span>
                            )}
                          </div>
                          <p className="text-zinc-500 text-[10px] font-label-caps uppercase mt-1">
                            {getVehicleName(profile)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[12px] text-zinc-400">person</span>
                        </div>
                        <span className="text-zinc-300 font-body-sm text-sm">{profile.user?.username || profile.user?.email?.split('@')[0] || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-[#C0392B]">favorite</span>
                          <span className="text-zinc-300 font-['Oswald'] text-sm font-bold">{profile.likeCount || 0}</span>
                        </div>
                        <div className="text-zinc-500 text-[10px] font-['Oswald'] tracking-widest">
                          ₹{profile.totalCost?.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => window.open(`/tuning?profileId=${profile._id}`, '_blank')}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-all"
                          title="View Build"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button
                          onClick={() => openEditModal(profile)}
                          className="p-2 text-zinc-400 hover:text-[#C0392B] hover:bg-[#C0392B]/10 rounded transition-all"
                          title="Edit Build Info"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => openDeleteModal(profile)}
                          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                          title="Delete Build"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(profiles.length / 10)}
          onPageChange={setPage}
        />
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 w-full max-w-md machined-edge overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-xl font-['Oswald'] font-bold text-white uppercase tracking-wider">Edit Build</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-label-caps text-zinc-500 uppercase tracking-widest mb-2">Build Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full bg-[#1A1A1A] border border-white/10 p-3 text-white focus:border-[#C0392B] outline-none font-body-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-label-caps text-zinc-500 uppercase tracking-widest mb-2">Goal</label>
                <select
                  value={editForm.goal}
                  onChange={(e) => setEditForm({...editForm, goal: e.target.value})}
                  className="w-full bg-[#1A1A1A] border border-white/10 p-3 text-white focus:border-[#C0392B] outline-none font-body-sm transition-colors appearance-none"
                >
                  <option value="Performance">Performance</option>
                  <option value="Better Mileage">Better Mileage</option>
                  <option value="Handling">Handling</option>
                  <option value="Off-Road">Off-Road</option>
                  <option value="Lighting Improvements">Lighting Improvements</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 border border-white/10 text-white font-['Oswald'] uppercase tracking-widest text-xs hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#C0392B] text-white font-['Oswald'] uppercase tracking-widest text-xs hover:bg-[#a93226] transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-red-500/30 w-full max-w-sm machined-edge overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="p-8 space-y-6">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <div>
                <h3 className="text-2xl font-['Oswald'] font-bold text-white uppercase tracking-wider mb-2">Delete Build?</h3>
                <p className="text-zinc-400 font-body-sm text-sm">
                  Are you sure you want to delete <span className="text-white font-bold">{selectedProfile?.name}</span>? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-3 border border-white/10 text-white font-['Oswald'] uppercase tracking-widest text-xs hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSubmit}
                  className="flex-1 py-3 bg-red-600 text-white font-['Oswald'] uppercase tracking-widest text-xs hover:bg-red-700 transition-colors"
                >
                  Delete Build
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfilesTab;
