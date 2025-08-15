class VersLibreEditor {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.image = null;
        this.logoImage = null;
        this.cleanupFunctions = [];
        
        // Constants
        this.CANVAS_WIDTH = 1080;
        this.CANVAS_HEIGHT = 1350;
        this.LOGO_LEFT_PERCENT = 0.12;
        this.LOGO_TOP_PERCENT = 0.05;
        this.LOGO_WIDTH_PERCENT = 0.09;
        this.TEXT_X = 130;
        this.TEXT_LINE1_Y = 1220;
        this.TEXT_LINE2_Y = 1260;
        this.TEXT_DATETIME_Y = 1300;
        this.FONT_SIZE = '30pt';
        this.DATETIME_FONT_SIZE = '26pt'; // 4px smaller than main text
        this.MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        
        // Font configuration
        this.fontFamily = 'Radial Regular, "Radial-Regular", RadialRegular, Arial, sans-serif';
        
        // Image positioning and scaling
        this.imageOffsetX = 0;
        this.imageOffsetY = 0;
        this.imageScale = 1.0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Mobile detection
        this.isMobile = this.detectMobile();
        
        this.initializeElements();
        this.bindEvents();
        this.updateOpacityDisplay();
        this.updateScaleDisplay();
        this.loadLogo();
        this.initializeFontLoading();
    }

    detectMobile() {
        return window.innerWidth <= 768;
    }

    initializeElements() {
        // Upload elements
        this.uploadArea = document.getElementById('uploadArea');
        this.imageInput = document.getElementById('imageInput');
        
        if (!this.uploadArea || !this.imageInput) {
            throw new Error('Required elements not found');
        }
        
        // Canvas elements
        this.canvasArea = document.getElementById('canvasArea');
        this.downloadSection = document.getElementById('downloadSection');
        
        // Text inputs - support both old and new structure
        this.titleLine1 = document.getElementById('titleLine1');
        this.titleLine2 = document.getElementById('titleLine2');
        
        // New separate date/time inputs
        this.dateInput = document.getElementById('dateInput');
        this.startTimeInput = document.getElementById('startTimeInput');
        this.endTimeInput = document.getElementById('endTimeInput');
        
        // Fallback to old combined input if new ones don't exist
        this.dateTime = document.getElementById('dateTime');
        
        // Image scaling controls
        this.scaleSlider = document.getElementById('scaleSlider');
        this.scaleValue = document.getElementById('scaleValue');
        
        // Gradient controls
        this.opacitySlider = document.getElementById('opacitySlider');
        this.opacityValue = document.getElementById('opacityValue');
        
        // Set default gradient opacity to 30%
        if (this.opacitySlider) {
            this.opacitySlider.value = 30;
        }
        
        // Action buttons
        this.downloadBtn = document.getElementById('downloadBtn');
        
        // Validation
        this.validateElements();
    }

    loadLogo() {
        // Load the Vers Libre logo
        this.logoImage = new Image();
        this.logoImage.onload = () => {
            // Logo loaded successfully, update preview if canvas exists
            if (this.canvas) {
                this.updatePreview();
            }
        };
        this.logoImage.onerror = () => {
            console.warn('Failed to load logo image, will use fallback');
        };
        // Load the actual Vers Libre logo (relative path)
        this.logoImage.src = './vers-libre-logo.png';
    }

    bindEvents() {
        if (!this.uploadArea || !this.imageInput) {
            throw new Error('Cannot bind events - required elements not found');
        }
        
        // Image upload events
        const clickHandler = () => this.imageInput.click();
        const dragOverHandler = (e) => this.handleDragOver(e);
        const dragLeaveHandler = (e) => this.handleDragLeave(e);
        const dropHandler = (e) => this.handleImageDrop(e);
        const changeHandler = (e) => this.handleImageUpload(e);
        
        this.uploadArea.addEventListener('click', clickHandler);
        this.uploadArea.addEventListener('dragover', dragOverHandler);
        this.uploadArea.addEventListener('dragleave', dragLeaveHandler);
        this.uploadArea.addEventListener('drop', dropHandler);
        this.imageInput.addEventListener('change', changeHandler);
        
        // Store cleanup functions
        this.cleanupFunctions.push(
            () => this.uploadArea.removeEventListener('click', clickHandler),
            () => this.uploadArea.removeEventListener('dragover', dragOverHandler),
            () => this.uploadArea.removeEventListener('dragleave', dragLeaveHandler),
            () => this.uploadArea.removeEventListener('drop', dropHandler),
            () => this.imageInput.removeEventListener('change', changeHandler)
        );

        // Text input events - support both old and new structure
        if (this.titleLine1) this.titleLine1.addEventListener('input', this.updatePreview.bind(this));
        if (this.titleLine2) this.titleLine2.addEventListener('input', this.updatePreview.bind(this));
        
        // New separate inputs
        if (this.dateInput) this.dateInput.addEventListener('input', this.updatePreview.bind(this));
        if (this.startTimeInput) this.startTimeInput.addEventListener('change', this.updatePreview.bind(this));
        if (this.endTimeInput) this.endTimeInput.addEventListener('change', this.updatePreview.bind(this));
        
        // Old combined input (fallback)
        if (this.dateTime) this.dateTime.addEventListener('input', this.updatePreview.bind(this));

        // Image scaling events
        if (this.scaleSlider) {
            this.scaleSlider.addEventListener('input', () => {
                this.updateScaleDisplay();
                this.updatePreview();
            });
        }

        // Gradient control events
        if (this.opacitySlider) {
            this.opacitySlider.addEventListener('input', () => {
                this.updateOpacityDisplay();
                this.updatePreview();
            });
        }

        // Action buttons
        if (this.downloadBtn) this.downloadBtn.addEventListener('click', this.downloadImage.bind(this));
        
        // Events bound successfully
    }

    bindCanvasEvents() {
        if (!this.canvas) return;

        // Create bound handlers for cleanup
        const mouseDownHandler = this.handleMouseDown.bind(this);
        const mouseMoveHandler = this.handleMouseMove.bind(this);
        const mouseUpHandler = this.handleMouseUp.bind(this);
        const touchStartHandler = this.handleTouchStart.bind(this);
        const touchMoveHandler = this.handleTouchMove.bind(this);
        const touchEndHandler = this.handleTouchEnd.bind(this);

        // Mouse events for image dragging
        this.canvas.addEventListener('mousedown', mouseDownHandler);
        this.canvas.addEventListener('mousemove', mouseMoveHandler);
        this.canvas.addEventListener('mouseup', mouseUpHandler);
        this.canvas.addEventListener('mouseleave', mouseUpHandler);

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', touchStartHandler);
        this.canvas.addEventListener('touchmove', touchMoveHandler);
        this.canvas.addEventListener('touchend', touchEndHandler);

        // Accessibility
        this.canvas.style.cursor = 'grab';
        this.canvas.title = 'Drag to reposition';
        this.canvas.setAttribute('role', 'img');
        this.canvas.setAttribute('aria-label', 'Event image preview - drag to reposition');
        this.canvas.setAttribute('tabindex', '0');

        // Store cleanup functions
        this.cleanupFunctions.push(
            () => this.canvas.removeEventListener('mousedown', mouseDownHandler),
            () => this.canvas.removeEventListener('mousemove', mouseMoveHandler),
            () => this.canvas.removeEventListener('mouseup', mouseUpHandler),
            () => this.canvas.removeEventListener('mouseleave', mouseUpHandler),
            () => this.canvas.removeEventListener('touchstart', touchStartHandler),
            () => this.canvas.removeEventListener('touchmove', touchMoveHandler),
            () => this.canvas.removeEventListener('touchend', touchEndHandler)
        );
    }

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
        
        if (this.showBriefInstructions) {
            this.showBriefInstructions();
        }
        
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
        this.canvas.style.cursor = 'grab';
    }

    handleTouchStart(e) {
        if (!this.image || e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        this.isDragging = true;
        this.lastMouseX = (touch.clientX - rect.left) * scaleX;
        this.lastMouseY = (touch.clientY - rect.top) * scaleY;
        
        if (this.showBriefInstructions) {
            this.showBriefInstructions();
        }
        
        e.preventDefault();
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
        e.preventDefault();
    }

    handleTouchEnd(e) {
        this.isDragging = false;
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('dragover');
    }

    validateFile(file) {
        if (!file) return { valid: false, error: 'No file provided' };
        
        if (file.size > this.MAX_FILE_SIZE) {
            return { valid: false, error: 'File size too large (max 10MB)' };
        }
        
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const validExtensions = ['.heic', '.heif'];
        const isValidType = validTypes.includes(file.type);
        const isValidExtension = validExtensions.some(ext => 
            file.name.toLowerCase().endsWith(ext)
        );
        
        if (!isValidType && !isValidExtension) {
            return { valid: false, error: 'Invalid file type. Supported: JPG, PNG, GIF, WEBP, HEIC' };
        }
        
        return { valid: true };
    }

    handleImageDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        
        if (files.length > 0) {
            const file = files[0];
            const validation = this.validateFile(file);
            
            if (validation.valid) {
                this.loadImage(file);
            } else {
                this.showError(validation.error);
            }
        } else {
            this.showError('Please drop a valid image file');
        }
    }

    showError(message) {
        // Create a more user-friendly error display
        const errorDiv = document.createElement('div');
        errorDiv.className = 'notification error-notification';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 500;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    showProgressMessage(message) {
        // Remove any existing progress message
        this.hideProgressMessage();
        
        const progressDiv = document.createElement('div');
        progressDiv.className = 'notification progress-notification';
        progressDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3b82f6;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        // Add a simple spinner
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;
        
        // Add CSS animation for spinner
        if (!document.getElementById('spinner-styles')) {
            const style = document.createElement('style');
            style.id = 'spinner-styles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        progressDiv.appendChild(spinner);
        progressDiv.appendChild(document.createTextNode(message));
        document.body.appendChild(progressDiv);
        
        this.currentProgressMessage = progressDiv;
    }

    hideProgressMessage() {
        if (this.currentProgressMessage && this.currentProgressMessage.parentNode) {
            this.currentProgressMessage.parentNode.removeChild(this.currentProgressMessage);
            this.currentProgressMessage = null;
        }
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        
        if (!file) return;
        
        const validation = this.validateFile(file);
        
        if (validation.valid) {
            this.loadImage(file);
        } else {
            this.showError(validation.error);
        }
    }

    loadImage(file) {
        try {
            const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
            
            if (isHeic) {
                this.loadHeicImage(file);
            } else {
                this.loadRegularImage(file);
            }
        } catch (error) {
            this.showError('Failed to load image: ' + error.message);
        }
    }

    loadHeicImage(file) {
        if (typeof heic2any === 'undefined') {
            this.showError('HEIC support library not loaded. Please refresh the page and try again.');
            return;
        }

        // Show conversion progress
        this.showProgressMessage('Converting HEIC file...');
        
        heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.8
        }).then((convertedBlob) => {
            this.hideProgressMessage();
            
            const convertedFile = new File([convertedBlob], file.name.replace(/\.heic$/i, '.jpg'), {
                type: 'image/jpeg'
            });
            
            this.loadRegularImage(convertedFile);
        }).catch((error) => {
            this.hideProgressMessage();
            this.showError('Failed to convert HEIC file: ' + error.message);
        });
    }

    loadRegularImage(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.image = img;
                this.resetImageTransform();
                this.createCanvas();
                
                if (this.downloadSection) {
                    this.downloadSection.style.display = 'flex';
                }
                this.updatePreview();
            };
            
            img.onerror = () => {
                this.showError('Error loading image. Please try a different file.');
            };
            
            img.src = e.target.result;
        };
        
        reader.onerror = () => {
            this.showError('Error reading file. Please try again.');
        };
        
        reader.readAsDataURL(file);
    }

    resetImageTransform() {
        this.imageOffsetX = 0;
        this.imageOffsetY = 0;
        this.imageScale = 1.0;
        
        if (this.scaleSlider) {
            this.scaleSlider.value = 100;
            this.updateScaleDisplay();
        }
    }

    createCanvas() {
        this.canvasArea.innerHTML = '';
        
        if (this.isMobile) {
            // Add CSS to move canvas visually to top on mobile
            const style = document.createElement('style');
            style.textContent = `
                @media (max-width: 768px) {
                    #canvasArea {
                        order: -1;
                        margin-bottom: 20px;
                    }
                    .main-container {
                        display: flex;
                        flex-direction: column;
                    }
                }
            `;
            if (!document.getElementById('mobile-canvas-style')) {
                style.id = 'mobile-canvas-style';
                document.head.appendChild(style);
            }
        }
        
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'canvas';
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size using constants
        this.canvas.width = this.CANVAS_WIDTH;
        this.canvas.height = this.CANVAS_HEIGHT;
        
        // Responsive display size that maintains 4:5 ratio
        const displayWidth = this.isMobile ? Math.min(320, window.innerWidth - 40) : 400;
        const displayHeight = displayWidth * 1.25;
        
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
            box-sizing: border-box;
        `;
        wrapper.appendChild(this.canvas);
        
        const overlay = document.createElement('div');
        overlay.className = 'canvas-overlay';
        wrapper.appendChild(overlay);
        
        // Add auto-hiding positioning instructions with very translucent background
        const instructions = document.createElement('div');
        instructions.className = 'positioning-instructions';
        instructions.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.2);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            pointer-events: none;
            z-index: 1000;
            white-space: nowrap;
            opacity: 1;
            transition: opacity 0.5s ease-out;
            backdrop-filter: blur(4px);
        `;
        instructions.textContent = 'Drag to reposition image';
        wrapper.appendChild(instructions);
        
        this.canvasArea.appendChild(wrapper);
        
        // Auto-hide instructions after 3 seconds
        setTimeout(() => {
            instructions.style.opacity = '0';
            // Remove from DOM after fade out
            setTimeout(() => {
                if (instructions.parentNode) {
                    instructions.parentNode.removeChild(instructions);
                }
            }, 500);
        }, 3000);
        
        // Show instructions again when user starts dragging
        this.setupInstructionReappearance(wrapper);
        
        this.bindCanvasEvents();
    }

    // Method to show instructions briefly when user interacts
    setupInstructionReappearance(wrapper) {
        let instructionTimer = null;
        
        const showBriefInstructions = () => {
            // Clear any existing timer
            if (instructionTimer) {
                clearTimeout(instructionTimer);
            }
            
            // Remove any existing instruction
            const existingInstructions = wrapper.querySelector('.positioning-instructions');
            if (existingInstructions) {
                existingInstructions.remove();
            }
            
            // Create new brief instruction
            const briefInstructions = document.createElement('div');
            briefInstructions.className = 'positioning-instructions';
            briefInstructions.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.15);
                color: white;
                padding: 6px 10px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
                pointer-events: none;
                z-index: 1000;
                white-space: nowrap;
                opacity: 1;
                transition: opacity 0.3s ease-out;
                backdrop-filter: blur(2px);
            `;
            briefInstructions.textContent = 'Repositioning...';
            wrapper.appendChild(briefInstructions);
            
            // Hide after 1.5 seconds
            instructionTimer = setTimeout(() => {
                briefInstructions.style.opacity = '0';
                setTimeout(() => {
                    if (briefInstructions.parentNode) {
                        briefInstructions.parentNode.removeChild(briefInstructions);
                    }
                }, 300);
            }, 1500);
        };
        
        // Store reference for use in mouse events
        this.showBriefInstructions = showBriefInstructions;
    }

    updatePreview() {
        if (!this.canvas || !this.image) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background image with positioning
        this.drawBackgroundImage();

        // Add bottom gradient overlay (full width, bottom 30%)
        this.drawBottomGradient();

        // Add Vers Libre logo (top-left, positioned exactly like the reference)
        this.drawVersLibreLogo();

        // Add main text (positioned like template)
        this.drawMainText();

        // Add date/time text
        this.drawDateTime();
    }

    drawBackgroundImage() {
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
        
        // Adjust position to keep center when scaling
        const scaleOffsetX = (drawWidth - scaledWidth) / 2;
        const scaleOffsetY = (drawHeight - scaledHeight) / 2;

        // Apply user positioning offset and scaling offset
        drawX += this.imageOffsetX + scaleOffsetX;
        drawY += this.imageOffsetY + scaleOffsetY;

        this.ctx.drawImage(this.image, drawX, drawY, scaledWidth, scaledHeight);
    }

    drawBottomGradient() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const gradientHeight = height * 0.4; // Bottom 40% for better text readability
        const opacity = this.opacitySlider.value / 100;

        // Create gradient from transparent to black
        const gradient = this.ctx.createLinearGradient(0, height - gradientHeight, 0, height);
        gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
        gradient.addColorStop(1, `rgba(0, 0, 0, ${opacity})`);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, height - gradientHeight, width, gradientHeight);
    }

    drawVersLibreLogo() {
        if (!this.logoImage || !this.logoImage.complete) {
            // Fallback: draw programmatic logo if image isn't loaded
            this.drawFallbackLogo();
            return;
        }

        const width = this.canvas.width;
        const height = this.canvas.height;
        
        const paddingLeft = width * this.LOGO_LEFT_PERCENT;
        const paddingTop = height * this.LOGO_TOP_PERCENT;
        const logoWidth = width * this.LOGO_WIDTH_PERCENT;
        const logoHeight = (logoWidth / this.logoImage.width) * this.logoImage.height;

        // Logo positioned at specified percentages

        this.ctx.drawImage(
            this.logoImage,
            paddingLeft,
            paddingTop,
            logoWidth,
            logoHeight
        );
    }

    drawFallbackLogo() {
        // Fallback method with percentage-based positioning for 1080x1350 canvas
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        const paddingLeft = width * this.LOGO_LEFT_PERCENT;
        const paddingTop = height * this.LOGO_TOP_PERCENT;
        const logoSize = width * this.LOGO_WIDTH_PERCENT;

        // Fallback logo positioning

        // Speech bubble background
        this.ctx.fillStyle = '#B91B5C';
        this.ctx.beginPath();
        
        // Main rectangle
        const rectWidth = logoSize;
        const rectHeight = logoSize * 0.65;
        this.ctx.roundRect(paddingLeft, paddingTop, rectWidth, rectHeight, 8);
        
        // Speech bubble tail
        const tailSize = logoSize * 0.15;
        this.ctx.moveTo(paddingLeft + rectWidth * 0.15, paddingTop + rectHeight);
        this.ctx.lineTo(paddingLeft + rectWidth * 0.35, paddingTop + rectHeight);
        this.ctx.lineTo(paddingLeft + rectWidth * 0.25, paddingTop + rectHeight + tailSize);
        this.ctx.closePath();
        
        this.ctx.fill();

        // Logo text
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const fontSize = logoSize * 0.18;
        this.ctx.font = `bold ${fontSize}px ${this.fontFamily}`;
        
        const textX = paddingLeft + rectWidth / 2;
        const textY = paddingTop + rectHeight / 2;
        
        this.ctx.fillText('VERS', textX, textY - fontSize * 0.3);
        this.ctx.fillText('LIBRE', textX, textY + fontSize * 0.3);
    }

    drawMainText() {
        const titleLine1 = this.titleLine1.value.toUpperCase();
        const titleLine2 = this.titleLine2.value.toUpperCase();
        
        if (!titleLine1 && !titleLine2) return;

        const fontSize = this.FONT_SIZE;
        const line1Y = this.TEXT_LINE1_Y;
        const line2Y = this.TEXT_LINE2_Y;
        const textX = this.TEXT_X;
        
        // Use regular weight font
        this.ctx.font = `${fontSize} ${this.fontFamily}`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillStyle = 'white';

        // Text positioned using constants

        // Draw lines at specified positions
        if (titleLine1) {
            this.ctx.fillText(titleLine1, textX, line1Y);
        }
        
        if (titleLine2) {
            this.ctx.fillText(titleLine2, textX, line2Y);
        }
    }

    drawDateTime() {
        let dateTimeText = '';
        
        // Check if using new separate date/start time/end time inputs
        if (this.dateInput && this.startTimeInput && this.endTimeInput) {
            const dateValue = this.dateInput.value ? this.dateInput.value.trim() : '';
            const startTime = this.startTimeInput.value ? this.startTimeInput.value.trim() : '';
            const endTime = this.endTimeInput.value ? this.endTimeInput.value.trim() : '';
            
            // Format date from YYYY-MM-DD to DD.MM.YY
            let dateText = '';
            if (dateValue) {
                const date = new Date(dateValue);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = String(date.getFullYear()).slice(-2);
                dateText = `${day}.${month}.${year}`;
            }
            
            if (dateText) {
                dateTimeText = dateText;
                if (startTime && endTime) {
                    dateTimeText += `｜${startTime}-${endTime}`;
                } else if (startTime) {
                    dateTimeText += `｜${startTime}`;
                }
            } else if (startTime && endTime) {
                dateTimeText = `${startTime}-${endTime}`;
            } else if (startTime) {
                dateTimeText = startTime;
            }
        }
        // Fallback to old combined input
        else if (this.dateTime && this.dateTime.value) {
            dateTimeText = this.dateTime.value.trim();
        }
        
        if (!dateTimeText) return;

        const fontSize = this.DATETIME_FONT_SIZE;
        const dateTimeY = this.TEXT_DATETIME_Y;
        const textX = this.TEXT_X;

        // Use regular weight font for date/time
        this.ctx.font = `${fontSize} ${this.fontFamily}`;
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';

        // Date/time positioned using constants

        this.ctx.fillText(dateTimeText.toUpperCase(), textX, dateTimeY);
    }

    updateOpacityDisplay() {
        if (this.opacityValue) {
            this.opacityValue.textContent = this.opacitySlider.value + '%';
        }
    }

    updateScaleDisplay() {
        if (this.scaleValue && this.scaleSlider) {
            const scalePercent = Math.round(this.scaleSlider.value);
            this.scaleValue.textContent = scalePercent + '%';
            this.imageScale = scalePercent / 100;
        }
    }

    async initializeFontLoading() {
        try {
            await document.fonts.ready;
            this.checkFontLoading();
        } catch (error) {
            // Font loading failed, use fallback
            this.fontFamily = 'Arial, sans-serif';
        }
    }

    checkFontLoading() {
        const fontVariations = [
            'Radial Regular',
            'Radial-Regular', 
            'RadialRegular'
        ];
        
        let fontFound = false;
        
        if (document.fonts && document.fonts.check) {
            for (const fontName of fontVariations) {
                const isLoaded = document.fonts.check(`16px "${fontName}"`);
                if (isLoaded) {
                    fontFound = true;
                    this.fontFamily = `"${fontName}", Arial, sans-serif`;
                    break;
                }
            }
        }
        
        if (!fontFound) {
            this.fontFamily = 'Arial, sans-serif';
        }
    }

    generateFilename() {
        // Get the first line of text
        const titleLine1 = this.titleLine1 ? this.titleLine1.value.trim() : '';
        
        // Get the date
        let dateText = '';
        if (this.dateInput && this.dateInput.value) {
            const date = new Date(this.dateInput.value);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            dateText = `${year}-${month}-${day}`;
        }
        
        // Create filename
        let filename = '';
        
        if (titleLine1 && dateText) {
            // Clean the title text for filename
            const cleanTitle = titleLine1
                .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .toLowerCase()
                .substring(0, 30); // Limit length
            
            filename = `${cleanTitle}_${dateText}.png`;
        } else if (titleLine1) {
            const cleanTitle = titleLine1
                .replace(/[^a-zA-Z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .toLowerCase()
                .substring(0, 40);
            
            filename = `${cleanTitle}.png`;
        } else if (dateText) {
            filename = `vers-libre-event_${dateText}.png`;
        } else {
            filename = 'vers-libre-event.png';
        }
        
        return filename;
    }

    downloadImage() {
        if (!this.canvas) return;

        try {
            // Create download link
            const link = document.createElement('a');
            const dataURL = this.canvas.toDataURL('image/png', 1.0);
            const filename = this.generateFilename();
            
            // iOS Safari workaround - open in new window if direct download fails
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
            
            if (isIOS || isSafari) {
                // For iOS/Safari, open image in new window for manual save
                const newWindow = window.open();
                if (newWindow) {
                    newWindow.document.write(`
                        <html>
                            <head><title>Vers Libre Event Image</title></head>
                            <body style="margin:0; padding:20px; text-align:center; background:#f5f5f5;">
                                <h3>Your Event Image</h3>
                                <p>Long press the image below and select "Save to Photos" or "Add to Photos"</p>
                                <img src="${dataURL}" style="max-width:100%; height:auto; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.2);" alt="Vers Libre Event">
                                <br><br>
                                <a href="${dataURL}" download="${filename}" style="display:inline-block; padding:12px 24px; background:#B91B5C; color:white; text-decoration:none; border-radius:6px; margin:10px;">
                                    Download Image
                                </a>
                            </body>
                        </html>
                    `);
                    newWindow.document.close();
                } else {
                    // Fallback if popup blocked
                    link.href = dataURL;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } else {
                // Standard download for desktop/Android
                link.href = dataURL;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            
        } catch (error) {
            this.showError('Download failed: ' + error.message);
        }
    }

    performDirectDownload(dataURL) {
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = this.generateFilename();
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Debounced update for better performance
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

    validateElements() {
        const requiredElements = [
            'uploadArea', 'imageInput', 'canvasArea', 'downloadSection',
            'titleLine1', 'titleLine2', 'dateInput', 'startTimeInput', 
            'endTimeInput', 'scaleSlider', 'scaleValue', 'opacitySlider', 
            'opacityValue', 'downloadBtn'
        ];
        
        const missing = requiredElements.filter(id => !document.getElementById(id));
        if (missing.length > 0) {
            throw new Error(`Missing required elements: ${missing.join(', ')}`);
        }
    }

    cleanup() {
        // Remove all event listeners
        this.cleanupFunctions.forEach(cleanup => cleanup());
        this.cleanupFunctions = [];
        
        // Clear canvas and reset state
        if (this.canvas && this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        this.canvas = null;
        this.ctx = null;
        this.image = null;
        this.logoImage = null;
    }
}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.versLibreEditor = new VersLibreEditor();
    } catch (error) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ef4444;
            color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            <h3>Initialization Error</h3>
            <p>${error.message}</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #ef4444;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                margin-top: 10px;
                cursor: pointer;
            ">Reload Page</button>
        `;
        document.body.appendChild(errorDiv);
    }
});