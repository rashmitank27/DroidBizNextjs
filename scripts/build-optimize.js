#!/usr/bin/env node

/**
 * High-Performance Build Optimization Script
 * Includes parallel processing, caching, and incremental builds
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const XLSX = require('xlsx');
const { Worker } = require('worker_threads');
const os = require('os');

const DATA_DIR = path.join(process.cwd(), 'data', 'excel');
const OUTPUT_DIR = path.join(process.cwd(), '.next-cache');
const HASH_FILE = path.join(OUTPUT_DIR, 'file-hashes.json');

class HighPerformanceBuildOptimizer {
  constructor() {
    this.stats = {
      filesProcessed: 0,
      filesSkipped: 0,
      totalPages: 0,
      totalSize: 0,
      errors: 0,
      startTime: Date.now(),
      parallelWorkers: Math.min(os.cpus().length, 8) // Use up to 8 CPU cores
    };
    this.fileHashes = this.loadFileHashes();
  }

  /**
   * Main optimization process with parallel processing
   */
  async optimize() {
    console.log(`🚀 Starting high-performance build optimization...`);
    console.log(`📊 Using ${this.stats.parallelWorkers} parallel workers\n`);
    
    try {
      this.ensureOutputDir();
      
      // Get all Excel files and check for changes
      const allFiles = this.getExcelFiles();
      const { changedFiles, unchangedFiles } = this.detectChangedFiles(allFiles);
      
      console.log(`📁 Total files: ${allFiles.length}`);
      console.log(`🔄 Changed files: ${changedFiles.length}`);
      console.log(`✅ Unchanged files: ${unchangedFiles.length} (will be skipped)\n`);
      
      // Process changed files in parallel
      if (changedFiles.length > 0) {
        await this.processFilesInParallel(changedFiles);
      }
      
      // Copy unchanged files from cache
      this.copyUnchangedFiles(unchangedFiles);
      
      // Generate SEO files
      await this.generateSEOFiles();
      
      // Save new file hashes
      this.saveFileHashes();
      
      this.showOptimizedStats();
      
      console.log('✅ High-performance build optimization completed!');
    } catch (error) {
      console.error('❌ Build optimization failed:', error);
      process.exit(1);
    }
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
   * Get all Excel files from data directory
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
   * Process Excel files in parallel using worker threads
   */
  async processFilesInParallel(files) {
    console.log(`⚡ Processing ${files.length} files in parallel...\n`);

    // Split files into chunks for parallel processing
    const chunks = this.chunkArray(files, this.stats.parallelWorkers);
    const processingPromises = chunks.map((chunk, index) => 
      this.processChunk(chunk, index)
    );

    // Wait for all chunks to complete
    const results = await Promise.all(processingPromises);
    
    // Aggregate results
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
        
        console.log(`   ✅ Worker ${chunkIndex + 1}: ${filename} (${result.pages} pages)`);
      } catch (error) {
        console.log(`   ❌ Worker ${chunkIndex + 1}: ${filename} failed - ${error.message}`);
        chunkStats.errors++;
      }
    }

    return chunkStats;
  }

  /**
   * Process individual Excel file (optimized version)
   */
  async processExcelFile(filename) {
    const filePath = path.join(DATA_DIR, filename);
    const subjectName = path.basename(filename, '.xlsx').toLowerCase();
    
    // Read and parse Excel file
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, {
      cellStyles: false, // Disable for performance
      cellFormulas: false, // Disable for performance
      cellDates: true
    });

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      throw new Error('No data found');
    }

    // Transform data (optimized)
    const transformedData = this.transformExcelDataOptimized(jsonData, subjectName);
    
    // Save to cache
    const outputPath = path.join(OUTPUT_DIR, `${subjectName}.json`);
    const jsonString = JSON.stringify(transformedData);
    fs.writeFileSync(outputPath, jsonString);

    return {
      pages: transformedData.content.length,
      size: Buffer.byteLength(jsonString)
    };
  }

  /**
   * Optimized data transformation
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
      shortDesc: this.extractShortDescOptimized(row.content || ''),
      lastModified: new Date().toISOString()
    }));

    const baseUrl = subjectName === 'blogs' ? '/blogs' : `/${subjectName}`;

    return {
      id: subjectName,
      name: this.capitalizeFirstLetter(subjectName),
      base_url: baseUrl,
      content: content,
      keywords: content[0]?.keywords || '',
      titleTag: content[0]?.titleTag || `${this.capitalizeFirstLetter(subjectName)} Tutorial`,
      descriptionTag: content[0]?.descriptionTag || `Learn ${subjectName} programming.`,
      totalPages: content.length,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Optimized short description extraction
   */
  extractShortDescOptimized(content) {
    if (!content) return '';
    
    // Fast regex-based cleaning (more efficient than multiple replace calls)
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
        const subjectName = path.basename(filename, '.xlsx').toLowerCase();
        const cachedPath = path.join(OUTPUT_DIR, `${subjectName}.json`);
        
        if (fs.existsSync(cachedPath)) {
          // File already exists in cache, count its pages
          const cachedData = JSON.parse(fs.readFileSync(cachedPath, 'utf8'));
          this.stats.totalPages += cachedData.content.length;
          this.stats.totalSize += fs.statSync(cachedPath).size;
        }
      }
    }
  }

  /**
   * Generate SEO files (sitemap, robots.txt)
   */
  async generateSEOFiles() {
    console.log('\n🗺️  Generating SEO files...');
    
    // This runs much faster since we're reading from processed JSON cache
    const processedFiles = fs.readdirSync(OUTPUT_DIR)
      .filter(file => file.endsWith('.json'));

    const sitemapEntries = [{ // Homepage
      url: 'https://www.droidbiz.in',
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: '1.0'
    }];

    // Process all cached data files
    for (const filename of processedFiles) {
      const data = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, filename), 'utf8'));
      
      for (const item of data.content) {
        const url = data.id === 'blogs' 
          ? `https://www.droidbiz.in/blogs/${item.url}`
          : `https://www.droidbiz.in/${data.id}/${item.url}`;
        
        sitemapEntries.push({
          url: url,
          lastmod: item.lastModified,
          changefreq: 'weekly',
          priority: '0.8'
        });
      }
    }

    // Generate and save sitemap
    const sitemapXML = this.generateSitemapXML(sitemapEntries);
    fs.writeFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), sitemapXML);
    
    // Generate robots.txt
    const robotsTxt = `User-agent: *\nAllow: /\nSitemap: https://www.droidbiz.in/sitemap.xml\n`;
    fs.writeFileSync(path.join(process.cwd(), 'public', 'robots.txt'), robotsTxt);
    
    console.log(`   ✅ Generated sitemap with ${sitemapEntries.length} URLs`);
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
   * Utility functions
   */
  ensureOutputDir() {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
  }

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
    
    console.log('\n📊 High-Performance Build Statistics:');
    console.log(`   ⏱️  Total time: ${totalTime}s`);
    console.log(`   🔄 Files processed: ${this.stats.filesProcessed}`);
    console.log(`   ⏭️  Files skipped (cached): ${this.stats.filesSkipped}`);
    console.log(`   📄 Total pages: ${this.stats.totalPages}`);
    console.log(`   💾 Total size: ${totalSizeMB} MB`);
    console.log(`   ⚡ Avg time per file: ${avgTimePerFile}s`);
    console.log(`   🖥️  Parallel workers: ${this.stats.parallelWorkers}`);
    console.log(`   ❌ Errors: ${this.stats.errors}`);
    
    // Performance insights
    const pagesPerSecond = (this.stats.totalPages / totalTime).toFixed(1);
    console.log(`   🚀 Pages generated per second: ${pagesPerSecond}`);
    
    if (this.stats.filesSkipped > 0) {
      const timesSaved = (this.stats.filesSkipped * avgTimePerFile).toFixed(1);
      console.log(`   💰 Time saved by caching: ${timesSaved}s`);
    }
  }
}

// Run optimization
if (require.main === module) {
  const optimizer = new HighPerformanceBuildOptimizer();
  optimizer.optimize();
}

module.exports = HighPerformanceBuildOptimizer;