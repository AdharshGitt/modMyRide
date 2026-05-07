import React from "react";

const Tabs = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="flex border-b border-white/10 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-6 py-3 font-label-caps text-[10px] uppercase tracking-widest transition-all ${
            activeTab === tab.id
              ? "text-[#C0392B] border-b-2 border-[#C0392B]"
              : "text-zinc-400 hover:text-white hover:border-white/30"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
