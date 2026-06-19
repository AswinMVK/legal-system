import React, { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Tricolor "Legal" logo
 *   "Le" = green (#138808)
 *   "ga" = white (#FFFFFF) — uses text-stroke for visibility on light bg
 *   "l"  = saffron/orange (#FF9933)
 *
 * Includes a small Ashoka Chakra icon next to the text.
 */
export default function TricolorLogo({
  size = "2rem",
  showIcon = true,
  animate = true,
}) {
  const logoRef = useRef(null);

  useEffect(() => {
    if (!animate || !logoRef.current) return;
    const letters = logoRef.current.querySelectorAll(".logo-char");
    gsap.from(letters, {
      y: -20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.08,
      ease: "back.out(1.7)",
    });
  }, [animate]);

  const baseStyle = {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    fontWeight: 900,
    fontSize: size,
    letterSpacing: "-0.03em",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.15em",
    cursor: "default",
    userSelect: "none",
  };

  return (
    <span ref={logoRef} style={baseStyle} className="tricolor-logo">
      {showIcon && (
        <span className="logo-char logo-icon">
          <svg
            viewBox="0 0 200 200"
            width="1.2em"
            height="1.2em"
            style={{ verticalAlign: "middle" }}
          >
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="#000080"
              strokeWidth="7"
            />
            <circle cx="100" cy="100" r="22" fill="#000080" />
            <circle cx="100" cy="100" r="12" fill="#0047AB" />
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 15 * Math.PI) / 180;
              return (
                <line
                  key={i}
                  x1={100 + 22 * Math.cos(angle)}
                  y1={100 + 22 * Math.sin(angle)}
                  x2={100 + 86 * Math.cos(angle)}
                  y2={100 + 86 * Math.sin(angle)}
                  stroke="#000080"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
        </span>
      )}
      <span className="logo-char" style={{ color: "#138808" }}>
        L
      </span>
      <span className="logo-char" style={{ color: "#006400" }}>
        e
      </span>
      <span
        className="logo-char logo-white-letter"
        style={{
          color: "#FFFFFF",
          WebkitTextStroke: "1.5px #B0B0B0",
          textShadow: "0 1px 4px rgba(0,0,0,0.12)",
        }}
      >
        g
      </span>
      <span
        className="logo-char logo-white-letter"
        style={{
          color: "#FFFFFF",
          WebkitTextStroke: "1.5px #B0B0B0",
          textShadow: "0 1px 4px rgba(0,0,0,0.12)",
        }}
      >
        a
      </span>
      <span className="logo-char" style={{ color: "#FF9933" }}>
        l
      </span>
    </span>
  );
}
