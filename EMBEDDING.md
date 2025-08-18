# 🎨 Embedding Vers Libre Editor

This guide shows you how to embed the Vers Libre Image Editor into your website, Google Sites, or any platform that supports iframes.

## 🚀 Quick Start

### For Google Sites:

1. **Add Embed Component**: Insert → Embed
2. **Paste URL**: `https://giantflags.github.io/vers-libre-editor/?embed=true`
3. **Set Dimensions**: Width: `100%`, Height: `800px` minimum

### For Any Website:

```html
<iframe 
  src="https://giantflags.github.io/vers-libre-editor/?embed=true" 
  width="100%" 
  height="900px" 
  frameborder="0"
  allowfullscreen
  title="Vers Libre Image Editor">
</iframe>
```

## 🎯 URL Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| `embed` | `true` | Enables compact embed mode |

Example: `https://giantflags.github.io/vers-libre-editor/?embed=true`

## 📱 Embed Mode Features

When `?embed=true` is used, the editor automatically:

- ✅ **Compact Design**: Smaller header and optimized spacing
- ✅ **Seamless Integration**: Removes outer borders and shadows  
- ✅ **Auto-Resize**: Sends height updates to parent page
- ✅ **Full Functionality**: All editing features work normally
- ✅ **Mobile Responsive**: Adapts to all screen sizes
- ✅ **Performance Optimized**: Lazy loading and efficient rendering

## 🔧 Advanced Integration

### Dynamic Height Adjustment

The embedded editor can communicate its height to the parent page:

```javascript
// Listen for height updates from embedded editor
window.addEventListener('message', function(event) {
    if (event.data.type === 'versLibreEditor') {
        const iframe = document.getElementById('editor-iframe');
        
        if (event.data.action === 'ready') {
            console.log('Editor loaded');
            iframe.style.height = event.data.height + 'px';
        } else if (event.data.action === 'resize') {
            iframe.style.height = event.data.height + 'px';
        }
    }
});
```

### Responsive Container

For best results, wrap the iframe in a responsive container:

```css
.editor-container {
    position: relative;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
}

.editor-container iframe {
    width: 100%;
    height: 800px;
    border: none;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
```

## 🌐 Platform-Specific Instructions

### Google Sites
1. Edit page → Insert → Embed
2. Paste: `https://giantflags.github.io/vers-libre-editor/?embed=true`
3. Resize to fit your content area

### WordPress
Use the HTML block and paste the iframe code above.

### Squarespace
Add a Code Block and insert the iframe HTML.

### Wix
Use the HTML Component and embed the iframe.

### Webflow
Add an Embed Component with the iframe code.

## ⚡ Performance Tips

1. **Lazy Loading**: Include `loading="lazy"` attribute
2. **Minimum Height**: Set initial height to prevent layout shifts
3. **Responsive Design**: Use percentage widths for mobile compatibility

## 🎨 Customization

The embedded version automatically detects iframe context and applies:

- Compact header (24px logo height)
- Minimal padding and margins
- Clean borders and shadows removal
- Optimized for integration

## 📋 Example Implementation

See `embed-example.html` in the repository for a complete working example.

## 🛟 Support

- **Demo**: https://giantflags.github.io/vers-libre-editor/embed-example.html
- **Issues**: https://github.com/giantflags/vers-libre-editor/issues
- **Repository**: https://github.com/giantflags/vers-libre-editor

## 🔒 Security & Privacy

- No data is sent to external servers
- All processing happens client-side
- Images remain on user's device until download
- HTTPS-only for secure embedding