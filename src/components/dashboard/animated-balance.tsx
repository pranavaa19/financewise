"use client"

import { useEffect, useState } from 'react';
import { motion, useSpring, useInView } from 'framer-motion';
import { formatIndianCurrency } from '@/lib/utils';
import { useRef } from 'react';

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  const [displayValue, setDisplayValue] = useState(0);

  const spring = useSpring(0, {
    damping: 20,
    stiffness: 100,
  });

  useEffect(() => {
    if (isInView) {
        spring.set(value);
    }
  }, [spring, value, isInView]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
        setDisplayValue(latest);
    });
    return unsubscribe;
  }, [spring]);

  return <span ref={ref}>{formatIndianCurrency(displayValue)}</span>;
}


export function AnimatedBalance({ value }: { value: number }) {
  return (
    <motion.span>
        <AnimatedNumber value={value} />
    </motion.span>
  );
}
