# Modular Architecture (Tier 2 Refactor)

This directory contains the **modularized codebase** for the Vers Libre Image Editor. The code has been refactored from a monolithic 1,455-line class into small, testable, reusable modules following separation of concerns principles.

## Directory Structure

```
src/
├── utils/              # Utility functions (pure, stateless)
│   ├── constants.js    # Application constants and configuration
│   ├── validation.js   # File and input validation logic
│   └── formatting.js   # Date, filename, and text formatting
│
├── services/           # Business logic services
│   └── ImageService.js # Image loading, HEIC conversion, logo loading
│
└── state/              # State management
    └── EditorState.js  # Centralized state with observer pattern
```

## Module Overview

### **utils/constants.js**
Centralized configuration and constants.

**Exports:**
- `CONSTANTS` - App-wide configuration (file sizes, timings, canvas sizes, etc.)
- `FORMAT_CONFIGS` - Configuration for each output format (4:5, 9:16, 1:1, obs-hd)
- `FONTS` - Font family configurations
- `UI_TEXT` - User-facing error/UI text messages

**Benefits:**
- Single source of truth for all magic numbers
- Easy to modify configuration without hunting through code
- Self-documenting with comments

---

### **utils/validation.js**
Input and file validation logic (pure functions).

**Exports:**
- `validateFile(file)` - Validates uploaded files (size, type, extension)
- `validateDate(dateString)` - Validates and parses date strings
- `isHeicFile(file)` - Checks if file is HEIC/HEIF format
- `validateElements(elementMap)` - Validates DOM elements exist

**Benefits:**
- Pure functions = easy to test
- Reusable across application
- Clear error messages

**Example:**
```javascript
import { validateFile } from './utils/validation.js';

const result = validateFile(file);
if (!result.valid) {
    console.error(result.error);
}
```

---

### **utils/formatting.js**
Date, filename, and display text formatting (pure functions).

**Exports:**
- `formatDate(dateValue)` - Converts YYYY-MM-DD to DD.MM.YY
- `formatDateTime({ dateValue, startTime, endTime })` - Formats full date/time string
- `sanitizeForFilename(text, maxLength)` - Removes special chars for filenames
- `generateFilename({ titleLine1, dateValue, format })` - Creates download filename
- `generateTimeOptions(intervalMinutes)` - Generates time select options

**Benefits:**
- Consistent formatting across app
- Easy to modify output formats
- Testable business logic

**Example:**
```javascript
import { generateFilename } from './utils/formatting.js';

const filename = generateFilename({
    titleLine1: 'My Event',
    dateValue: '2025-12-01',
    format: '4:5'
});
// Returns: "my-event_2025-12-01.png"
```

---

### **services/ImageService.js**
Image loading and processing service.

**Exports:**
- `ImageService.loadImage(file, callbacks)` - Loads image with HEIC auto-conversion
- `ImageService.loadHeicImage(file, callbacks)` - Converts HEIC to JPEG
- `ImageService.loadRegularImage(file, callbacks)` - Loads standard image formats
- `ImageService.loadLogo(logoPath)` - Loads Vers Libre logo

**Benefits:**
- Asynchronous image processing
- HEIC conversion abstracted away
- Progress callbacks for UX
- Error handling built-in

**Example:**
```javascript
import { ImageService } from './services/ImageService.js';

await ImageService.loadImage(file, {
    onProgress: (msg) => console.log(msg),
    onError: (err) => alert(err),
    onSuccess: (img) => useImage(img)
});
```

---

### **state/EditorState.js**
Centralized state management with observer pattern.

**Exports:**
- `EditorState` class - Observable state container

**Methods:**
- `getState()` - Get full state snapshot
- `get(key)` - Get specific state value
- `update(updates)` - Update multiple state values
- `set(key, value)` - Update single state value
- `subscribe(listener)` - Subscribe to state changes
- `resetImageTransform()` - Reset image position/scale
- `setFormat(format)` - Update canvas format
- `getFormatConfig()` - Get current format config

**Benefits:**
- Single source of truth for app state
- Observer pattern for reactive updates
- Easier debugging (state inspector)
- Enables undo/redo in future

**Example:**
```javascript
import { EditorState } from './state/EditorState.js';

const state = new EditorState();

// Subscribe to changes
state.subscribe((newState, changes) => {
    console.log('State changed:', changes);
});

// Update state
state.update({ imageScale: 1.5, gradientOpacity: 50 });
```

---

## Migration Status

### ✅ Completed
- [x] Create modular directory structure
- [x] Extract constants to `utils/constants.js`
- [x] Extract validation to `utils/validation.js`
- [x] Extract formatting to `utils/formatting.js`
- [x] Extract ImageService to `services/ImageService.js`
- [x] Create EditorState in `state/EditorState.js`
- [x] Dynamic time select generation (replaced 200+ lines of HTML)

### 🚧 In Progress
- [ ] Refactor main `script.js` to use modules (incremental migration)
- [ ] Extract CanvasService for rendering logic

### 📋 Planned
- [ ] Add unit tests with Vitest
- [ ] Extract UIService for notifications/feedback
- [ ] Extract EventHandlerService for mouse/touch events
- [ ] Full ES6 module migration
- [ ] Build system with Vite

---

## Usage (Future)

Once fully migrated, the editor will work as ES6 modules:

```html
<!-- index.html -->
<script type="module" src="./src/main.js"></script>
```

```javascript
// src/main.js
import { EditorState } from './state/EditorState.js';
import { ImageService } from './services/ImageService.js';
import { validateFile, formatDate } from './utils/index.js';

// Initialize editor with modular architecture
const state = new EditorState();
// ... rest of initialization
```

---

## Testing

With this modular structure, we can now write unit tests:

```javascript
// tests/utils/validation.test.js
import { describe, it, expect } from 'vitest';
import { validateFile } from '../src/utils/validation.js';

describe('validateFile', () => {
    it('should reject files over 10MB', () => {
        const largefile = new File(['x'.repeat(11 * 1024 * 1024)], 'big.jpg');
        const result = validateFile(largeFile);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('too large');
    });
});
```

---

## Architecture Benefits

### Before (Monolithic)
```
VersLibreEditor (1,455 lines)
└── Everything in one class
```

### After (Modular)
```
src/
├── utils/         (Stateless utilities)
├── services/      (Business logic)
└── state/         (State management)
```

**Improvements:**
- ✅ **Testable** - Pure functions can be unit tested
- ✅ **Maintainable** - Small focused modules
- ✅ **Reusable** - Functions can be used elsewhere
- ✅ **Scalable** - Easy to add new features
- ✅ **Readable** - Clear separation of concerns

---

## Contributing

When adding new features:

1. **Utilities** → `utils/` (pure functions, no side effects)
2. **Business Logic** → `services/` (stateful operations)
3. **State** → `state/` (state management only)

Keep modules small (<200 lines), focused, and well-documented.
