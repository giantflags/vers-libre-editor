# Vers Libre Editor - Testing Checklist

## Manual Testing Guide

### 1. Basic Functionality Tests ✅
- [ ] **Page Load**: Open http://localhost:8080 - page should load without console errors
- [ ] **Image Upload**: Click upload area → select image → canvas should appear
- [ ] **Drag & Drop**: Drag image file onto upload area → should upload successfully
- [ ] **Text Input**: Enter text in Line 1, Line 2 → should appear on canvas immediately
- [ ] **Date/Time**: Select date and times → should format and display correctly
- [ ] **Image Scaling**: Move scale slider → image should resize smoothly
- [ ] **Gradient Opacity**: Move opacity slider → gradient should change
- [ ] **Image Positioning**: Drag canvas image → should reposition smoothly
- [ ] **Download**: Click download → image should download as PNG

### 2. Error Handling Tests 🛡️
- [ ] **Large File**: Try uploading >10MB image → should show error message
- [ ] **Invalid File**: Try uploading non-image file → should show error message
- [ ] **Broken Image**: Try corrupt image file → should show error message
- [ ] **Missing Elements**: Test with broken HTML → should show initialization error
- [ ] **Network Issues**: Test with CDN blocked → should gracefully fallback

### 3. Performance Tests ⚡
- [ ] **Smooth Updates**: Type quickly in text fields → updates should be smooth (not laggy)
- [ ] **Canvas Rendering**: Move sliders rapidly → should use requestAnimationFrame
- [ ] **Memory Usage**: Upload multiple images → check browser memory (F12 → Performance)
- [ ] **Large Images**: Test with 4K+ images → should handle without freezing

### 4. Accessibility Tests ♿
- [ ] **Keyboard Navigation**: Tab through all controls → proper focus order
- [ ] **Screen Reader**: Use VoiceOver/NVDA → labels should be announced
- [ ] **Focus Indicators**: Tab navigation → visible focus outlines
- [ ] **ARIA Labels**: Inspect elements → proper aria-label attributes
- [ ] **Canvas Access**: Tab to canvas → should be focusable with description

### 5. Mobile/Responsive Tests 📱
- [ ] **Mobile View**: Test on phone/tablet → layout should adapt
- [ ] **Touch Targets**: All buttons ≥44px → easy to tap
- [ ] **Touch Drag**: Touch drag on canvas → should reposition image
- [ ] **Viewport**: Zoom in/out → should remain usable
- [ ] **iOS Safari**: Test download → should open new window for save

### 6. Browser Compatibility Tests 🌐
- [ ] **Chrome**: All features work
- [ ] **Firefox**: All features work  
- [ ] **Safari**: All features work (especially download)
- [ ] **Mobile Safari**: Touch events and download work
- [ ] **Edge**: All features work

## Automated Testing Commands

### Check for JavaScript Errors
```bash
# Open browser console (F12) and look for:
# - No console.log statements (should be clean)
# - No error messages
# - Proper error handling messages only
```

### Performance Testing
```bash
# Browser DevTools (F12) → Performance tab
# 1. Start recording
# 2. Upload image and interact with controls
# 3. Stop recording
# 4. Look for smooth 60fps performance
```

### Accessibility Testing
```bash
# Install axe DevTools extension
# Or use built-in browser accessibility checker
# Check for WCAG compliance
```

## Test Files You Can Use

### Good Test Images
- Small JPEG (~500KB)
- Large PNG (~5MB)
- HEIC file (if available)
- Wide aspect ratio image
- Tall aspect ratio image

### Error Test Cases
- Text file renamed to .jpg
- Corrupted image file
- File larger than 10MB
- Empty file

## Expected Results

### Console Output
- **Before**: 25+ console.log messages
- **After**: Clean console (no debug messages)
- **Errors**: User-friendly error notifications only

### Performance
- **Text Updates**: <16ms response time
- **Canvas Rendering**: Smooth 60fps
- **Memory**: No memory leaks on repeated uploads

### Accessibility
- **Keyboard**: All controls reachable via Tab
- **Screen Reader**: All elements properly labeled
- **Focus**: Visible focus indicators throughout

## Quick Smoke Test (2 minutes)
1. Open http://localhost:8080
2. Upload any image
3. Type in text fields
4. Move both sliders
5. Drag image around
6. Download image
7. Check console for errors

All should work smoothly without errors!