import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Edit3, Trash2, Star } from 'lucide-react'
import { Photo } from '@/lib/storage'
import { PhotoLightbox } from './PhotoLightbox'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'

interface PhotoGridProps {
  photos: Photo[]
  onUpdatePhoto: (id: string, updates: Partial<Photo>) => void
  onDeletePhoto: (id: string) => void
  onReorder: (photos: Photo[]) => void
  sortBy: 'newest' | 'oldest' | 'favorites'
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  onUpdatePhoto,
  onDeletePhoto,
  onReorder,
  sortBy
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [draggedPhoto, setDraggedPhoto] = useState<Photo | null>(null)

  // Sort photos based on current sort option
  const sortedPhotos = React.useMemo(() => {
    const sorted = [...photos]
    
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      case 'oldest':
        return sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      case 'favorites':
        return sorted.sort((a, b) => {
          if (a.isFavorite && !b.isFavorite) return -1
          if (!a.isFavorite && b.isFavorite) return 1
          return b.createdAt.getTime() - a.createdAt.getTime()
        })
      default:
        return sorted
    }
  }, [photos, sortBy])

  const handlePhotoClick = useCallback((photo: Photo) => {
    setSelectedPhoto(photo)
  }, [])

  const handleCloseLightbox = useCallback(() => {
    setSelectedPhoto(null)
  }, [])

  const handleToggleFavorite = useCallback((photo: Photo) => {
    onUpdatePhoto(photo.id, { isFavorite: !photo.isFavorite })
  }, [onUpdatePhoto])

  const handleDeletePhoto = useCallback((photo: Photo) => {
    onDeletePhoto(photo.id)
    setSelectedPhoto(null)
  }, [onDeletePhoto])

  const handleDragStart = useCallback((photo: Photo) => {
    setDraggedPhoto(photo)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedPhoto(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetPhoto: Photo) => {
    e.preventDefault()
    
    if (!draggedPhoto || draggedPhoto.id === targetPhoto.id) return
    
    const draggedIndex = sortedPhotos.findIndex(p => p.id === draggedPhoto.id)
    const targetIndex = sortedPhotos.findIndex(p => p.id === targetPhoto.id)
    
    if (draggedIndex === -1 || targetIndex === -1) return
    
    const newPhotos = [...sortedPhotos]
    const [removed] = newPhotos.splice(draggedIndex, 1)
    newPhotos.splice(targetIndex, 0, removed)
    
    onReorder(newPhotos)
  }, [draggedPhoto, sortedPhotos, onReorder])

  if (photos.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="text-6xl mb-4">📸</div>
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
          No photos yet
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Add some photos to start building your gallery
        </p>
      </motion.div>
    )
  }

  return (
    <>
      <motion.div
        layout
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
      >
        <AnimatePresence>
          {sortedPhotos.map((photo, index) => (
            <motion.div
              key={photo.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              draggable
              onDragStart={() => handleDragStart(photo)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, photo)}
              className={cn(
                "group relative aspect-square rounded-lg overflow-hidden cursor-pointer",
                "hover:shadow-lg transition-all duration-300",
                draggedPhoto?.id === photo.id && "opacity-50 scale-95"
              )}
              onClick={() => handlePhotoClick(photo)}
            >
              {/* Photo */}
              <img
                src={URL.createObjectURL(new Blob([photo.data]))}
                alt={photo.caption || 'Photo'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
              
              {/* Favorite indicator */}
              {photo.isFavorite && (
                <div className="absolute top-2 right-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                </div>
              )}
              
              {/* Action buttons */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="w-8 h-8 bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleFavorite(photo)
                    }}
                  >
                    <Heart className={cn(
                      "w-4 h-4",
                      photo.isFavorite ? "text-red-500 fill-current" : "text-slate-600"
                    )} />
                  </Button>
                  
                  <Button
                    size="icon"
                    variant="secondary"
                    className="w-8 h-8 bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePhotoClick(photo)
                    }}
                  >
                    <Edit3 className="w-4 h-4 text-slate-600" />
                  </Button>
                  
                  <Button
                    size="icon"
                    variant="destructive"
                    className="w-8 h-8 bg-red-500/90 hover:bg-red-500"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePhoto(photo)
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </Button>
                </div>
              </div>
              
              {/* Caption preview */}
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-sm truncate">
                    {photo.caption}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Lightbox */}
      <PhotoLightbox
        photo={selectedPhoto}
        onClose={handleCloseLightbox}
        onUpdate={onUpdatePhoto}
        onDelete={handleDeletePhoto}
      />
    </>
  )
}
