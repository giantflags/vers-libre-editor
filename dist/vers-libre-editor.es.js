const h = {
  // File upload limits
  MAX_FILE_SIZE_MB: 10,
  MAX_FILE_SIZE_BYTES: 10485760,
  // 10MB in bytes
  // Supported file types
  VALID_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  VALID_IMAGE_EXTENSIONS: [".heic", ".heif"],
  // Performance tuning
  DEBOUNCE_DELAY_MS: 150,
  // Delay for text input debouncing
  MOBILE_BREAKPOINT: 768,
  // Screen width for mobile detection
  // Canvas display sizes
  MOBILE_CANVAS_WIDTH: 320,
  // Max width for mobile display
  MOBILE_CANVAS_PADDING: 40,
  // Padding for mobile canvas
  DESKTOP_CANVAS_WIDTH: 400,
  // Width for desktop display
  // Rendering configuration
  GRADIENT_HEIGHT_PERCENT: 0.4,
  // Bottom 40% of canvas for gradient
  HEIC_CONVERSION_QUALITY: 0.8,
  // JPEG quality for HEIC conversion
  PNG_EXPORT_QUALITY: 1,
  // Full quality for PNG export
  // UI timing
  ERROR_MESSAGE_DURATION_MS: 5e3,
  // How long error messages display
  INSTRUCTION_HIDE_DELAY_MS: 3e3,
  // Auto-hide positioning instructions
  INSTRUCTION_FADE_DURATION_MS: 500,
  // Fade animation duration
  BRIEF_INSTRUCTION_DURATION_MS: 1500,
  // Brief instruction display time
  // Touch/interaction
  MIN_TOUCH_TARGET_PX: 44,
  // Minimum touch target size (accessibility)
  // Text constraints
  MAX_TITLE_LENGTH: 40,
  // Maximum characters for title lines
  MAX_FILENAME_LENGTH: 40
  // Maximum length for generated filenames
}, m = {
  "4:5": {
    width: 1080,
    height: 1350,
    name: "Instagram/Facebook Post",
    textPositions: {
      line1Y: 1220,
      line2Y: 1260,
      dateTimeY: 1300
    },
    logo: {
      show: !0,
      leftPercent: 0.12,
      topPercent: 0.05,
      widthPercent: 0.09
    }
  },
  "9:16": {
    width: 1080,
    height: 1920,
    name: "Instagram Story",
    textPositions: {
      line1Y: 1320,
      line2Y: 1370,
      dateTimeY: 1420
    },
    logo: {
      show: !1,
      leftPercent: 0.12,
      topPercent: 0.05,
      widthPercent: 0.09
    }
  },
  "1:1": {
    width: 1080,
    height: 1080,
    name: "Mixcloud Show Image",
    textPositions: {
      line1Y: 950,
      line2Y: 990,
      dateTimeY: 1030
    },
    logo: {
      show: !0,
      leftPercent: 0.12,
      topPercent: 0.05,
      widthPercent: 0.09
    }
  },
  "obs-hd": {
    width: 1920,
    height: 1080,
    name: "Video Stream for OBS",
    textPositions: {
      line1Y: null,
      // Calculated dynamically
      line2Y: null,
      // Calculated dynamically
      dateTimeY: null
      // Hidden for OBS
    },
    logo: {
      show: !0,
      rightPercent: 0.05,
      topPercent: 0.05,
      widthPercent: 0.05
    }
  }
}, w = {
  family: 'Radial Regular, "Radial-Regular", RadialRegular, Arial, sans-serif',
  fallback: "Arial, sans-serif",
  variations: ["Radial Regular", "Radial-Regular", "RadialRegular"],
  sizes: {
    main: "30pt",
    dateTime: "26pt"
  }
}, d = {
  errors: {
    noFile: "No file provided",
    fileTooLarge: "File size too large (max 10MB)",
    invalidType: "Invalid file type. Supported: JPG, PNG, GIF, WEBP, HEIC",
    heicNotSupported: "HEIC support library not loaded. Please refresh the page and try again.",
    heicConversionFailed: "Failed to convert HEIC file",
    imageLoadFailed: "Error loading image. Please try a different file.",
    fileReadFailed: "Error reading file. Please try again.",
    downloadFailed: "Download failed",
    missingElements: "Required elements not found"
  },
  progress: {
    convertingHeic: "Converting HEIC file..."
  },
  instructions: {
    dragToReposition: "Drag to reposition image",
    repositioning: "Repositioning..."
  }
};
class I {
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
      imageScale: 1,
      // Interaction state
      isDragging: !1,
      lastMouseX: 0,
      lastMouseY: 0,
      // Format and dimensions
      currentFormat: "4:5",
      canvasWidth: 1080,
      canvasHeight: 1350,
      // Text content
      titleLine1: "",
      titleLine2: "",
      dateValue: "",
      startTime: "",
      endTime: "",
      // Display settings
      gradientOpacity: 30,
      showLogo: !0,
      // UI state
      isMobile: !1,
      isEmbedded: !1,
      // Font
      fontFamily: 'Radial Regular, "Radial-Regular", RadialRegular, Arial, sans-serif'
    }, this.listeners = [];
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
  get(e) {
    return this.state[e];
  }
  /**
   * Update state with partial updates
   * @param {Object} updates - Partial state updates
   */
  update(e) {
    const t = { ...this.state };
    this.state = { ...this.state, ...e }, this.notify(e, t);
  }
  /**
   * Set a single state value
   * @param {string} key - State key
   * @param {*} value - New value
   */
  set(e, t) {
    this.update({ [e]: t });
  }
  /**
   * Subscribe to state changes
   * @param {Function} listener - Callback function(newState, changes, oldState)
   * @returns {Function} Unsubscribe function
   */
  subscribe(e) {
    return this.listeners.push(e), () => {
      this.listeners = this.listeners.filter((t) => t !== e);
    };
  }
  /**
   * Notify all listeners of state changes
   * @param {Object} changes - What changed
   * @param {Object} oldState - Previous state
   */
  notify(e, t) {
    this.listeners.forEach((i) => {
      i(this.state, e, t);
    });
  }
  /**
   * Reset image transformation to defaults
   */
  resetImageTransform() {
    this.update({
      imageOffsetX: 0,
      imageOffsetY: 0,
      imageScale: 1
    });
  }
  /**
   * Update format configuration
   * @param {string} format - Format key ('4:5', '9:16', etc.)
   */
  setFormat(e) {
    const t = m[e];
    if (!t) return;
    const i = {
      currentFormat: e,
      canvasWidth: t.width,
      canvasHeight: t.height,
      showLogo: t.logo.show
    };
    this.update(i);
  }
  /**
   * Get current format configuration
   * @returns {Object} Format configuration object
   */
  getFormatConfig() {
    return m[this.state.currentFormat];
  }
}
function S(s) {
  if (!s)
    return { valid: !1, error: d.errors.noFile };
  if (s.size > h.MAX_FILE_SIZE_BYTES)
    return { valid: !1, error: d.errors.fileTooLarge };
  const e = h.VALID_IMAGE_TYPES.includes(s.type), t = h.VALID_IMAGE_EXTENSIONS.some(
    (i) => s.name.toLowerCase().endsWith(i)
  );
  return !e && !t ? { valid: !1, error: d.errors.invalidType } : { valid: !0 };
}
function T(s) {
  if (!s || !s.trim())
    return { valid: !1 };
  const e = new Date(s);
  return isNaN(e.getTime()) ? (console.warn("Invalid date value:", s), { valid: !1 }) : { valid: !0, date: e };
}
function E(s) {
  if (!s) return !1;
  const e = s.name.toLowerCase();
  return e.endsWith(".heic") || e.endsWith(".heif");
}
class v {
  /**
   * Loads an image file, handling HEIC conversion if needed
   * @param {File} file - The image file to load
   * @param {Object} callbacks - Callback functions
   * @param {Function} callbacks.onProgress - Called with progress messages
   * @param {Function} callbacks.onError - Called with error messages
   * @param {Function} callbacks.onSuccess - Called with loaded HTMLImageElement
   * @returns {Promise<void>}
   */
  static async loadImage(e, { onProgress: t, onError: i, onSuccess: a }) {
    try {
      const n = S(e);
      if (!n.valid) {
        i(n.error);
        return;
      }
      E(e) ? await this.loadHeicImage(e, { onProgress: t, onError: i, onSuccess: a }) : await this.loadRegularImage(e, { onError: i, onSuccess: a });
    } catch (n) {
      i(`${d.errors.imageLoadFailed}: ${n.message}`);
    }
  }
  /**
   * Loads and converts a HEIC image
   * @param {File} file - HEIC file to convert
   * @param {Object} callbacks - Callback functions
   * @returns {Promise<void>}
   */
  static async loadHeicImage(e, { onProgress: t, onError: i, onSuccess: a }) {
    if (typeof heic2any > "u") {
      i(d.errors.heicNotSupported);
      return;
    }
    try {
      t(d.progress.convertingHeic);
      const n = await heic2any({
        blob: e,
        toType: "image/jpeg",
        quality: h.HEIC_CONVERSION_QUALITY
      });
      t(null);
      const r = new File(
        [n],
        e.name.replace(/\.heic$/i, ".jpg"),
        { type: "image/jpeg" }
      );
      await this.loadRegularImage(r, { onError: i, onSuccess: a });
    } catch (n) {
      t(null), i(`${d.errors.heicConversionFailed}: ${n.message}`);
    }
  }
  /**
   * Loads a standard image file
   * @param {File} file - Image file to load
   * @param {Object} callbacks - Callback functions
   * @returns {Promise<HTMLImageElement>}
   */
  static async loadRegularImage(e, { onError: t, onSuccess: i }) {
    return new Promise((a, n) => {
      const r = new FileReader();
      r.onload = (o) => {
        const l = new Image();
        l.onload = () => {
          i(l), a(l);
        }, l.onerror = () => {
          const c = d.errors.imageLoadFailed;
          t(c), n(new Error(c));
        }, l.src = o.target.result;
      }, r.onerror = () => {
        const o = d.errors.fileReadFailed;
        t(o), n(new Error(o));
      }, r.readAsDataURL(e);
    });
  }
  /**
   * Loads the Vers Libre logo
   * @param {string} logoPath - Path to logo image
   * @returns {Promise<HTMLImageElement>}
   */
  static async loadLogo(e = "./vers-libre-logo.png") {
    return new Promise((t, i) => {
      const a = new Image();
      a.onload = () => {
        t(a);
      }, a.onerror = () => {
        console.warn("Failed to load logo image, will use fallback"), t(null);
      }, a.src = e;
    });
  }
}
function y(s) {
  if (!s) return "";
  const e = T(s);
  if (!e.valid) return "";
  const t = e.date, i = String(t.getDate()).padStart(2, "0"), a = String(t.getMonth() + 1).padStart(2, "0"), n = String(t.getFullYear()).slice(-2);
  return `${i}.${a}.${n}`;
}
function A({ dateValue: s, startTime: e, endTime: t }) {
  const i = y(s), a = (e == null ? void 0 : e.trim()) || "", n = (t == null ? void 0 : t.trim()) || "";
  return i ? a && n ? `${i}｜${a}-${n}` : a ? `${i}｜${a}` : i : a && n ? `${a}-${n}` : a || "";
}
function u(s, e = h.MAX_FILENAME_LENGTH) {
  return s ? s.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").toLowerCase().substring(0, e) : "";
}
function b({ titleLine1: s, dateValue: e, format: t }) {
  let i = "";
  if (t === "1:1" ? i = "_square" : t === "obs-hd" && (i = "_obs-hd"), t === "obs-hd")
    return s != null && s.trim() ? `${u(s, 40)}${i}.png` : `vers-libre-event${i}.png`;
  let a = "";
  if (e != null && e.trim()) {
    const r = new Date(e);
    if (!isNaN(r.getTime())) {
      const o = r.getFullYear(), l = String(r.getMonth() + 1).padStart(2, "0"), c = String(r.getDate()).padStart(2, "0");
      a = `${o}-${l}-${c}`;
    }
  }
  const n = (s == null ? void 0 : s.trim()) || "";
  return n && a ? `${u(n, 30)}_${a}${i}.png` : n ? `${u(n, 40)}${i}.png` : a ? `vers-libre-event_${a}${i}.png` : `vers-libre-event${i}.png`;
}
function _(s = 30) {
  const e = [];
  for (let t = 0; t < 24; t++)
    for (let i = 0; i < 60; i += s) {
      const a = String(t).padStart(2, "0"), n = String(i).padStart(2, "0");
      e.push(`${a}:${n}`);
    }
  return e;
}
class L {
  constructor() {
    this.listeners = /* @__PURE__ */ new Map();
  }
  on(e, t) {
    return this.listeners.has(e) || this.listeners.set(e, []), this.listeners.get(e).push(t), () => this.off(e, t);
  }
  off(e, t) {
    if (!this.listeners.has(e)) return;
    const i = this.listeners.get(e), a = i.indexOf(t);
    a > -1 && i.splice(a, 1);
  }
  emit(e, t) {
    this.listeners.has(e) && this.listeners.get(e).forEach((i) => {
      try {
        i(t);
      } catch (a) {
        console.error(`Error in event listener for "${e}":`, a);
      }
    });
  }
  removeAllListeners(e) {
    e ? this.listeners.delete(e) : this.listeners.clear();
  }
}
class R extends L {
  /**
   * @param {HTMLElement} container - DOM element to mount editor
   * @param {Object} config - Configuration options
   */
  constructor(e, t = {}) {
    if (super(), !e || !(e instanceof HTMLElement))
      throw new Error("VersLibreEditor requires a valid DOM container element");
    this.container = e, this.config = this.mergeConfig(t), this.state = new I(), this.elements = {}, this.cleanupFunctions = [], this.init();
  }
  /**
   * Merge user config with defaults
   */
  mergeConfig(e) {
    var t, i, a, n, r, o, l, c, p, g, f;
    return {
      // Mode
      standalone: e.standalone ?? !0,
      readonly: e.readonly ?? !1,
      // Features
      features: {
        upload: ((t = e.features) == null ? void 0 : t.upload) ?? !0,
        download: ((i = e.features) == null ? void 0 : i.download) ?? !0,
        formats: ((a = e.features) == null ? void 0 : a.formats) ?? ["4:5", "9:16", "1:1", "obs-hd"],
        heicSupport: ((n = e.features) == null ? void 0 : n.heicSupport) ?? !0
      },
      // Theme
      theme: e.theme || "default",
      // Callbacks
      callbacks: {
        onSave: ((r = e.callbacks) == null ? void 0 : r.onSave) || null,
        onExport: ((o = e.callbacks) == null ? void 0 : o.onExport) || null,
        onError: ((l = e.callbacks) == null ? void 0 : l.onError) || null,
        onReady: ((c = e.callbacks) == null ? void 0 : c.onReady) || null
      },
      // API
      api: {
        endpoint: ((p = e.api) == null ? void 0 : p.endpoint) || "/api/editor",
        saveProject: ((g = e.api) == null ? void 0 : g.saveProject) || "/api/projects",
        uploadImage: ((f = e.api) == null ? void 0 : f.uploadImage) || "/api/upload"
      },
      // Initial data
      initialData: e.initialData || null,
      ...e
    };
  }
  /**
   * Initialize the editor
   */
  async init() {
    try {
      this.container.classList.add("vers-libre-editor-scope"), this.config.theme && this.container.setAttribute("data-theme", this.config.theme), this.injectHTML(), this.cacheElements(), this.state.set("logoImage", await v.loadLogo()), this.bindEvents(), this.config.initialData && await this.loadProject(this.config.initialData), await this.initializeFontLoading(), this.emit("editor:ready", { config: this.config }), this.config.callbacks.onReady && this.config.callbacks.onReady(this);
    } catch (e) {
      this.handleError("Initialization failed", e);
    }
  }
  /**
   * Inject HTML structure into container
   */
  injectHTML() {
    this.container.innerHTML = this.getTemplate();
  }
  /**
   * Get HTML template
   */
  getTemplate() {
    return `
            <div class="editor-container">
                <div class="sidebar">
                    <div class="sidebar-section">
                        <h3>📤 Upload</h3>
                        <div class="upload-area" id="uploadArea">
                            <div class="upload-icon">📤</div>
                            <p><strong>Click to upload</strong> or drag & drop</p>
                            <p style="font-size: 0.8rem; color: #64748b;">Supports JPG, PNG, GIF${this.config.features.heicSupport ? ", HEIC" : ""}</p>
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
                                ${this.config.features.formats.map((e) => {
      const t = m[e];
      return `<option value="${e}">${t.name}</option>`;
    }).join("")}
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
                    ` : ""}
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
      uploadArea: this.container.querySelector("#uploadArea"),
      imageInput: this.container.querySelector("#imageInput"),
      canvasArea: this.container.querySelector("#canvasArea"),
      downloadSection: this.container.querySelector("#downloadSection"),
      downloadBtn: this.container.querySelector("#downloadBtn"),
      titleLine1: this.container.querySelector("#titleLine1"),
      titleLine2: this.container.querySelector("#titleLine2"),
      dateInput: this.container.querySelector("#dateInput"),
      startTimeInput: this.container.querySelector("#startTimeInput"),
      endTimeInput: this.container.querySelector("#endTimeInput"),
      aspectRatio: this.container.querySelector("#aspectRatio"),
      scaleSlider: this.container.querySelector("#scaleSlider"),
      scaleValue: this.container.querySelector("#scaleValue"),
      opacitySlider: this.container.querySelector("#opacitySlider"),
      opacityValue: this.container.querySelector("#opacityValue")
    }, this.populateTimeSelects();
  }
  /**
   * Populate time select dropdowns
   */
  populateTimeSelects() {
    const e = [];
    for (let i = 0; i < 24; i++)
      for (let a = 0; a < 60; a += 30) {
        const n = String(i).padStart(2, "0"), r = String(a).padStart(2, "0");
        e.push(`${n}:${r}`);
      }
    const t = '<option value="">Select time</option>' + e.map((i) => `<option value="${i}">${i}</option>`).join("");
    this.elements.startTimeInput && (this.elements.startTimeInput.innerHTML = t), this.elements.endTimeInput && (this.elements.endTimeInput.innerHTML = t);
  }
  /**
   * Bind event listeners
   */
  bindEvents() {
    this.elements.uploadArea && this.config.features.upload && (this.elements.uploadArea.addEventListener("click", () => this.elements.imageInput.click()), this.elements.uploadArea.addEventListener("dragover", this.handleDragOver.bind(this)), this.elements.uploadArea.addEventListener("dragleave", this.handleDragLeave.bind(this)), this.elements.uploadArea.addEventListener("drop", this.handleDrop.bind(this))), this.elements.imageInput && this.elements.imageInput.addEventListener("change", this.handleImageUpload.bind(this)), this.elements.downloadBtn && this.config.features.download && this.elements.downloadBtn.addEventListener("click", this.handleDownload.bind(this));
  }
  /**
   * Handle image upload
   */
  async handleImageUpload(e) {
    const t = e.target.files[0];
    t && await v.loadImage(t, {
      onProgress: (i) => {
        this.emit("image:loading", { message: i });
      },
      onError: (i) => {
        this.handleError("Image upload failed", i);
      },
      onSuccess: (i) => {
        this.state.update({ image: i }), this.emit("image:uploaded", {
          size: t.size,
          name: t.name,
          dimensions: { width: i.width, height: i.height }
        }), this.elements.downloadSection && (this.elements.downloadSection.style.display = "flex");
      }
    });
  }
  /**
   * Handle download
   */
  handleDownload() {
    this.emit("image:export:start");
    const e = {
      format: this.state.get("currentFormat"),
      filename: b({
        titleLine1: this.elements.titleLine1.value,
        dateValue: this.elements.dateInput.value,
        format: this.state.get("currentFormat")
      })
    };
    this.emit("image:exported", e), this.config.callbacks.onExport && this.config.callbacks.onExport(e);
  }
  /**
   * Drag and drop handlers
   */
  handleDragOver(e) {
    e.preventDefault(), e.stopPropagation(), this.elements.uploadArea.classList.add("dragover");
  }
  handleDragLeave(e) {
    e.preventDefault(), e.stopPropagation(), this.elements.uploadArea.classList.remove("dragover");
  }
  handleDrop(e) {
    e.preventDefault(), e.stopPropagation(), this.elements.uploadArea.classList.remove("dragover");
    const t = e.dataTransfer.files;
    t.length > 0 && (this.elements.imageInput.files = t, this.handleImageUpload({ target: { files: t } }));
  }
  /**
   * Initialize font loading
   */
  async initializeFontLoading() {
    try {
      await document.fonts.ready;
    } catch {
      console.warn("Font loading failed, using fallback");
    }
  }
  /**
   * Load a project
   */
  async loadProject(e) {
    var t;
    try {
      this.emit("project:loading", e), (t = e.image) != null && t.url, e.text && (this.elements.titleLine1 && (this.elements.titleLine1.value = e.text.line1 || ""), this.elements.titleLine2 && (this.elements.titleLine2.value = e.text.line2 || ""), this.elements.dateInput && (this.elements.dateInput.value = e.text.date || ""), this.elements.startTimeInput && (this.elements.startTimeInput.value = e.text.startTime || ""), this.elements.endTimeInput && (this.elements.endTimeInput.value = e.text.endTime || "")), e.format && (this.state.setFormat(e.format), this.elements.aspectRatio && (this.elements.aspectRatio.value = e.format)), this.emit("project:loaded", e);
    } catch (i) {
      this.handleError("Failed to load project", i);
    }
  }
  /**
   * Get current project data
   */
  getProjectData() {
    var e, t, i, a, n;
    return {
      format: this.state.get("currentFormat"),
      image: {
        offsetX: this.state.get("imageOffsetX"),
        offsetY: this.state.get("imageOffsetY"),
        scale: this.state.get("imageScale")
      },
      text: {
        line1: ((e = this.elements.titleLine1) == null ? void 0 : e.value) || "",
        line2: ((t = this.elements.titleLine2) == null ? void 0 : t.value) || "",
        date: ((i = this.elements.dateInput) == null ? void 0 : i.value) || "",
        startTime: ((a = this.elements.startTimeInput) == null ? void 0 : a.value) || "",
        endTime: ((n = this.elements.endTimeInput) == null ? void 0 : n.value) || ""
      },
      settings: {
        gradientOpacity: this.state.get("gradientOpacity")
      }
    };
  }
  /**
   * Handle errors
   */
  handleError(e, t) {
    const i = {
      message: e,
      error: t instanceof Error ? t.message : t,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    console.error(e, t), this.emit("error", i), this.config.callbacks.onError && this.config.callbacks.onError(i);
  }
  /**
   * Destroy the editor and cleanup
   */
  destroy() {
    this.cleanupFunctions.forEach((e) => e()), this.removeAllListeners(), this.container && (this.container.innerHTML = "", this.container.classList.remove("vers-libre-editor-scope"), this.container.removeAttribute("data-theme")), this.elements = {}, this.state = null, this.container = null, this.emit("editor:destroyed");
  }
}
export {
  h as CONSTANTS,
  I as EditorState,
  w as FONTS,
  m as FORMAT_CONFIGS,
  v as ImageService,
  d as UI_TEXT,
  R as VersLibreEditorComponent,
  y as formatDate,
  A as formatDateTime,
  b as generateFilename,
  _ as generateTimeOptions,
  E as isHeicFile,
  T as validateDate,
  S as validateFile
};
//# sourceMappingURL=vers-libre-editor.es.js.map
