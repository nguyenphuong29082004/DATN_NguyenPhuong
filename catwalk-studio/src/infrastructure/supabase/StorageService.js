import { getSupabaseClient } from './supabase.client.js';

/**
 * StorageService — handles file uploads via Supabase Storage.
 * Abstracts direct Supabase storage calls for clean architecture compliance.
 */
export class StorageService {
    constructor(bucket = 'media') {
        this.bucket = bucket;
    }

    get client() {
        return getSupabaseClient();
    }

    /**
     * Upload a file to a specific path within the storage bucket.
     * @param {File} file - The file to upload
     * @param {string} path - Storage path (e.g., 'model-photos/userId/front_123.jpg')
     * @param {Object} [options] - Upload options
     * @param {boolean} [options.upsert=true] - Overwrite existing file
     * @returns {Promise<{ url: string }>} Public URL of the uploaded file
     */
    async upload(file, path, options = { upsert: true }) {
        const { error } = await this.client.storage
            .from(this.bucket)
            .upload(path, file, options);

        if (error) {
            throw new Error(`Storage upload failed: ${error.message}`);
        }

        const { data: urlData } = this.client.storage
            .from(this.bucket)
            .getPublicUrl(path);

        return { url: urlData.publicUrl };
    }

    /**
     * Delete a file from storage.
     * @param {string} path - Storage path to delete
     * @returns {Promise<void>}
     */
    async delete(path) {
        const { error } = await this.client.storage
            .from(this.bucket)
            .remove([path]);

        if (error) {
            throw new Error(`Storage delete failed: ${error.message}`);
        }
    }
}
