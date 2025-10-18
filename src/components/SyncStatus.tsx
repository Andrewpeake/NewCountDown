import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Cloud, 
  Upload, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react'
import { PhotoStorage } from '@/lib/storage'
import { SyncStatus as SyncStatusType } from '@/lib/cloudStorage'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'

interface SyncStatusProps {
  onSync: () => void
  isSyncing: boolean
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ onSync, isSyncing }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>({
    isOnline: navigator.onLine,
    isUploading: false,
    isDownloading: false,
    lastSync: null,
    pendingUploads: 0,
    pendingDownloads: 0
  })

  useEffect(() => {
    // Load initial sync status
    loadSyncStatus()

    // Set up sync listeners
    const cleanup = PhotoStorage.setupSyncListeners(
      handleOnline,
      handleOffline,
      setSyncStatus
    )

    return cleanup
  }, [])

  const loadSyncStatus = async () => {
    try {
      const status = await PhotoStorage.getSyncStatus()
      setSyncStatus(status)
    } catch (error) {
      console.error('Error loading sync status:', error)
    }
  }

  const handleOnline = () => {
    console.log('App came online, syncing...')
    onSync()
  }

  const handleOffline = () => {
    console.log('App went offline')
  }

  const handleManualSync = async () => {
    try {
      onSync()
    } catch (error) {
      console.error('Error during manual sync:', error)
    }
  }

  const formatLastSync = (lastSync: Date | null) => {
    if (!lastSync) return 'Never'
    
    const now = new Date()
    const diff = now.getTime() - lastSync.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Online/Offline Status */}
            <div className="flex items-center gap-2">
              {syncStatus.isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium">
                {syncStatus.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Sync Status */}
            <div className="flex items-center gap-2">
              {syncStatus.isUploading || syncStatus.isDownloading ? (
                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
              ) : syncStatus.lastSync ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
              
              <span className="text-sm">
                {syncStatus.isUploading && 'Uploading...'}
                {syncStatus.isDownloading && 'Downloading...'}
                {!syncStatus.isUploading && !syncStatus.isDownloading && syncStatus.lastSync && 'Synced'}
                {!syncStatus.isUploading && !syncStatus.isDownloading && !syncStatus.lastSync && 'Not synced'}
              </span>
            </div>

            {/* Last Sync Time */}
            {syncStatus.lastSync && (
              <span className="text-xs text-slate-500">
                {formatLastSync(syncStatus.lastSync)}
              </span>
            )}
          </div>

          {/* Manual Sync Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualSync}
            disabled={!syncStatus.isOnline || isSyncing}
            className="flex items-center gap-2"
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Cloud className="w-4 h-4" />
            )}
            {isSyncing ? 'Syncing...' : 'Sync'}
          </Button>
        </div>

        {/* Pending Operations */}
        {(syncStatus.pendingUploads > 0 || syncStatus.pendingDownloads > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              {syncStatus.pendingUploads > 0 && (
                <div className="flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  <span>{syncStatus.pendingUploads} pending uploads</span>
                </div>
              )}
              {syncStatus.pendingDownloads > 0 && (
                <div className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  <span>{syncStatus.pendingDownloads} pending downloads</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
