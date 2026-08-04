const LEVELS = [
  { label: "Sangat Lemah", color: "#dc2626" },
  { label: "Lemah", color: "#ea580c" },
  { label: "Cukup", color: "#f59e0b" },
  { label: "Kuat", color: "#16a34a" },
  { label: "Sangat Kuat", color: "#059669" },
];

// Skor 0-5 dari panjang & keragaman karakter kata sandi.
function scoreOf(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

// Indikator kekuatan kata sandi — muncul begitu ada isian.
export function PasswordStrength({ value }) {
  if (!value) return null;
  const idx = Math.min(scoreOf(value), LEVELS.length - 1);
  const { label, color } = LEVELS[idx];
  const pct = ((idx + 1) / LEVELS.length) * 100;
  return (
    <div className="p-pwstr">
      <div className="p-pwstr-bar">
        <div className="p-pwstr-fill" style={{ width: pct + "%", background: color }} />
      </div>
      <div className="p-pwstr-label" style={{ color }}>{label}</div>
    </div>
  );
}
