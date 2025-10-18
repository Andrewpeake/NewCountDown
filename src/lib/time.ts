import { DateTime, Settings } from 'luxon'

// Configure Luxon to use the browser's timezone
Settings.defaultZone = 'system'

export interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number // total milliseconds
  isPast: boolean
}

export interface TimezoneInfo {
  name: string
  offset: string
  abbreviation: string
}

// Common timezones for the picker
export const COMMON_TIMEZONES: TimezoneInfo[] = [
  { name: 'America/Edmonton', offset: 'UTC-7/-6', abbreviation: 'MST/MDT' },
  { name: 'America/New_York', offset: 'UTC-5/-4', abbreviation: 'EST/EDT' },
  { name: 'America/Los_Angeles', offset: 'UTC-8/-7', abbreviation: 'PST/PDT' },
  { name: 'America/Chicago', offset: 'UTC-6/-5', abbreviation: 'CST/CDT' },
  { name: 'America/Denver', offset: 'UTC-7/-6', abbreviation: 'MST/MDT' },
  { name: 'Europe/London', offset: 'UTC+0/+1', abbreviation: 'GMT/BST' },
  { name: 'Europe/Paris', offset: 'UTC+1/+2', abbreviation: 'CET/CEST' },
  { name: 'Asia/Tokyo', offset: 'UTC+9', abbreviation: 'JST' },
  { name: 'Australia/Sydney', offset: 'UTC+10/+11', abbreviation: 'AEST/AEDT' },
  { name: 'UTC', offset: 'UTC+0', abbreviation: 'UTC' }
]

export class TimeUtils {
  /**
   * Parse a target date string and timezone into a DateTime object
   */
  static parseTargetDate(dateString: string, timezone: string): DateTime {
    try {
      // Handle empty or invalid date strings
      if (!dateString || dateString.trim() === '') {
        console.warn('Empty date string provided, using default date')
        return DateTime.fromISO('2025-11-02T06:03:00.000Z', { zone: timezone })
      }

      // Try to parse as ISO string first
      let dt = DateTime.fromISO(dateString)
      
      // If that fails or doesn't have timezone info, parse as local and convert
      if (!dt.isValid || !dt.zone) {
        dt = DateTime.fromISO(dateString, { zone: timezone })
      }
      
      if (!dt.isValid) {
        console.warn(`Invalid date string: ${dateString}, using default date`)
        return DateTime.fromISO('2025-11-02T06:03:00.000Z', { zone: timezone })
      }
      
      return dt
    } catch (error) {
      console.error('Error parsing target date:', error)
      // Fallback to default date
      return DateTime.fromISO('2025-11-02T06:03:00.000Z', { zone: timezone })
    }
  }

  /**
   * Calculate time remaining until target date
   */
  static calculateTimeRemaining(targetDate: string, timezone: string): TimeRemaining {
    const target = this.parseTargetDate(targetDate, timezone)
    const now = DateTime.now()
    
    const diff = target.diff(now, ['days', 'hours', 'minutes', 'seconds'])
    const isPast = target < now
    
    return {
      days: Math.max(0, Math.floor(Math.abs(diff.days))),
      hours: Math.max(0, Math.floor(Math.abs(diff.hours))),
      minutes: Math.max(0, Math.floor(Math.abs(diff.minutes))),
      seconds: Math.max(0, Math.floor(Math.abs(diff.seconds))),
      total: Math.abs(diff.toMillis()),
      isPast
    }
  }

  /**
   * Format a date for display
   */
  static formatDate(date: DateTime, format: 'short' | 'long' | 'time' = 'long'): string {
    switch (format) {
      case 'short':
        return date.toLocaleString(DateTime.DATE_SHORT)
      case 'long':
        return date.toLocaleString(DateTime.DATE_FULL)
      case 'time':
        return date.toLocaleString(DateTime.TIME_SIMPLE)
      default:
        return date.toLocaleString(DateTime.DATE_FULL)
    }
  }

  /**
   * Get timezone information for display
   */
  static getTimezoneInfo(timezone: string): TimezoneInfo {
    const dt = DateTime.now().setZone(timezone)
    return {
      name: timezone,
      offset: dt.offsetNameShort || 'UTC',
      abbreviation: dt.offsetNameShort || 'UTC'
    }
  }

  /**
   * Validate a date string
   */
  static isValidDate(dateString: string, timezone: string): boolean {
    const dt = this.parseTargetDate(dateString, timezone)
    return dt.isValid
  }

  /**
   * Get a preview of the target date in the specified timezone
   */
  static getDatePreview(dateString: string, timezone: string): string {
    const dt = this.parseTargetDate(dateString, timezone)
    if (!dt.isValid) return 'Invalid date'
    
    return dt.toLocaleString({
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  }

  /**
   * Convert a date to ISO string in the specified timezone
   */
  static toISOString(date: Date, timezone: string): string {
    const dt = DateTime.fromJSDate(date, { zone: timezone })
    return dt.toISO() || date.toISOString()
  }

  /**
   * Get current date in the specified timezone
   */
  static getCurrentDate(timezone: string): DateTime {
    return DateTime.now().setZone(timezone)
  }

  /**
   * Check if a timezone is valid
   */
  static isValidTimezone(timezone: string): boolean {
    try {
      const dt = DateTime.now().setZone(timezone)
      return dt.isValid
    } catch {
      return false
    }
  }

  /**
   * Get elapsed time since a past date
   */
  static getElapsedTime(pastDate: string, timezone: string): TimeRemaining {
    const past = this.parseTargetDate(pastDate, timezone)
    const now = DateTime.now()
    
    const diff = now.diff(past, ['days', 'hours', 'minutes', 'seconds'])
    
    return {
      days: Math.floor(diff.days),
      hours: Math.floor(diff.hours),
      minutes: Math.floor(diff.minutes),
      seconds: Math.floor(diff.seconds),
      total: diff.toMillis(),
      isPast: true
    }
  }
}
