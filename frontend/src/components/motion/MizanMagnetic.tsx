import { useRef, useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { SPRINGS } from "@/lib/motion";

interface MizanMagneticProps {
  children: React.ReactNode;
  className?: string;
  pullStrength?: number; // 0.1 to 0.4 recommended
}

export function MizanMagnetic({
  children,
  className = "",
  pullStrength = 0.22,
}: MizanMagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const shouldReduceMotion = useReducedMotion();
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  if (shouldReduceMotion || isTouch) {
    return <div className={className}>{children}</div>;
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = (e.clientX - centerX) * pullStrength;
    const distanceY = (e.clientY - centerY) * pullStrength;
    setPosition({ x: distanceX, y: distanceY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={SPRINGS.tactile}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}
