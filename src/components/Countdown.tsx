import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Calendar, Clock } from 'lucide-react'
import { FlipUnit } from './FlipUnit'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { TimeUtils, TimeRemaining } from '@/lib/time'
import { SettingsStorage } from '@/lib/storage'

interface CountdownProps {
  onEditClick: () => void
}

export const Countdown: React.FC<CountdownProps> = ({ onEditClick }) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
    isPast: false
  })
  const [targetDate, setTargetDate] = useState('')
  const [timezone, setTimezone] = useState('America/Edmonton')

  useEffect(() => {
    // Load settings
    const settings = SettingsStorage.getSettings()
    setTargetDate(settings.countdown.targetDate)
    setTimezone(settings.countdown.timezone)

    // Calculate initial time
    const initial = TimeUtils.calculateTimeRemaining(settings.countdown.targetDate, settings.countdown.timezone)
    setTimeRemaining(initial)

    // Update every second
    const interval = setInterval(() => {
      const current = TimeUtils.calculateTimeRemaining(settings.countdown.targetDate, settings.countdown.timezone)
      setTimeRemaining(current)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatDate = (dateString: string, tz: string) => {
    const dt = TimeUtils.parseTargetDate(dateString, tz)
    return TimeUtils.formatDate(dt, 'long')
  }

  const formatTime = (dateString: string, tz: string) => {
    const dt = TimeUtils.parseTargetDate(dateString, tz)
    return TimeUtils.formatDate(dt, 'time')
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200">
            Tara
          </span>
          <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-pink-500 fill-current" />
          <span className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200">
            Andrew
          </span>
        </div>
        
        <div className="flex items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatDate(targetDate, timezone)}</span>
          </div>
        </div>
      </motion.div>

      {/* Main countdown */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="mb-8"
      >
        <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-0 shadow-2xl">
          <CardContent className="p-8 sm:p-12">
            {timeRemaining.isPast ? (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mb-6"
                >
                  <div className="text-6xl sm:text-8xl mb-4">✈️</div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                    She's here!
                  </h2>
                  <p className="text-lg text-slate-600 dark:text-slate-400">
                    Time since arrival
                  </p>
                </motion.div>
                
                <div className="flex justify-center gap-4 sm:gap-8">
                  <FlipUnit value={timeRemaining.days} label="Days" />
                  <FlipUnit value={timeRemaining.hours} label="Hours" />
                  <FlipUnit value={timeRemaining.minutes} label="Minutes" />
                  <FlipUnit value={timeRemaining.seconds} label="Seconds" />
                </div>
              </div>
            ) : (
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mb-8"
                >
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Time Until We're Together
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    {formatDate(targetDate, timezone)} at {formatTime(targetDate, timezone)}
                  </p>
                </motion.div>
                
                <div className="flex justify-center gap-4 sm:gap-8">
                  <FlipUnit value={timeRemaining.days} label="Days" />
                  <FlipUnit value={timeRemaining.hours} label="Hours" />
                  <FlipUnit value={timeRemaining.minutes} label="Minutes" />
                  <FlipUnit value={timeRemaining.seconds} label="Seconds" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="text-center"
      >
        <Button
          onClick={onEditClick}
          variant="outline"
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Change date/time
        </Button>
      </motion.div>
    </div>
  )
}
