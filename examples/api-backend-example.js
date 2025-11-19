/**
 * Example Backend API for Vers Libre Editor Integration
 *
 * This shows example Express.js endpoints that would be needed
 * to integrate the editor into a dashboard with persistence.
 *
 * Stack: Node.js + Express + MongoDB (or any database)
 */

const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

const app = express();
app.use(express.json());

// Configure file upload
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = './uploads';
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalName)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
        if (validTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and HEIC are allowed.'));
        }
    }
});

// =============================================================================
// PROJECT ENDPOINTS
// =============================================================================

/**
 * GET /api/projects
 * List all projects for a user
 */
app.get('/api/projects', async (req, res) => {
    try {
        const userId = req.query.userId || req.user?.id; // Assuming auth middleware

        // In production, query from database
        // const projects = await db.projects.find({ userId });

        // Example response
        const projects = [
            {
                id: 'proj-123',
                userId: userId,
                title: 'Summer Festival 2025',
                format: '4:5',
                image: {
                    url: '/uploads/abc123.jpg',
                    originalName: 'festival.jpg',
                    size: 2048576,
                    width: 1920,
                    height: 1080,
                    offsetX: 0,
                    offsetY: 0,
                    scale: 1.0
                },
                text: {
                    line1: 'Summer Music Festival',
                    line2: 'Live Performances',
                    date: '2025-07-15',
                    startTime: '18:00',
                    endTime: '23:00'
                },
                settings: {
                    gradientOpacity: 30,
                    showLogo: true
                },
                createdAt: new Date('2025-01-15T10:00:00Z').toISOString(),
                updatedAt: new Date('2025-01-15T10:30:00Z').toISOString()
            }
        ];

        res.json({
            success: true,
            data: projects
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_PROJECTS_FAILED',
                message: error.message
            }
        });
    }
});

/**
 * GET /api/projects/:id
 * Get a single project by ID
 */
app.get('/api/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id; // Assuming auth middleware

        // In production, query from database
        // const project = await db.projects.findOne({ id, userId });

        const project = {
            id: id,
            userId: userId,
            title: 'Summer Festival 2025',
            format: '4:5',
            image: {
                url: '/uploads/abc123.jpg',
                originalName: 'festival.jpg',
                size: 2048576,
                width: 1920,
                height: 1080,
                offsetX: 0,
                offsetY: 0,
                scale: 1.0
            },
            text: {
                line1: 'Summer Music Festival',
                line2: 'Live Performances',
                date: '2025-07-15',
                startTime: '18:00',
                endTime: '23:00'
            },
            settings: {
                gradientOpacity: 30,
                showLogo: true
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (!project) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'PROJECT_NOT_FOUND',
                    message: 'Project not found'
                }
            });
        }

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_PROJECT_FAILED',
                message: error.message
            }
        });
    }
});

/**
 * POST /api/projects
 * Create a new project
 */
app.post('/api/projects', async (req, res) => {
    try {
        const userId = req.user?.id; // Assuming auth middleware
        const { title, format, image, text, settings } = req.body;

        // Validate required fields
        if (!format || !text) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Format and text are required'
                }
            });
        }

        // Create project
        const project = {
            id: uuidv4(),
            userId: userId,
            title: title || 'Untitled Project',
            format,
            image: image || { offsetX: 0, offsetY: 0, scale: 1.0 },
            text,
            settings: settings || { gradientOpacity: 30, showLogo: true },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // In production, save to database
        // await db.projects.insertOne(project);

        res.status(201).json({
            success: true,
            data: project
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'CREATE_PROJECT_FAILED',
                message: error.message
            }
        });
    }
});

/**
 * PUT /api/projects/:id
 * Update an existing project
 */
app.put('/api/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const updates = req.body;

        // In production, update in database
        // const result = await db.projects.updateOne(
        //     { id, userId },
        //     { $set: { ...updates, updatedAt: new Date() } }
        // );

        const project = {
            id,
            userId,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'UPDATE_PROJECT_FAILED',
                message: error.message
            }
        });
    }
});

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
app.delete('/api/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        // In production, delete from database
        // await db.projects.deleteOne({ id, userId });

        res.json({
            success: true,
            data: { id }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DELETE_PROJECT_FAILED',
                message: error.message
            }
        });
    }
});

// =============================================================================
// IMAGE UPLOAD ENDPOINTS
// =============================================================================

/**
 * POST /api/upload
 * Upload an image file
 */
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'NO_FILE_UPLOADED',
                    message: 'No file was uploaded'
                }
            });
        }

        const file = req.file;
        const imageUrl = `/uploads/${file.filename}`;

        // In production, you might upload to S3/CloudStorage
        // const imageUrl = await uploadToS3(file);

        res.json({
            success: true,
            data: {
                url: imageUrl,
                originalName: file.originalname,
                size: file.size,
                mimetype: file.mimetype
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'UPLOAD_FAILED',
                message: error.message
            }
        });
    }
});

/**
 * POST /api/export
 * Save exported image
 */
app.post('/api/export', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'NO_FILE_UPLOADED',
                    message: 'No file was uploaded'
                }
            });
        }

        const { projectId } = req.body;
        const file = req.file;
        const exportUrl = `/exports/${file.filename}`;

        // In production, save to cloud storage and update project
        // const exportUrl = await uploadToS3(file);
        // await db.projects.updateOne(
        //     { id: projectId },
        //     { $set: { exportedAt: new Date(), exportUrl } }
        // );

        res.json({
            success: true,
            data: {
                url: exportUrl,
                filename: file.filename,
                size: file.size
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'EXPORT_FAILED',
                message: error.message
            }
        });
    }
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// Handle multer errors
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'FILE_TOO_LARGE',
                    message: 'File size exceeds 10MB limit'
                }
            });
        }
    }

    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: err.message
        }
    });
});

// =============================================================================
// START SERVER
// =============================================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
    console.log('');
    console.log('Available endpoints:');
    console.log('  GET    /api/projects          - List projects');
    console.log('  GET    /api/projects/:id      - Get project');
    console.log('  POST   /api/projects          - Create project');
    console.log('  PUT    /api/projects/:id      - Update project');
    console.log('  DELETE /api/projects/:id      - Delete project');
    console.log('  POST   /api/upload            - Upload image');
    console.log('  POST   /api/export            - Export image');
});

module.exports = app;
