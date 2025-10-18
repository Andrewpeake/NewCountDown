import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FlipUnitProps {
  value: number
  label: string
  className?: string
}

export const FlipUnit: React.FC<FlipUnitProps> = ({ value, label, className }) => {
  const [displayValue, setDisplayValue] = useState(value)
  const [isFlipping, setIsFlipping] = useState(false)

  useEffect(() => {
    if (value !== displayValue) {
      setIsFlipping(true)
      
      // Small delay to show the flip animation
      const timer = setTimeout(() => {
        setDisplayValue(value)
        setIsFlipping(false)
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [value, displayValue])

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative">
        {/* Background card */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg shadow-lg flex items-center justify-center">
          <span className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200">
            {displayValue.toString().padStart(2, '0')}
          </span>
        </div>
        
        {/* Flip animation overlay */}
        <AnimatePresence>
          {isFlipping && (
            <motion.div
              key={`flip-${value}`}
              initial={{ rotateX: 0, opacity: 1 }}
              animate={{ rotateX: -90, opacity: 0 }}
              exit={{ rotateX: 90, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 rounded-lg shadow-lg flex items-center justify-center"
            >
              <span className="text-2xl sm:text-3xl font-bold text-blue-800 dark:text-blue-200">
                {value.toString().padStart(2, '0')}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mt-2 uppercase tracking-wide">
        {label}
      </span>
    </div>
  )
}
