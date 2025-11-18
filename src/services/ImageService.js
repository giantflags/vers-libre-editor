/**
 * ImageService - Handles image loading, conversion, and processing
 */

import { CONSTANTS, UI_TEXT } from '../utils/constants.js';
import { validateFile, isHeicFile } from '../utils/validation.js';

export class ImageService {
    /**
     * Loads an image file, handling HEIC conversion if needed
     * @param {File} file - The image file to load
     * @param {Object} callbacks - Callback functions
     * @param {Function} callbacks.onProgress - Called with progress messages
     * @param {Function} callbacks.onError - Called with error messages
     * @param {Function} callbacks.onSuccess - Called with loaded HTMLImageElement
     * @returns {Promise<void>}
     */
    static async loadImage(file, { onProgress, onError, onSuccess }) {
        try {
            // Validate file first
            const validation = validateFile(file);
            if (!validation.valid) {
                onError(validation.error);
                return;
            }

            // Check if HEIC and convert if needed
            if (isHeicFile(file)) {
                await this.loadHeicImage(file, { onProgress, onError, onSuccess });
            } else {
                await this.loadRegularImage(file, { onError, onSuccess });
            }
        } catch (error) {
            onError(`${UI_TEXT.errors.imageLoadFailed}: ${error.message}`);
        }
    }

    /**
     * Loads and converts a HEIC image
     * @param {File} file - HEIC file to convert
     * @param {Object} callbacks - Callback functions
     * @returns {Promise<void>}
     */
    static async loadHeicImage(file, { onProgress, onError, onSuccess }) {
        // Check if heic2any library is available
        if (typeof heic2any === 'undefined') {
            onError(UI_TEXT.errors.heicNotSupported);
            return;
        }

        try {
            onProgress(UI_TEXT.progress.convertingHeic);

            const convertedBlob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: CONSTANTS.HEIC_CONVERSION_QUALITY,
            });

            onProgress(null); // Hide progress message

            const convertedFile = new File(
                [convertedBlob],
                file.name.replace(/\.heic$/i, '.jpg'),
                { type: 'image/jpeg' }
            );

            await this.loadRegularImage(convertedFile, { onError, onSuccess });
        } catch (error) {
            onProgress(null); // Hide progress message
            onError(`${UI_TEXT.errors.heicConversionFailed}: ${error.message}`);
        }
    }

    /**
     * Loads a standard image file
     * @param {File} file - Image file to load
     * @param {Object} callbacks - Callback functions
     * @returns {Promise<HTMLImageElement>}
     */
    static async loadRegularImage(file, { onError, onSuccess }) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    onSuccess(img);
                    resolve(img);
                };

                img.onerror = () => {
                    const error = UI_TEXT.errors.imageLoadFailed;
                    onError(error);
                    reject(new Error(error));
                };

                img.src = e.target.result;
            };

            reader.onerror = () => {
                const error = UI_TEXT.errors.fileReadFailed;
                onError(error);
                reject(new Error(error));
            };

            reader.readAsDataURL(file);
        });
    }

    /**
     * Loads the Vers Libre logo
     * @param {string} logoPath - Path to logo image
     * @returns {Promise<HTMLImageElement>}
     */
    static async loadLogo(logoPath = './vers-libre-logo.png') {
        return new Promise((resolve, reject) => {
            const logoImage = new Image();

            logoImage.onload = () => {
                resolve(logoImage);
            };

            logoImage.onerror = () => {
                console.warn('Failed to load logo image, will use fallback');
                resolve(null); // Resolve with null to use fallback
            };

            logoImage.src = logoPath;
        });
    }
}
