class VersLibreEditor {
    constructor() {
        console.log('VersLibreEditor constructor called');
        this.canvas = null;
        this.ctx = null;
        this.image = null;
        this.logoImage = null;
        
        // Try different font fallbacks
        this.fontFamily = 'Radial Regular, "Radial-Regular", RadialRegular, Arial, sans-serif';
        
        // Image positioning and scaling
        this.imageOffsetX = 0;
        this.imageOffsetY = 0;
        this.imageScale = 1.0; // Default scale
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.initializeElements();
        this.bindEvents();
        this.updateOpacityDisplay();
        this.updateScaleDisplay();
        this.loadLogo();
        this.checkFontLoading();
        console.log('VersLibreEditor initialization complete');
    }

    initializeElements() {
        // Upload elements
        this.uploadArea = document.getElementById('uploadArea');
        this.imageInput = document.getElementById('imageInput');
        
        // Debug: Check if elements are found
        console.log('Looking for upload elements...');
        console.log('uploadArea found:', !!this.uploadArea, this.uploadArea);
        console.log('imageInput found:', !!this.imageInput, this.imageInput);
        
        if (!this.uploadArea) {
            console.error('Upload area not found! Check if element with id="uploadArea" exists');
            return;
        }
        if (!this.imageInput) {
            console.error('Image input not found! Check if element with id="imageInput" exists');
            return;
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
        
        console.log('All elements initialized successfully');
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
        // Check if upload elements exist before binding events
        if (!this.uploadArea || !this.imageInput) {
            console.error('Cannot bind upload events - elements not found');
            console.log('uploadArea:', this.uploadArea);
            console.log('imageInput:', this.imageInput);
            return;
        }
        
        console.log('Binding upload events to:', this.uploadArea, this.imageInput);
        
        // Image upload events with debugging
        this.uploadArea.addEventListener('click', (e) => {
            console.log('Upload area clicked', e);
            this.imageInput.click();
        });
        
        this.uploadArea.addEventListener('dragover', (e) => {
            console.log('Drag over detected', e);
            this.handleDragOver(e);
        });
        
        this.uploadArea.addEventListener('dragleave', (e) => {
            console.log('Drag leave detected', e);
            this.handleDragLeave(e);
        });
        
        this.uploadArea.addEventListener('drop', (e) => {
            console.log('Drop detected', e);
            this.handleImageDrop(e);
        });
        
        this.imageInput.addEventListener('change', (e) => {
            console.log('File input changed', e.target.files);
            this.handleImageUpload(e);
        });

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
        
        console.log('All events bound successfully');
    }

    bindCanvasEvents() {
        if (!this.canvas) return;

        // Mouse events for image dragging
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

        // Change cursor when hovering over image and show tooltip
        this.canvas.style.cursor = 'grab';
        this.canvas.title = 'Drag to reposition'; // Tooltip on hover
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
        
        // Show brief instructions when dragging starts
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
        
        // Show brief instructions when touch dragging starts
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

    handleImageDrop(e) {
        console.log('handleImageDrop called');
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        console.log('Files dropped:', files.length);
        
        if (files.length > 0) {
            const file = files[0];
            console.log('First file:', file.name, file.type);
            
            if (file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
                console.log('Valid image file, loading...');
                this.loadImage(file);
            } else {
                console.error('Invalid file type:', file.type);
                alert('Please drop a valid image file (JPG, PNG, GIF, HEIC)');
            }
        } else {
            console.log('No files in drop event');
            alert('Please drop a valid image file (JPG, PNG, GIF, HEIC)');
        }
    }

    handleImageUpload(e) {
        console.log('handleImageUpload called');
        const file = e.target.files[0];
        
        if (!file) {
            console.log('No file selected');
            return;
        }
        
        console.log('File selected:', file.name, file.type, file.size);
        
        if (file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
            console.log('Valid image file, loading...');
            this.loadImage(file);
        } else {
            console.error('Invalid file type:', file.type);
            alert('Please select a valid image file (JPG, PNG, GIF, HEIC)');
        }
    }

    loadImage(file) {
        console.log('loadImage called with:', file.name);
        
        // Check if it's a HEIC file
        const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
        
        if (isHeic) {
            // Handle HEIC files with heic2any library
            this.loadHeicImage(file);
        } else {
            // Handle regular image files
            this.loadRegularImage(file);
        }
    }

    loadHeicImage(file) {
        console.log('Loading HEIC file:', file.name);
        
        // Check if heic2any is available
        if (typeof heic2any === 'undefined') {
            console.error('heic2any library not loaded');
            alert('HEIC support not available. Please convert to JPG/PNG first, or refresh the page to load HEIC support.');
            return;
        }

        // Convert HEIC to JPEG
        heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.8
        }).then((convertedBlob) => {
            console.log('HEIC conversion successful');
            
            // Create a new file from the converted blob
            const convertedFile = new File([convertedBlob], file.name.replace(/\.heic$/i, '.jpg'), {
                type: 'image/jpeg'
            });
            
            // Load the converted image
            this.loadRegularImage(convertedFile);
        }).catch((error) => {
            console.error('HEIC conversion failed:', error);
            alert('Failed to convert HEIC file. Please try converting to JPG/PNG first.');
        });
    }

    loadRegularImage(file) {
        console.log('Loading regular image file:', file.name);
        const reader = new FileReader();
        
        reader.onload = (e) => {
            console.log('File reader loaded successfully');
            const img = new Image();
            img.onload = () => {
                console.log('Image loaded successfully:', img.width, 'x', img.height);
                this.image = img;
                this.imageOffsetX = 0; // Reset position
                this.imageOffsetY = 0;
                this.imageScale = 1.0; // Reset scale
                
                // Reset scale slider if it exists
                if (this.scaleSlider) {
                    this.scaleSlider.value = 100;
                    this.updateScaleDisplay();
                }
                
                this.createCanvas();
                if (this.downloadSection) {
                    this.downloadSection.style.display = 'flex';
                }
                this.updatePreview();
            };
            img.onerror = (error) => {
                console.error('Error loading image:', error);
                alert('Error loading image. Please try a different file.');
            };
            img.src = e.target.result;
        };
        
        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            alert('Error reading file. Please try again.');
        };
        
        reader.readAsDataURL(file);
    }

    createCanvas() {
        this.canvasArea.innerHTML = '';
        
        // Apply mobile-first CSS positioning
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
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

        // Set canvas size - CORRECT Instagram 4:5 ratio dimensions
        const width = 1080;   // Instagram recommended width
        const height = 1350;  // Instagram recommended height (4:5 ratio = 1080:1350)
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Responsive display size that maintains 4:5 ratio
        const displayWidth = isMobile ? Math.min(320, window.innerWidth - 40) : 400;
        const displayHeight = displayWidth * 1.25; // 4:5 ratio = 1.25
        
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';
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
        
        // Position using percentages as specified for 1080x1350 canvas:
        // - 12% from left edge (~129.6px)
        // - 5% from top (~67.5px)
        // - Logo ends at 21% from left (so width = 21% - 12% = 9% = ~97.2px)
        const paddingLeft = width * 0.12; // 12% from left edge
        const paddingTop = height * 0.05; // 5% from top edge
        const logoWidth = width * 0.09; // 9% width (ends at 21% from left)
        const logoHeight = (logoWidth / this.logoImage.width) * this.logoImage.height;

        console.log('Logo positioning (1080x1350):', { width, height, paddingLeft, paddingTop, logoWidth, logoHeight }); // Debug

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
        
        // Match real logo positioning using percentages for 1080x1350:
        // - 12% from left edge (~129.6px)
        // - 5% from top (~67.5px)
        // - Logo ends at 21% from left (width = 9% = ~97.2px)
        const paddingLeft = width * 0.12; // 12% from left edge
        const paddingTop = height * 0.05; // 5% from top edge
        const logoSize = width * 0.09; // 9% width

        console.log('Fallback logo positioning (1080x1350):', { width, height, paddingLeft, paddingTop, logoSize }); // Debug

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

        // 30pt font size
        const fontSize = '30pt';
        
        // Fixed Y positions for bottom baseline of each line
        const line1Y = 1220;    // Line 1 bottom baseline at 1220px from top
        const line2Y = 1260;    // Line 2 bottom baseline at 1260px from top
        const textX = 130;      // X position: 130px from left
        
        // Use regular weight font
        this.ctx.font = `${fontSize} ${this.fontFamily}`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillStyle = 'white';

        console.log('Text positioning (bottom baseline):', { line1Y, line2Y, textX, fontSize });

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
                    dateTimeText += ` | ${startTime}-${endTime}`;
                } else if (startTime) {
                    dateTimeText += ` | ${startTime}`;
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

        // 30pt font size
        const fontSize = '30pt';
        
        // Line 3 (date/time) bottom baseline position
        const dateTimeY = 1300; // Bottom baseline at 1300px from top
        const textX = 130;      // X position: 130px from left

        // Use regular weight font for date/time
        this.ctx.font = `${fontSize} ${this.fontFamily}`;
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';

        console.log('Date/time positioning:', { textX, dateTimeY, fontSize });

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

    checkFontLoading() {
        // Check multiple font name variations
        const fontVariations = [
            'Radial Regular',
            'Radial-Regular', 
            'RadialRegular',
            'radial-regular'
        ];
        
        let fontFound = false;
        
        if (document.fonts && document.fonts.check) {
            for (const fontName of fontVariations) {
                const isLoaded = document.fonts.check(`16px "${fontName}"`);
                console.log(`Font "${fontName}" loaded:`, isLoaded);
                if (isLoaded) {
                    fontFound = true;
                    this.fontFamily = `"${fontName}", Arial, sans-serif`;
                    console.log('✅ Using font:', this.fontFamily);
                    break;
                }
            }
        }
        
        if (!fontFound) {
            console.warn('⚠️ Radial Regular font not detected. Using Arial fallback.');
            console.log('📝 To add Radial Regular font:');
            console.log('1. Download Radial Regular .woff2 files');
            console.log('2. Create a "fonts" folder in your project');
            console.log('3. Add font files and update your CSS');
            
            // Use Arial as fallback - still looks professional
            this.fontFamily = 'Arial, sans-serif';
        }
    }

    downloadImage() {
        if (!this.canvas) return;

        try {
            // Create download link
            const link = document.createElement('a');
            const dataURL = this.canvas.toDataURL('image/png', 1.0);
            
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
                                <a href="${dataURL}" download="vers-libre-event.png" style="display:inline-block; padding:12px 24px; background:#B91B5C; color:white; text-decoration:none; border-radius:6px; margin:10px;">
                                    Download Image
                                </a>
                            </body>
                        </html>
                    `);
                    newWindow.document.close();
                } else {
                    // Fallback if popup blocked
                    link.href = dataURL;
                    link.download = 'vers-libre-event.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } else {
                // Standard download for desktop/Android
                link.href = dataURL;
                link.download = 'vers-libre-event.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            
        } catch (error) {
            console.error('Download failed:', error);
            alert('Download failed. Please try again or check your browser settings.');
        }
    }
}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded, initializing VersLibreEditor...');
    try {
        new VersLibreEditor();
    } catch (error) {
        console.error('Error initializing VersLibreEditor:', error);
    }
});