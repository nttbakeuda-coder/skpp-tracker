import { useState } from "react";

function IcoEye() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IcoEyeOff() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A10.5 10.5 0 0 1 12 4c7 0 11 8 11 8a20.4 20.4 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

// Input kata sandi dengan tombol mata (tampilkan/sembunyikan).
export function PasswordField({ label, value, onChange, placeholder = "••••••••", autoComplete, children }) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div className="p-pwd-box">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="p-pwd-eye"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        >
          {show ? <IcoEyeOff /> : <IcoEye />}
        </button>
      </div>
      {children}
    </div>
  );
}
