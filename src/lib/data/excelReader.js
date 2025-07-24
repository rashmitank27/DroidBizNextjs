import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// Cache to store parsed data
const dataCache = new Map();

/**
 * Read and parse Excel file
 * @param {string} filename - Name of the Excel file (e.g., 'Kotlin.xlsx')
 * @returns {Promise<Object>} Parsed data structure matching Firestore format
 */
async function readExcelFile(filename) {
  // Check cache first
  if (dataCache.has(filename)) {
    return dataCache.get(filename);
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'excel', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Excel file not found: ${filePath}`);
      return null;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, {
      cellStyles: true,
      cellFormulas: true,
      cellDates: true,
      cellNF: true,
      sheetStubs: true
    });

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      console.error(`No data found in Excel file: ${filename}`);
      return null;
    }

    // Transform the data to match Firestore structure
    const transformedData = transformExcelToFirestoreFormat(jsonData, filename);
    
    // Cache the result
    dataCache.set(filename, transformedData);
    
    return transformedData;
  } catch (error) {
    console.error(`Error reading Excel file ${filename}:`, error);
    return null;
  }
}

/**
 * Transform Excel data to match Firestore structure
 * @param {Array} excelData - Raw Excel data
 * @param {string} filename - Excel filename to derive subject info
 * @returns {Object} Transformed data structure
 */
function transformExcelToFirestoreFormat(excelData, filename) {
  // Extract subject name from filename (e.g., 'Kotlin.xlsx' -> 'kotlin')
  const subjectName = path.basename(filename, '.xlsx').toLowerCase();
  const subjectId = subjectName;

  // Transform Excel rows to content array
  const content = excelData.map(row => ({
    id: row.id || 0,
    title: row.title || '',
    url: row.url || '',
    type: row.type || 1,
    content: row.content || '',
    keywords: row.keywords || '',
    titleTag: row.titleTag || row.title || '',
    descriptionTag: row.descriptionTag || '',
    shortDesc: extractShortDesc(row.content || ''),
  }));

  // Determine if this is a blog or tutorial based on subject name
  const isBlog = subjectId === 'blogs' || subjectId === 'blog';
  
  // Create base URL for the subject
  const baseUrl = isBlog ? '/blogs' : `/${subjectId}`;

  return {
    id: subjectId,
    name: capitalizeFirstLetter(subjectName),
    base_url: baseUrl,
    content: content,
    keywords: content.length > 0 ? content[0].keywords : '',
    titleTag: content.length > 0 ? content[0].titleTag : `${capitalizeFirstLetter(subjectName)} Tutorial`,
    descriptionTag: content.length > 0 ? content[0].descriptionTag : `Learn ${subjectName} programming with comprehensive tutorials and examples.`,
  };
}

/**
 * Extract short description from content (first 150 characters)
 * @param {string} content - Full content text
 * @returns {string} Short description
 */
function extractShortDesc(content) {
  if (!content) return '';
  
  // Remove markdown headers and formatting
  const cleanContent = content
    .replace(/#{1,6}\s+/g, '') // Remove markdown headers
    .replace(/\*\*/g, '') // Remove bold formatting
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]*`/g, '') // Remove inline code
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();

  return cleanContent.length > 150 
    ? cleanContent.substring(0, 150) + '...'
    : cleanContent;
}

/**
 * Capitalize first letter of a string
 * @param {string} str - Input string
 * @returns {string} Capitalized string
 */
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get all available Excel files from the data directory
 * @returns {Array<string>} List of Excel filenames
 */
function getAvailableExcelFiles() {
  try {
    const dataDir = path.join(process.cwd(), 'data', 'excel');
    if (!fs.existsSync(dataDir)) {
      console.error('Excel data directory not found:', dataDir);
      return [];
    }

    return fs.readdirSync(dataDir)
      .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'))
      .sort();
  } catch (error) {
    console.error('Error reading Excel directory:', error);
    return [];
  }
}

/**
 * Load all tutorial data from Excel files
 * @returns {Promise<Array>} Array of tutorial subjects
 */
export async function getTutorials() {
  try {
    const excelFiles = getAvailableExcelFiles();
    
    if (excelFiles.length === 0) {
      console.error('No Excel files found in data directory');
      return [];
    }

    const results = [];
    
    // Process each Excel file
    for (const filename of excelFiles) {
      const data = await readExcelFile(filename);
      if (data) {
        results.push(data);
      }
    }

    return results;
  } catch (error) {
    console.error('Error loading tutorials from Excel files:', error);
    return [];
  }
}

/**
 * Get specific tutorial by subject ID
 * @param {string} subjectId - Subject identifier
 * @returns {Promise<Object|null>} Tutorial data or null if not found
 */
export async function getTutorialBySubject(subjectId) {
  try {
    const filename = `${capitalizeFirstLetter(subjectId)}.xlsx`;
    return await readExcelFile(filename);
  } catch (error) {
    console.error(`Error loading tutorial for subject ${subjectId}:`, error);
    return null;
  }
}

/**
 * Clear cache - useful for development or when files are updated
 */
export function clearCache() {
  dataCache.clear();
  console.log('Excel data cache cleared');
}

/**
 * Preload all Excel files into cache for better performance
 * @returns {Promise<void>}
 */
export async function preloadAllData() {
  try {
    console.log('Preloading all Excel data...');
    await getTutorials();
    console.log('Excel data preloading complete');
  } catch (error) {
    console.error('Error preloading Excel data:', error);
  }
}

export default {
  getTutorials,
  getTutorialBySubject,
  clearCache,
  preloadAllData,
  readExcelFile
};