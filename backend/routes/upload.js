import express from 'express';
import { authenticate, authorizeAuthor } from '../middleware/auth.js';
import { upload, uploadMultiple, processImage, handleUploadError } from '../middleware/upload.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import cloudinary from 'cloudinary';

const router = express.Router();

// Configure Cloudinary (if available)
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Single file upload
router.post('/single', authenticate, authorizeAuthor, upload.single('file'), handleUploadError, processImage, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    let uploadResult;

    if (process.env.CLOUDINARY_CLOUD_NAME) {
      // Upload to Cloudinary
      uploadResult = await cloudinary.v2.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, {
        folder: 'blog-uploads',
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto'
      });
    } else {
      // Local storage (for development)
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const uploadDir = path.join(__dirname, '../uploads');
      
      // Create upload directory if it doesn't exist
      await fs.mkdir(uploadDir, { recursive: true });
      
      const filename = `${Date.now()}-${req.file.originalname}`;
      const filepath = path.join(uploadDir, filename);
      
      await fs.writeFile(filepath, req.file.buffer);
      
      uploadResult = {
        public_id: filename,
        secure_url: `/uploads/${filename}`,
        url: `/uploads/${filename}`,
        format: req.file.mimetype.split('/')[1],
        size: req.file.size
      };
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
        format: uploadResult.format,
        size: uploadResult.size,
        originalName: req.file.originalname
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file'
    });
  }
});

// Multiple file upload
router.post('/multiple', authenticate, authorizeAuthor, uploadMultiple, handleUploadError, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadResults = [];

    for (const file of req.files) {
      let uploadResult;

      if (process.env.CLOUDINARY_CLOUD_NAME) {
        uploadResult = await cloudinary.v2.uploader.upload(`data:${file.mimetype};base64,${file.buffer.toString('base64')}`, {
          folder: 'blog-uploads',
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto'
        });
      } else {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const uploadDir = path.join(__dirname, '../uploads');
        
        await fs.mkdir(uploadDir, { recursive: true });
        
        const filename = `${Date.now()}-${file.originalname}`;
        const filepath = path.join(uploadDir, filename);
        
        await fs.writeFile(filepath, file.buffer);
        
        uploadResult = {
          public_id: filename,
          secure_url: `/uploads/${filename}`,
          url: `/uploads/${filename}`,
          format: file.mimetype.split('/')[1],
          size: file.size
        };
      }

      uploadResults.push({
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
        format: uploadResult.format,
        size: uploadResult.size,
        originalName: file.originalname
      });
    }

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      data: uploadResults
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files'
    });
  }
});

// Delete uploaded file
router.delete('/:publicId', authenticate, authorizeAuthor, async (req, res) => {
  try {
    const { publicId } = req.params;

    if (process.env.CLOUDINARY_CLOUD_NAME) {
      // Delete from Cloudinary
      await cloudinary.v2.uploader.destroy(publicId);
    } else {
      // Delete from local storage
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const filepath = path.join(__dirname, '../uploads', publicId);
      
      try {
        await fs.unlink(filepath);
      } catch (unlinkError) {
        // File might not exist, which is fine
        console.error('File deletion error:', unlinkError);
      }
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    });
  }
});

// Get upload configuration
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
      storageProvider: process.env.CLOUDINARY_CLOUD_NAME ? 'cloudinary' : 'local',
      cloudinaryConfig: process.env.CLOUDINARY_CLOUD_NAME ? {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'blog_uploads'
      } : null
    }
  });
});

export default router;