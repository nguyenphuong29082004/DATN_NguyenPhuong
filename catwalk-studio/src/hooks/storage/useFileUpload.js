import { useState } from 'react';
import { getSupabaseClient } from '../../infrastructure/supabase/supabase.client.js';

/**
 * Hook for uploading files to Cloudflare R2 via Edge Function
 */
export const useFileUpload = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const supabase = getSupabaseClient();

    /**
     * Upload a file to Cloudflare R2
     * @param {File} file - File to upload
     * @param {string} [folder] - Optional folder path (e.g., userId)
     * @returns {Promise<{url: string, path: string} | null>}
     */
    const uploadFile = async (file, folder = '') => {
        if (!file) {
            setUploadError('No file provided');
            setIsUploading(false);
            return null;
        }

        // Reset state before upload
        setIsUploading(true);
        setUploadError(null);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', folder);

            const { data, error } = await supabase.functions.invoke('upload-to-r2', {
                body: formData,
            });

            if (error) {
                console.error('R2 upload error:', error);
                setIsUploading(false);
                throw error;
            }

            if (!data || !data.url) {
                setIsUploading(false);
                throw new Error('Invalid response from upload service');
            }

            setUploadProgress(100);
            setIsUploading(false);

            return {
                url: data.url,
                path: data.path
            };
        } catch (error) {
            console.error('Error uploading file:', error);
            setUploadError(error.message || 'Failed to upload file');
            setIsUploading(false);
            return null;
        }
    };

    /**
     * Delete a file from R2 (not implemented yet)
     * @param {string} filePath - Path to file in storage
     */
    const deleteFile = async (filePath) => {
        console.warn('Delete from R2 not implemented yet:', filePath);
        return false;
    };

    return {
        uploadFile,
        deleteFile,
        isUploading,
        uploadError,
        uploadProgress
    };
};
