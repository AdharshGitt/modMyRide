import React from "react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col items-center justify-center mt-8 gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-4 py-2 font-label-caps text-[10px] uppercase tracking-widest transition-all ${
            currentPage === 1
              ? "text-zinc-700 cursor-not-allowed"
              : "text-zinc-400 hover:text-[#C0392B] hover:bg-white/5"
          }`}
        >
          Previous
        </button>
        
        <div className="flex gap-1">
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 flex items-center justify-center font-label-caps text-[10px] uppercase tracking-widest transition-all ${
                currentPage === page
                  ? "bg-[#C0392B] text-white"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 font-label-caps text-[10px] uppercase tracking-widest transition-all ${
            currentPage === totalPages
              ? "text-zinc-700 cursor-not-allowed"
              : "text-zinc-400 hover:text-[#C0392B] hover:bg-white/5"
          }`}
        >
          Next
        </button>
      </div>
      
      <div className="text-zinc-600 text-[10px] font-label-caps uppercase tracking-widest">
        Showing Page <span className="text-zinc-400">{currentPage}</span> of <span className="text-zinc-400">{totalPages}</span>
      </div>
    </div>
  );
};

export default Pagination;
