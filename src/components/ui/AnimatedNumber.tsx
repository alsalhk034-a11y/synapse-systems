import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'

interface Props {
  value: number
  duration?: number
  format?: (n: number) => string
  className?: string
}

export function AnimatedNumber({ value, duration = 0.8, format, className }: Props) {
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 })
  const display = useTransform(spring, (v) => (format ? format(v) : Math.round(v).toLocaleString()))

  useEffect(() => {
    mv.set(value)
  }, [value, mv])

  return <motion.span className={className}>{display}</motion.span>
}
