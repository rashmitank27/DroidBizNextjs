#!/usr/bin/env node

/**
 * Fixed Static Build Optimization Script for V3 Branch
 * Ensures manifest.json is always created properly
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
    this.manifest = this.createNewManifest();
  }

  /**
   * Load previously stored file hashes for incremental builds
   */
  loadFileHashes() {
    try {
      if (fs.existsSync(HASH_FILE)) {
        const hashes = JSON.parse(fs.readFileSync(HASH_FILE, 'utf8'));
        console.log('📝 Loaded existing file hashes');
        return hashes;
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
    try {
      fs.writeFileSync(HASH_FILE, JSON.stringify(this.fileHashes, null, 2));
      console.log('   ✅ File hashes saved');
    } catch (error) {
      console.error('   ❌ Failed to save file hashes:', error.message);
    }
  }

  /**
   * Create new manifest structure
   */
  createNewManifest() {
    return {
      subjects: [],
      homepages: [],
      totalFiles: 0,
      totalPages: 0,
      lastUpdated: null,
      buildId: this.generateBuildId(),
      buildStats: {
        filesProcessed: 0,
        filesSkipped: 0,
        totalSize: 0,
        buildTime: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };
  }

  /**
   * Generate unique build ID
   */
  generateBuildId() {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Get all Excel files from data directory
   */
  getExcelFiles() {
    if (!fs.existsSync(DATA_DIR)) {
      console.error(`❌ Data directory not found: ${DATA_DIR}`);
      throw new Error(`Data directory not found: ${DATA_DIR}`);
    }

    const files = fs.readdirSync(DATA_DIR)
      .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'))
      .sort();

    if (files.length === 0) {
      console.warn('⚠️  No Excel files found in data directory');
    }

    return files;
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
    console.log('📁 Ensuring directories exist...');
    
    [CACHE_DIR, PUBLIC_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`   ✅ Created directory: ${path.relative(process.cwd(), dir)}`);
      }
    });

    // Ensure API directories exist
    const apiDir = path.join(PUBLIC_DIR, 'api');
    const dataApiDir = path.join(apiDir, 'data');
    
    [apiDir, dataApiDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`   ✅ Created API directory: ${path.relative(process.cwd(), dir)}`);
      }
    });
  }

  /**
   * Process Excel files in parallel
   */
 async processFilesInParallel(files) {
    console.log(`⚡ Processing ${files.length} files in parallel...\n`);

    for (const filename of files) {
      try {
        const result = await this.processExcelFile(filename);
        this.stats.filesProcessed++;
        console.log(`   ✅ Processed: ${filename} (${result.pages} pages)`);
      } catch (error) {
        console.log(`   ❌ Failed: ${filename} - ${error.message}`);
        this.stats.errors++;
      }
    }
  }

  /**
   * Process individual Excel file
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
        transformedData = this.transformTutorialHomeData(jsonData);
      } else if (isHomepage) {
        transformedData = this.transformHomepageData(jsonData, subjectName);
      } else {
        transformedData = this.transformExcelDataOptimized(jsonData, subjectName);
      }
      
      const outputPath = path.join(CACHE_DIR, outputFilename);
      const jsonString = JSON.stringify(transformedData, null, 2);
      fs.writeFileSync(outputPath, jsonString);
      
      this.stats.totalSize += Buffer.byteLength(jsonString);
      
      // FIXED: Add to manifest immediately after processing
      this.addToManifestImmediate(transformedData, isHomepage, isTutorialHome, filename);

      return {
        pages: isTutorialHome ? transformedData.content?.length || 0 : 
               isHomepage ? transformedData.sections?.length || 0 : 
               transformedData.content?.length || 0,
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
   * NEW: Add processed data to manifest immediately
   */
  addToManifestImmediate(data, isHomepage, isTutorialHome, filename) {
    console.log(`   📋 Adding ${filename} to manifest...`);
    
    if (isTutorialHome) {
      // Skip tutorial_home for manifest
      return;
    }
    
    if (isHomepage) {
      const homepageEntry = {
        id: data.id,
        subjectId: data.id,
        title: data.title || `${this.capitalizeWords(data.id)} Tutorial`,
        totalSections: data.totalSections || 0,
        totalTutorials: data.totalTutorials || 0,
        lastModified: data.lastUpdated
      };
      
      this.manifest.homepages.push(homepageEntry);
      console.log(`      ✅ Added homepage: ${data.id} (${homepageEntry.totalSections} sections)`);
      
    } else {
      const pageCount = data.content?.length || 0;
      this.stats.totalPages += pageCount;
      
      const subjectEntry = {
        id: data.id,
        name: data.name || this.capitalizeWords(data.id),
        base_url: data.base_url || `/${data.id}`,
        totalPages: pageCount,
        totalSections: data.totalSections || 1,
        sections: data.sections || ['General'],
        lastModified: data.lastUpdated,
        keywords: data.keywords || '',
        titleTag: data.titleTag || `${data.name || data.id} Tutorial`,
        descriptionTag: data.descriptionTag || `Learn ${data.name || data.id}`
      };
      
      this.manifest.subjects.push(subjectEntry);
      console.log(`      ✅ Added subject: ${data.id} (${pageCount} pages)`);
    }
  }

  /**
   * Add processed data to manifest
   */
  addToManifest(data, isHomepage, isTutorialHome) {
    if (isTutorialHome) {
      // Skip tutorial_home for manifest
      return;
    }
    
    if (isHomepage) {
      this.manifest.homepages.push({
        id: data.id,
        subjectId: data.id,
        title: data.title || `${this.capitalizeWords(data.id)} Tutorial`,
        totalSections: data.totalSections || 0,
        totalTutorials: data.totalTutorials || 0,
        lastModified: data.lastUpdated
      });
    } else {
      const pageCount = data.content?.length || 0;
      this.stats.totalPages += pageCount;
      
      this.manifest.subjects.push({
        id: data.id,
        name: data.name || this.capitalizeWords(data.id),
        base_url: data.base_url || `/${data.id}`,
        totalPages: pageCount,
        totalSections: data.totalSections || 1,
        sections: data.sections || ['General'],
        lastModified: data.lastUpdated,
        keywords: data.keywords || '',
        titleTag: data.titleTag || `${data.name || data.id} Tutorial`,
        descriptionTag: data.descriptionTag || `Learn ${data.name || data.id}`
      });
    }
  }

  /**
   * Transform tutorial_home.xlsx data
   */
  transformTutorialHomeData(excelData) {
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
   * Transform homepage data (simplified)
   */
  transformHomepageData(excelData, subjectName) {
    const displayName = this.capitalizeWords(subjectName);
    
    return {
      id: subjectName,
      name: displayName,
      title: `${displayName} Tutorial`,
      shortDesc: `Learn ${displayName} programming`,
      sections: [],
      totalSections: 0,
      totalTutorials: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Transform regular Excel data
   */
  transformExcelDataOptimized(excelData, subjectName) {
    const content = excelData.map((row, index) => {
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

    const baseUrl = subjectName === 'blogs' ? '/blogs' : `/${subjectName}`;
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
   * Extract short description from content
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
   * Capitalize words and replace hyphens/underscores
   */
  capitalizeWords(str) {
    return str
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  }

  /**
   * Save manifest to file
   */
  saveManifest() {
    console.log('\n📋 Saving manifest...');
    
    // Update final stats
    this.manifest.totalFiles = this.stats.filesProcessed;
    this.manifest.totalPages = this.stats.totalPages;
    this.manifest.lastUpdated = new Date().toISOString();
    this.manifest.buildStats = {
      filesProcessed: this.stats.filesProcessed,
      filesSkipped: this.stats.filesSkipped,
      totalSize: this.stats.totalSize,
      buildTime: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform
    };
    
    try {
      const manifestString = JSON.stringify(this.manifest, null, 2);
      fs.writeFileSync(MANIFEST_FILE, manifestString);
      console.log('   ✅ Manifest saved to .next-cache/manifest.json');
      console.log(`   📊 Subjects: ${this.manifest.subjects.length}, Homepages: ${this.manifest.homepages.length}, Total pages: ${this.manifest.totalPages}`);
      
      // Verify manifest was created
      if (fs.existsSync(MANIFEST_FILE)) {
        const stats = fs.statSync(MANIFEST_FILE);
        console.log(`   ✅ Manifest file size: ${stats.size} bytes`);
      }
      
    } catch (error) {
      console.error('   ❌ Failed to save manifest:', error.message);
      throw error;
    }
  }

  /**
   * Generate static API routes
   */
  async generateStaticAPI() {
    console.log('\n🔧 Generating static API routes...');
    
    const apiDir = path.join(PUBLIC_DIR, 'api');
    const dataApiDir = path.join(apiDir, 'data');
    
    try {
      // Copy manifest to public API
      if (fs.existsSync(MANIFEST_FILE)) {
        fs.copyFileSync(MANIFEST_FILE, path.join(apiDir, 'manifest.json'));
        console.log('   ✅ Copied manifest.json to API route');
      }
      
      // Copy all cache files to public API
      const cacheFiles = fs.readdirSync(CACHE_DIR)
        .filter(file => file.endsWith('.json') && file !== 'file-hashes.json');
      
      for (const file of cacheFiles) {
        const sourcePath = path.join(CACHE_DIR, file);
        const targetPath = path.join(dataApiDir, file);
        fs.copyFileSync(sourcePath, targetPath);
      }
      
      console.log(`   ✅ Copied ${cacheFiles.length} data files to API routes`);
      
    } catch (error) {
      console.error('   ❌ Failed to generate static API:', error.message);
    }
  }

  /**
   * Show optimization statistics
   */
  showOptimizedStats() {
    const totalTime = (Date.now() - this.stats.startTime) / 1000;
    
    console.log('\n📊 Build Statistics:');
    console.log(`   📁 Files processed: ${this.stats.filesProcessed}`);
    console.log(`   ⏭️  Files skipped: ${this.stats.filesSkipped}`);
    console.log(`   📄 Total pages: ${this.stats.totalPages}`);
    console.log(`   💾 Total size: ${(this.stats.totalSize / 1024).toFixed(1)} KB`);
    console.log(`   ⏱️  Build time: ${totalTime.toFixed(1)}s`);
    console.log(`   ❌ Errors: ${this.stats.errors}`);
    
    if (this.stats.errors > 0) {
      console.log('\n⚠️  Some files had errors. Check the logs above.');
    }
  }

  /**
   * Main optimization process
   */
   async optimize() {
    console.log(`🚀 Starting static build optimization...`);
    console.log(`📊 Using ${this.stats.parallelWorkers} parallel workers\n`);
    
    try {
      // Step 1: Ensure directories
      this.ensureDirectories();
      
      // Step 2: Get Excel files
      const allFiles = this.getExcelFiles();
      
      if (allFiles.length === 0) {
        console.warn('⚠️  No Excel files found. Creating empty manifest...');
        this.saveManifest();
        return;
      }
      
      // Step 3: Detect changes
      const { changedFiles, unchangedFiles } = this.detectChangedFiles(allFiles);
      
      console.log(`📁 Total files: ${allFiles.length}`);
      console.log(`🔄 Changed files: ${changedFiles.length}`);
      console.log(`✅ Unchanged files: ${unchangedFiles.length} (will be skipped)\n`);
      
      // Step 4: Process files (this now updates manifest as we go)
      if (changedFiles.length > 0) {
        await this.processFilesInParallel(changedFiles);
      }
      
      // Step 5: Handle unchanged files for manifest
      if (unchangedFiles.length > 0) {
        await this.addUnchangedFilesToManifest(unchangedFiles);
      }
      
      // Step 6: Finalize manifest with metadata
      this.updateManifestFinal();
      
      // Step 7: Save everything
      this.saveManifest();
      this.saveFileHashes();
      await this.generateStaticAPI();
      
      // Step 8: Show results
      this.showOptimizedStats();
      
      console.log('\n✅ Static build optimization completed!');
      console.log('📦 Ready for deployment with static files');
      
    } catch (error) {
      console.error('\n❌ Build optimization failed:', error);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    }
  }

  updateManifestFinal() {
    console.log('\n📋 Finalizing manifest...');
    
    // Update final stats only (subjects already added)
    this.manifest.totalFiles = this.stats.filesProcessed;
    this.manifest.totalPages = this.stats.totalPages;
    this.manifest.lastUpdated = new Date().toISOString();
    this.manifest.buildStats = {
      filesProcessed: this.stats.filesProcessed,
      filesSkipped: this.stats.filesSkipped,
      totalSize: this.stats.totalSize,
      buildTime: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform
    };
    
    console.log(`   📊 Final counts: ${this.manifest.subjects.length} subjects, ${this.manifest.homepages.length} homepages`);
    console.log(`   📄 Total pages: ${this.manifest.totalPages}`);
  }
  
   async addUnchangedFilesToManifest(unchangedFiles) {
    console.log(`\n📋 Adding ${unchangedFiles.length} unchanged files to manifest...`);
    
    for (const filename of unchangedFiles) {
      try {
        const isHomepage = filename.includes('_home.');
        const isTutorialHome = filename === 'tutorial_home.xlsx';
        
        let subjectName, cachedFilename;
        
        if (isTutorialHome) {
          continue; // Skip tutorial_home
        } else if (isHomepage) {
          subjectName = path.basename(filename, '.xlsx').replace('_home', '').toLowerCase();
          cachedFilename = `${subjectName}_home.json`;
        } else {
          subjectName = path.basename(filename, '.xlsx').toLowerCase();
          cachedFilename = `${subjectName}.json`;
        }
        
        const cachedPath = path.join(CACHE_DIR, cachedFilename);
        
        if (fs.existsSync(cachedPath)) {
          const cachedData = JSON.parse(fs.readFileSync(cachedPath, 'utf8'));
          this.addToManifestImmediate(cachedData, isHomepage, isTutorialHome, filename);
          
          // Update stats for unchanged files
          if (!isHomepage && cachedData.content) {
            this.stats.totalPages += cachedData.content.length;
          }
        }
        
      } catch (error) {
        console.log(`   ⚠️  Could not read cached file for ${filename}: ${error.message}`);
      }
    }
  }
}

// Run optimization
if (require.main === module) {
  const optimizer = new StaticBuildOptimizer();
  optimizer.optimize().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = StaticBuildOptimizer;