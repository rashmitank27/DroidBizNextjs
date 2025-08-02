#!/usr/bin/env node

/**
 * Fixed Static Build Optimization Script with Homepage Support (Pipe Separator)
 * Enhanced with metadata header support
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const XLSX = require('xlsx');
const os = require('os');

const DATA_DIR = path.join(process.cwd(), 'data', 'excel');
const CACHE_DIR = path.join(process.cwd(), '.next-cache');
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const HASH_FILE = path.join(CACHE_DIR, 'file-hashes.json');
const MANIFEST_FILE = path.join(CACHE_DIR, 'manifest.json');

class StaticBuildOptimizer {
  constructor() {
    this.stats = {
      filesProcessed: 0,
      filesSkipped: 0,
      totalPages: 0,
      totalSize: 0,
      errors: 0,
      startTime: Date.now(),
      parallelWorkers: Math.min(os.cpus().length, 8)
    };
    this.fileHashes = this.loadFileHashes();
    this.manifest = this.loadManifest();
  }

  /**
   * Load previously stored file hashes for incremental builds
   */
  loadFileHashes() {
    try {
      if (fs.existsSync(HASH_FILE)) {
        return JSON.parse(fs.readFileSync(HASH_FILE, 'utf8'));
      }
    } catch (error) {
      console.log('📝 No previous build cache found, performing full build');
    }
    return {};
  }

  /**
   * Save file hashes for next incremental build
   */
  saveFileHashes() {
    fs.writeFileSync(HASH_FILE, JSON.stringify(this.fileHashes, null, 2));
  }

  /**
   * Load manifest from committed cache
   */
  loadManifest() {
    try {
      if (fs.existsSync(MANIFEST_FILE)) {
        return JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
      }
    } catch (error) {
      console.log('📝 No previous manifest found, creating new one');
    }
    return {
      subjects: [],
      homepages: [],
      totalFiles: 0,
      totalPages: 0,
      lastUpdated: null,
      buildId: this.generateBuildId()
    };
  }

  /**
   * Transform optimized homepage Excel data with metadata header support
   * New Excel Structure:
   * Row 1: Global metadata (title, shortDesc, keywords, titleTag, descriptionTag)
   * Row 2+: Section data (sectionName, sectionDesc, tutorialTitles, tutorialUrls)
   */
  transformHomepageDataWithHeader(excelData, subjectName) {
    if (!excelData || excelData.length === 0) {
      throw new Error('No homepage data found');
    }

    // Extract global metadata from first row
    const metadataRow = excelData[0];
    const globalMetadata = {
      title: metadataRow.title || `${this.capitalizeFirstLetter(subjectName)} Tutorial`,
      shortDesc: metadataRow.shortDesc || `Learn ${subjectName} programming`,
      keywords: metadataRow.keywords || `${subjectName}, programming, tutorial`,
      titleTag: metadataRow.titleTag || metadataRow.title || `${this.capitalizeFirstLetter(subjectName)} Tutorial`,
      descriptionTag: metadataRow.descriptionTag || metadataRow.shortDesc || `Learn ${subjectName} programming`
    };

    const sections = [];

    // Process section data starting from row 2 (index 1)
    excelData.slice(1).forEach((row, index) => {
      const sectionName = row.sectionName?.trim() || 'General';
      const sectionDesc = row.sectionDesc?.trim() || 'Learn programming concepts';
      
      // Parse pipe-separated tutorial titles and URLs
      const tutorialTitles = this.parsePipeSeparatedField(row.tutorialTitles);
      const tutorialUrls = this.parsePipeSeparatedField(row.tutorialUrls);
      
      // Validate that titles and URLs arrays have same length
      if (tutorialTitles.length !== tutorialUrls.length) {
        console.warn(`Row ${index + 2}: Mismatch between tutorial titles (${tutorialTitles.length}) and URLs (${tutorialUrls.length})`);
        const minLength = Math.min(tutorialTitles.length, tutorialUrls.length);
        tutorialTitles.splice(minLength);
        tutorialUrls.splice(minLength);
      }

      // Create tutorials array
      const tutorials = [];
      for (let i = 0; i < tutorialTitles.length; i++) {
        if (tutorialTitles[i] && tutorialUrls[i]) {
          tutorials.push({
            title: tutorialTitles[i].trim(),
            url: tutorialUrls[i].trim()
          });
        }
      }

      // Check if section already exists
      let existingSection = sections.find(section => section.name === sectionName);
      if (existingSection) {
        // Add tutorials to existing section
        existingSection.tutorials.push(...tutorials);
      } else {
        // Create new section
        sections.push({
          name: sectionName,
          desc: sectionDesc,
          tutorials: tutorials
        });
      }
    });

    // Calculate totals
    const totalTutorials = sections.reduce((sum, section) => sum + section.tutorials.length, 0);

    return {
      id: subjectName,
      name: this.capitalizeFirstLetter(subjectName),
      ...globalMetadata, // Spread the global metadata
      sections: sections,
      totalSections: sections.length,
      totalTutorials: totalTutorials,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Auto-detect Excel format and process accordingly
   */
  transformHomepageDataSmart(excelData, subjectName) {
    if (!excelData || excelData.length === 0) {
      throw new Error('No homepage data found');
    }

    const firstRow = excelData[0];
    
    // Check if first row contains only metadata (no section data)
    const hasOnlyMetadata = firstRow.title && !firstRow.sectionName && !firstRow.tutorialTitles;
    
    if (hasOnlyMetadata && excelData.length > 1) {
      console.log(`📊 Detected metadata header format for ${subjectName}`);
      return this.transformHomepageDataWithHeader(excelData, subjectName);
    } else {
      console.log(`📊 Using original format for ${subjectName}`);
      return this.transformHomepageDataOriginal(excelData, subjectName);
    }
  }

  /**
   * Original transform method (renamed for compatibility)
   */
  transformHomepageDataOriginal(excelData, subjectName) {
    const firstRow = excelData[0];
    const title = firstRow.title || `${this.capitalizeFirstLetter(subjectName)} Tutorial`;
    const shortDesc = firstRow.shortDesc || `Learn ${subjectName} programming`;
    const keywords = firstRow.keywords || `${subjectName}, programming, tutorial`;
    const titleTag = firstRow.titleTag || title;
    const descriptionTag = firstRow.descriptionTag || shortDesc;

    const sections = [];
    
    excelData.forEach((row, index) => {
      const sectionName = row.sectionName?.trim() || 'General';
      const sectionDesc = row.sectionDesc?.trim() || 'Learn programming concepts';
      
      const tutorialTitles = this.parsePipeSeparatedField(row.tutorialTitles);
      const tutorialUrls = this.parsePipeSeparatedField(row.tutorialUrls);
      
      if (tutorialTitles.length !== tutorialUrls.length) {
        console.warn(`Row ${index + 1}: Mismatch between tutorial titles and URLs`);
        const minLength = Math.min(tutorialTitles.length, tutorialUrls.length);
        tutorialTitles.splice(minLength);
        tutorialUrls.splice(minLength);
      }

      const tutorials = [];
      for (let i = 0; i < tutorialTitles.length; i++) {
        if (tutorialTitles[i] && tutorialUrls[i]) {
          tutorials.push({
            title: tutorialTitles[i].trim(),
            url: tutorialUrls[i].trim()
          });
        }
      }

      let existingSection = sections.find(section => section.name === sectionName);
      if (existingSection) {
        existingSection.tutorials.push(...tutorials);
      } else {
        sections.push({
          name: sectionName,
          desc: sectionDesc,
          tutorials: tutorials
        });
      }
    });

    const totalTutorials = sections.reduce((sum, section) => sum + section.tutorials.length, 0);

    return {
      id: subjectName,
      name: this.capitalizeFirstLetter(subjectName),
      title: title,
      shortDesc: shortDesc,
      keywords: keywords,
      titleTag: titleTag,
      descriptionTag: descriptionTag,
      sections: sections,
      totalSections: sections.length,
      totalTutorials: totalTutorials,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Transform optimized homepage Excel data (pipe-separated format)
   * This is the main method that gets called - now uses smart detection
   */
  transformHomepageData(excelData, subjectName) {
    return this.transformHomepageDataSmart(excelData, subjectName);
  }

  /**
   * Parse pipe-separated field values
   */
  parsePipeSeparatedField(fieldValue) {
    if (!fieldValue || typeof fieldValue !== 'string') {
      return [];
    }
    
    return fieldValue
      .split('|')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  /**
   * Capitalize first letter of string
   */
  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  /**
   * Validate homepage data structure
   */
  validateHomepageData(data) {
    if (!data.title) {
      throw new Error('Homepage must have a title');
    }
    
    if (!data.sections || data.sections.length === 0) {
      throw new Error('Homepage must have at least one section');
    }
    
    data.sections.forEach((section, index) => {
      if (!section.name) {
        throw new Error(`Section ${index + 1} must have a name`);
      }
      
      if (!section.tutorials || section.tutorials.length === 0) {
        console.warn(`Section "${section.name}" has no tutorials`);
      }
      
      section.tutorials.forEach((tutorial, tutIndex) => {
        if (!tutorial.title) {
          throw new Error(`Tutorial ${tutIndex + 1} in section "${section.name}" must have a title`);
        }
        if (!tutorial.url) {
          throw new Error(`Tutorial "${tutorial.title}" in section "${section.name}" must have a URL`);
        }
      });
    });
  }

  /**
   * Process individual Excel file (updated to handle homepage files)
   */
  async processExcelFile(filename) {
    const filePath = path.join(DATA_DIR, filename);
    const isHomepage = filename.includes('_home.');
    const subjectName = isHomepage 
      ? path.basename(filename, '.xlsx').replace('_home', '').toLowerCase()
      : path.basename(filename, '.xlsx').toLowerCase();
    
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(fileBuffer, {
        cellStyles: false,
        cellFormulas: false,
        cellDates: true
      });

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error('No data found in Excel file');
      }

      const transformedData = isHomepage 
        ? this.transformHomepageData(jsonData, subjectName)
        : this.transformExcelDataOptimized(jsonData, subjectName);
      
      if (isHomepage) {
        this.validateHomepageData(transformedData);
      }
      
      const outputFilename = isHomepage ? `${subjectName}_home.json` : `${subjectName}.json`;
      const outputPath = path.join(CACHE_DIR, outputFilename);
      const jsonString = JSON.stringify(transformedData, null, 2);
      fs.writeFileSync(outputPath, jsonString);

      return {
        pages: isHomepage ? transformedData.sections?.length || 0 : transformedData.content.length,
        sections: isHomepage ? transformedData.sections?.length || 0 : transformedData.totalSections || 1,
        tutorials: isHomepage ? transformedData.totalTutorials || 0 : transformedData.content.length,
        size: Buffer.byteLength(jsonString),
        type: isHomepage ? 'homepage' : 'content'
      };
    } catch (error) {
      console.error(`Error processing ${filename}:`, error.message);
      throw new Error(`Failed to process ${filename}: ${error.message}`);
    }
  }

  /**
   * Optimized data transformation with section support (for regular tutorial files)
   */
  transformExcelDataOptimized(excelData, subjectName) {
    const content = excelData.map((row, index) => ({
      id: row.id || index + 1,
      title: row.title || `Untitled ${index + 1}`,
      url: row.url || `page-${index + 1}`,
      type: row.type || 1,
      content: row.content || '',
      keywords: row.keywords || '',
      titleTag: row.titleTag || row.title || '',
      descriptionTag: row.descriptionTag || '',
      shortDesc: row.shortDesc || this.extractShortDescOptimized(row.content),
      section: row.section || 'General',
      lastModified: new Date().toISOString()
    }));

    const baseUrl = subjectName === 'blogs' ? '/blogs' : `/${subjectName}`;
    const sections = [...new Set(content.map(item => item.section))];
    
    return {
      id: subjectName,
      name: this.capitalizeFirstLetter(subjectName),
      base_url: baseUrl,
      content: content,
      sections: sections,
      keywords: content[0]?.keywords || '',
      titleTag: content[0]?.titleTag || `${this.capitalizeFirstLetter(subjectName)} Tutorial`,
      descriptionTag: content[0]?.descriptionTag || `Learn ${subjectName} programming.`,
      totalPages: content.length,
      totalSections: sections.length,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Optimized short description extraction
   */
  extractShortDescOptimized(content) {
    if (!content) return '';
    
    const cleaned = content
      .replace(/#{1,6}\s+|\*\*|```[\s\S]*?```|`[^`]*`/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned.length > 155 ? cleaned.substring(0, 155) + '...' : cleaned;
  }

  /**
   * Generate unique build ID
   */
  generateBuildId() {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Get all Excel files from data directory (including homepage files)
   */
  getExcelFiles() {
    if (!fs.existsSync(DATA_DIR)) {
      throw new Error(`Data directory not found: ${DATA_DIR}`);
    }

    return fs.readdirSync(DATA_DIR)
      .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'))
      .sort();
  }

  /**
   * Detect which files have changed since last build
   */
  detectChangedFiles(allFiles) {
    const changedFiles = [];
    const unchangedFiles = [];

    for (const filename of allFiles) {
      const filePath = path.join(DATA_DIR, filename);
      const currentHash = this.getFileHash(filePath);
      const previousHash = this.fileHashes[filename];

      if (currentHash !== previousHash) {
        changedFiles.push(filename);
        this.fileHashes[filename] = currentHash;
      } else {
        unchangedFiles.push(filename);
      }
    }

    return { changedFiles, unchangedFiles };
  }

  /**
   * Calculate MD5 hash of file for change detection
   */
  getFileHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    [CACHE_DIR, PUBLIC_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Ensure API directories exist
    const apiDir = path.join(PUBLIC_DIR, 'api');
    const dataApiDir = path.join(apiDir, 'data');
    
    [apiDir, dataApiDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Process Excel files in parallel
   */
  async processFilesInParallel(files) {
    console.log(`⚡ Processing ${files.length} files in parallel...\n`);

    const chunks = this.chunkArray(files, this.stats.parallelWorkers);
    const processingPromises = chunks.map((chunk, index) => 
      this.processChunk(chunk, index)
    );

    const results = await Promise.all(processingPromises);
    
    results.forEach(result => {
      this.stats.filesProcessed += result.filesProcessed;
      this.stats.totalPages += result.totalPages;
      this.stats.totalSize += result.totalSize;
      this.stats.errors += result.errors;
    });
  }

  /**
   * Process a chunk of files
   */
  async processChunk(files, chunkIndex) {
    const chunkStats = {
      filesProcessed: 0,
      totalPages: 0,
      totalSize: 0,
      errors: 0
    };

    console.log(`🔄 Worker ${chunkIndex + 1}: Processing ${files.length} files`);

    for (const filename of files) {
      try {
        const result = await this.processExcelFile(filename);
        chunkStats.filesProcessed++;
        chunkStats.totalPages += result.pages;
        chunkStats.totalSize += result.size;
        
        if (result.type === 'homepage') {
          console.log(`   ✅ Worker ${chunkIndex + 1}: ${filename} (${result.sections} sections, ${result.tutorials} tutorials)`);
        } else {
          console.log(`   ✅ Worker ${chunkIndex + 1}: ${filename} (${result.pages} pages, ${result.sections} sections)`);
        }
      } catch (error) {
        console.log(`   ❌ Worker ${chunkIndex + 1}: ${filename} failed - ${error.message}`);
        chunkStats.errors++;
      }
    }

    return chunkStats;
  }

  /**
   * Split array into chunks for parallel processing
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Main optimization process
   */
  async optimize() {
    console.log(`🚀 Starting static build optimization...`);
    console.log(`📊 Using ${this.stats.parallelWorkers} parallel workers\n`);
    
    try {
      this.ensureDirectories();
      
      const allFiles = this.getExcelFiles();
      const { changedFiles, unchangedFiles } = this.detectChangedFiles(allFiles);
      
      console.log(`📁 Total files: ${allFiles.length}`);
      console.log(`🔄 Changed files: ${changedFiles.length}`);
      console.log(`✅ Unchanged files: ${unchangedFiles.length} (will be skipped)\n`);
      
      if (changedFiles.length > 0) {
        await this.processFilesInParallel(changedFiles);
      }
      
      this.saveFileHashes();
      
      console.log('✅ Static build optimization completed!');
      console.log('📦 Ready for Vercel deployment with static files');
    } catch (error) {
      console.error('❌ Build optimization failed:', error);
      process.exit(1);
    }
  }

  // Add this method to your StaticBuildOptimizer class in scripts/build-optimize.js

/**
 * Process tutorial_home.xlsx file specifically
 */
async processExcelFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  const isHomepage = filename.includes('_home.');
  const isTutorialHome = filename === 'tutorial_home.xlsx';
  
  let subjectName, outputFilename;
  
  if (isTutorialHome) {
    subjectName = 'tutorial_home';
    outputFilename = 'tutorial_home.json';
  } else if (isHomepage) {
    subjectName = path.basename(filename, '.xlsx').replace('_home', '').toLowerCase();
    outputFilename = `${subjectName}_home.json`;
  } else {
    subjectName = path.basename(filename, '.xlsx').toLowerCase();
    outputFilename = `${subjectName}.json`;
  }
  
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, {
      cellStyles: false,
      cellFormulas: false,
      cellDates: true
    });

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      throw new Error('No data found in Excel file');
    }

    let transformedData;
    
    if (isTutorialHome) {
      // Transform tutorial_home.xlsx data
      transformedData = this.transformTutorialHomeData(jsonData);
    } else if (isHomepage) {
      // Transform regular homepage data
      transformedData = this.transformHomepageData(jsonData, subjectName);
    } else {
      // Transform regular tutorial data
      transformedData = this.transformExcelDataOptimized(jsonData, subjectName);
    }
    
    if (isHomepage || isTutorialHome) {
      this.validateHomepageData(transformedData);
    }
    
    const outputPath = path.join(CACHE_DIR, outputFilename);
    const jsonString = JSON.stringify(transformedData, null, 2);
    fs.writeFileSync(outputPath, jsonString);

    return {
      pages: isTutorialHome ? transformedData.content?.length || 0 : 
             isHomepage ? transformedData.sections?.length || 0 : 
             transformedData.content.length,
      sections: isTutorialHome ? 1 : 
                isHomepage ? transformedData.sections?.length || 0 : 
                transformedData.totalSections || 1,
      tutorials: isTutorialHome ? transformedData.content?.length || 0 :
                 isHomepage ? transformedData.totalTutorials || 0 : 
                 transformedData.content.length,
      size: Buffer.byteLength(jsonString),
      type: isTutorialHome ? 'tutorial_home' : 
            isHomepage ? 'homepage' : 
            'content'
    };
  } catch (error) {
    console.error(`Error processing ${filename}:`, error.message);
    throw new Error(`Failed to process ${filename}: ${error.message}`);
  }
}

/**
 * Transform tutorial_home.xlsx data
 */
transformTutorialHomeData(excelData) {
  if (!excelData || excelData.length === 0) {
    throw new Error('No tutorial home data found');
  }

  const content = excelData.map((row, index) => ({
    id: row.id || index + 1,
    title: row.title || `Untitled ${index + 1}`,
    content: row.content || '',
    keywords: row.keywords || '',
    descriptionTag: row.descriptionTag || '',
    url: row.url || `page-${index + 1}`,
    lastModified: new Date().toISOString()
  }));

  return {
    id: 'tutorial_home',
    name: 'Tutorial Home',
    content: content,
    totalPages: content.length,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Updated validation for tutorial home data
 */
validateHomepageData(data) {
  if (data.id === 'tutorial_home') {
    // Validate tutorial_home data
    if (!data.content || data.content.length === 0) {
      throw new Error('Tutorial home must have content');
    }
    
    data.content.forEach((item, index) => {
      if (!item.title) {
        throw new Error(`Tutorial home item ${index + 1} must have a title`);
      }
      if (!item.url) {
        throw new Error(`Tutorial home item "${item.title}" must have a URL`);
      }
    });
  } else {
    // Original validation for section-based homepages
    if (!data.title) {
      throw new Error('Homepage must have a title');
    }
    
    if (!data.sections || data.sections.length === 0) {
      throw new Error('Homepage must have at least one section');
    }
    
    data.sections.forEach((section, index) => {
      if (!section.name) {
        throw new Error(`Section ${index + 1} must have a name`);
      }
      
      if (!section.tutorials || section.tutorials.length === 0) {
        console.warn(`Section "${section.name}" has no tutorials`);
      }
      
      section.tutorials.forEach((tutorial, tutIndex) => {
        if (!tutorial.title) {
          throw new Error(`Tutorial ${tutIndex + 1} in section "${section.name}" must have a title`);
        }
        if (!tutorial.url) {
          throw new Error(`Tutorial "${tutorial.title}" in section "${section.name}" must have a URL`);
        }
      });
    });
  }
}

// Updated build-optimize.js - Add this utility function to the StaticBuildOptimizer class

/**
 * Convert subject name to URL-friendly slug with hyphens instead of underscores
 */
createUrlSlug(filename) {
  return path.basename(filename, '.xlsx')
    .toLowerCase()
    .replace(/_/g, '-')  // Replace underscores with hyphens
    .replace(/\s+/g, '-')  // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '')  // Remove special characters except hyphens
    .replace(/-+/g, '-')  // Replace multiple consecutive hyphens with single hyphen
    .replace(/^-|-$/g, '');  // Remove leading/trailing hyphens
}

/**
 * Updated processExcelFile method with proper URL slug generation
 */
async processExcelFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  const isHomepage = filename.includes('_home.');
  const isTutorialHome = filename === 'tutorial_home.xlsx';
  
  let subjectName, outputFilename;
  
  if (isTutorialHome) {
    subjectName = 'tutorial_home';
    outputFilename = 'tutorial_home.json';
  } else if (isHomepage) {
    // For homepage files like "jetpack_compose_home.xlsx"
    const baseFilename = path.basename(filename, '.xlsx').replace('_home', '');
    subjectName = this.createUrlSlug(baseFilename);  // Convert to "jetpack-compose"
    outputFilename = `${subjectName}_home.json`;
  } else {
    // For regular tutorial files
    subjectName = this.createUrlSlug(filename);  // Convert to URL slug
    outputFilename = `${subjectName}.json`;
  }
  
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, {
      cellStyles: false,
      cellFormulas: false,
      cellDates: true
    });

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      throw new Error('No data found in Excel file');
    }

    let transformedData;
    
    if (isTutorialHome) {
      // Transform tutorial_home.xlsx data
      transformedData = this.transformTutorialHomeData(jsonData);
    } else if (isHomepage) {
      // Transform regular homepage data
      transformedData = this.transformHomepageData(jsonData, subjectName);
    } else {
      // Transform regular tutorial data
      transformedData = this.transformExcelDataOptimized(jsonData, subjectName);
    }
    
    if (isHomepage || isTutorialHome) {
      this.validateHomepageData(transformedData);
    }
    
    const outputPath = path.join(CACHE_DIR, outputFilename);
    const jsonString = JSON.stringify(transformedData, null, 2);
    fs.writeFileSync(outputPath, jsonString);

    return {
      pages: isTutorialHome ? transformedData.content?.length || 0 : 
             isHomepage ? transformedData.sections?.length || 0 : 
             transformedData.content.length,
      sections: isTutorialHome ? 1 : 
                isHomepage ? transformedData.sections?.length || 0 : 
                transformedData.totalSections || 1,
      tutorials: isTutorialHome ? transformedData.content?.length || 0 :
                 isHomepage ? transformedData.totalTutorials || 0 : 
                 transformedData.content.length,
      size: Buffer.byteLength(jsonString),
      type: isTutorialHome ? 'tutorial_home' : 
            isHomepage ? 'homepage' : 
            'content'
    };
  } catch (error) {
    console.error(`Error processing ${filename}:`, error.message);
    throw new Error(`Failed to process ${filename}: ${error.message}`);
  }
}

/**
 * Updated transformExcelDataOptimized method with proper URL slug
 */
transformExcelDataOptimized(excelData, subjectName) {
  const content = excelData.map((row, index) => {
    // Base structure for all subjects
    const baseItem = {
      id: row.id || index + 1,
      title: row.title || `Untitled ${index + 1}`,
      url: row.url || `page-${index + 1}`,
      content: row.content || '',
      keywords: row.keywords || '',
      titleTag: row.titleTag || row.title || '',
      descriptionTag: row.descriptionTag || '',
      shortDesc: row.shortDesc || this.extractShortDescOptimized(row.content),
      lastModified: new Date().toISOString()
    };

    // Add type and section only for non-blog subjects
    if (subjectName !== 'blogs') {
      baseItem.type = row.type || 1;
      baseItem.section = row.section || 'General';
    }

    return baseItem;
  });

  // Create proper URL slug for base_url
  const baseUrl = subjectName === 'blogs' ? '/blogs' : `/${subjectName}`;
  
  // Only calculate sections for non-blog subjects
  const sections = subjectName === 'blogs' 
    ? [] 
    : [...new Set(content.map(item => item.section).filter(Boolean))];
  
  const result = {
    id: subjectName,
    name: this.capitalizeWords(subjectName),
    base_url: baseUrl,
    content: content,
    keywords: content[0]?.keywords || '',
    titleTag: content[0]?.titleTag || `${this.capitalizeWords(subjectName)} ${subjectName === 'blogs' ? 'Blog' : 'Tutorial'}`,
    descriptionTag: content[0]?.descriptionTag || `${subjectName === 'blogs' ? 'Read our latest blog posts' : `Learn ${this.capitalizeWords(subjectName)} programming`}.`,
    totalPages: content.length,
    lastUpdated: new Date().toISOString()
  };

  // Add sections only for non-blog subjects
  if (subjectName !== 'blogs') {
    result.sections = sections;
    result.totalSections = sections.length;
  }

  return result;
}

/**
 * Updated transformHomepageDataOriginal with proper URL slug
 */
transformHomepageDataOriginal(excelData, subjectName) {
  const firstRow = excelData[0];
  const displayName = this.capitalizeWords(subjectName);
  const title = firstRow.title || `${displayName} Tutorial`;
  const shortDesc = firstRow.shortDesc || `Learn ${displayName} programming`;
  const keywords = firstRow.keywords || `${subjectName.replace(/-/g, ', ')}, programming, tutorial`;
  const titleTag = firstRow.titleTag || title;
  const descriptionTag = firstRow.descriptionTag || shortDesc;

  const sections = [];
  
  excelData.forEach((row, index) => {
    const sectionName = row.sectionName?.trim() || 'General';
    const sectionDesc = row.sectionDesc?.trim() || 'Learn programming concepts';
    
    const tutorialTitles = this.parsePipeSeparatedField(row.tutorialTitles);
    const tutorialUrls = this.parsePipeSeparatedField(row.tutorialUrls);
    
    if (tutorialTitles.length !== tutorialUrls.length) {
      console.warn(`Row ${index + 1}: Mismatch between tutorial titles and URLs`);
      const minLength = Math.min(tutorialTitles.length, tutorialUrls.length);
      tutorialTitles.splice(minLength);
      tutorialUrls.splice(minLength);
    }

    const tutorials = [];
    for (let i = 0; i < tutorialTitles.length; i++) {
      if (tutorialTitles[i] && tutorialUrls[i]) {
        tutorials.push({
          title: tutorialTitles[i].trim(),
          url: tutorialUrls[i].trim()
        });
      }
    }

    let existingSection = sections.find(section => section.name === sectionName);
    if (existingSection) {
      existingSection.tutorials.push(...tutorials);
    } else {
      sections.push({
        name: sectionName,
        desc: sectionDesc,
        tutorials: tutorials
      });
    }
  });

  const totalTutorials = sections.reduce((sum, section) => sum + section.tutorials.length, 0);

  return {
    id: subjectName,
    name: displayName,
    title: title,
    shortDesc: shortDesc,
    keywords: keywords,
    titleTag: titleTag,
    descriptionTag: descriptionTag,
    sections: sections,
    totalSections: sections.length,
    totalTutorials: totalTutorials,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Helper function to capitalize words and replace hyphens with spaces for display
 */
capitalizeWords(str) {
  return str
    .replace(/-/g, ' ')  // Replace hyphens with spaces
    .replace(/\b\w/g, l => l.toUpperCase())  // Capitalize first letter of each word
    .trim();
}

/**
 * Updated capitalizeFirstLetter to handle hyphenated words
 */
capitalizeFirstLetter(string) {
  return this.capitalizeWords(string);
}
}

// Create and run optimizer
const optimizer = new StaticBuildOptimizer();
optimizer.optimize().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

module.exports = StaticBuildOptimizer;