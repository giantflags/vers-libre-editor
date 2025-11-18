/**
 * EditorState - Centralized state management with observer pattern
 * Provides a single source of truth for editor state
 */

import { FORMAT_CONFIGS } from '../utils/constants.js';

export class EditorState {
    constructor() {
        this.state = {
            // Canvas and image
            image: null,
            logoImage: null,
            canvas: null,
            ctx: null,

            // Image transformation
            imageOffsetX: 0,
            imageOffsetY: 0,
            imageScale: 1.0,

            // Interaction state
            isDragging: false,
            lastMouseX: 0,
            lastMouseY: 0,

            // Format and dimensions
            currentFormat: '4:5',
            canvasWidth: 1080,
            canvasHeight: 1350,

            // Text content
            titleLine1: '',
            titleLine2: '',
            dateValue: '',
            startTime: '',
            endTime: '',

            // Display settings
            gradientOpacity: 30,
            showLogo: true,

            // UI state
            isMobile: false,
            isEmbedded: false,

            // Font
            fontFamily: 'Radial Regular, "Radial-Regular", RadialRegular, Arial, sans-serif',
        };

        this.listeners = [];
    }

    /**
     * Get current state
     * @returns {Object} Current state object
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Get a specific state value
     * @param {string} key - State key
     * @returns {*} State value
     */
    get(key) {
        return this.state[key];
    }

    /**
     * Update state with partial updates
     * @param {Object} updates - Partial state updates
     */
    update(updates) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...updates };
        this.notify(updates, oldState);
    }

    /**
     * Set a single state value
     * @param {string} key - State key
     * @param {*} value - New value
     */
    set(key, value) {
        this.update({ [key]: value });
    }

    /**
     * Subscribe to state changes
     * @param {Function} listener - Callback function(newState, changes, oldState)
     * @returns {Function} Unsubscribe function
     */
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * Notify all listeners of state changes
     * @param {Object} changes - What changed
     * @param {Object} oldState - Previous state
     */
    notify(changes, oldState) {
        this.listeners.forEach(listener => {
            listener(this.state, changes, oldState);
        });
    }

    /**
     * Reset image transformation to defaults
     */
    resetImageTransform() {
        this.update({
            imageOffsetX: 0,
            imageOffsetY: 0,
            imageScale: 1.0,
        });
    }

    /**
     * Update format configuration
     * @param {string} format - Format key ('4:5', '9:16', etc.)
     */
    setFormat(format) {
        const config = FORMAT_CONFIGS[format];
        if (!config) return;

        const updates = {
            currentFormat: format,
            canvasWidth: config.width,
            canvasHeight: config.height,
            showLogo: config.logo.show,
        };

        this.update(updates);
    }

    /**
     * Get current format configuration
     * @returns {Object} Format configuration object
     */
    getFormatConfig() {
        return FORMAT_CONFIGS[this.state.currentFormat];
    }
}
