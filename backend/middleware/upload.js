import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// Configure storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'), false);
  }
};

// Create multer upload instance
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Image processing middleware
export const processImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const { width, height, quality = 85, format = 'webp' } = req.body;

    let buffer = req.file.buffer;

    // Process image with Sharp
    const image = sharp(buffer);

    // Resize if dimensions provided
    if (width || height) {
      image.resize(
        width ? parseInt(width) : null,
        height ? parseInt(height) : null,
        {
          fit: 'inside',
          withoutEnlargement: true
        }
      );
    }

    // Convert to specified format
    if (format === 'webp') {
      buffer = await image.webp({ quality: parseInt(quality) }).toBuffer();
    } else if (format === 'jpeg') {
      buffer = await image.jpeg({ quality: parseInt(quality) }).toBuffer();
    } else if (format === 'png') {
      buffer = await image.png({ quality: parseInt(quality) }).toBuffer();
    }

    // Generate unique filename
    const filename = `${uuidv4()}.${format}`;
    
    // Update file object
    req.file = {
      ...req.file,
      buffer,
      originalname: filename,
      mimetype: `image/${format}`,
      size: buffer.length
    };

    next();

  } catch (error) {
    console.error('Image processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process image'
    });
  }
};

// Multiple image upload
export const uploadMultiple = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10 // Maximum 10 files
  }
}).array('images', 10);

// File upload error handler
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name for file upload.'
      });
    }
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next();
};