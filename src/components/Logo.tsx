type Props = {
  className?: string;
  /** Draw the rounded badge behind the mark (default) or the bare cloud. */
  badge?: boolean;
};

/**
 * The SkyLocker mark: a cloud (your files live online) with a keyhole
 * (it is locked to your account). Flat single-colour vector so it reads
 * clearly at any size and works in one colour.
 */
export function SkyLockerMark({ className = "h-9 w-9", badge = true }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="SkyLocker"
    >
      {badge && <rect x="0" y="0" width="64" height="64" rx="18" fill="#4f46e5" />}

      {/* Cloud with a flat base — the "sky" half of SkyLocker */}
      <path
        d="M20.2 45
           C12.4 45 6 38.8 6 31.2
           C6 24.1 11.1 18.2 17.9 17.5
           C20.3 11.3 26.3 7 33.5 7
           C41.6 7 48.3 12.6 49.7 20.2
           C55.6 21 60 26 60 32.2
           C60 39.1 54.4 45 47.5 45
           Z"
        fill={badge ? "#ffffff" : "#4f46e5"}
      />

      {/* Keyhole — the "locker" half: only your account can open it */}
      <circle cx="33.2" cy="29" r="5.1" fill={badge ? "#4f46e5" : "#ffffff"} />
      <path
        d="M30.7 33.2 H35.7 L34.4 41.6 H32 Z"
        fill={badge ? "#4f46e5" : "#ffffff"}
      />
    </svg>
  );
}