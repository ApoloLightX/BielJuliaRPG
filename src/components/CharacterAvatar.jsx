function CharacterAvatar({ skinHex, hairHex, gender, size = 120 }) {
  const isFemale = gender === "female";
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className="mx-auto">
      <circle cx="60" cy="60" r="58" fill="#1a1310" stroke="#3a2a24" strokeWidth="2" />
      {/* pescoço */}
      <rect x="50" y="75" width="20" height="20" fill={skinHex} />
      {/* rosto */}
      <ellipse cx="60" cy="58" rx="26" ry="30" fill={skinHex} />
      {/* cabelo */}
      {isFemale ? (
        <path
          d="M 34 55 Q 30 20 60 18 Q 90 20 86 55 Q 88 90 78 95 Q 82 60 74 40 Q 60 30 46 40 Q 38 60 42 95 Q 32 90 34 55 Z"
          fill={hairHex}
        />
      ) : (
        <path
          d="M 34 50 Q 32 22 60 20 Q 88 22 86 50 Q 87 38 76 32 Q 60 26 44 32 Q 33 38 34 50 Z"
          fill={hairHex}
        />
      )}
      {/* olhos */}
      <circle cx="50" cy="58" r="3" fill="#0e0b0a" />
      <circle cx="70" cy="58" r="3" fill="#0e0b0a" />
      {/* corpo/armadura */}
      <path d="M 30 118 Q 30 90 60 88 Q 90 90 90 118 Z" fill="#2a1f1a" stroke="#3a2a24" strokeWidth="1.5" />
    </svg>
  );
}

export default CharacterAvatar;
