# Dashboard Integration Guide

This guide explains how to integrate the **Vers Libre Editor Component Library** into the `librai-dashboard`.

---

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [React Integration](#react-integration)
4. [API Integration](#api-integration)
5. [Build & Deployment](#build--deployment)
6. [TypeScript Support](#typescript-support)
7. [Customization](#customization)

---

## Installation

### Option 1: npm Package (Recommended for Production)

```bash
cd librai-dashboard
npm install @librai/vers-libre-editor
```

### Option 2: Local Development

For development and testing, link the package locally:

```bash
# In vers-libre-editor directory
npm link

# In librai-dashboard directory
npm link @librai/vers-libre-editor
```

### Option 3: Git Submodule

Add as a git submodule to your dashboard:

```bash
cd librai-dashboard
git submodule add https://github.com/giantflags/vers-libre-editor packages/vers-libre-editor
```

Then install dependencies:

```bash
cd packages/vers-libre-editor
npm install && npm run build
```

---

## Quick Start

### 1. Import the Component

```jsx
import { VersLibreEditor } from '@librai/vers-libre-editor/react';
import '@librai/vers-libre-editor/css';
```

### 2. Add to Your Dashboard

```jsx
function EditorPage() {
    const editorRef = useRef(null);

    return (
        <div className="page">
            <h1>Create Event Image</h1>
            <VersLibreEditor ref={editorRef} />
        </div>
    );
}
```

That's it! You now have a fully functional editor integrated.

---

## React Integration

### Basic Integration

```jsx
import React, { useRef } from 'react';
import { VersLibreEditor } from '@librai/vers-libre-editor/react';
import '@librai/vers-libre-editor/css';

export function EditorPage() {
    const editorRef = useRef(null);

    const handleSave = async () => {
        const projectData = editorRef.current?.getProjectData();

        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
        });

        const { id } = await response.json();
        alert(`Project saved with ID: ${id}`);
    };

    return (
        <div className="editor-page">
            <header>
                <h1>Event Image Editor</h1>
                <button onClick={handleSave}>Save Project</button>
            </header>

            <VersLibreEditor
                ref={editorRef}
                config={{
                    standalone: false,
                    features: {
                        upload: true,
                        download: true,
                        formats: ['4:5', '9:16', '1:1', 'obs-hd']
                    }
                }}
                onImageUploaded={(data) => {
                    console.log('Image uploaded:', data);
                }}
                onImageExported={(data) => {
                    console.log('Image exported:', data);
                }}
                onError={(error) => {
                    console.error('Editor error:', error);
                }}
            />
        </div>
    );
}
```

### Advanced Integration with Custom Hook

Use the provided `useEditor` hook for declarative state management:

```jsx
import { useEditor } from '@librai/vers-libre-editor/react/hooks';

export function EditorPageAdvanced() {
    const {
        editorRef,
        projectData,
        isReady,
        isLoading,
        error,
        loadProject,
        getProjectData,
        exportImage,
        handleReady,
        handleError
    } = useEditor({
        onReady: (instance) => console.log('Editor ready'),
        onError: (err) => console.error('Error:', err)
    });

    const saveToBackend = async () => {
        const data = getProjectData();
        await fetch('/api/projects', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    };

    return (
        <div>
            {isLoading && <div>Loading...</div>}
            {error && <div>Error: {error.message}</div>}

            <button onClick={saveToBackend} disabled={!isReady}>
                Save
            </button>
            <button onClick={exportImage} disabled={!isReady}>
                Export
            </button>

            <VersLibreEditor
                ref={editorRef}
                onReady={handleReady}
                onError={handleError}
            />
        </div>
    );
}
```

### Loading Existing Projects

```jsx
import { useParams } from 'react-router-dom';

function EditProjectPage() {
    const { projectId } = useParams();
    const editorRef = useRef(null);

    useEffect(() => {
        if (projectId) {
            loadProject();
        }
    }, [projectId]);

    const loadProject = async () => {
        const response = await fetch(`/api/projects/${projectId}`);
        const projectData = await response.json();

        editorRef.current?.loadProject(projectData);
    };

    return <VersLibreEditor ref={editorRef} />;
}
```

---

## API Integration

### Backend Endpoints Required

Your dashboard backend needs these endpoints:

#### 1. **POST /api/projects** - Create Project
```javascript
{
    "title": "Summer Festival",
    "format": "4:5",
    "image": {
        "url": "/uploads/abc123.jpg",
        "offsetX": 0,
        "offsetY": 0,
        "scale": 1.0
    },
    "text": {
        "line1": "Summer Festival",
        "line2": "Live Music",
        "date": "2025-07-15",
        "startTime": "18:00",
        "endTime": "23:00"
    },
    "settings": {
        "gradientOpacity": 30,
        "showLogo": true
    }
}
```

#### 2. **GET /api/projects/:id** - Get Project
```javascript
// Returns same structure as above, plus:
{
    "id": "proj-123",
    "userId": "user-456",
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
}
```

#### 3. **PUT /api/projects/:id** - Update Project
Same structure as POST.

#### 4. **POST /api/upload** - Upload Image
```javascript
// Multipart form-data
FormData: { image: File }

// Response:
{
    "success": true,
    "data": {
        "url": "/uploads/abc123.jpg",
        "size": 2048576,
        "width": 1920,
        "height": 1080
    }
}
```

#### 5. **POST /api/export** - Save Exported Image
```javascript
// Multipart form-data
FormData: {
    image: Blob,
    projectId: "proj-123"
}

// Response:
{
    "success": true,
    "data": {
        "url": "/exports/abc123.png",
        "filename": "summer-festival_2025-07-15.png"
    }
}
```

### Example Backend Implementation

See [examples/api-backend-example.js](./examples/api-backend-example.js) for a complete Express.js implementation.

### Connecting Editor to API

```jsx
const config = {
    api: {
        endpoint: process.env.REACT_APP_API_URL,
        saveProject: '/api/projects',
        uploadImage: '/api/upload'
    },
    callbacks: {
        onSave: async (projectData) => {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData)
            });
            return response.json();
        },
        onExport: async (exportData) => {
            const formData = new FormData();
            formData.append('image', exportData.blob);

            const response = await fetch('/api/export', {
                method: 'POST',
                body: formData
            });
            return response.json();
        }
    }
};

<VersLibreEditor config={config} />
```

---

## Build & Deployment

### Development Build

```bash
npm run dev
```

This starts Vite dev server with hot module replacement.

### Production Build

```bash
npm run build
```

Outputs to `dist/`:
- `vers-libre-editor.es.js` - ES module format
- `vers-libre-editor.umd.js` - UMD format (browser compatible)
- Source maps for debugging

### Including in Dashboard Build

If using Vite or Webpack in your dashboard:

```javascript
// vite.config.js or webpack.config.js
export default {
    optimizeDeps: {
        include: ['@librai/vers-libre-editor']
    }
}
```

### CSS Import Options

**Option 1: Import in JavaScript**
```jsx
import '@librai/vers-libre-editor/css';
```

**Option 2: Import in CSS**
```css
@import '@librai/vers-libre-editor/dist/vers-libre-editor.css';
```

**Option 3: Link in HTML**
```html
<link rel="stylesheet" href="/node_modules/@librai/vers-libre-editor/dist/vers-libre-editor.css">
```

---

## TypeScript Support

The library includes full TypeScript definitions.

### Using Types

```typescript
import type {
    EditorConfig,
    EditorProject,
    EditorCallbacks,
    ImageData,
    TextData,
    VersLibreEditorRef
} from '@librai/vers-libre-editor';

const config: EditorConfig = {
    standalone: false,
    features: {
        upload: true,
        download: true,
        formats: ['4:5', '9:16']
    }
};

const projectData: EditorProject = {
    format: '4:5',
    image: {
        offsetX: 0,
        offsetY: 0,
        scale: 1.0
    },
    text: {
        line1: 'Title',
        line2: 'Subtitle',
        date: '2025-01-15',
        startTime: '18:00',
        endTime: '22:00'
    },
    settings: {
        gradientOpacity: 30,
        showLogo: true
    }
};
```

### React with TypeScript

```tsx
import React, { useRef } from 'react';
import { VersLibreEditor } from '@librai/vers-libre-editor/react';
import type { VersLibreEditorRef, EditorProject } from '@librai/vers-libre-editor';

export function EditorPage() {
    const editorRef = useRef<VersLibreEditorRef>(null);

    const loadProject = (data: EditorProject) => {
        editorRef.current?.loadProject(data);
    };

    return <VersLibreEditor ref={editorRef} />;
}
```

---

## Customization

### Theming

The editor uses CSS variables for theming. Override in your dashboard styles:

```css
:root {
    --editor-primary-color: #007bff;
    --editor-background: #ffffff;
    --editor-text-color: #333333;
    --editor-border-color: #dddddd;
    --editor-border-radius: 8px;
}
```

### Custom Fonts

```jsx
const config = {
    theme: 'custom',
    customStyles: `
        @font-face {
            font-family: 'CustomFont';
            src: url('/fonts/CustomFont.woff2');
        }
        .editor-container {
            font-family: 'CustomFont', sans-serif;
        }
    `
};
```

### Feature Flags

Enable/disable features as needed:

```jsx
const config = {
    features: {
        upload: true,          // Allow image uploads
        download: true,        // Show download button
        formats: ['4:5'],      // Only Instagram Post format
        heicSupport: false     // Disable HEIC conversion
    }
};
```

### Read-Only Mode

Display projects without editing:

```jsx
<VersLibreEditor
    config={{ readonly: true }}
    initialData={existingProject}
/>
```

---

## Dashboard Router Integration

### Add Routes

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { EditorPage } from './pages/EditorPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/editor" element={<EditorPage />} />
                <Route path="/editor/:projectId" element={<EditorPage />} />
            </Routes>
        </BrowserRouter>
    );
}
```

### Navigation

```jsx
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const navigate = useNavigate();

    return (
        <button onClick={() => navigate('/editor')}>
            Create New Image
        </button>
    );
}
```

---

## Permission & Access Control

### User Permissions

```jsx
function EditorPage() {
    const { user } = useAuth();

    const config = {
        readonly: !user.canEdit,
        features: {
            upload: user.canUpload,
            download: user.canExport,
            formats: user.allowedFormats || ['4:5']
        }
    };

    return <VersLibreEditor config={config} />;
}
```

### Project Ownership

```jsx
const handleSave = async (projectData) => {
    const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
            ...projectData,
            userId: user.id,
            organizationId: user.organizationId
        })
    });
};
```

---

## Examples

See the [examples/](./examples/) directory for complete working examples:

- **[standalone.html](./examples/standalone.html)** - Vanilla JS implementation
- **[react-dashboard-integration.jsx](./examples/react-dashboard-integration.jsx)** - React integration patterns
- **[api-backend-example.js](./examples/api-backend-example.js)** - Express.js API server

---

## Troubleshooting

### Build Issues

**Problem:** `Cannot find module '@librai/vers-libre-editor'`

**Solution:**
```bash
npm install @librai/vers-libre-editor
# or
npm link @librai/vers-libre-editor
```

**Problem:** CSS not loading

**Solution:** Import CSS explicitly:
```jsx
import '@librai/vers-libre-editor/css';
```

### Runtime Issues

**Problem:** Editor not rendering

**Solution:** Ensure container element exists:
```jsx
const containerRef = useRef(null);

useEffect(() => {
    if (containerRef.current) {
        // Editor will render here
    }
}, []);
```

**Problem:** Images not uploading

**Solution:** Check API endpoint configuration:
```jsx
config={{
    api: {
        uploadImage: '/api/upload' // Verify this endpoint exists
    }
}}
```

---

## Performance Optimization

### Code Splitting

```jsx
// Lazy load the editor
const VersLibreEditor = lazy(() =>
    import('@librai/vers-libre-editor/react').then(module => ({
        default: module.VersLibreEditor
    }))
);

function EditorPage() {
    return (
        <Suspense fallback={<div>Loading editor...</div>}>
            <VersLibreEditor />
        </Suspense>
    );
}
```

### Memoization

```jsx
const editorConfig = useMemo(() => ({
    standalone: false,
    features: { upload: true, download: true }
}), []);

<VersLibreEditor config={editorConfig} />
```

---

## Support

For issues, questions, or feature requests:

- **GitHub Issues:** https://github.com/giantflags/vers-libre-editor/issues
- **Documentation:** https://github.com/giantflags/vers-libre-editor
- **Examples:** See `examples/` directory

---

## Next Steps

1. Install the package in your dashboard
2. Follow the [Quick Start](#quick-start) guide
3. Review the [React Integration](#react-integration) examples
4. Implement the [API endpoints](#api-integration)
5. Customize the theme and features to match your dashboard

Happy coding! 🎨
