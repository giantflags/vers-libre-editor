/**
 * React wrapper for VersLibreEditorComponent
 * Provides a React-friendly interface for the editor
 */

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { VersLibreEditorComponent } from '../VersLibreEditorComponent.js';

/**
 * VersLibreEditor React Component
 *
 * @example
 * ```jsx
 * import { VersLibreEditor } from '@librai/vers-libre-editor/react';
 *
 * function MyDashboard() {
 *   const editorRef = useRef();
 *
 *   return (
 *     <VersLibreEditor
 *       ref={editorRef}
 *       config={{ theme: 'dashboard' }}
 *       onImageUploaded={(data) => console.log('Uploaded:', data)}
 *       onImageExported={(data) => handleExport(data)}
 *       onError={(error) => console.error(error)}
 *     />
 *   );
 * }
 * ```
 */
export const VersLibreEditor = forwardRef(({
    config = {},
    className = '',
    style = {},

    // Event handlers
    onReady,
    onImageUploaded,
    onImageLoading,
    onImageExported,
    onProjectLoaded,
    onProjectLoading,
    onError,

    // Initial data
    initialData = null,
}, ref) => {
    const containerRef = useRef(null);
    const editorRef = useRef(null);

    // Expose editor instance methods to parent via ref
    useImperativeHandle(ref, () => ({
        /**
         * Load a project into the editor
         */
        loadProject: (projectData) => {
            editorRef.current?.loadProject(projectData);
        },

        /**
         * Get current project data
         */
        getProjectData: () => {
            return editorRef.current?.getProjectData();
        },

        /**
         * Trigger export/download
         */
        exportImage: () => {
            editorRef.current?.handleDownload();
        },

        /**
         * Destroy the editor instance
         */
        destroy: () => {
            editorRef.current?.destroy();
        },

        /**
         * Access raw editor instance
         */
        getInstance: () => {
            return editorRef.current;
        }
    }), []);

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize editor
        const editor = new VersLibreEditorComponent(containerRef.current, {
            ...config,
            initialData,
            callbacks: {
                ...config.callbacks,
                onReady: (instance) => {
                    config.callbacks?.onReady?.(instance);
                    onReady?.(instance);
                },
            }
        });

        editorRef.current = editor;

        // Set up event listeners
        const unsubscribers = [];

        if (onImageUploaded) {
            unsubscribers.push(editor.on('image:uploaded', onImageUploaded));
        }

        if (onImageLoading) {
            unsubscribers.push(editor.on('image:loading', onImageLoading));
        }

        if (onImageExported) {
            unsubscribers.push(editor.on('image:exported', onImageExported));
        }

        if (onProjectLoaded) {
            unsubscribers.push(editor.on('project:loaded', onProjectLoaded));
        }

        if (onProjectLoading) {
            unsubscribers.push(editor.on('project:loading', onProjectLoading));
        }

        if (onError) {
            unsubscribers.push(editor.on('error', onError));
        }

        // Cleanup
        return () => {
            unsubscribers.forEach(unsub => unsub());
            editor.destroy();
        };
    }, []); // Only run on mount

    // Handle config updates
    useEffect(() => {
        if (editorRef.current && config.theme) {
            containerRef.current?.setAttribute('data-theme', config.theme);
        }
    }, [config.theme]);

    return (
        <div
            ref={containerRef}
            className={`vers-libre-editor-react ${className}`}
            style={{
                width: '100%',
                height: '100%',
                ...style
            }}
        />
    );
});

VersLibreEditor.displayName = 'VersLibreEditor';

export default VersLibreEditor;
