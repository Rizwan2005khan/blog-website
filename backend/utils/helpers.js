import { format, parseISO, differenceInDays, isValid } from 'date-fns';
import slugify from 'slugify';
import crypto from 'crypto';

// Date formatting utilities
export const formatDate = (date, formatString = 'yyyy-MM-dd') => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      throw new Error('Invalid date');
    }
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Date formatting error:', error);
    return null;
  }
};

export const getRelativeTime = (date) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid date';
    
    const now = new Date();
    const daysDiff = differenceInDays(now, dateObj);
    
    if (daysDiff === 0) return 'Today';
    if (daysDiff === 1) return 'Yesterday';
    if (daysDiff < 7) return `${daysDiff} days ago`;
    if (daysDiff < 30) return `${Math.floor(daysDiff / 7)} weeks ago`;
    if (daysDiff < 365) return `${Math.floor(daysDiff / 30)} months ago`;
    
    return format(dateObj, 'MMM dd, yyyy');
  } catch (error) {
    console.error('Relative time error:', error);
    return 'Invalid date';
  }
};

// Slug generation
export const generateSlug = (text, options = {}) => {
  const defaultOptions = {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
    ...options
  };
  
  return slugify(text, defaultOptions);
};

export const generateUniqueSlug = async (text, model, field = 'slug') => {
  let slug = generateSlug(text);
  let uniqueSlug = slug;
  let counter = 1;
  
  while (await model.findOne({ [field]: uniqueSlug })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  
  return uniqueSlug;
};

// Text processing utilities
export const stripHtml = (html) => {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
};

export const truncateText = (text, maxLength = 150, suffix = '...') => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + suffix;
};

export const wordCount = (text) => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export const readingTime = (text, wordsPerMinute = 200) => {
  const words = wordCount(text);
  const minutes = Math.ceil(words / wordsPerMinute);
  return minutes;
};

// SEO utilities
export const generateMetaDescription = (content, maxLength = 160) => {
  const plainText = stripHtml(content);
  return truncateText(plainText, maxLength);
};

export const generateMetaKeywords = (content, tags = []) => {
  // Simple keyword extraction (in production, use NLP library)
  const words = content.toLowerCase().split(/\s+/);
  const wordFreq = {};
  
  words.forEach(word => {
    if (word.length > 3 && !word.match(/^https?:\/\//)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  const keywords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
  
  return [...new Set([...keywords, ...tags])].slice(0, 10);
};

// Security utilities
export const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

export const hashData = (data, algorithm = 'sha256') => {
  return crypto.createHash(algorithm).update(data).digest('hex');
};

export const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
};

// Array utilities
export const paginateArray = (array, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: array.slice(startIndex, endIndex),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(array.length / limit),
      totalItems: array.length,
      hasNextPage: endIndex < array.length,
      hasPrevPage: startIndex > 0
    }
  };
};

export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const removeDuplicates = (array, key) => {
  if (!key) return [...new Set(array)];
  
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

// Object utilities
export const pick = (obj, keys) => {
  return keys.reduce((picked, key) => {
    if (obj && obj.hasOwnProperty(key)) {
      picked[key] = obj[key];
    }
    return picked;
  }, {});
};

export const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

export const deepMerge = (target, source) => {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
};

// Validation utilities
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidMongoId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Color utilities
export const generateRandomColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
};

export const isValidHexColor = (color) => {
  return /^#[0-9A-F]{6}$/i.test(color);
};

export const darkenColor = (hex, amount = 0.2) => {
  const color = hex.replace('#', '');
  const num = parseInt(color, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) - Math.round(255 * amount)));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) - Math.round(255 * amount)));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) - Math.round(255 * amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

export const lightenColor = (hex, amount = 0.2) => {
  return darkenColor(hex, -amount);
};

// Export all utilities
export default {
  formatDate,
  getRelativeTime,
  generateSlug,
  generateUniqueSlug,
  stripHtml,
  truncateText,
  wordCount,
  readingTime,
  generateMetaDescription,
  generateMetaKeywords,
  generateSecureToken,
  hashData,
  sanitizeFilename,
  paginateArray,
  shuffleArray,
  removeDuplicates,
  pick,
  omit,
  deepMerge,
  isValidEmail,
  isValidUrl,
  isValidMongoId,
  generateRandomColor,
  isValidHexColor,
  darkenColor,
  lightenColor
};