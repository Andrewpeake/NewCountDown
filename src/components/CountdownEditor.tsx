import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Globe, Check, X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { SettingsStorage } from '@/lib/storage'
import { TimeUtils, COMMON_TIMEZONES } from '@/lib/time'
import { cn } from '@/lib/utils'

interface CountdownEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export const CountdownEditor: React.FC<CountdownEditorProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [targetDate, setTargetDate] = useState('')
  const [targetTime, setTargetTime] = useState('')
  const [timezone, setTimezone] = useState('America/Edmonton')
  const [preview, setPreview] = useState('')
  const [isValid, setIsValid] = useState(true)

  useEffect(() => {
    if (isOpen) {
      // Load current settings
      const settings = SettingsStorage.getSettings()
      const currentDate = new Date(settings.countdown.targetDate)
      
      setTargetDate(currentDate.toISOString().slice(0, 10))
      setTargetTime(currentDate.toTimeString().slice(0, 5))
      setTimezone(settings.countdown.timezone)
    }
  }, [isOpen])

  useEffect(() => {
    if (targetDate && targetTime && timezone) {
      try {
        // Combine date and time
        const dateTimeString = `${targetDate}T${targetTime}:00`
        const dt = new Date(dateTimeString)
        
        // Convert to the selected timezone
        const isoString = dt.toISOString()
        
        // Validate the date
        const isValidDate = TimeUtils.isValidDate(isoString, timezone)
        setIsValid(isValidDate)
        
        if (isValidDate) {
          const previewText = TimeUtils.getDatePreview(isoString, timezone)
          setPreview(previewText)
        } else {
          setPreview('Invalid date')
        }
      } catch (error) {
        setIsValid(false)
        setPreview('Invalid date')
      }
    }
  }, [targetDate, targetTime, timezone])

  const handleSave = () => {
    if (!isValid || !targetDate || !targetTime) return

    try {
      // Combine date and time
      const dateTimeString = `${targetDate}T${targetTime}:00`
      const dt = new Date(dateTimeString)
      const isoString = dt.toISOString()

      // Update settings
      SettingsStorage.updateCountdown({
        targetDate: isoString,
        timezone
      })

      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving countdown settings:', error)
    }
  }

  const handleCancel = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Edit Countdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Input */}
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Target Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Time Input */}
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Target Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="time"
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Timezone Select */}
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Timezone
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full h-10 px-3 py-2 pl-10 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz.name} value={tz.name}>
                      {tz.name} ({tz.abbreviation})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                Preview:
              </p>
              <p className={cn(
                "text-sm font-medium",
                isValid ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {preview || 'Select date and time'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={!isValid || !targetDate || !targetTime}
                className="flex-1 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Save
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
