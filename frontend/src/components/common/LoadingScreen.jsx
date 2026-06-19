import React, { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Full-screen loading overlay with the Ashoka Chakra logo (logo.jpeg)
 * spinning on a tricolor Indian flag gradient background.
 */
export default function LoadingScreen({ message = "Loading…" }) {
  const logoRef = useRef(null);
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Spin the Ashoka Chakra logo continuously
      gsap.to(logoRef.current, {
        rotation: 360,
        duration: 2.4,
        ease: "linear",
        repeat: -1,
        transformOrigin: "50% 50%",
      });

      // Pulsing glow ring behind the logo
      gsap.to(glowRef.current, {
        scale: 1.15,
        opacity: 0.3,
        duration: 1.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Pulse the loading text
      gsap.fromTo(
        textRef.current,
        { opacity: 0.4 },
        {
          opacity: 1,
          duration: 0.9,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        },
      );

      // Entrance animation
      gsap.from(containerRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.5,
        ease: "back.out(1.6)",
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="ls-overlay">
      {/* Tricolor flag bands */}
      <div className="ls-flag-saffron" />
      <div className="ls-flag-white" />
      <div className="ls-flag-green" />

      <div ref={containerRef} className="ls-center">
        {/* Glow ring */}
        <div ref={glowRef} className="ls-glow" />

        {/* Spinning Ashoka Chakra logo */}
        <img
          ref={logoRef}
          src="/logo.jpeg"
          alt="Ashoka Chakra"
          className="ls-logo"
          draggable={false}
        />

        {/* Brand text */}
        <div className="ls-brand">
          <span className="ls-brand-saffron">Le</span>
          <span className="ls-brand-white">gi</span>
          <span className="ls-brand-green">ra</span>
        </div>

        {/* Loading message */}
        <p ref={textRef} className="ls-message">
          {message}
        </p>

        {/* Tricolor progress bar */}
        <div className="ls-progress">
          <div className="ls-progress-bar" />
        </div>
      </div>
    </div>
  );
}
