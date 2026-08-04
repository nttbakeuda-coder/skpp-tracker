import { useEffect, useRef, useState } from "react";
import { IcoChevronDown } from "./Icons.jsx";

// Dropdown dengan kotak pencarian — untuk daftar opsi panjang (mis. OPD/Instansi).
export function SearchableSelect({ label, value, onChange, options, placeholder = "— Pilih —", error, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQ("");
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const ql = q.trim().toLowerCase();
  const filtered = ql ? options.filter((o) => o.toLowerCase().includes(ql)) : options;

  return (
    <div className={"field p-ssel" + (error ? " invalid" : "") + (disabled ? " is-disabled" : "")} ref={ref}>
      {label && <label>{label}</label>}
      <div className="p-ssel-box" style={disabled ? { opacity: 0.55, pointerEvents: "none", cursor: "not-allowed" } : undefined}>
        <input
          value={open ? q : value || ""}
          onChange={(e) => {
            if (disabled) return;
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (disabled) return;
            setOpen(true);
            setQ("");
          }}
          placeholder={placeholder}
          autoComplete="off"
          readOnly={disabled}
          tabIndex={disabled ? -1 : undefined}
        />
        <span className="p-ssel-arrow"><IcoChevronDown size={16} /></span>
      </div>
      {error && <div className="field-err">{error}</div>}
      {open && !disabled && (
        <div className="p-ssel-menu">
          {filtered.length === 0 ? (
            <div className="p-ssel-empty">Tidak ditemukan.</div>
          ) : (
            filtered.map((o) => (
              <div
                key={o}
                className={"p-ssel-opt" + (o === value ? " on" : "")}
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                  setQ("");
                }}
              >
                {o}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
