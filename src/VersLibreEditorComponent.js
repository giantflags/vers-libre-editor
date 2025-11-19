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

        // Canvas state
        this.canvas = null;
        this.ctx = null;
        this.image = null;
        this.imageScale = 1.0;
        this.imageOffsetX = 0;
        this.imageOffsetY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // Current format
        this.currentAspectRatio = '4:5';
        this.CANVAS_WIDTH = FORMAT_CONFIGS['4:5'].width;
        this.CANVAS_HEIGHT = FORMAT_CONFIGS['4:5'].height;

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
        // Create debounced update function
        this.debouncedUpdatePreview = this.debounce(this.updatePreview.bind(this), CONSTANTS.DEBOUNCE_DELAY_MS);

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

        // Text inputs - debounced updates
        if (this.elements.titleLine1) this.elements.titleLine1.addEventListener('input', this.debouncedUpdatePreview);
        if (this.elements.titleLine2) this.elements.titleLine2.addEventListener('input', this.debouncedUpdatePreview);
        if (this.elements.dateInput) this.elements.dateInput.addEventListener('input', this.debouncedUpdatePreview);
        if (this.elements.startTimeInput) this.elements.startTimeInput.addEventListener('change', this.updatePreview.bind(this));
        if (this.elements.endTimeInput) this.elements.endTimeInput.addEventListener('change', this.updatePreview.bind(this));

        // Image controls
        if (this.elements.scaleSlider) {
            this.elements.scaleSlider.addEventListener('input', () => {
                this.updateScaleDisplay();
                this.updatePreview();
            });
        }

        if (this.elements.opacitySlider) {
            this.elements.opacitySlider.addEventListener('input', () => {
                this.updateOpacityDisplay();
                this.updatePreview();
            });
        }

        // Format selector
        if (this.elements.aspectRatio) {
            this.elements.aspectRatio.addEventListener('change', () => {
                this.updateAspectRatio();
                if (this.canvas && this.image) {
                    this.createCanvas();
                    this.updatePreview();
                }
            });
        }

        // Download
        if (this.elements.downloadBtn && this.config.features.download) {
            this.elements.downloadBtn.addEventListener('click', this.handleDownload.bind(this));
        }
    }

    /**
     * Update aspect ratio from selector
     */
    updateAspectRatio() {
        if (!this.elements.aspectRatio) return;

        const format = this.elements.aspectRatio.value;
        this.state.setFormat(format);

        const config = FORMAT_CONFIGS[format];
        this.CANVAS_WIDTH = config.width;
        this.CANVAS_HEIGHT = config.height;
        this.currentAspectRatio = format;
    }

    /**
     * Create canvas element
     */
    createCanvas() {
        if (!this.elements.canvasArea) return;

        this.elements.canvasArea.innerHTML = '';

        // Update dimensions from current format
        this.updateAspectRatio();

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'canvas';
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = this.CANVAS_WIDTH;
        this.canvas.height = this.CANVAS_HEIGHT;

        // Responsive display size
        const isMobile = window.innerWidth <= CONSTANTS.MOBILE_BREAKPOINT;
        const displayWidth = isMobile ?
            Math.min(400, window.innerWidth - 40) : 500;

        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.maxWidth = '100%';
        this.canvas.style.height = 'auto';

        const wrapper = document.createElement('div');
        wrapper.className = 'canvas-wrapper';
        wrapper.style.cssText = `
            display: inline-block;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            padding: 8px;
            margin: 20px 0;
            max-width: 100%;
            position: relative;
        `;
        wrapper.appendChild(this.canvas);

        this.elements.canvasArea.appendChild(wrapper);

        // Bind canvas interaction events
        this.bindCanvasEvents();
    }

    /**
     * Bind canvas drag events
     */
    bindCanvasEvents() {
        if (!this.canvas) return;

        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));

        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

        // Accessibility
        this.canvas.style.cursor = 'grab';
        this.canvas.setAttribute('role', 'img');
        this.canvas.setAttribute('aria-label', 'Event image preview - drag to reposition');
    }

    /**
     * Update canvas preview
     */
    updatePreview() {
        if (!this.canvas || !this.image) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw layers
        this.drawBackgroundImage();
        this.drawBottomGradient();
        this.drawVersLibreLogo();
        this.drawMainText();
        this.drawDateTime();
    }

    /**
     * Draw background image with transforms
     */
    drawBackgroundImage() {
        if (!this.image) return;

        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const canvasAspect = canvasWidth / canvasHeight;
        const imgAspect = this.image.width / this.image.height;

        let drawWidth, drawHeight, drawX, drawY;

        if (imgAspect > canvasAspect) {
            // Image is wider - fit height
            drawHeight = canvasHeight;
            drawWidth = drawHeight * imgAspect;
            drawX = (canvasWidth - drawWidth) / 2;
            drawY = 0;
        } else {
            // Image is taller - fit width
            drawWidth = canvasWidth;
            drawHeight = drawWidth / imgAspect;
            drawX = 0;
            drawY = (canvasHeight - drawHeight) / 2;
        }

        // Apply scaling
        const scaledWidth = drawWidth * this.imageScale;
        const scaledHeight = drawHeight * this.imageScale;

        // Adjust position for scale
        const scaleOffsetX = (drawWidth - scaledWidth) / 2;
        const scaleOffsetY = (drawHeight - scaledHeight) / 2;

        // Apply offsets
        drawX += this.imageOffsetX + scaleOffsetX;
        drawY += this.imageOffsetY + scaleOffsetY;

        this.ctx.drawImage(this.image, drawX, drawY, scaledWidth, scaledHeight);
    }

    /**
     * Draw bottom gradient overlay
     */
    drawBottomGradient() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const gradientHeight = height * 0.3;
        const opacity = this.elements.opacitySlider ? (this.elements.opacitySlider.value / 100) : 0.3;

        const gradient = this.ctx.createLinearGradient(0, height - gradientHeight, 0, height);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(0, 0, 0, ${opacity})`);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, height - gradientHeight, width, gradientHeight);
    }

    /**
     * Draw Vers Libre logo
     */
    drawVersLibreLogo() {
        const logoImage = this.state.get('logoImage');
        if (!logoImage || !logoImage.complete) return;

        const width = this.canvas.width;
        const height = this.canvas.height;
        const logoWidthPercent = 0.15;
        const logoWidth = width * logoWidthPercent;
        const logoHeight = (logoWidth / logoImage.width) * logoImage.height;

        let logoX, logoY;
        if (this.currentAspectRatio === 'obs-hd') {
            logoX = width - (width * 0.05) - logoWidth;
            logoY = height * 0.05;
        } else {
            logoX = width * 0.05;
            logoY = height * 0.05;
        }

        this.ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);
    }

    /**
     * Draw main text
     */
    drawMainText() {
        const titleLine1 = this.elements.titleLine1?.value.toUpperCase() || '';
        const titleLine2 = this.elements.titleLine2?.value.toUpperCase() || '';

        if (!titleLine1 && !titleLine2) return;

        const width = this.canvas.width;
        const height = this.canvas.height;

        const fontSize = height * 0.055;
        const textX = width * 0.05;
        const line1Y = height * 0.81;
        const line2Y = height * 0.87;

        this.ctx.font = `${fontSize}px "Radial", sans-serif`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillStyle = 'white';

        if (titleLine1) {
            this.ctx.fillText(titleLine1, textX, line1Y);
        }

        if (titleLine2) {
            this.ctx.fillText(titleLine2, textX, line2Y);
        }
    }

    /**
     * Draw date/time text
     */
    drawDateTime() {
        // Hide for OBS format
        if (this.currentAspectRatio === 'obs-hd') return;

        const dateValue = this.elements.dateInput?.value || '';
        const startTime = this.elements.startTimeInput?.value || '';
        const endTime = this.elements.endTimeInput?.value || '';

        let dateTimeText = '';

        if (dateValue) {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = String(date.getFullYear()).slice(-2);
                dateTimeText = `${day}.${month}.${year}`;
            }
        }

        if (dateTimeText && startTime && endTime) {
            dateTimeText += `｜${startTime}-${endTime}`;
        } else if (startTime && endTime) {
            dateTimeText = `${startTime}-${endTime}`;
        }

        if (!dateTimeText) return;

        const width = this.canvas.width;
        const height = this.canvas.height;
        const fontSize = height * 0.025;
        const textX = width * 0.05;
        const dateTimeY = height * 0.94;

        this.ctx.font = `${fontSize}px "Radial", sans-serif`;
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';

        this.ctx.fillText(dateTimeText.toUpperCase(), textX, dateTimeY);
    }

    /**
     * Update scale display
     */
    updateScaleDisplay() {
        if (this.elements.scaleValue && this.elements.scaleSlider) {
            const value = this.elements.scaleSlider.value;
            this.elements.scaleValue.textContent = value + '%';
            this.imageScale = value / 100;
        }
    }

    /**
     * Update opacity display
     */
    updateOpacityDisplay() {
        if (this.elements.opacityValue && this.elements.opacitySlider) {
            this.elements.opacityValue.textContent = this.elements.opacitySlider.value + '%';
        }
    }

    /**
     * Mouse drag handlers
     */
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    handleMouseDown(e) {
        if (!this.image) return;

        const pos = this.getMousePos(e);
        this.isDragging = true;
        this.lastMouseX = pos.x;
        this.lastMouseY = pos.y;
        this.canvas.style.cursor = 'grabbing';
        e.preventDefault();
    }

    handleMouseMove(e) {
        if (!this.isDragging || !this.image) return;

        const pos = this.getMousePos(e);
        const deltaX = pos.x - this.lastMouseX;
        const deltaY = pos.y - this.lastMouseY;

        this.imageOffsetX += deltaX;
        this.imageOffsetY += deltaY;

        this.lastMouseX = pos.x;
        this.lastMouseY = pos.y;

        this.updatePreview();
        e.preventDefault();
    }

    handleMouseUp(e) {
        this.isDragging = false;
        if (this.canvas) {
            this.canvas.style.cursor = 'grab';
        }
    }

    /**
     * Touch drag handlers
     */
    handleTouchStart(e) {
        if (!this.image || e.touches.length !== 1) return;

        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        this.isDragging = true;
        this.lastMouseX = (touch.clientX - rect.left) * scaleX;
        this.lastMouseY = (touch.clientY - rect.top) * scaleY;
    }

    handleTouchMove(e) {
        if (!this.isDragging || !this.image || e.touches.length !== 1) return;

        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const touchX = (touch.clientX - rect.left) * scaleX;
        const touchY = (touch.clientY - rect.top) * scaleY;

        const deltaX = touchX - this.lastMouseX;
        const deltaY = touchY - this.lastMouseY;

        this.imageOffsetX += deltaX;
        this.imageOffsetY += deltaY;

        this.lastMouseX = touchX;
        this.lastMouseY = touchY;

        this.updatePreview();
    }

    handleTouchEnd(e) {
        this.isDragging = false;
    }

    /**
     * Debounce utility
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
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
                this.image = img;
                this.state.update({ image: img });

                // Create canvas if it doesn't exist
                if (!this.canvas) {
                    this.createCanvas();
                }

                // Reset positioning
                this.imageOffsetX = 0;
                this.imageOffsetY = 0;
                this.imageScale = 1.0;

                // Update preview
                this.updatePreview();

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
     * Handle download - also accessible as exportImage()
     */
    handleDownload() {
        this.exportImage();
    }

    /**
     * Export canvas as PNG
     */
    exportImage() {
        if (!this.canvas) {
            this.handleError('Cannot export', 'No image loaded');
            return;
        }

        this.emit('image:export:start');

        try {
            const filename = generateFilename({
                titleLine1: this.elements.titleLine1?.value || '',
                dateValue: this.elements.dateInput?.value || '',
                format: this.currentAspectRatio
            });

            // Convert canvas to blob
            this.canvas.toBlob((blob) => {
                if (!blob) {
                    this.handleError('Export failed', 'Could not generate image');
                    return;
                }

                const exportData = {
                    format: this.currentAspectRatio,
                    filename: filename,
                    blob: blob,
                    dataURL: URL.createObjectURL(blob)
                };

                this.emit('image:exported', exportData);

                // Call export callback if provided
                if (this.config.callbacks.onExport) {
                    this.config.callbacks.onExport(exportData);
                }

                // Auto-download in standalone mode
                if (this.config.standalone) {
                    this.downloadBlob(blob, filename);
                }
            }, 'image/png', 1.0);

        } catch (error) {
            this.handleError('Export failed', error);
        }
    }

    /**
     * Download blob as file
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;

        // Handle iOS/Safari
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

        if (isIOS || isSafari) {
            // Open in new window for iOS/Safari
            const newWindow = window.open(url);
            if (!newWindow) {
                // Fallback if popup blocked
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } else {
            // Standard download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // Cleanup
        setTimeout(() => URL.revokeObjectURL(url), 100);
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
