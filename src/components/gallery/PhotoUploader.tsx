import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { parse } from 'exifr'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'

interface UploadProgress {
  file: File
  progress: number
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

interface PhotoUploaderProps {
  onPhotosAdded: (photos: Array<{
    data: ArrayBuffer
    takenAt?: Date
    caption?: string
  }>) => void
  disabled?: boolean
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  onPhotosAdded,
  disabled = false
}) => {
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const processFile = useCallback(async (file: File): Promise<{
    data: ArrayBuffer
    takenAt?: Date
    caption?: string
  }> => {
    try {
      // Compress image
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 3000,
        useWebWorker: true
      })

      // Convert to ArrayBuffer
      const arrayBuffer = await compressedFile.arrayBuffer()

      // Try to extract EXIF data
      let takenAt: Date | undefined
      try {
        const exifData = await parse(compressedFile)
        if (exifData?.DateTimeOriginal) {
          takenAt = new Date(exifData.DateTimeOriginal)
        } else if (exifData?.DateTime) {
          takenAt = new Date(exifData.DateTime)
        }
      } catch (exifError) {
        console.warn('Could not extract EXIF data:', exifError)
      }

      return {
        data: arrayBuffer,
        takenAt,
        caption: file.name.replace(/\.[^/.]+$/, '') // Use filename as initial caption
      }
    } catch (error) {
      throw new Error(`Failed to process ${file.name}: ${error}`)
    }
  }, [])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || acceptedFiles.length === 0) return

    setIsProcessing(true)
    
    // Initialize upload progress
    const initialUploads: UploadProgress[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }))
    
    setUploads(initialUploads)

    const processedPhotos: Array<{
      data: ArrayBuffer
      takenAt?: Date
      caption?: string
    }> = []

    // Process files one by one to avoid overwhelming the browser
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i]
      
      try {
        // Update status to processing
        setUploads(prev => prev.map((upload, index) => 
          index === i ? { ...upload, status: 'processing', progress: 50 } : upload
        ))

        const processed = await processFile(file)
        processedPhotos.push(processed)

        // Update status to completed
        setUploads(prev => prev.map((upload, index) => 
          index === i ? { ...upload, status: 'completed', progress: 100 } : upload
        ))

      } catch (error) {
        console.error('Error processing file:', error)
        
        // Update status to error
        setUploads(prev => prev.map((upload, index) => 
          index === i ? { 
            ...upload, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error'
          } : upload
        ))
      }
    }

    // Call the callback with processed photos
    if (processedPhotos.length > 0) {
      onPhotosAdded(processedPhotos)
    }

    // Clear uploads after a delay
    setTimeout(() => {
      setUploads([])
      setIsProcessing(false)
    }, 2000)
  }, [disabled, processFile, onPhotosAdded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    disabled: disabled || isProcessing
  })

  const removeUpload = useCallback((index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index))
  }, [])

  return (
    <div className="w-full">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
          isDragActive 
            ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" 
            : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "p-4 rounded-full",
            isDragActive 
              ? "bg-blue-100 dark:bg-blue-900/30" 
              : "bg-slate-100 dark:bg-slate-800"
          )}>
            {isDragActive ? (
              <Upload className="w-8 h-8 text-blue-500" />
            ) : (
              <ImageIcon className="w-8 h-8 text-slate-500" />
            )}
          </div>
          
          <div>
            <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
              {isDragActive ? 'Drop photos here' : 'Drag & drop photos here'}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              or click to select files
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
              Supports JPEG, PNG, GIF, WebP (max 2MB each)
            </p>
          </div>
        </div>
      </div>

      {/* Upload progress */}
      <AnimatePresence>
        {uploads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            {uploads.map((upload, index) => (
              <motion.div
                key={`${upload.file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {upload.file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {upload.progress}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {upload.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {upload.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  {upload.status === 'processing' && (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeUpload(index)}
                    className="w-6 h-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
