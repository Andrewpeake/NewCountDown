import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings as SettingsIcon, 
  Download, 
  Upload, 
  Trash2, 
  Palette,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { SettingsStorage, DataExporter, AppSettings } from '@/lib/storage'
import { TimeUtils, COMMON_TIMEZONES } from '@/lib/time'

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(SettingsStorage.getSettings())
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showSampleData, setShowSampleData] = useState(false)

  useEffect(() => {
    setSettings(SettingsStorage.getSettings())
  }, [])

  const handleThemeChange = (theme: AppSettings['theme']) => {
    const newSettings = { ...settings, theme }
    setSettings(newSettings)
    SettingsStorage.updateTheme(theme)
    
    // Apply theme to document
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }

  const handleCountdownChange = (field: 'targetDate' | 'timezone', value: string) => {
    const newCountdown = { ...settings.countdown, [field]: value }
    const newSettings = { ...settings, countdown: newCountdown }
    setSettings(newSettings)
    SettingsStorage.updateCountdown(newCountdown)
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const blob = await DataExporter.exportData()
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `t-andrew-backup-${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsImporting(true)
      setImportError(null)
      await DataExporter.importData(file)
      
      // Reload settings
      setSettings(SettingsStorage.getSettings())
      
      // Reload page to refresh all data
      window.location.reload()
    } catch (error) {
      console.error('Import failed:', error)
      setImportError(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  const handleClearData = async () => {
    try {
      await import('@/lib/storage').then(({ PhotoStorage, SettingsStorage }) => {
        PhotoStorage.clearAllPhotos()
        SettingsStorage.clearAllData()
      })
      
      // Reload page
      window.location.reload()
    } catch (error) {
      console.error('Clear data failed:', error)
    }
  }

  const handleLoadSampleData = async () => {
    try {
      setShowSampleData(true)
      
      // Create sample photos
      const samplePhotos = [
        { name: 'sunset.jpg', caption: 'Beautiful sunset together' },
        { name: 'dinner.jpg', caption: 'Romantic dinner date' },
        { name: 'hiking.jpg', caption: 'Adventure in the mountains' },
        { name: 'beach.jpg', caption: 'Day at the beach' },
        { name: 'coffee.jpg', caption: 'Morning coffee together' },
        { name: 'city.jpg', caption: 'Exploring the city' }
      ]

      // Create placeholder images
      for (let i = 0; i < samplePhotos.length; i++) {
        const { name, caption } = samplePhotos[i]
        
        // Create a simple colored rectangle as placeholder
        const canvas = document.createElement('canvas')
        canvas.width = 800
        canvas.height = 600
        const ctx = canvas.getContext('2d')!
        
        // Random gradient background
        const colors = [
          ['#FF6B6B', '#4ECDC4'],
          ['#45B7D1', '#96CEB4'],
          ['#FFEAA7', '#DDA0DD'],
          ['#74B9FF', '#0984E3'],
          ['#FD79A8', '#FDCB6E'],
          ['#6C5CE7', '#A29BFE']
        ]
        
        const [color1, color2] = colors[i % colors.length]
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        gradient.addColorStop(0, color1)
        gradient.addColorStop(1, color2)
        
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Add text
        ctx.fillStyle = 'white'
        ctx.font = 'bold 48px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(name.replace('.jpg', '').toUpperCase(), canvas.width / 2, canvas.height / 2)
        
        // Convert to blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8)
        })
        
        const arrayBuffer = await blob.arrayBuffer()
        
        // Save photo
        const { PhotoStorage } = await import('@/lib/storage')
        await PhotoStorage.savePhoto({
          data: arrayBuffer,
          createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // Spread over days
          caption,
          isFavorite: i < 2, // First two are favorites
          order: i
        })
      }
      
      // Reload page to show sample data
      window.location.reload()
    } catch (error) {
      console.error('Error loading sample data:', error)
    }
  }

  const getDatePreview = () => {
    if (!settings.countdown.targetDate || !settings.countdown.timezone) return ''
    return TimeUtils.getDatePreview(settings.countdown.targetDate, settings.countdown.timezone)
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
            Settings
          </h2>
        </div>
      </motion.div>

      <div className="space-y-6">
        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Theme
                </label>
                <div className="flex gap-2">
                  {(['light', 'dark', 'system'] as const).map((theme) => (
                    <Button
                      key={theme}
                      size="sm"
                      variant={settings.theme === theme ? "default" : "outline"}
                      onClick={() => handleThemeChange(theme)}
                      className="capitalize"
                    >
                      {theme}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Countdown Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Countdown Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Target Date & Time
                </label>
                <Input
                  type="datetime-local"
                  value={settings.countdown.targetDate ? 
                    new Date(settings.countdown.targetDate).toISOString().slice(0, 16) : ''
                  }
                  onChange={(e) => {
                    const isoString = e.target.value ? new Date(e.target.value).toISOString() : ''
                    handleCountdownChange('targetDate', isoString)
                  }}
                  className="mb-2"
                />
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  {getDatePreview()}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Timezone
                </label>
                <select
                  value={settings.countdown.timezone}
                  onChange={(e) => handleCountdownChange('timezone', e.target.value)}
                  className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz.name} value={tz.name}>
                      {tz.name} ({tz.abbreviation})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? 'Exporting...' : 'Export Data'}
                </Button>

                <div className="relative">
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('import-file')?.click()}
                    disabled={isImporting}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {isImporting ? 'Importing...' : 'Import Data'}
                  </Button>
                  <input
                    id="import-file"
                    type="file"
                    accept=".zip"
                    onChange={handleImport}
                    className="hidden"
                  />
                </div>
              </div>

              {importError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{importError}</span>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadSampleData}
                  disabled={showSampleData}
                  className="flex items-center gap-2 mb-4"
                >
                  <CheckCircle className="w-4 h-4" />
                  {showSampleData ? 'Loading Sample Data...' : 'Load Sample Data'}
                </Button>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Add 6 sample photos to see the gallery layout
                </p>
              </div>

              <div className="border-t pt-4">
                <Button
                  variant="destructive"
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Data
                </Button>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                  This will permanently delete all photos and settings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clear confirmation dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Confirm Clear Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Are you sure you want to clear all data? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleClearData}
                  className="flex-1"
                >
                  Yes, Clear All Data
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
