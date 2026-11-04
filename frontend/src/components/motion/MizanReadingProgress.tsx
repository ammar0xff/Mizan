import { motion, useScroll, useSpring } from "motion/react";

interface MizanReadingProgressProps {
  color?: string;
  height?: number;
}

export function MizanReadingProgress({
  color = "#B86B76",
  height = 3,
}: MizanReadingProgressProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 300,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{
        scaleX,
        backgroundColor: color,
        height,
      }}
      className="fixed top-0 start-0 end-0 z-50 origin-start pointer-events-none"
    />
  );
}
