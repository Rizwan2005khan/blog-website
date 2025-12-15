import cloudinary from 'cloudinary';
import streamifier from 'streamifier';

// Configure Cloudinary
export const configureCloudinary = () => {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
    
    console.log('☁️ Cloudinary configured');
    return true;
  }
  
  console.log('⚠️ Cloudinary not configured - using local storage');
  return false;
};

// Upload to Cloudinary
export const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder: options.folder || 'blog-cms',
        resource_type: options.resource_type || 'auto',
        quality: options.quality || 'auto',
        fetch_format: options.fetch_format || 'auto',
        ...options
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Delete from Cloudinary
export const deleteFromCloudinary = (publicId, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.destroy(publicId, { resource_type: resourceType }, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

// Get image transformations
export const getImageTransformations = (publicId, options = {}) => {
  const transformations = [];
  
  // Size transformations
  if (options.width || options.height) {
    transformations.push(`w_${options.width || 'auto'}`);
    transformations.push(`h_${options.height || 'auto'}`);
  }
  
  // Quality
  if (options.quality) {
    transformations.push(`q_${options.quality}`);
  }
  
  // Format
  if (options.format) {
    transformations.push(`f_${options.format}`);
  }
  
  // Effects
  if (options.effect) {
    transformations.push(`e_${options.effect}`);
  }
  
  // Crop mode
  if (options.crop) {
    transformations.push(`c_${options.crop}`);
  }
  
  const transformationString = transformations.join(',');
  const url = cloudinary.v2.url(publicId, {
    transformation: transformationString,
    secure: true
  });
  
  return {
    url,
    transformations: transformationString,
    publicId
  };
};

// Generate multiple sizes for responsive images
export const generateResponsiveImages = async (publicId, sizes = []) => {
  const results = {};
  
  const defaultSizes = [
    { width: 300, height: 200, name: 'small' },
    { width: 600, height: 400, name: 'medium' },
    { width: 1200, height: 800, name: 'large' },
    { width: 1920, height: 1080, name: 'xlarge' }
  ];
  
  const sizesToGenerate = sizes.length > 0 ? sizes : defaultSizes;
  
  for (const size of sizesToGenerate) {
    try {
      const result = getImageTransformations(publicId, {
        width: size.width,
        height: size.height,
        crop: size.crop || 'fill',
        quality: 'auto',
        format: 'auto'
      });
      
      results[size.name] = result;
    } catch (error) {
      console.error(`Error generating ${size.name} image:`, error);
    }
  }
  
  return results;
};

// Optimize image for web
export const optimizeImage = async (publicId, options = {}) => {
  return getImageTransformations(publicId, {
    quality: 'auto',
    fetch_format: 'auto',
    ...options
  });
};

// Get image metadata
export const getImageMetadata = (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.v2.api.resource(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

// Create image upload preset
export const createUploadPreset = async (presetName, options = {}) => {
  try {
    const result = await cloudinary.v2.api.create_upload_preset({
      name: presetName,
      folder: options.folder || 'blog-cms',
      resource_type: options.resource_type || 'auto',
      quality: options.quality || 'auto',
      fetch_format: options.fetch_format || 'auto',
      ...options
    });
    
    return result;
  } catch (error) {
    console.error('Error creating upload preset:', error);
    throw error;
  }
};