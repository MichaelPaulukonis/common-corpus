'use strict';

/**
 * Lambda-optimized version of Common Corpus
 * 
 * Key differences from standard version:
 * - No zip file extraction (uses pre-extracted texts)
 * - Memory-efficient caching
 * - Lambda layer path support
 * - Reduced cold start time
 */

let Corpora = function(options = {}) {
  if(!(this instanceof Corpora)) {
    return new Corpora(options);
  }

  // Configuration
  const config = {
    maxCacheSize: options.maxCacheSize || 10,
    isLambda: !!process.env.AWS_LAMBDA_FUNCTION_NAME,
    ...options
  };

  // Path resolution for Lambda layer vs local development
  const getCorpusPath = () => {
    if (config.isLambda) {
      // Lambda layer path
      return '/opt/nodejs/node_modules/common-corpus/corpus-extracted';
    } else if (process.env.CORPUS_PATH) {
      // Custom path via environment variable
      return process.env.CORPUS_PATH;
    } else {
      // Default local development path
      return require('path').join(__dirname, './corpus');
    }
  };

  // Recursive directory walker (optimized for Lambda)
  let walkSync = function(dir, filelist) {
    const fs = require('fs');
    const path = require('path');

    if (dir[dir.length-1] !== '/') { 
      dir = dir.concat('/'); 
    }

    try {
      var files = fs.readdirSync(dir);
      filelist = filelist || [];
      
      // Skip system directories
      if (dir.indexOf('###') === -1) {
        files.forEach(function(file) {
          const fullPath = dir + file;
          try {
            if (fs.statSync(fullPath).isDirectory()) {
              filelist = walkSync(fullPath + '/', filelist);
            } else {
              // In Lambda, skip zip files (should be pre-extracted)
              if (config.isLambda && file.match(/\.(zip|7z)$/)) {
                return;
              }
              filelist.push(fullPath);
            }
          } catch (error) {
            console.warn(`Skipping file ${fullPath}: ${error.message}`);
          }
        });
      }
    } catch (error) {
      console.warn(`Cannot read directory ${dir}: ${error.message}`);
    }
    
    return filelist;
  };

  // Initialize paths and modules
  let fs = require('fs'),
      path = require('path'),
      debreak = require('./lib/debreak'),
      textutil = require('./lib/textutil'),
      root = getCorpusPath(),
      books = walkSync(root),
      texts = [],
      textCache = new Map(); // Memory cache for Lambda

  // Lambda-optimized text reading (no zip extraction)
  let gettext = function(filename) {
    try {
      let text = fs.readFileSync(filename);
      let iconv = require('iconv-lite');
      let book = iconv.decode(Buffer.from(text), 'ISO8859-1');
      
      // Remove BOM if present
      if (book.charCodeAt(0) === 0xFEFF) {
        book = book.slice(1);
      }
      
      return debreak(book);
    } catch (error) {
      console.error(`Error reading file ${filename}:`, error.message);
      throw new Error(`Failed to read text file: ${path.basename(filename)}`);
    }
  };

  // Memory-efficient cached text getter
  let getCachedText = function(filename) {
    const cacheKey = path.basename(filename);
    
    if (textCache.has(cacheKey)) {
      return textCache.get(cacheKey);
    }

    const text = gettext(filename);
    
    // Implement LRU cache
    if (textCache.size >= config.maxCacheSize) {
      const firstKey = textCache.keys().next().value;
      textCache.delete(firstKey);
    }
    
    textCache.set(cacheKey, text);
    return text;
  };

  // Clean filename for display
  let cleanName = (name) => name.replace(/\.(txt|js|zip|7z)$/g, '')
    .replace(root, '')
    .replace(/^[\/\\]/, '');

  // Build text collection
  for(let i = 0, len = books.length; i < len; i++) {
    let filename = books[i];
    
    try {
      if (filename.indexOf('sentences') > -1) {
        // Pre-processed sentence files
        texts.push({
          name: cleanName(filename),
          text: () => {
            try {
              return require(filename).join('\n');
            } catch (error) {
              console.error(`Error loading sentences from ${filename}:`, error.message);
              return '';
            }
          },
          sentences: () => {
            try {
              return require(filename);
            } catch (error) {
              console.error(`Error loading sentences from ${filename}:`, error.message);
              return [];
            }
          }
        });
      } else {
        // Regular text files
        texts.push({
          name: cleanName(filename),
          text: () => getCachedText(filename),
          sentences: () => {
            try {
              return textutil.sentencify(getCachedText(filename));
            } catch (error) {
              console.error(`Error processing sentences for ${filename}:`, error.message);
              return [];
            }
          }
        });
      }
    } catch (error) {
      console.warn(`Skipping problematic file ${filename}:`, error.message);
    }
  }

  // Public API
  this.texts = texts;
  this.config = config;

  // Enhanced filter with error handling
  this.filter = function(filter) {
    try {
      let r = new RegExp(filter, 'i');
      return texts.filter(m => {
        try {
          return m.name.match(r) !== null;
        } catch (error) {
          console.warn(`Filter error for text ${m.name}:`, error.message);
          return false;
        }
      });
    } catch (error) {
      console.error(`Invalid filter pattern "${filter}":`, error.message);
      return [];
    }
  };

  // Utility methods
  this.readFile = gettext;
  this.cleanName = cleanName;
  
  // Lambda-specific methods
  this.getCacheStats = function() {
    return {
      cacheSize: textCache.size,
      maxCacheSize: config.maxCacheSize,
      cachedTexts: Array.from(textCache.keys())
    };
  };

  this.clearCache = function() {
    textCache.clear();
  };

  this.getConfig = function() {
    return { ...config };
  };

  // Health check for Lambda
  this.healthCheck = function() {
    return {
      status: 'ok',
      textsLoaded: texts.length,
      cacheSize: textCache.size,
      isLambda: config.isLambda,
      corpusPath: root,
      timestamp: new Date().toISOString()
    };
  };
};

module.exports = Corpora;