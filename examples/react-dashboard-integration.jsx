/**
 * Example: React Dashboard Integration
 *
 * This demonstrates how to integrate the Vers Libre Editor
 * into a React-based dashboard (like librai-dashboard).
 */

import React, { useRef, useState, useEffect } from 'react';
import { VersLibreEditor } from '@librai/vers-libre-editor/react';
import { useEditor } from '@librai/vers-libre-editor/react/hooks';
import '@librai/vers-libre-editor/css';

/**
 * Example 1: Basic Integration with forwardRef
 * Use this when you need imperative control over the editor
 */
export function EditorPageBasic() {
    const editorRef = useRef(null);
    const [projectId, setProjectId] = useState(null);

    const handleSave = async () => {
        // Get current project data
        const projectData = editorRef.current?.getProjectData();

        // Save to backend
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
        });

        const { id } = await response.json();
        setProjectId(id);
        alert('Project saved!');
    };

    const handleLoad = async () => {
        if (!projectId) return;

        // Load from backend
        const response = await fetch(`/api/projects/${projectId}`);
        const projectData = await response.json();

        // Load into editor
        editorRef.current?.loadProject(projectData);
    };

    const handleExport = () => {
        editorRef.current?.exportImage();
    };

    return (
        <div className="editor-page">
            <header className="editor-header">
                <h1>Create Event Image</h1>
                <div className="actions">
                    <button onClick={handleSave}>Save Project</button>
                    <button onClick={handleLoad} disabled={!projectId}>
                        Load Project
                    </button>
                    <button onClick={handleExport}>Export Image</button>
                </div>
            </header>

            <VersLibreEditor
                ref={editorRef}
                config={{
                    standalone: false,
                    features: {
                        upload: true,
                        download: true,
                        formats: ['4:5', '9:16', '1:1', 'obs-hd']
                    },
                    api: {
                        endpoint: '/api',
                        saveProject: '/api/projects',
                        uploadImage: '/api/upload'
                    }
                }}
                onReady={(instance) => {
                    console.log('Editor ready:', instance);
                }}
                onImageUploaded={(data) => {
                    console.log('Image uploaded:', data);
                }}
                onImageExported={(data) => {
                    console.log('Image exported:', data);
                    // Could auto-upload to cloud storage here
                }}
                onError={(error) => {
                    console.error('Editor error:', error);
                    alert(`Error: ${error.message}`);
                }}
            />
        </div>
    );
}

/**
 * Example 2: Advanced Integration with Custom Hook
 * Use this for more declarative React code with state management
 */
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
        onReady: (instance) => {
            console.log('Editor instance ready:', instance);
        },
        onExport: async () => {
            // Auto-save on export
            await saveToBackend();
        },
        onError: (err) => {
            console.error('Editor error:', err);
        }
    });

    const [savedProjects, setSavedProjects] = useState([]);

    useEffect(() => {
        // Load user's projects on mount
        loadUserProjects();
    }, []);

    const loadUserProjects = async () => {
        const response = await fetch('/api/projects?userId=current');
        const projects = await response.json();
        setSavedProjects(projects);
    };

    const saveToBackend = async () => {
        const data = getProjectData();

        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...data,
                userId: 'current-user-id'
            })
        });

        const result = await response.json();
        await loadUserProjects(); // Refresh list
        return result;
    };

    const handleLoadProject = async (project) => {
        await loadProject(project);
    };

    return (
        <div className="editor-page-advanced">
            <aside className="project-sidebar">
                <h2>Your Projects</h2>
                {savedProjects.map((project) => (
                    <div
                        key={project.id}
                        className="project-item"
                        onClick={() => handleLoadProject(project)}
                    >
                        <h3>{project.title}</h3>
                        <p>{project.format} • {new Date(project.updatedAt).toLocaleDateString()}</p>
                    </div>
                ))}
            </aside>

            <main className="editor-main">
                <header className="editor-header">
                    <h1>Create Event Image</h1>
                    <div className="actions">
                        <button onClick={saveToBackend} disabled={!isReady}>
                            Save Project
                        </button>
                        <button onClick={exportImage} disabled={!isReady}>
                            Export Image
                        </button>
                    </div>
                    {isLoading && <div className="loading-indicator">Loading...</div>}
                    {error && <div className="error-message">{error.message}</div>}
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
                    onReady={handleReady}
                    onError={handleError}
                    onImageUploaded={(data) => {
                        console.log('Image uploaded:', data);
                    }}
                    onProjectLoaded={(data) => {
                        console.log('Project loaded:', data);
                    }}
                />
            </main>
        </div>
    );
}

/**
 * Example 3: Integration with Dashboard Router
 * Show how it fits into a larger app structure
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

export function DashboardApp() {
    return (
        <BrowserRouter>
            <div className="dashboard">
                <nav className="dashboard-nav">
                    <a href="/dashboard">Dashboard</a>
                    <a href="/editor">Image Editor</a>
                    <a href="/projects">My Projects</a>
                    <a href="/settings">Settings</a>
                </nav>

                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={<DashboardHome />} />
                    <Route path="/editor" element={<EditorPageAdvanced />} />
                    <Route path="/editor/:projectId" element={<EditorPageWithId />} />
                    <Route path="/projects" element={<ProjectsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

/**
 * Example 4: Loading Existing Project from URL
 */
import { useParams } from 'react-router-dom';

function EditorPageWithId() {
    const { projectId } = useParams();
    const editorRef = useRef(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (projectId) {
            loadProjectById(projectId);
        }
    }, [projectId]);

    const loadProjectById = async (id) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/projects/${id}`);
            const projectData = await response.json();

            editorRef.current?.loadProject(projectData);
        } catch (error) {
            console.error('Failed to load project:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading project...</div>;
    }

    return (
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
            onImageExported={async (data) => {
                // Auto-save exported image to cloud
                await uploadToCloud(data.blob, projectId);
            }}
        />
    );
}

// Placeholder components
function DashboardHome() {
    return <div>Dashboard Home</div>;
}

function ProjectsPage() {
    return <div>Projects Page</div>;
}

function SettingsPage() {
    return <div>Settings Page</div>;
}

async function uploadToCloud(blob, projectId) {
    const formData = new FormData();
    formData.append('image', blob);
    formData.append('projectId', projectId);

    await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });
}
