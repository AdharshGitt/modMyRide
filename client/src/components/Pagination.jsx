import React from "react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getVisiblePages = () => {
    const pages = [];
    const sidePages = 2; // Pages to show on each side of current
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return { pages, showFirst: false, showLast: false };
    }

    let start = Math.max(1, currentPage - sidePages);
    let end = Math.min(totalPages, currentPage + sidePages);

    // Adjust if near the start
    if (start <= 2) {
      start = 1;
      end = 5;
    }

    // Adjust if near the end
    if (end >= totalPages - 1) {
      end = totalPages;
      start = totalPages - 4;
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return { 
      pages, 
      showFirst: start > 1, 
      showLast: end < totalPages 
    };
  };

  const { pages, showFirst, showLast } = getVisiblePages();

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
        
        <div className="flex items-center gap-1">
          {showFirst && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className={`w-8 h-8 flex items-center justify-center font-label-caps text-[10px] uppercase tracking-widest transition-all text-zinc-400 hover:text-white hover:bg-white/5`}
              >
                1
              </button>
              <span className="w-8 h-8 flex items-center justify-center text-zinc-600">...</span>
            </>
          )}

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
          
          {showLast && (
            <>
              <span className="w-8 h-8 flex items-center justify-center text-zinc-600">...</span>
              <button
                onClick={() => onPageChange(totalPages)}
                className={`w-8 h-8 flex items-center justify-center font-label-caps text-[10px] uppercase tracking-widest transition-all text-zinc-400 hover:text-white hover:bg-white/5`}
              >
                {totalPages}
              </button>
            </>
          )}
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
