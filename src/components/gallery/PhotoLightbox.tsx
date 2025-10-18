import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Edit3, Trash2, Star } from 'lucide-react'
import { Photo } from '@/lib/storage'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { cn } from '@/lib/utils'

interface PhotoLightboxProps {
  photo: Photo | null
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Photo>) => void
  onDelete: (id: string) => void
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photo,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [isEditingCaption, setIsEditingCaption] = useState(false)
  const [caption, setCaption] = useState('')

  useEffect(() => {
    if (photo) {
      setCaption(photo.caption || '')
    }
  }, [photo])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (photo) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = 'unset'
      }
    }
  }, [photo, handleKeyDown])

  const handleSaveCaption = useCallback(() => {
    if (photo) {
      onUpdate(photo.id, { caption: caption.trim() || undefined })
      setIsEditingCaption(false)
    }
  }, [photo, caption, onUpdate])

  const handleCancelEdit = useCallback(() => {
    setCaption(photo?.caption || '')
    setIsEditingCaption(false)
  }, [photo])

  const handleToggleFavorite = useCallback(() => {
    if (photo) {
      onUpdate(photo.id, { isFavorite: !photo.isFavorite })
    }
  }, [photo, onUpdate])

  const handleDelete = useCallback(() => {
    if (photo && window.confirm('Are you sure you want to delete this photo?')) {
      onDelete(photo.id)
      onClose()
    }
  }, [photo, onDelete, onClose])

  if (!photo) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      >
        <div className="flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Photo */}
            <div className="relative">
              <img
                src={URL.createObjectURL(new Blob([photo.data]))}
                alt={photo.caption || 'Photo'}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
              
              {/* Favorite indicator */}
              {photo.isFavorite && (
                <div className="absolute top-4 left-4">
                  <Star className="w-6 h-6 text-yellow-400 fill-current" />
                </div>
              )}
            </div>

            {/* Photo info */}
            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              {/* Caption */}
              <div className="mb-4">
                {isEditingCaption ? (
                  <div className="flex gap-2">
                    <Input
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Add a caption..."
                      className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/70"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveCaption}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="border-white/30 text-white hover:bg-white/20"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-white text-lg">
                      {photo.caption || 'No caption'}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingCaption(true)}
                      className="text-white hover:bg-white/20"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleToggleFavorite}
                    className={cn(
                      "bg-white/20 hover:bg-white/30 text-white",
                      photo.isFavorite && "bg-yellow-500/20 hover:bg-yellow-500/30"
                    )}
                  >
                    <Heart className={cn(
                      "w-4 h-4 mr-2",
                      photo.isFavorite && "text-yellow-400 fill-current"
                    )} />
                    {photo.isFavorite ? 'Favorited' : 'Add to Favorites'}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDelete}
                    className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-400/30"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Photo metadata */}
              <div className="mt-4 text-sm text-white/70">
                <p>Added: {photo.createdAt.toLocaleDateString()}</p>
                {photo.takenAt && (
                  <p>Taken: {photo.takenAt.toLocaleDateString()}</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
