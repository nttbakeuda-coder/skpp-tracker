// Utilitas scroll halus ke elemen ber-id (dipakai Navbar & Landing).
export function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function scrollToLacak() {
  scrollToId("lacak");
  setTimeout(() => {
    const input = document.getElementById("inputNomor");
    if (input) input.focus();
  }, 700);
}
