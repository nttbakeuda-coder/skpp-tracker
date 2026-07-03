export function BackToTop({ show }) {
  return (
    <button
      className={"btt" + (show ? " show" : "")}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Kembali ke atas"
    >
      ↑
    </button>
  );
}
