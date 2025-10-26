import { get, set, del, keys } from 'idb-keyval'
import { CloudStorageService, CloudPhoto, SyncStatus } from './cloudStorage'

// Types for our data structures
export interface Photo {
  id: string
  data: ArrayBuffer
  createdAt: Date
  takenAt?: Date
  caption?: string
  isFavorite: boolean
  order: number
  cloudId?: string
  cloudUrl?: string
  lastSynced?: Date
  isUploading?: boolean
  uploadProgress?: number
}

export interface CountdownSettings {
  targetDate: string // ISO string
  timezone: string
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  countdown: CountdownSettings
}

// Default settings
const DEFAULT_COUNTDOWN: CountdownSettings = {
  targetDate: '2025-11-02T06:03:00.000Z', // Nov 2, 2025 12:03 AM America/Edmonton (UTC-6)
  timezone: 'America/Edmonton'
}

const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'system',
  countdown: DEFAULT_COUNTDOWN
}

// Photo storage using IndexedDB
export class PhotoStorage {
  private static readonly PHOTO_PREFIX = 'photo:'
  private static readonly ORDER_KEY = 'photo_order'

  static async savePhoto(photo: Omit<Photo, 'id'>): Promise<string> {
    const id = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const photoWithId: Photo = { ...photo, id }
    
    await set(`${this.PHOTO_PREFIX}${id}`, photoWithId)
    
    // Update order
    const order = await this.getPhotoOrder()
    order.push(id)
    await set(this.ORDER_KEY, order)
    
    return id
  }

  static async savePhotoWithId(photo: Photo): Promise<void> {
    // Save photo with existing ID (for synced photos)
    await set(`${this.PHOTO_PREFIX}${photo.id}`, photo)
    
    // Add to order if not already present
    const order = await this.getPhotoOrder()
    if (!order.includes(photo.id)) {
      order.push(photo.id)
      await set(this.ORDER_KEY, order)
    }
  }

  static async getPhoto(id: string): Promise<Photo | null> {
    return await get(`${this.PHOTO_PREFIX}${id}`) || null
  }

  static async getAllPhotos(): Promise<Photo[]> {
    const allKeys = await keys()
    const photoKeys = allKeys.filter(key => 
      typeof key === 'string' && key.startsWith(this.PHOTO_PREFIX)
    )
    
    const photos = await Promise.all(
      photoKeys.map(key => get(key))
    )
    
    return photos.filter((photo): photo is Photo => photo !== undefined)
  }

  static async deletePhoto(id: string): Promise<void> {
    // Get photo first to check if it has cloud metadata
    const photo = await this.getPhoto(id)
    
    if (!photo) {
      console.warn(`Photo with id ${id} not found`)
      return
    }
    
    // Delete from cloud if it exists there
    if (photo.cloudId) {
      try {
        console.log(`Deleting photo from Firebase: ${photo.cloudId}`)
        await CloudStorageService.deletePhoto(photo.cloudId)
        console.log(`Successfully deleted photo from Firebase: ${photo.cloudId}`)
      } catch (error) {
        console.error(`Failed to delete photo from Firebase (${photo.cloudId}):`, error)
        // Continue with local deletion even if cloud deletion fails
      }
    } else {
      console.log(`Photo ${id} has no cloudId, skipping Firebase deletion`)
    }
    
    // Delete from local storage
    await del(`${this.PHOTO_PREFIX}${id}`)
    
    // Update order
    const order = await this.getPhotoOrder()
    const newOrder = order.filter(photoId => photoId !== id)
    await set(this.ORDER_KEY, newOrder)
    
    console.log(`Successfully deleted photo locally: ${id}`)
  }

  static async updatePhoto(id: string, updates: Partial<Photo>): Promise<void> {
    const photo = await this.getPhoto(id)
    if (!photo) return
    
    const updatedPhoto = { ...photo, ...updates }
    await set(`${this.PHOTO_PREFIX}${id}`, updatedPhoto)
    
    // Update cloud if photo exists there
    if (photo.cloudId) {
      try {
        await CloudStorageService.updatePhoto(photo.cloudId, updates)
        console.log('Updated photo in cloud:', photo.cloudId)
      } catch (error) {
        console.error('Error updating photo in cloud:', error)
        // Continue even if cloud update fails
      }
    }
  }

  static async reorderPhotos(photoIds: string[]): Promise<void> {
    await set(this.ORDER_KEY, photoIds)
  }

  private static async getPhotoOrder(): Promise<string[]> {
    return await get(this.ORDER_KEY) || []
  }

  static async getPhotosInOrder(): Promise<Photo[]> {
    const order = await this.getPhotoOrder()
    const photos = await this.getAllPhotos()
    
    // Create a map for quick lookup
    const photoMap = new Map(photos.map(photo => [photo.id, photo]))
    
    // Return photos in the stored order, with any new photos at the end
    const orderedPhotos = order
      .map(id => photoMap.get(id))
      .filter((photo): photo is Photo => photo !== undefined)
    
    // Add any photos not in the order (new photos)
    const orderedIds = new Set(order)
    const unorderedPhotos = photos.filter(photo => !orderedIds.has(photo.id))
    
    return [...orderedPhotos, ...unorderedPhotos]
  }

  static async clearAllPhotos(): Promise<void> {
    const allKeys = await keys()
    const photoKeys = allKeys.filter(key => 
      typeof key === 'string' && key.startsWith(this.PHOTO_PREFIX)
    )
    
    await Promise.all(photoKeys.map(key => del(key)))
    await del(this.ORDER_KEY)
  }

  // Cloud sync methods
  static async syncWithCloud(): Promise<{
    uploaded: CloudPhoto[]
    downloaded: Photo[]
    conflicts: { local: Photo; cloud: CloudPhoto }[]
    cleaned: number
  }> {
    try {
      // First, clean up any invalid photos from cloud storage
      const cleanedCount = await CloudStorageService.cleanupInvalidPhotos()
      console.log(`Cleaned up ${cleanedCount} invalid photos from cloud storage`)
      
      const localPhotos = await this.getAllPhotos()
      const syncResult = await CloudStorageService.syncPhotos(localPhotos)
      
      // Update local photos with cloud metadata
      for (const cloudPhoto of syncResult.uploaded) {
        await this.updatePhoto(cloudPhoto.id, {
          cloudId: cloudPhoto.cloudId,
          cloudUrl: cloudPhoto.cloudUrl,
          lastSynced: cloudPhoto.lastSynced
        })
      }
      
      // Add downloaded photos to local storage (preserve original IDs)
      for (const photo of syncResult.downloaded) {
        console.log('Downloading photo to local storage:', {
          id: photo.id,
          exists: !!(await this.getPhoto(photo.id))
        })
        await this.savePhotoWithId(photo)
      }
      
      // Update last sync time
      localStorage.setItem('lastSync', new Date().toISOString())
      
      return { ...syncResult, cleaned: cleanedCount }
    } catch (error) {
      console.error('Error syncing with cloud:', error)
      throw error
    }
  }

  static async uploadPhotoToCloud(photoId: string): Promise<CloudPhoto> {
    try {
      const photo = await this.getPhoto(photoId)
      if (!photo) throw new Error('Photo not found')
      
      const cloudPhoto = await CloudStorageService.uploadPhoto(photo)
      
      // Update local photo with cloud metadata
      await this.updatePhoto(photoId, {
        cloudId: cloudPhoto.cloudId,
        cloudUrl: cloudPhoto.cloudUrl,
        lastSynced: cloudPhoto.lastSynced
      })
      
      return cloudPhoto
    } catch (error) {
      console.error('Error uploading photo to cloud:', error)
      throw error
    }
  }

  static async downloadPhotoFromCloud(cloudId: string): Promise<Photo> {
    try {
      const photo = await CloudStorageService.downloadPhoto(cloudId)
      await this.savePhoto(photo)
      return photo
    } catch (error) {
      console.error('Error downloading photo from cloud:', error)
      throw error
    }
  }

  static async getSyncStatus(): Promise<SyncStatus> {
    return await CloudStorageService.getSyncStatus()
  }

  static setupSyncListeners(
    onOnline: () => void,
    onOffline: () => void,
    onSyncStatusChange: (status: SyncStatus) => void
  ): () => void {
    return CloudStorageService.setupSyncListeners(onOnline, onOffline, onSyncStatusChange)
  }
}

// Settings storage using localStorage
export class SettingsStorage {
  private static readonly SETTINGS_KEY = 't_andrew_settings'

  static getSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY)
      if (!stored) return DEFAULT_APP_SETTINGS
      
      const parsed = JSON.parse(stored)
      return {
        ...DEFAULT_APP_SETTINGS,
        ...parsed,
        countdown: {
          ...DEFAULT_COUNTDOWN,
          ...parsed.countdown
        }
      }
    } catch {
      return DEFAULT_APP_SETTINGS
    }
  }

  static saveSettings(settings: AppSettings): void {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings))
  }

  static updateCountdown(countdown: CountdownSettings): void {
    const settings = this.getSettings()
    settings.countdown = countdown
    this.saveSettings(settings)
  }

  static updateTheme(theme: AppSettings['theme']): void {
    const settings = this.getSettings()
    settings.theme = theme
    this.saveSettings(settings)
  }

  static clearAllData(): void {
    localStorage.removeItem(this.SETTINGS_KEY)
    // Note: PhotoStorage.clearAllPhotos() should be called separately
  }
}

// Export/Import functionality
export interface ExportData {
  settings: AppSettings
  photos: Array<{
    id: string
    data: string // base64 encoded
    createdAt: string
    takenAt?: string
    caption?: string
    isFavorite: boolean
    order: number
  }>
  manifest: {
    version: string
    exportedAt: string
  }
}

export class DataExporter {
  static async exportData(): Promise<Blob> {
    const settings = SettingsStorage.getSettings()
    const photos = await PhotoStorage.getAllPhotos()
    
    const exportData: ExportData = {
      settings,
      photos: await Promise.all(photos.map(async photo => ({
        id: photo.id,
        data: await this.arrayBufferToBase64(photo.data),
        createdAt: photo.createdAt.toISOString(),
        takenAt: photo.takenAt?.toISOString(),
        caption: photo.caption,
        isFavorite: photo.isFavorite,
        order: photo.order
      }))),
      manifest: {
        version: '1.0.0',
        exportedAt: new Date().toISOString()
      }
    }

    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    
    // Add manifest
    zip.file('manifest.json', JSON.stringify(exportData.manifest, null, 2))
    
    // Add settings
    zip.file('settings.json', JSON.stringify(settings, null, 2))
    
    // Add photos
    const photosFolder = zip.folder('photos')
    if (photosFolder) {
      for (const photo of exportData.photos) {
        photosFolder.file(`${photo.id}.json`, JSON.stringify(photo, null, 2))
      }
    }
    
    return await zip.generateAsync({ type: 'blob' })
  }

  static async importData(file: File): Promise<void> {
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(file)
    
    // Read manifest
    const manifestFile = zip.file('manifest.json')
    if (!manifestFile) throw new Error('Invalid export file: missing manifest')
    
    const manifest = JSON.parse(await manifestFile.async('text'))
    if (manifest.version !== '1.0.0') {
      throw new Error(`Unsupported export version: ${manifest.version}`)
    }
    
    // Import settings
    const settingsFile = zip.file('settings.json')
    if (settingsFile) {
      const settings = JSON.parse(await settingsFile.async('text'))
      SettingsStorage.saveSettings(settings)
    }
    
    // Import photos
    const photosFolder = zip.folder('photos')
    if (photosFolder) {
      const photoFiles = Object.keys(photosFolder.files).filter(name => name.endsWith('.json'))
      
      for (const fileName of photoFiles) {
        const photoFile = photosFolder.file(fileName)
        if (photoFile) {
          const photoData = JSON.parse(await photoFile.async('text'))
          const photo: Photo = {
            id: photoData.id,
            data: this.base64ToArrayBuffer(photoData.data),
            createdAt: new Date(photoData.createdAt),
            takenAt: photoData.takenAt ? new Date(photoData.takenAt) : undefined,
            caption: photoData.caption,
            isFavorite: photoData.isFavorite,
            order: photoData.order
          }
          
          await set(`photo:${photo.id}`, photo)
        }
      }
    }
  }

  private static async arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }
}
