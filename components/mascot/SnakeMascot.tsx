"use client";

import { motion } from "framer-motion";
import type { MascotExpression } from "@/types";
import { cn } from "@/lib/utils";

interface SnakeMascotProps {
  expression?: MascotExpression;
  size?: number;
  className?: string;
}

/**
 * A small, rounded, rose-pink snake character, built entirely from SVG
 * primitives (no external art / emoji). Facial features swap based on
 * `expression`. Subtle breathing + blink animation only; respects
 * prefers-reduced-motion via the global CSS rule that clamps all
 * animation durations.
 */
export function SnakeMascot({ expression = "neutral", size = 96, className }: SnakeMascotProps) {
  return (
    <motion.svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={cn("select-none", className)}
      initial={{ scale: 0.98 }}
      animate={{ scale: [0.98, 1.01, 0.98] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      role="img"
      aria-label={`Rắn mascot SNEK biểu cảm ${expression}`}
    >
      <defs>
        <linearGradient id="snekBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D9A4AC" />
          <stop offset="100%" stopColor="#B76E79" />
        </linearGradient>
        <radialGradient id="snekCheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8F4F5A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#8F4F5A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Tail curl */}
      <motion.path
        d="M18 96c-6-10-2-24 10-28 9-3 17 3 16 12-1 7-8 10-13 6"
        fill="none"
        stroke="url(#snekBody)"
        strokeWidth="14"
        strokeLinecap="round"
        animate={{ rotate: [0, 3, 0] }}
        style={{ transformOrigin: "20px 90px" }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Body */}
      <path
        d="M22 90 C10 60 20 30 46 20 C72 10 100 26 100 52"
        fill="none"
        stroke="url(#snekBody)"
        strokeWidth="22"
        strokeLinecap="round"
      />

      {/* Head */}
      <g>
        <circle cx="86" cy="46" r="27" fill="url(#snekBody)" />
        <circle cx="76" cy="54" r="7" fill="url(#snekCheek)" />
        <circle cx="97" cy="54" r="7" fill="url(#snekCheek)" />

        {/* Face content swapped per expression */}
        <FaceFeatures expression={expression} />
      </g>
    </motion.svg>
  );
}

function FaceFeatures({ expression }: { expression: MascotExpression }) {
  const eyeColor = "#2A1418";

  switch (expression) {
    case "happy":
      return (
        <g>
          <path d="M74 42 Q78 36 82 42" stroke={eyeColor} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M90 42 Q94 36 98 42" stroke={eyeColor} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M76 56 Q86 66 96 56" stroke={eyeColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M74 22 Q86 14 100 24" stroke="#F3D9DE" strokeWidth="2" fill="none" strokeLinecap="round" opacity={0.7} />
        </g>
      );
    case "proud":
      return (
        <g>
          <path d="M73 40 Q78 35 83 40" stroke={eyeColor} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M89 40 Q94 35 99 40" stroke={eyeColor} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M78 58 Q86 63 94 58" stroke={eyeColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <circle cx="60" cy="30" r="3" fill="#F3D9DE" opacity={0.8} />
          <circle cx="112" cy="36" r="2.4" fill="#F3D9DE" opacity={0.7} />
        </g>
      );
    case "focused":
      return (
        <g>
          <rect x="72" y="40" width="12" height="4" rx="2" fill={eyeColor} />
          <rect x="90" y="40" width="12" height="4" rx="2" fill={eyeColor} />
          <path d="M80 58 Q86 60 92 58" stroke={eyeColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
    case "worried":
      return (
        <g>
          <circle cx="78" cy="44" r="3.6" fill={eyeColor} />
          <circle cx="94" cy="44" r="3.6" fill={eyeColor} />
          <path d="M72 36 Q78 40 84 37" stroke={eyeColor} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M88 37 Q94 40 100 36" stroke={eyeColor} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M78 60 Q86 55 94 60" stroke={eyeColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
    case "shocked":
      return (
        <g>
          <circle cx="78" cy="44" r="5.4" fill={eyeColor} />
          <circle cx="94" cy="44" r="5.4" fill={eyeColor} />
          <circle cx="79.5" cy="42.2" r="1.4" fill="#F4EFF0" />
          <circle cx="95.5" cy="42.2" r="1.4" fill="#F4EFF0" />
          <ellipse cx="86" cy="61" rx="6" ry="7" fill={eyeColor} />
        </g>
      );
    case "sleeping":
      return (
        <g>
          <path d="M73 44 Q78 47 83 44" stroke={eyeColor} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M89 44 Q94 47 99 44" stroke={eyeColor} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M82 58 Q86 60 90 58" stroke={eyeColor} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <text x="98" y="24" fontSize="12" fill="#D9A4AC" opacity={0.9}>z</text>
          <text x="106" y="14" fontSize="9" fill="#D9A4AC" opacity={0.7}>z</text>
        </g>
      );
    case "neutral":
    default:
      return (
        <g>
          <circle cx="78" cy="44" r="3.4" fill={eyeColor} />
          <circle cx="94" cy="44" r="3.4" fill={eyeColor} />
          <path d="M79 58 Q86 61 93 58" stroke={eyeColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
  }
}
