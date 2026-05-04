export function Button({ children, onClick, type = "button", disabled, className = "" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn ${className}`.trim()}
    >
      {children}
    </button>
  );
}