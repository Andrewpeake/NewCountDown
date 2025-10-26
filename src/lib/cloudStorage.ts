import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject
} from 'firebase/storage'
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  orderBy, 
  getDocs
} from 'firebase/firestore'
import { storage, db } from './firebase'
import { Photo } from './storage'

export interface CloudPhoto extends Photo {
  cloudId: string
  cloudUrl: string
  lastSynced: Date
  isUploading?: boolean
  uploadProgress?: number
}

export interface SyncStatus {
  isOnline: boolean
  isUploading: boolean
  isDownloading: boolean
  lastSync: Date | null
  pendingUploads: number
  pendingDownloads: number
}

export class CloudStorageService {
  private static readonly PHOTOS_COLLECTION = 'photos'
  private static readonly STORAGE_PATH = 'photos'

  /**
   * Upload a photo to cloud storage
   */
  static async uploadPhoto(photo: Photo): Promise<CloudPhoto> {
    try {
      // Check if Firebase is properly configured
      if (!storage) {
        throw new Error('Firebase Storage not initialized. Please configure Firebase.')
      }

      const cloudId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const storageRef = ref(storage, `${this.STORAGE_PATH}/${cloudId}`)
      
      // Upload the photo data
      const uploadTask = await uploadBytes(storageRef, photo.data)
      const cloudUrl = await getDownloadURL(uploadTask.ref)
      
      // Create cloud photo document
      const cloudPhoto: CloudPhoto = {
        ...photo,
        cloudId,
        cloudUrl,
        lastSynced: new Date()
      }
      
      // Save metadata to Firestore (filter out undefined values)
      const firestoreData: any = {
        id: photo.id,
        cloudId,
        cloudUrl,
        createdAt: photo.createdAt,
        caption: photo.caption || '',
        isFavorite: photo.isFavorite || false,
        order: photo.order || 0,
        lastSynced: new Date()
      }
      
      // Only include takenAt if it's not undefined
      if (photo.takenAt) {
        firestoreData.takenAt = photo.takenAt
      }
      
      // Debug: Log the data being sent to Firestore
      console.log('Uploading photo to Firestore:', {
        cloudId,
        takenAt: photo.takenAt,
        firestoreData
      })
      
      await setDoc(doc(db, this.PHOTOS_COLLECTION, cloudId), firestoreData)
      
      return cloudPhoto
    } catch (error) {
      console.error('Error uploading photo to cloud:', error)
      throw error
    }
  }

  /**
   * Download a photo from cloud storage
   */
  static async downloadPhoto(cloudId: string): Promise<Photo> {
    try {
      // Check if Firebase is properly configured
      if (!storage) {
        throw new Error('Firebase Storage not initialized. Please configure Firebase.')
      }
      
      // Get metadata from Firestore
      const docRef = doc(db, this.PHOTOS_COLLECTION, cloudId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        throw new Error('Photo not found in cloud')
      }
      
      const data = docSnap.data()
      
      // Debug: Log the download attempt
      console.log('Downloading photo from cloud:', {
        cloudId,
        cloudUrl: data.cloudUrl,
        hasCloudUrl: !!data.cloudUrl
      })
      
      // Get a fresh download URL from Firebase Storage
      const storageRef = ref(storage, `${this.STORAGE_PATH}/${cloudId}`)
      const freshCloudUrl = await getDownloadURL(storageRef)
      
      // Download the actual photo data using the fresh URL
      const response = await fetch(freshCloudUrl)
      
      if (!response.ok) {
        throw new Error(`Failed to download photo: ${response.status} ${response.statusText}`)
      }
      
      const arrayBuffer = await response.arrayBuffer()
      
      return {
        id: data.id,
        data: arrayBuffer,
        createdAt: data.createdAt.toDate(),
        takenAt: data.takenAt?.toDate(),
        caption: data.caption,
        isFavorite: data.isFavorite,
        order: data.order
      }
    } catch (error) {
      console.error('Error downloading photo from cloud:', error)
      throw error
    }
  }

  /**
   * Update photo metadata in cloud
   */
  static async updatePhoto(cloudId: string, updates: Partial<Photo>): Promise<void> {
    try {
      const docRef = doc(db, this.PHOTOS_COLLECTION, cloudId)
      
      // Filter out undefined values
      const filteredUpdates: any = {
        lastSynced: new Date()
      }
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          filteredUpdates[key] = value
        }
      })
      
      await updateDoc(docRef, filteredUpdates)
    } catch (error) {
      console.error('Error updating photo in cloud:', error)
      throw error
    }
  }

  /**
   * Delete photo from cloud storage
   */
  static async deletePhoto(cloudId: string): Promise<void> {
    try {
      console.log(`Starting Firebase deletion for cloudId: ${cloudId}`)
      
      // Delete from Firestore
      const docRef = doc(db, this.PHOTOS_COLLECTION, cloudId)
      await deleteDoc(docRef)
      console.log(`Deleted Firestore document: ${cloudId}`)
      
      // Delete from Storage
      const storageRef = ref(storage, `${this.STORAGE_PATH}/${cloudId}`)
      await deleteObject(storageRef)
      console.log(`Deleted Firebase Storage file: ${cloudId}`)
      
      console.log(`Successfully deleted photo from Firebase: ${cloudId}`)
    } catch (error) {
      console.error(`Error deleting photo from Firebase (${cloudId}):`, error)
      throw error
    }
  }

  /**
   * Get all photos from cloud
   */
  static async getAllPhotos(): Promise<CloudPhoto[]> {
    try {
      const q = query(
        collection(db, this.PHOTOS_COLLECTION),
        orderBy('createdAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const photos: CloudPhoto[] = []
      
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data()
        photos.push({
          id: data.id,
          cloudId: data.cloudId,
          cloudUrl: data.cloudUrl,
          createdAt: data.createdAt.toDate(),
          takenAt: data.takenAt?.toDate(),
          caption: data.caption,
          isFavorite: data.isFavorite,
          order: data.order,
          lastSynced: data.lastSynced.toDate(),
          data: new ArrayBuffer(0) // We don't load the actual data here
        })
      }
      
      return photos
    } catch (error) {
      console.error('Error getting photos from cloud:', error)
      throw error
    }
  }

  /**
   * Sync local photos with cloud
   */
  static async syncPhotos(localPhotos: Photo[]): Promise<{
    uploaded: CloudPhoto[]
    downloaded: Photo[]
    conflicts: { local: Photo; cloud: CloudPhoto }[]
  }> {
    try {
      const cloudPhotos = await this.getAllPhotos()
      const localMap = new Map(localPhotos.map(p => [p.id, p]))
      const cloudMap = new Map(cloudPhotos.map(p => [p.id, p]))
      
      const uploaded: CloudPhoto[] = []
      const downloaded: Photo[] = []
      const conflicts: { local: Photo; cloud: CloudPhoto }[] = []
      
      // Find photos to upload (local only)
      for (const localPhoto of localPhotos) {
        if (!cloudMap.has(localPhoto.id)) {
          const cloudPhoto = await this.uploadPhoto(localPhoto)
          uploaded.push(cloudPhoto)
        }
      }
      
      // Find photos to download (cloud only)
      for (const cloudPhoto of cloudPhotos) {
        if (!localMap.has(cloudPhoto.id)) {
          try {
            const localPhoto = await this.downloadPhoto(cloudPhoto.cloudId)
            downloaded.push(localPhoto)
          } catch (error) {
            console.error(`Failed to download photo ${cloudPhoto.cloudId}:`, error)
            // Continue with other photos even if one fails
            // Optionally, you could remove the invalid photo from cloud storage here
          }
        }
      }
      
      // Find conflicts (different last modified)
      for (const localPhoto of localPhotos) {
        const cloudPhoto = cloudMap.get(localPhoto.id)
        if (cloudPhoto && localPhoto.createdAt.getTime() !== cloudPhoto.createdAt.getTime()) {
          conflicts.push({ local: localPhoto, cloud: cloudPhoto })
        }
      }
      
      return { uploaded, downloaded, conflicts }
    } catch (error) {
      console.error('Error syncing photos:', error)
      throw error
    }
  }

  /**
   * Get sync status
   */
  static async getSyncStatus(): Promise<SyncStatus> {
    try {
      const isOnline = navigator.onLine
      const lastSync = localStorage.getItem('lastSync')
      
      return {
        isOnline,
        isUploading: false, // This would be tracked by upload progress
        isDownloading: false, // This would be tracked by download progress
        lastSync: lastSync ? new Date(lastSync) : null,
        pendingUploads: 0, // This would be tracked by pending uploads
        pendingDownloads: 0 // This would be tracked by pending downloads
      }
    } catch (error) {
      console.error('Error getting sync status:', error)
      return {
        isOnline: false,
        isUploading: false,
        isDownloading: false,
        lastSync: null,
        pendingUploads: 0,
        pendingDownloads: 0
      }
    }
  }

  /**
   * Clean up invalid photos from cloud storage
   */
  static async cleanupInvalidPhotos(): Promise<number> {
    try {
      const cloudPhotos = await this.getAllPhotos()
      let cleanedCount = 0
      
      for (const cloudPhoto of cloudPhotos) {
        try {
          // Try to get a fresh download URL to verify the photo still exists
          const storageRef = ref(storage, `${this.STORAGE_PATH}/${cloudPhoto.cloudId}`)
          await getDownloadURL(storageRef)
        } catch (error) {
          console.log(`Cleaning up invalid photo: ${cloudPhoto.cloudId}`)
          try {
            await this.deletePhoto(cloudPhoto.cloudId)
            cleanedCount++
          } catch (deleteError) {
            console.error(`Failed to delete invalid photo ${cloudPhoto.cloudId}:`, deleteError)
          }
        }
      }
      
      return cleanedCount
    } catch (error) {
      console.error('Error cleaning up invalid photos:', error)
      return 0
    }
  }

  /**
   * Set up online/offline listeners
   */
  static setupSyncListeners(
    onOnline: () => void,
    onOffline: () => void,
    onSyncStatusChange: (status: SyncStatus) => void
  ): () => void {
    const handleOnline = () => {
      onOnline()
      this.getSyncStatus().then(onSyncStatusChange)
    }
    
    const handleOffline = () => {
      onOffline()
      this.getSyncStatus().then(onSyncStatusChange)
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }
}
