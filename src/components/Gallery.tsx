import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, Star, Calendar, Filter, CloudOff } from 'lucide-react'
import { Photo, PhotoStorage } from '@/lib/storage'
import { PhotoGrid } from './gallery/PhotoGrid'
import { PhotoUploader } from './gallery/PhotoUploader'
import { SyncStatus } from './SyncStatus'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

type SortOption = 'newest' | 'oldest' | 'favorites'

export const Gallery: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  // Load photos on mount
  useEffect(() => {
    loadPhotos()
  }, [])

  const loadPhotos = useCallback(async () => {
    try {
      setIsLoading(true)
      const loadedPhotos = await PhotoStorage.getPhotosInOrder()
      setPhotos(loadedPhotos)
    } catch (error) {
      console.error('Error loading photos:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handlePhotosAdded = useCallback(async (newPhotos: Array<{
    data: ArrayBuffer
    takenAt?: Date
    caption?: string
  }>) => {
    try {
      const photosToAdd = await Promise.all(
        newPhotos.map(async (photoData, index) => {
          const photo: Omit<Photo, 'id'> = {
            data: photoData.data,
            createdAt: new Date(),
            takenAt: photoData.takenAt,
            caption: photoData.caption,
            isFavorite: false,
            order: photos.length + index
          }
          
          const id = await PhotoStorage.savePhoto(photo)
          return { ...photo, id }
        })
      )

      setPhotos(prev => [...prev, ...photosToAdd])
    } catch (error) {
      console.error('Error adding photos:', error)
    }
  }, [photos.length])

  const handleUpdatePhoto = useCallback(async (id: string, updates: Partial<Photo>) => {
    try {
      await PhotoStorage.updatePhoto(id, updates)
      setPhotos(prev => prev.map(photo => 
        photo.id === id ? { ...photo, ...updates } : photo
      ))
    } catch (error) {
      console.error('Error updating photo:', error)
    }
  }, [])

  const handleDeletePhoto = useCallback(async (id: string) => {
    try {
      await PhotoStorage.deletePhoto(id)
      setPhotos(prev => prev.filter(photo => photo.id !== id))
    } catch (error) {
      console.error('Error deleting photo:', error)
    }
  }, [])

  const handleReorder = useCallback(async (reorderedPhotos: Photo[]) => {
    try {
      const photoIds = reorderedPhotos.map(photo => photo.id)
      await PhotoStorage.reorderPhotos(photoIds)
      setPhotos(reorderedPhotos)
    } catch (error) {
      console.error('Error reordering photos:', error)
    }
  }, [])

  const handleSync = useCallback(async () => {
    try {
      setIsSyncing(true)
      setSyncError(null)
      
      const syncResult = await PhotoStorage.syncWithCloud()
      
      // Reload photos to show updated data
      await loadPhotos()
      
      console.log('Sync completed:', {
        uploaded: syncResult.uploaded.length,
        downloaded: syncResult.downloaded.length,
        conflicts: syncResult.conflicts.length,
        cleaned: syncResult.cleaned
      })
      
      if (syncResult.conflicts.length > 0) {
        console.warn('Sync conflicts detected:', syncResult.conflicts)
        // In a real app, you'd show a conflict resolution UI
      }
    } catch (error) {
      console.error('Sync failed:', error)
      setSyncError(error instanceof Error ? error.message : 'Sync failed')
    } finally {
      setIsSyncing(false)
    }
  }, [])

  const handleUploadToCloud = useCallback(async (photoId: string) => {
    try {
      await PhotoStorage.uploadPhotoToCloud(photoId)
      await loadPhotos() // Reload to show updated cloud status
    } catch (error) {
      console.error('Error uploading photo to cloud:', error)
    }
  }, [])

  const sortOptions: Array<{ value: SortOption; label: string; icon: React.ReactNode }> = [
    { value: 'newest', label: 'Newest', icon: <Calendar className="w-4 h-4" /> },
    { value: 'oldest', label: 'Oldest', icon: <Calendar className="w-4 h-4" /> },
    { value: 'favorites', label: 'Favorites', icon: <Star className="w-4 h-4" /> }
  ]

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">
              Our Photos
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'} in your gallery
            </p>
          </div>
        </div>

        {/* Sync Status */}
        <SyncStatus onSync={handleSync} isSyncing={isSyncing} />

        {/* Sync Error */}
        {syncError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
          >
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <CloudOff className="w-4 h-4" />
              <span className="text-sm">Sync failed: {syncError}</span>
            </div>
          </motion.div>
        )}

        {/* Upload section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Add Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoUploader onPhotosAdded={handlePhotosAdded} />
          </CardContent>
        </Card>

        {/* Sort controls */}
        {photos.length > 0 && (
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Sort by:
              </span>
            </div>
            
            <div className="flex gap-2">
              {sortOptions.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={sortBy === option.value ? "default" : "outline"}
                  onClick={() => setSortBy(option.value)}
                  className="flex items-center gap-2"
                >
                  {option.icon}
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Photo grid */}
      <PhotoGrid
        photos={photos}
        onUpdatePhoto={handleUpdatePhoto}
        onDeletePhoto={handleDeletePhoto}
        onReorder={handleReorder}
        onUploadToCloud={handleUploadToCloud}
        sortBy={sortBy}
      />
    </div>
  )
}
