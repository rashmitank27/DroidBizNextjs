import fs from 'fs';
import path from 'path';

// For static deployment, read from committed cache
const CACHE_DIR = path.join(process.cwd(), '.next-cache');
const MANIFEST_PATH = path.join(CACHE_DIR, 'manifest.json');

let cachedManifest = null;
let cachedData = new Map();

/**
 * Load manifest from committed cache
 */
function loadManifest() {
  if (cachedManifest) return cachedManifest;
  
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      cachedManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
      return cachedManifest;
    }
  } catch (error) {
    console.error('Error loading manifest:', error);
  }
  
  return { subjects: [], totalFiles: 0, totalPages: 0 };
}

/**
 * Load specific subject data from cache
 */
function loadSubjectData(subjectId) {
  if (cachedData.has(subjectId)) {
    return cachedData.get(subjectId);
  }
  
  try {
    const filePath = path.join(CACHE_DIR, `${subjectId}.json`);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      cachedData.set(subjectId, data);
      return data;
    }
  } catch (error) {
    console.error(`Error loading subject data for ${subjectId}:`, error);
  }
  
  return null;
}

/**
 * Get all tutorials from committed cache
 */
export async function getTutorials() {
  try {
    const manifest = loadManifest();
    const results = [];
    
    for (const subject of manifest.subjects) {
      const data = loadSubjectData(subject.id);
      if (data) {
        results.push(data);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error loading tutorials from cache:', error);
    return [];
  }
}

/**
 * Get specific tutorial by subject ID
 */
export async function getTutorialBySubject(subjectId) {
  try {
    return loadSubjectData(subjectId);
  } catch (error) {
    console.error(`Error loading tutorial for subject ${subjectId}:`, error);
    return null;
  }
}

/**
 * Get manifest data
 */
export async function getManifest() {
  return loadManifest();
}

/**
 * Clear cache (for development)
 */
export function clearCache() {
  cachedManifest = null;
  cachedData.clear();
  console.log('Static data cache cleared');
}

export default {
  getTutorials,
  getTutorialBySubject,
  getManifest,
  clearCache
};