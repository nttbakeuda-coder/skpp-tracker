// Ikon SVG garis (line icon) — pengganti emoji di seluruh portal, warna
// mengikuti currentColor sehingga otomatis serasi dengan konteks pemakaian.
// `style` diteruskan ke <svg> (dipakai a.l. untuk memutar chevron jadi panah
// kiri/kanan) — jangan dihapus dari destructuring.
function Svg({ size = 16, style, children }) {
  return (
    <svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export function IcoPerson(p) {
  return <Svg {...p}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Svg>;
}

export function IcoBuilding(p) {
  return <Svg {...p}><rect x="4" y="2" width="16" height="20" rx="1" /><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" /></Svg>;
}

export function IcoCheckCircle(p) {
  return <Svg {...p}><path d="M21.8 10.9A10 10 0 1 1 13 2.1" /><path d="m9 11 3 3L22 4" /></Svg>;
}

export function IcoAlertTriangle(p) {
  return <Svg {...p}><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></Svg>;
}

export function IcoBan(p) {
  return <Svg {...p}><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" /></Svg>;
}

export function IcoInbox(p) {
  return <Svg {...p}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></Svg>;
}

export function IcoClock(p) {
  return <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></Svg>;
}

export function IcoInfo(p) {
  return <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 16v-5M12 8h.01" /></Svg>;
}

export function IcoMail(p) {
  return <Svg {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" /></Svg>;
}

export function IcoPackage(p) {
  return <Svg {...p}><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5M12 22V12" /></Svg>;
}

export function IcoClipboardList(p) {
  return <Svg {...p}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M9 12h6M9 16h6M9 8h1" /></Svg>;
}

export function IcoMonitor(p) {
  return <Svg {...p}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></Svg>;
}

export function IcoPenTool(p) {
  return <Svg {...p}><path d="M12 19 8 5l4 4 4-4-4 14Z" /><path d="m2 22 5-5" /><path d="m17.5 6.5 1-1a2.12 2.12 0 0 1 3 3l-1 1" /></Svg>;
}

export function IcoCamera(p) {
  return <Svg {...p}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" /><circle cx="12" cy="13" r="3.5" /></Svg>;
}

export function IcoPaperclip(p) {
  return <Svg {...p}><path d="M21.44 11.05 12.25 20.24a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.67 3.67 0 0 1 5.19 5.19L9.66 17.65a1.83 1.83 0 0 1-2.6-2.6l8.49-8.48" /></Svg>;
}

export function IcoFileText(p) {
  return <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></Svg>;
}

export function IcoImage(p) {
  return <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></Svg>;
}

export function IcoChevronDown(p) {
  return <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>;
}

export function IcoX(p) {
  return <Svg {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg>;
}

export function IcoSearch(p) {
  return <Svg {...p}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Svg>;
}

export function IcoFolder(p) {
  return <Svg {...p}><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></Svg>;
}

export function IcoDownload(p) {
  return <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></Svg>;
}

export function IcoLogOut(p) {
  return <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></Svg>;
}

export function IcoExternal(p) {
  return <Svg {...p}><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></Svg>;
}

export function IcoBook(p) {
  return <Svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></Svg>;
}

// Ikon media sosial versi garis (stroke) -- dipakai chip "kaca" di layar
// Kontak landing, sesuai prototipe handoff (bukan glyph solid berwarna brand).
export function IcoFacebook(p) {
  return <Svg {...p}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></Svg>;
}

export function IcoInstagram(p) {
  return <Svg {...p}><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></Svg>;
}

export function IcoTiktok(p) {
  return <Svg {...p}><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></Svg>;
}

export function IcoYoutube(p) {
  return <Svg {...p}><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></Svg>;
}

export function IcoPhone(p) {
  return <Svg {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></Svg>;
}

export function IcoShield(p) {
  return <Svg {...p}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></Svg>;
}
