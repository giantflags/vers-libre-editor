/**
 * Vers Libre Image Editor - Component Library
 * Main entry point for ES6 module exports
 */

// Core component
export { VersLibreEditorComponent } from './VersLibreEditorComponent.js';

// Services
export { ImageService } from './services/ImageService.js';

// State management
export { EditorState } from './state/EditorState.js';

// Utilities
export { validateFile, validateDate, isHeicFile } from './utils/validation.js';
export { formatDate, formatDateTime, generateFilename, generateTimeOptions } from './utils/formatting.js';
export { CONSTANTS, FORMAT_CONFIGS, FONTS, UI_TEXT } from './utils/constants.js';

// Note: TypeScript types are provided via src/types/index.d.ts
