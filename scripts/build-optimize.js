#!/usr/bin/env node

/**
 * Fixed Static Build Optimization Script with Homepage Support (Pipe Separator)
 * Corrected order of operations for manifest generation
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
   * Save manifest
   */
  saveManifest() {
    try {
      fs.writeFileSync(MANIFEST_FILE, JSON.stringify(this.manifest, null, 2));
      console.log('   ✅ Manifest saved to .next-cache/manifest.json');
    } catch (error) {
      console.error('   ❌ Failed to save manifest:', error.message);
      throw error;
    }
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
      
      this.copyUnchangedFiles(unchangedFiles);
      this.updateManifest(allFiles);
      this.saveManifest();
      this.saveFileHashes();
      await this.generateSEOFiles();
      await this.generateStaticAPI();
      
      this.showOptimizedStats();
      
      console.log('✅ Static build optimization completed!');
      console.log('📦 Ready for Vercel deployment with static files');
    } catch (error) {
      console.error('❌ Build optimization failed:', error);
      process.exit(1);
    }
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
   * Transform optimized homepage Excel data (pipe-separated format)
   */
  transformHomepageData(excelData, subjectName) {
    if (!excelData || excelData.length === 0) {
      throw new Error('No homepage data found');
    }

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
      
      // Parse pipe-separated tutorial titles and URLs
      const tutorialTitles = this.parsePipeSeparatedField(row.tutorialTitles);
      const tutorialUrls = this.parsePipeSeparatedField(row.tutorialUrls);
      
      // Validate that titles and URLs arrays have same length
      if (tutorialTitles.length !== tutorialUrls.length) {
        console.warn(`Row ${index + 1}: Mismatch between tutorial titles (${tutorialTitles.length}) and URLs (${tutorialUrls.length})`);
        const minLength = Math.min(tutorialTitles.length, tutorialUrls.length);
        tutorialTitles.splice(minLength);
        tutorialUrls.splice(minLength);
      }
      
      // Create tutorials array
      const tutorials = [];
      for (let i = 0; i < tutorialTitles.length; i++) {
        if (tutorialTitles[i] && tutorialUrls[i]) {
          tutorials.push({
            title: tutorialTitles[i],
            url: tutorialUrls[i]
          });
        }
      }
      
      // Only add section if it has tutorials
      if (tutorials.length > 0) {
        sections.push({
          name: sectionName,
          description: sectionDesc,
          tutorials: tutorials
        });
      }
    });

    return {
      id: `${subjectName}_home`,
      type: 'homepage',
      subjectId: subjectName,
      title: title,
      shortDesc: shortDesc,
      sections: sections,
      keywords: keywords,
      titleTag: titleTag,
      descriptionTag: descriptionTag,
      totalSections: sections.length,
      totalTutorials: sections.reduce((total, section) => total + section.tutorials.length, 0),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Parse pipe-separated field with proper trimming and validation
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
   * Copy unchanged files from previous build cache
   */
  copyUnchangedFiles(unchangedFiles) {
    this.stats.filesSkipped = unchangedFiles.length;
    
    if (unchangedFiles.length > 0) {
      console.log(`📋 Copying ${unchangedFiles.length} unchanged files from cache...`);
      
      for (const filename of unchangedFiles) {
        const isHomepage = filename.includes('_home.');
        const subjectName = isHomepage 
          ? path.basename(filename, '.xlsx').replace('_home', '').toLowerCase()
          : path.basename(filename, '.xlsx').toLowerCase();
        
        const cachedFilename = isHomepage ? `${subjectName}_home.json` : `${subjectName}.json`;
        const cachedPath = path.join(CACHE_DIR, cachedFilename);
        
        if (fs.existsSync(cachedPath)) {
          try {
            const cachedData = JSON.parse(fs.readFileSync(cachedPath, 'utf8'));
            if (cachedData) {
              if (isHomepage && cachedData.sections) {
                this.stats.totalPages += cachedData.sections.length;
              } else if (cachedData.content && Array.isArray(cachedData.content)) {
                this.stats.totalPages += cachedData.content.length;
              }
              this.stats.totalSize += fs.statSync(cachedPath).size;
            }
          } catch (error) {
            console.log(`   ⚠️  Warning: Could not read cached file ${cachedPath}: ${error.message}`);
          }
        }
      }
    }
  }

  /**
   * Update manifest with current data (updated for homepage support)
   */
  updateManifest(allFiles) {
    console.log('\n📋 Updating manifest...');
    
    this.manifest.subjects = [];
    this.manifest.homepages = [];
    this.manifest.totalFiles = allFiles.length;
    this.manifest.totalPages = 0;
    this.manifest.lastUpdated = new Date().toISOString();
    this.manifest.buildId = this.generateBuildId();
    
    const cacheFiles = fs.readdirSync(CACHE_DIR)
      .filter(file => file.endsWith('.json') && 
                     file !== 'file-hashes.json' && 
                     file !== 'manifest.json');
    
    let totalPagesCount = 0;
    
    for (const filename of cacheFiles) {
      try {
        const filePath = path.join(CACHE_DIR, filename);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        if (data && data.type === 'homepage') {
          const homepageInfo = {
            id: data.id,
            subjectId: data.subjectId,
            title: data.title,
            shortDesc: data.shortDesc,
            totalSections: data.totalSections,
            totalTutorials: data.totalTutorials,
            lastModified: data.lastUpdated,
            keywords: data.keywords,
            titleTag: data.titleTag,
            descriptionTag: data.descriptionTag
          };
          
          this.manifest.homepages.push(homepageInfo);
          console.log(`   ✅ Added homepage ${data.subjectId}: ${data.totalSections} sections, ${data.totalTutorials} tutorials`);
          
        } else if (data && data.content && Array.isArray(data.content)) {
          const subjectInfo = {
            id: data.id,
            name: data.name,
            base_url: data.base_url,
            totalPages: data.content.length,
            totalSections: data.totalSections || 1,
            sections: data.sections || ['General'],
            lastModified: data.lastUpdated || new Date().toISOString(),
            keywords: data.keywords || '',
            titleTag: data.titleTag || `${data.name} Tutorial`,
            descriptionTag: data.descriptionTag || `Learn ${data.name} programming.`
          };
          
          this.manifest.subjects.push(subjectInfo);
          totalPagesCount += subjectInfo.totalPages;
          
          console.log(`   ✅ Added ${data.name}: ${subjectInfo.totalPages} pages, ${subjectInfo.totalSections} sections`);
        }
      } catch (error) {
        console.warn(`   ⚠️  Could not read ${filename} for manifest: ${error.message}`);
      }
    }
    
    this.manifest.totalPages = totalPagesCount;
    this.manifest.buildStats = {
      filesProcessed: this.stats.filesProcessed,
      filesSkipped: this.stats.filesSkipped,
      totalSize: this.stats.totalSize,
      buildTime: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform
    };
    
    console.log(`   📊 Manifest updated: ${this.manifest.subjects.length} subjects, ${this.manifest.homepages.length} homepages, ${totalPagesCount} total pages`);
  }

  /**
   * Generate static API routes
   */
  async generateStaticAPI() {
    console.log('\n🔧 Generating static API routes...');
    
    const apiDir = path.join(PUBLIC_DIR, 'api');
    const dataApiDir = path.join(apiDir, 'data');
    
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true });
    }
    if (!fs.existsSync(dataApiDir)) {
      fs.mkdirSync(dataApiDir, { recursive: true });
    }
    
    if (fs.existsSync(MANIFEST_FILE)) {
      fs.copyFileSync(MANIFEST_FILE, path.join(apiDir, 'manifest.json'));
      console.log('   ✅ Copied manifest.json to API route');
    }
    
    const subjectList = this.manifest.subjects.map(s => ({
      id: s.id,
      name: s.name,
      base_url: s.base_url,
      totalPages: s.totalPages,
      totalSections: s.totalSections,
      sections: s.sections
    }));
    
    fs.writeFileSync(
      path.join(apiDir, 'subjects.json'),
      JSON.stringify(subjectList, null, 2)
    );
    console.log('   ✅ Generated subjects.json API route');
    
    const cacheFiles = fs.readdirSync(CACHE_DIR)
      .filter(file => file.endsWith('.json') && 
                     file !== 'file-hashes.json' && 
                     file !== 'manifest.json');
    
    let copiedCount = 0;
    for (const filename of cacheFiles) {
      try {
        fs.copyFileSync(
          path.join(CACHE_DIR, filename),
          path.join(dataApiDir, filename)
        );
        copiedCount++;
      } catch (error) {
        console.warn(`   ⚠️  Failed to copy ${filename}: ${error.message}`);
      }
    }
    
    console.log(`   ✅ Generated ${copiedCount} data API routes`);
  }

  /**
   * Generate SEO files (sitemap, robots.txt)
   */
  async generateSEOFiles() {
    console.log('\n🗺️  Generating SEO files...');
    
    const sitemapEntries = [{
      url: 'https://www.droidbiz.in',
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: '1.0'
    }];

    const cacheFiles = fs.readdirSync(CACHE_DIR)
      .filter(file => file.endsWith('.json') && 
                     file !== 'file-hashes.json' && 
                     file !== 'manifest.json');

    for (const filename of cacheFiles) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, filename), 'utf8'));
        
        if (!data || data.type === 'homepage') continue;
        
        if (data.content && Array.isArray(data.content)) {
          for (const item of data.content) {
            if (!item || !item.url) continue;

            const url = data.id === 'blogs' 
              ? `https://www.droidbiz.in/blogs/${item.url}`
              : `https://www.droidbiz.in/${data.id}/${item.url}`;
            
            sitemapEntries.push({
              url: url,
              lastmod: item.lastModified || new Date().toISOString(),
              changefreq: 'weekly',
              priority: '0.8'
            });
          }
        }
      } catch (error) {
        console.log(`   ❌ Error processing ${filename} for SEO: ${error.message}`);
        continue;
      }
    }

    const sitemapXML = this.generateSitemapXML(sitemapEntries);
    fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapXML);
    
    const robotsTxt = `User-agent: *\nAllow: /\nSitemap: https://www.droidbiz.in/sitemap.xml\n`;
    fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), robotsTxt);
    
    console.log(`   ✅ Generated sitemap with ${sitemapEntries.length} URLs`);
  }

  /**
   * Generate sitemap XML
   */
  generateSitemapXML(entries) {
    const urls = entries.map(entry => `
  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
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
   * Capitalize first letter of a string
   */
  capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Show optimized build statistics
   */
  showOptimizedStats() {
    const totalTime = ((Date.now() - this.stats.startTime) / 1000).toFixed(1);
    const totalSizeMB = (this.stats.totalSize / 1024 / 1024).toFixed(2);
    const avgTimePerFile = this.stats.filesProcessed > 0 
      ? (totalTime / this.stats.filesProcessed).toFixed(2) 
      : 0;
    
    console.log('\n📊 Build Statistics:');
    console.log(`   ⏱️  Total time: ${totalTime}s`);
    console.log(`   🔄 Files processed: ${this.stats.filesProcessed}`);
    console.log(`   ⏭️  Files skipped (cached): ${this.stats.filesSkipped}`);
    console.log(`   📄 Total pages: ${this.stats.totalPages}`);
    console.log(`   💾 Total size: ${totalSizeMB} MB`);
    console.log(`   ⚡ Avg time per file: ${avgTimePerFile}s`);
    console.log(`   🖥️  Parallel workers: ${this.stats.parallelWorkers}`);
    console.log(`   ❌ Errors: ${this.stats.errors}`);
    
    const pagesPerSecond = totalTime > 0 ? (this.stats.totalPages / totalTime).toFixed(1) : 0;
    console.log(`   🚀 Pages generated per second: ${pagesPerSecond}`);
    
    if (this.stats.filesSkipped > 0) {
      const timesSaved = (this.stats.filesSkipped * avgTimePerFile).toFixed(1);
      console.log(`   💰 Time saved by caching: ${timesSaved}s`);
    }
  }
}

// Run optimization
if (require.main === module) {
  const optimizer = new StaticBuildOptimizer();
  optimizer.optimize();
}

module.exports = StaticBuildOptimizer;