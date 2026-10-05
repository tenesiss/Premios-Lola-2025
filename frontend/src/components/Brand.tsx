export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand ${compact ? "brand-compact" : ""}`}>
      <svg
        className="brand-symbol"
        viewBox="0 0 40 46"
        fill="none"
        aria-hidden="true"
      >
        <path d="M5 3h30L5 43h30L5 3Z" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 3v7l16 26v7M28 3v7L12 36v7"
          stroke="currentColor"
          strokeWidth="1"
          opacity=".5"
        />
        <path d="M9 23h22" stroke="currentColor" strokeWidth="1" />
      </svg>
      <span className="brand-type">
        <span>PREMIOS</span>
        <strong>
          LOLA<span className="brand-period">.</span>
        </strong>
      </span>
      {!compact && (
        <span className="brand-edition">
          20
          <br />
          26
        </span>
      )}
    </span>
  );
}
