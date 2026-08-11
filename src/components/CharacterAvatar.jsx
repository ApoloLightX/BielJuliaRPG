import { useId } from "react";

function CharacterAvatar({ skinHex, hairHex, gender, size = 120 }) {
  const isFemale = gender === "female";
  const unique = useId().replace(/:/g, "");
  const bgGradientId = `avatar-bg-${unique}`;
  const faceGradientId = `avatar-face-${unique}`;
  const clothGradientId = `avatar-cloth-${unique}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className="mx-auto drop-shadow-[0_5px_18px_rgba(0,0,0,0.38)]"
      role="img"
      aria-label="Avatar do personagem"
    >
      <defs>
        <radialGradient id={bgGradientId} cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#281813" />
          <stop offset="72%" stopColor="#17100e" />
          <stop offset="100%" stopColor="#0e0b0a" />
        </radialGradient>
        <linearGradient id={faceGradientId} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={skinHex} />
          <stop offset="100%" stopColor={skinHex} stopOpacity="0.82" />
        </linearGradient>
        <linearGradient id={clothGradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38251f" />
          <stop offset="100%" stopColor="#1a1210" />
        </linearGradient>
      </defs>

      <circle cx="60" cy="60" r="58" fill={`url(#${bgGradientId})`} stroke="#4b3028" strokeWidth="2" />
      <circle cx="60" cy="60" r="53" fill="none" stroke="#ffffff" strokeOpacity="0.035" />
      <ellipse cx="60" cy="105" rx="35" ry="12" fill="#080706" opacity="0.55" />

      <path d="M 27 119 Q 30 91 60 87 Q 90 91 93 119 Z" fill={`url(#${clothGradientId})`} stroke="#4a3029" strokeWidth="1.5" />
      <path d="M 44 118 Q 48 94 60 94 Q 72 94 76 118 Z" fill="#130e0c" opacity="0.7" />
      <path d="M 50 76 L 70 76 L 68 92 Q 60 97 52 92 Z" fill={skinHex} />

      {isFemale ? (
        <>
          <path d="M 32 61 Q 27 21 59 16 Q 92 19 88 61 Q 90 91 79 101 Q 81 74 76 49 Q 62 34 45 47 Q 39 71 42 101 Q 29 91 32 61 Z" fill={hairHex} />
          <path d="M 35 50 Q 41 24 61 22 Q 76 22 85 39 Q 70 32 55 35 Q 42 38 35 50 Z" fill="#ffffff" opacity="0.055" />
        </>
      ) : (
        <>
          <path d="M 35 51 Q 32 24 59 19 Q 87 21 86 51 Q 81 39 72 34 Q 59 28 47 34 Q 39 39 35 51 Z" fill={hairHex} />
          <path d="M 39 41 Q 52 27 70 32 Q 77 34 82 41 Q 63 34 39 41 Z" fill="#ffffff" opacity="0.055" />
        </>
      )}

      <ellipse cx="60" cy="57" rx="24.5" ry="28.5" fill={`url(#${faceGradientId})`} stroke="#5f4035" strokeWidth="0.7" />
      <ellipse cx="48" cy="68" rx="5" ry="2.4" fill="#d97970" opacity="0.22" />
      <ellipse cx="72" cy="68" rx="5" ry="2.4" fill="#d97970" opacity="0.22" />

      <path d="M 43 50 Q 49 46 55 49" stroke={hairHex} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M 65 49 Q 71 46 77 50" stroke={hairHex} strokeWidth="2.2" fill="none" strokeLinecap="round" />

      <ellipse cx="49.5" cy="57" rx="4.8" ry="3.7" fill="#f1e9e3" />
      <ellipse cx="70.5" cy="57" rx="4.8" ry="3.7" fill="#f1e9e3" />
      <circle cx="49.5" cy="57" r="2.25" fill="#17110f" />
      <circle cx="70.5" cy="57" r="2.25" fill="#17110f" />
      <circle cx="48.7" cy="56.2" r="0.7" fill="#ffffff" opacity="0.9" />
      <circle cx="69.7" cy="56.2" r="0.7" fill="#ffffff" opacity="0.9" />

      <path d="M 60 58 L 57.5 64 Q 60 66 63 64" stroke="#7d5547" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M 52 71 Q 60 76 68 71" stroke="#8e5047" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 54 72 Q 60 74 66 72" stroke="#f2d4cc" strokeWidth="0.7" fill="none" opacity="0.45" />

      <path d="M 42 90 Q 60 82 78 90" stroke="#b8492f" strokeWidth="2.2" fill="none" opacity="0.7" />
      <circle cx="60" cy="90" r="2.4" fill="#b8492f" />
      <circle cx="60" cy="90" r="5" fill="none" stroke="#b8492f" strokeOpacity="0.18" />
    </svg>
  );
}

export default CharacterAvatar;
