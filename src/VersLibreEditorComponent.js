/**
 * VersLibreEditorComponent - Main component class
 * Designed for integration into dashboards and frameworks
 */

import { EditorState } from './state/EditorState.js';
import { ImageService } from './services/ImageService.js';
import { CONSTANTS, FORMAT_CONFIGS, UI_TEXT } from './utils/constants.js';
import { formatDateTime, generateFilename } from './utils/formatting.js';
import { validateFile } from './utils/validation.js';

/**
 * Simple EventEmitter for component communication
 */
class EventEmitter {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    emit(event, data) {
        if (!this.listeners.has(event)) return;
        this.listeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for "${event}":`, error);
            }
        });
    }

    removeAllListeners(event) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }
}

/**
 * Main component class for Vers Libre Image Editor
 */
export class VersLibreEditorComponent extends EventEmitter {
    /**
     * @param {HTMLElement} container - DOM element to mount editor
     * @param {Object} config - Configuration options
     */
    constructor(container, config = {}) {
        super();

        if (!container || !(container instanceof HTMLElement)) {
            throw new Error('VersLibreEditor requires a valid DOM container element');
        }

        this.container = container;
        this.config = this.mergeConfig(config);
        this.state = new EditorState();
        this.elements = {};
        this.cleanupFunctions = [];

        // Initialize
        this.init();
    }

    /**
     * Merge user config with defaults
     */
    mergeConfig(config) {
        return {
            // Mode
            standalone: config.standalone ?? true,
            readonly: config.readonly ?? false,

            // Features
            features: {
                upload: config.features?.upload ?? true,
                download: config.features?.download ?? true,
                formats: config.features?.formats ?? ['4:5', '9:16', '1:1', 'obs-hd'],
                heicSupport: config.features?.heicSupport ?? true,
            },

            // Theme
            theme: config.theme || 'default',

            // Callbacks
            callbacks: {
                onSave: config.callbacks?.onSave || null,
                onExport: config.callbacks?.onExport || null,
                onError: config.callbacks?.onError || null,
                onReady: config.callbacks?.onReady || null,
            },

            // API
            api: {
                endpoint: config.api?.endpoint || '/api/editor',
                saveProject: config.api?.saveProject || '/api/projects',
                uploadImage: config.api?.uploadImage || '/api/upload',
            },

            // Initial data
            initialData: config.initialData || null,

            ...config
        };
    }

    /**
     * Initialize the editor
     */
    async init() {
        try {
            // Add editor class to container
            this.container.classList.add('vers-libre-editor-scope');

            // Apply theme
            if (this.config.theme) {
                this.container.setAttribute('data-theme', this.config.theme);
            }

            // Inject HTML structure
            this.injectHTML();

            // Cache DOM elements
            this.cacheElements();

            // Load logo
            this.state.set('logoImage', await ImageService.loadLogo());

            // Bind events
            this.bindEvents();

            // Load initial data if provided
            if (this.config.initialData) {
                await this.loadProject(this.config.initialData);
            }

            // Initialize font loading
            await this.initializeFontLoading();

            // Emit ready event
            this.emit('editor:ready', { config: this.config });
            if (this.config.callbacks.onReady) {
                this.config.callbacks.onReady(this);
            }

        } catch (error) {
            this.handleError('Initialization failed', error);
        }
    }

    /**
     * Inject HTML structure into container
     */
    injectHTML() {
        // For now, we'll use the existing HTML structure
        // In production, this would be a template string
        this.container.innerHTML = this.getTemplate();
    }

    /**
     * Get HTML template
     */
    getTemplate() {
        // This is a simplified template - in production you'd include the full HTML
        return `
            <div class="editor-container">
                <div class="sidebar">
                    <div class="sidebar-section">
                        <h3>📤 Upload</h3>
                        <div class="upload-area" id="uploadArea">
                            <div class="upload-icon">📤</div>
                            <p><strong>Click to upload</strong> or drag & drop</p>
                            <p style="font-size: 0.8rem; color: #64748b;">Supports JPG, PNG, GIF${this.config.features.heicSupport ? ', HEIC' : ''}</p>
                        </div>
                        <input type="file" id="imageInput" accept="image/*,.heic,.heif" style="display: none;">
                    </div>

                    <div class="sidebar-section">
                        <h3>✏️ Text</h3>
                        <div class="text-fields">
                            <div class="text-field-item">
                                <label for="titleLine1" class="text-field-label">Line 1</label>
                                <input type="text" id="titleLine1" placeholder="EVENT TITLE" maxlength="40">
                            </div>
                            <div class="text-field-item">
                                <label for="titleLine2" class="text-field-label">Line 2</label>
                                <input type="text" id="titleLine2" placeholder="SUBTITLE" maxlength="40">
                            </div>
                            <div class="text-field-item">
                                <label for="dateInput" class="text-field-label">Date</label>
                                <input type="date" id="dateInput">
                            </div>
                            <div class="text-field-item">
                                <label for="startTimeInput" class="text-field-label">Start Time</label>
                                <select id="startTimeInput"></select>
                            </div>
                            <div class="text-field-item">
                                <label for="endTimeInput" class="text-field-label">End Time</label>
                                <select id="endTimeInput"></select>
                            </div>
                        </div>
                    </div>

                    <div class="sidebar-section">
                        <h3>🎛️ Controls</h3>
                        <div class="control-group">
                            <label for="aspectRatio">Format</label>
                            <select id="aspectRatio">
                                ${this.config.features.formats.map(format => {
                                    const config = FORMAT_CONFIGS[format];
                                    return `<option value="${format}">${config.name}</option>`;
                                }).join('')}
                            </select>
                        </div>
                        <div class="control-group">
                            <label for="scaleSlider">Image Scale</label>
                            <input type="range" id="scaleSlider" min="50" max="200" value="100">
                            <span id="scaleValue">100%</span>
                        </div>
                        <div class="control-group">
                            <label for="opacitySlider">Gradient Opacity</label>
                            <input type="range" id="opacitySlider" min="0" max="100" value="30">
                            <span id="opacityValue">30%</span>
                        </div>
                    </div>
                </div>

                <div class="canvas-container">
                    ${this.config.features.download ? `
                        <div class="download-section" id="downloadSection" style="display: none;">
                            <button class="btn btn-primary" id="downloadBtn">Download</button>
                        </div>
                    ` : ''}
                    <div id="canvasArea">
                        <div class="empty-state">
                            <div class="empty-state-icon">📸</div>
                            <h4>Upload an image to get started</h4>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Cache DOM element references
     */
    cacheElements() {
        this.elements = {
            uploadArea: this.container.querySelector('#uploadArea'),
            imageInput: this.container.querySelector('#imageInput'),
            canvasArea: this.container.querySelector('#canvasArea'),
            downloadSection: this.container.querySelector('#downloadSection'),
            downloadBtn: this.container.querySelector('#downloadBtn'),
            titleLine1: this.container.querySelector('#titleLine1'),
            titleLine2: this.container.querySelector('#titleLine2'),
            dateInput: this.container.querySelector('#dateInput'),
            startTimeInput: this.container.querySelector('#startTimeInput'),
            endTimeInput: this.container.querySelector('#endTimeInput'),
            aspectRatio: this.container.querySelector('#aspectRatio'),
            scaleSlider: this.container.querySelector('#scaleSlider'),
            scaleValue: this.container.querySelector('#scaleValue'),
            opacitySlider: this.container.querySelector('#opacitySlider'),
            opacityValue: this.container.querySelector('#opacityValue'),
        };

        // Populate time selects
        this.populateTimeSelects();
    }

    /**
     * Populate time select dropdowns
     */
    populateTimeSelects() {
        const times = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const h = String(hour).padStart(2, '0');
                const m = String(minute).padStart(2, '0');
                times.push(`${h}:${m}`);
            }
        }

        const options = '<option value="">Select time</option>' +
            times.map(t => `<option value="${t}">${t}</option>`).join('');

        if (this.elements.startTimeInput) {
            this.elements.startTimeInput.innerHTML = options;
        }
        if (this.elements.endTimeInput) {
            this.elements.endTimeInput.innerHTML = options;
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Image upload
        if (this.elements.uploadArea && this.config.features.upload) {
            this.elements.uploadArea.addEventListener('click', () => this.elements.imageInput.click());
            this.elements.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            this.elements.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
            this.elements.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        }

        if (this.elements.imageInput) {
            this.elements.imageInput.addEventListener('change', this.handleImageUpload.bind(this));
        }

        // Download
        if (this.elements.downloadBtn && this.config.features.download) {
            this.elements.downloadBtn.addEventListener('click', this.handleDownload.bind(this));
        }

        // Text inputs - would add debouncing here
        // Format selector
        // Sliders
        // etc.
    }

    /**
     * Handle image upload
     */
    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        await ImageService.loadImage(file, {
            onProgress: (msg) => {
                this.emit('image:loading', { message: msg });
            },
            onError: (error) => {
                this.handleError('Image upload failed', error);
            },
            onSuccess: (img) => {
                this.state.update({ image: img });
                this.emit('image:uploaded', {
                    size: file.size,
                    name: file.name,
                    dimensions: { width: img.width, height: img.height }
                });
                // Show download button
                if (this.elements.downloadSection) {
                    this.elements.downloadSection.style.display = 'flex';
                }
            }
        });
    }

    /**
     * Handle download
     */
    handleDownload() {
        this.emit('image:export:start');

        // Export logic would go here
        // For now, emit event for parent to handle
        const exportData = {
            format: this.state.get('currentFormat'),
            filename: generateFilename({
                titleLine1: this.elements.titleLine1.value,
                dateValue: this.elements.dateInput.value,
                format: this.state.get('currentFormat')
            })
        };

        this.emit('image:exported', exportData);

        if (this.config.callbacks.onExport) {
            this.config.callbacks.onExport(exportData);
        }
    }

    /**
     * Drag and drop handlers
     */
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.elements.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.elements.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.elements.uploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.elements.imageInput.files = files;
            this.handleImageUpload({ target: { files } });
        }
    }

    /**
     * Initialize font loading
     */
    async initializeFontLoading() {
        try {
            await document.fonts.ready;
            // Font loaded successfully
        } catch (error) {
            console.warn('Font loading failed, using fallback');
        }
    }

    /**
     * Load a project
     */
    async loadProject(projectData) {
        try {
            this.emit('project:loading', projectData);

            // Load image if URL provided
            if (projectData.image?.url) {
                // Fetch and load image
            }

            // Set text values
            if (projectData.text) {
                if (this.elements.titleLine1) this.elements.titleLine1.value = projectData.text.line1 || '';
                if (this.elements.titleLine2) this.elements.titleLine2.value = projectData.text.line2 || '';
                if (this.elements.dateInput) this.elements.dateInput.value = projectData.text.date || '';
                if (this.elements.startTimeInput) this.elements.startTimeInput.value = projectData.text.startTime || '';
                if (this.elements.endTimeInput) this.elements.endTimeInput.value = projectData.text.endTime || '';
            }

            // Set format
            if (projectData.format) {
                this.state.setFormat(projectData.format);
                if (this.elements.aspectRatio) {
                    this.elements.aspectRatio.value = projectData.format;
                }
            }

            this.emit('project:loaded', projectData);
        } catch (error) {
            this.handleError('Failed to load project', error);
        }
    }

    /**
     * Get current project data
     */
    getProjectData() {
        return {
            format: this.state.get('currentFormat'),
            image: {
                offsetX: this.state.get('imageOffsetX'),
                offsetY: this.state.get('imageOffsetY'),
                scale: this.state.get('imageScale')
            },
            text: {
                line1: this.elements.titleLine1?.value || '',
                line2: this.elements.titleLine2?.value || '',
                date: this.elements.dateInput?.value || '',
                startTime: this.elements.startTimeInput?.value || '',
                endTime: this.elements.endTimeInput?.value || ''
            },
            settings: {
                gradientOpacity: this.state.get('gradientOpacity')
            }
        };
    }

    /**
     * Handle errors
     */
    handleError(message, error) {
        const errorData = {
            message,
            error: error instanceof Error ? error.message : error,
            timestamp: new Date().toISOString()
        };

        console.error(message, error);
        this.emit('error', errorData);

        if (this.config.callbacks.onError) {
            this.config.callbacks.onError(errorData);
        }
    }

    /**
     * Destroy the editor and cleanup
     */
    destroy() {
        // Remove all event listeners
        this.cleanupFunctions.forEach(cleanup => cleanup());
        this.removeAllListeners();

        // Clear DOM
        if (this.container) {
            this.container.innerHTML = '';
            this.container.classList.remove('vers-libre-editor-scope');
            this.container.removeAttribute('data-theme');
        }

        // Clear references
        this.elements = {};
        this.state = null;
        this.container = null;

        this.emit('editor:destroyed');
    }
}
