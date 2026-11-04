/**
 * Mizan Warm Editorial Luxury — Motion Configuration & Tokens
 *
 * Centralized easing curves, duration tokens, spring presets,
 * and Framer Motion animation variants tailored for Arabic (RTL) & English (LTR).
 */

import { Variants } from "motion/react";

// ── Editorial Easing Curves ──
export const EASINGS = {
  // Signature silk curve: fast start, long elegant deceleration
  editorial: [0.16, 1, 0.3, 1] as const,
  // Majestic for larger hero & section reveals
  editorialSlow: [0.22, 1, 0.36, 1] as const,
  // Snappy for UI micro-interactions, buttons, pills
  snappy: [0.25, 1, 0.5, 1] as const,
  // Smooth symmetric ease for continuous transitions
  smooth: [0.4, 0, 0.2, 1] as const,
};

// ── Duration Tokens (Seconds) ──
export const DURATIONS = {
  micro: 0.15,
  fast: 0.25,
  normal: 0.45,
  expressive: 0.75,
  cinematic: 1.1,
};

// ── Spring Physics Presets ──
export const SPRINGS = {
  // Tactile click / press
  tactile: { type: "spring" as const, stiffness: 450, damping: 30 },
  // Smooth floating / hover
  floating: { type: "spring" as const, stiffness: 180, damping: 20 },
  // Snappy layout transition (tabs, layoutId)
  layout: { type: "spring" as const, stiffness: 350, damping: 28 },
  // Gentle elastic pop for badges / checkmarks
  bouncy: { type: "spring" as const, stiffness: 400, damping: 18 },
};

// ── Core Framer Motion Variants ──

/**
 * Standard fade & subtle lift for section headings and content blocks
 */
export const fadeUpVariant: Variants = {
  hidden: {
    opacity: 0,
    y: 28,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATIONS.expressive,
      ease: EASINGS.editorial,
    },
  },
};

/**
 * Pure fade in for overlays, glows, and ambient elements
 */
export const fadeInVariant: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.smooth,
    },
  },
};

/**
 * Container orchestrator for staggered child animations
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerTight: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

export const staggerContainerRelaxed: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

/**
 * Editorial masked clip reveal from bottom
 */
export const clipRevealVariant: Variants = {
  hidden: {
    clipPath: "inset(100% 0% 0% 0%)",
    opacity: 0,
  },
  visible: {
    clipPath: "inset(0% 0% 0% 0%)",
    opacity: 1,
    transition: {
      duration: DURATIONS.expressive,
      ease: EASINGS.editorial,
    },
  },
};

/**
 * Card tactile hover & elevation
 */
export const cardHoverProps = {
  whileHover: {
    y: -4,
    transition: { duration: DURATIONS.fast, ease: EASINGS.snappy },
  },
  whileTap: {
    y: 0,
    scale: 0.99,
    transition: { duration: DURATIONS.micro },
  },
};

/**
 * Page entrance transition
 */
export const pageTransitionVariant: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.editorial,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.smooth,
    },
  },
};
