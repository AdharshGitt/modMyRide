export const InputLabel = ({
  htmlFor,
  children,
  type = "text",
  value,
  onChange,
  name,
  placeholder,
  autoComplete,
  required,
  disabled,
  ...inputProps
}) => {
  return (
    <div className="input-container flex-1">
      <label htmlFor={htmlFor} className="input-label">
        {children}
      </label>
      <input
        id={htmlFor}
        className="input-field"
        type={type}
        value={value}
        onChange={onChange}
        name={name}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        {...inputProps}
      />
    </div>
  );
};