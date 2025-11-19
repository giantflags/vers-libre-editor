/**
 * TypeScript type definitions for Vers Libre Editor
 */

// ============================================================================
// EDITOR CONFIGURATION
// ============================================================================

export interface EditorFeatures {
    upload?: boolean;
    download?: boolean;
    formats?: Array<'4:5' | '9:16' | '1:1' | 'obs-hd'>;
    heicSupport?: boolean;
}

export interface EditorCallbacks {
    onSave?: (data: EditorProject) => void | Promise<void>;
    onExport?: (data: ExportData) => void | Promise<void>;
    onError?: (error: EditorError) => void;
    onReady?: (instance: VersLibreEditorComponent) => void;
}

export interface EditorAPI {
    endpoint?: string;
    saveProject?: string;
    uploadImage?: string;
}

export interface EditorConfig {
    standalone?: boolean;
    readonly?: boolean;
    features?: EditorFeatures;
    theme?: string;
    callbacks?: EditorCallbacks;
    api?: EditorAPI;
    initialData?: EditorProject | null;
}

// ============================================================================
// PROJECT DATA SCHEMA
// ============================================================================

export interface ImageData {
    url?: string;
    originalName?: string;
    size?: number;
    width?: number;
    height?: number;
    offsetX: number;
    offsetY: number;
    scale: number;
}

export interface TextData {
    line1: string;
    line2: string;
    date: string;
    startTime: string;
    endTime: string;
}

export interface EditorSettings {
    gradientOpacity: number;
    showLogo: boolean;
}

export interface EditorProject {
    id?: string;
    userId?: string;
    title?: string;
    format: '4:5' | '9:16' | '1:1' | 'obs-hd';
    image: ImageData;
    text: TextData;
    settings: EditorSettings;
    createdAt?: string;
    updatedAt?: string;
    exportedAt?: string;
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

export interface CreateProjectRequest {
    title?: string;
    format: string;
    image?: ImageData;
    text: TextData;
    settings?: EditorSettings;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
    id: string;
}

export interface ExportData {
    format: string;
    filename: string;
    blob?: Blob;
    dataURL?: string;
}

// ============================================================================
// EVENTS
// ============================================================================

export interface EditorError {
    message: string;
    error?: string;
    timestamp: string;
}

export interface ImageUploadedEvent {
    size: number;
    name: string;
    dimensions: {
        width: number;
        height: number;
    };
}

export interface ImageLoadingEvent {
    message: string | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export declare class VersLibreEditorComponent {
    constructor(container: HTMLElement, config?: EditorConfig);

    // Public API methods
    init(): Promise<void>;
    loadProject(projectData: EditorProject): Promise<void>;
    getProjectData(): EditorProject;
    destroy(): void;

    // Event emitter
    on(event: string, callback: (data: any) => void): () => void;
    off(event: string, callback: (data: any) => void): void;
    emit(event: string, data?: any): void;

    // Properties
    container: HTMLElement;
    config: EditorConfig;
    state: any; // EditorState
    elements: Record<string, HTMLElement>;
}

// ============================================================================
// REACT COMPONENT
// ============================================================================

import { ForwardRefExoticComponent, RefAttributes } from 'react';

export interface VersLibreEditorProps {
    config?: EditorConfig;
    className?: string;
    style?: React.CSSProperties;

    // Event handlers
    onReady?: (instance: VersLibreEditorComponent) => void;
    onImageUploaded?: (data: ImageUploadedEvent) => void;
    onImageLoading?: (data: ImageLoadingEvent) => void;
    onImageExported?: (data: ExportData) => void;
    onProjectLoaded?: (data: EditorProject) => void;
    onProjectLoading?: (data: EditorProject) => void;
    onError?: (error: EditorError) => void;

    initialData?: EditorProject | null;
}

export interface VersLibreEditorRef {
    loadProject: (projectData: EditorProject) => void;
    getProjectData: () => EditorProject;
    exportImage: () => void;
    destroy: () => void;
    getInstance: () => VersLibreEditorComponent;
}

export const VersLibreEditor: ForwardRefExoticComponent<
    VersLibreEditorProps & RefAttributes<VersLibreEditorRef>
>;

// ============================================================================
// UTILITIES
// ============================================================================

export function validateFile(file: File): { valid: boolean; error?: string };
export function validateDate(dateString: string): { valid: boolean; date?: Date };
export function isHeicFile(file: File): boolean;

export function formatDate(dateValue: string): string;
export function formatDateTime(params: {
    dateValue: string;
    startTime: string;
    endTime: string;
}): string;
export function generateFilename(params: {
    titleLine1: string;
    dateValue: string;
    format: string;
}): string;
export function generateTimeOptions(intervalMinutes?: number): string[];

// ============================================================================
// CONSTANTS
// ============================================================================

export const CONSTANTS: {
    MAX_FILE_SIZE_MB: number;
    MAX_FILE_SIZE_BYTES: number;
    VALID_IMAGE_TYPES: string[];
    VALID_IMAGE_EXTENSIONS: string[];
    DEBOUNCE_DELAY_MS: number;
    MOBILE_BREAKPOINT: number;
    // ... more constants
};

export const FORMAT_CONFIGS: Record<string, {
    width: number;
    height: number;
    name: string;
    textPositions: {
        line1Y: number;
        line2Y: number;
        dateTimeY: number | null;
    };
    logo: {
        show: boolean;
        leftPercent?: number;
        topPercent: number;
        widthPercent: number;
        rightPercent?: number;
    };
}>;
