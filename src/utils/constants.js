/**
 * Application-wide constants and configuration
 * Centralized location for all magic numbers and configuration values
 */

export const CONSTANTS = {
    // File upload limits
    MAX_FILE_SIZE_MB: 10,
    MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB in bytes

    // Supported file types
    VALID_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    VALID_IMAGE_EXTENSIONS: ['.heic', '.heif'],

    // Performance tuning
    DEBOUNCE_DELAY_MS: 150, // Delay for text input debouncing
    MOBILE_BREAKPOINT: 768, // Screen width for mobile detection

    // Canvas display sizes
    MOBILE_CANVAS_WIDTH: 320, // Max width for mobile display
    MOBILE_CANVAS_PADDING: 40, // Padding for mobile canvas
    DESKTOP_CANVAS_WIDTH: 400, // Width for desktop display

    // Rendering configuration
    GRADIENT_HEIGHT_PERCENT: 0.4, // Bottom 40% of canvas for gradient
    HEIC_CONVERSION_QUALITY: 0.8, // JPEG quality for HEIC conversion
    PNG_EXPORT_QUALITY: 1.0, // Full quality for PNG export

    // UI timing
    ERROR_MESSAGE_DURATION_MS: 5000, // How long error messages display
    INSTRUCTION_HIDE_DELAY_MS: 3000, // Auto-hide positioning instructions
    INSTRUCTION_FADE_DURATION_MS: 500, // Fade animation duration
    BRIEF_INSTRUCTION_DURATION_MS: 1500, // Brief instruction display time

    // Touch/interaction
    MIN_TOUCH_TARGET_PX: 44, // Minimum touch target size (accessibility)

    // Text constraints
    MAX_TITLE_LENGTH: 40, // Maximum characters for title lines
    MAX_FILENAME_LENGTH: 40, // Maximum length for generated filenames
};

/**
 * Format configurations for different output sizes
 */
export const FORMAT_CONFIGS = {
    '4:5': {
        width: 1080,
        height: 1350,
        name: 'Instagram/Facebook Post',
        textPositions: {
            line1Y: 1220,
            line2Y: 1260,
            dateTimeY: 1300,
        },
        logo: {
            show: true,
            leftPercent: 0.12,
            topPercent: 0.05,
            widthPercent: 0.09,
        },
    },
    '9:16': {
        width: 1080,
        height: 1920,
        name: 'Instagram Story',
        textPositions: {
            line1Y: 1320,
            line2Y: 1370,
            dateTimeY: 1420,
        },
        logo: {
            show: false,
            leftPercent: 0.12,
            topPercent: 0.05,
            widthPercent: 0.09,
        },
    },
    '1:1': {
        width: 1080,
        height: 1080,
        name: 'Mixcloud Show Image',
        textPositions: {
            line1Y: 950,
            line2Y: 990,
            dateTimeY: 1030,
        },
        logo: {
            show: true,
            leftPercent: 0.12,
            topPercent: 0.05,
            widthPercent: 0.09,
        },
    },
    'obs-hd': {
        width: 1920,
        height: 1080,
        name: 'Video Stream for OBS',
        textPositions: {
            line1Y: null, // Calculated dynamically
            line2Y: null, // Calculated dynamically
            dateTimeY: null, // Hidden for OBS
        },
        logo: {
            show: true,
            rightPercent: 0.05,
            topPercent: 0.05,
            widthPercent: 0.05,
        },
    },
};

/**
 * Font configuration
 */
export const FONTS = {
    family: 'Radial Regular, "Radial-Regular", RadialRegular, Arial, sans-serif',
    fallback: 'Arial, sans-serif',
    variations: ['Radial Regular', 'Radial-Regular', 'RadialRegular'],
    sizes: {
        main: '30pt',
        dateTime: '26pt',
    },
};

/**
 * UI text constants
 */
export const UI_TEXT = {
    errors: {
        noFile: 'No file provided',
        fileTooLarge: 'File size too large (max 10MB)',
        invalidType: 'Invalid file type. Supported: JPG, PNG, GIF, WEBP, HEIC',
        heicNotSupported: 'HEIC support library not loaded. Please refresh the page and try again.',
        heicConversionFailed: 'Failed to convert HEIC file',
        imageLoadFailed: 'Error loading image. Please try a different file.',
        fileReadFailed: 'Error reading file. Please try again.',
        downloadFailed: 'Download failed',
        missingElements: 'Required elements not found',
    },
    progress: {
        convertingHeic: 'Converting HEIC file...',
    },
    instructions: {
        dragToReposition: 'Drag to reposition image',
        repositioning: 'Repositioning...',
    },
};
