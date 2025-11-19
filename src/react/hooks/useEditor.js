/**
 * React hook for managing editor state and actions
 */

import { useState, useCallback, useRef } from 'react';

/**
 * Hook for managing Vers Libre Editor
 *
 * @example
 * ```jsx
 * function MyComponent() {
 *   const {
 *     editorRef,
 *     projectData,
 *     loadProject,
 *     exportImage,
 *     error
 *   } = useEditor({
 *     onExport: (data) => saveToCloud(data)
 *   });
 *
 *   return (
 *     <div>
 *       <VersLibreEditor ref={editorRef} />
 *       <button onClick={exportImage}>Export</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useEditor(options = {}) {
    const editorRef = useRef(null);
    const [projectData, setProjectData] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Load a project into the editor
     */
    const loadProject = useCallback(async (data) => {
        try {
            setIsLoading(true);
            setError(null);
            await editorRef.current?.loadProject(data);
            setProjectData(data);
            options.onProjectLoaded?.(data);
        } catch (err) {
            setError(err);
            options.onError?.(err);
        } finally {
            setIsLoading(false);
        }
    }, [options]);

    /**
     * Get current project data
     */
    const getProjectData = useCallback(() => {
        const data = editorRef.current?.getProjectData();
        setProjectData(data);
        return data;
    }, []);

    /**
     * Export/download the image
     */
    const exportImage = useCallback(() => {
        try {
            editorRef.current?.exportImage();
            options.onExport?.();
        } catch (err) {
            setError(err);
            options.onError?.(err);
        }
    }, [options]);

    /**
     * Handle editor ready
     */
    const handleReady = useCallback((instance) => {
        setIsReady(true);
        options.onReady?.(instance);
    }, [options]);

    /**
     * Handle errors
     */
    const handleError = useCallback((err) => {
        setError(err);
        options.onError?.(err);
    }, [options]);

    return {
        // Ref
        editorRef,

        // State
        projectData,
        isReady,
        isLoading,
        error,

        // Actions
        loadProject,
        getProjectData,
        exportImage,

        // Event handlers
        handleReady,
        handleError,
    };
}
