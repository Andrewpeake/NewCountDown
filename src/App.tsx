import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Camera, Settings as SettingsIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Countdown } from './components/Countdown'
import { Gallery } from './components/Gallery'
import { Settings } from './components/Settings'
import { CountdownEditor } from './components/CountdownEditor'
import { SettingsStorage } from './lib/storage'
import { cn } from './lib/utils'

function App() {
  const [activeTab, setActiveTab] = useState('countdown')
  const [isCountdownEditorOpen, setIsCountdownEditorOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  useEffect(() => {
    // Load theme from settings
    const settings = SettingsStorage.getSettings()
    setTheme(settings.theme)
    
    // Apply theme
    const root = document.documentElement
    if (settings.theme === 'dark') {
      root.classList.add('dark')
    } else if (settings.theme === 'light') {
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

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (settings.theme === 'system') {
        if (mediaQuery.matches) {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const handleCountdownEdit = () => {
    setIsCountdownEditorOpen(true)
  }

  const handleCountdownSave = () => {
    // Force re-render of countdown component
    setActiveTab('countdown')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700"
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white fill-current" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  T+Andrew
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Relationship countdown & photo gallery
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-16 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
            <div className="max-w-6xl mx-auto px-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="countdown" className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Countdown
                </TabsTrigger>
                <TabsTrigger value="gallery" className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Gallery
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <SettingsIcon className="w-4 h-4" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="min-h-screen">
            <TabsContent value="countdown" className="mt-0">
              <Countdown onEditClick={handleCountdownEdit} />
            </TabsContent>

            <TabsContent value="gallery" className="mt-0">
              <Gallery />
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <Settings />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      {/* Countdown Editor Modal */}
      <CountdownEditor
        isOpen={isCountdownEditorOpen}
        onClose={() => setIsCountdownEditorOpen(false)}
        onSave={handleCountdownSave}
      />

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 mt-12"
      >
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-slate-600 dark:text-slate-400">
            <p>Made with ❤️ for Tara & Andrew</p>
            <p className="mt-1">Built with React, TypeScript, and Tailwind CSS</p>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}

export default App
