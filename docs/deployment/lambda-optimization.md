# Lambda Optimization Guide

## Current Implementation Issues

The existing Common Corpus implementation has several problems for AWS Lambda deployment:

### Critical Issues
1. **File System Writes**: Attempts to write to read-only filesystem
2. **Cold Start Performance**: Zip extraction on every invocation
3. **Size Constraints**: Lambda layer 250MB limit vs 75MB corpus
4. **Memory Usage**: Simultaneous extraction and text processing

## Lambda-Optimized Solutions

### Solution 1: Pre-Extracted Lambda Layer

Create a Lambda layer with pre-extracted texts to avoid runtime extraction.

#### Build Process
```bash
#!/bin/bash
# scripts/build-lambda-layer.sh

# Create layer structure
mkdir -p lambda-layer/nodejs/node_modules/common-corpus

# Copy core files
cp index.js lambda-layer/nodejs/node_modules/common-corpus/
cp -r lib lambda-layer/nodejs/node_modules/common-corpus/
cp package.json lambda-layer/nodejs/node_modules/common-corpus/

# Extract all zipped texts
mkdir -p lambda-layer/nodejs/node_modules/common-corpus/corpus-extracted
cd corpus
find . -name "*.zip" -exec unzip -o {} -d ../lambda-layer/nodejs/node_modules/common-corpus/corpus-extracted/ \;
find . -name "*.7z" -exec 7z x {} -o../lambda-layer/nodejs/node_modules/common-corpus/corpus-extracted/ \;

# Copy non-zipped texts
find . -name "*.txt" -exec cp {} ../lambda-layer/nodejs/node_modules/common-corpus/corpus-extracted/ \;
find . -name "*.js" -exec cp {} ../lambda-layer/nodejs/node_modules/common-corpus/corpus-extracted/ \;

# Create layer zip
cd lambda-layer
zip -r ../common-corpus-layer.zip .
```

#### Modified Implementation
```javascript
// lambda-optimized-index.js
'use strict';

let Corpora = function() {
  if(!(this instanceof Corpora)) {
    return new Corpora();
  }

  let fs = require('fs'),
      path = require('path'),
      debreak = require('./lib/debreak'),
      textutil = require('./lib/textutil'),
      // Use pre-extracted corpus for Lambda
      root = process.env.AWS_LAMBDA_FUNCTION_NAME 
        ? path.join(__dirname, './corpus-extracted')
        : path.join(__dirname, './corpus'),
      books = walkSync(root),
      texts = [];

  // Lambda-optimized file reading (no zip extraction)
  let gettext = function(filename) {
    // Skip zip handling in Lambda environment
    if (process.env.AWS_LAMBDA_FUNCTION_NAME && filename.match(/\.(zip|7z)$/)) {
      // Convert zip filename to extracted filename
      filename = filename.replace(/\.(zip|7z)$/, '.txt');
      filename = filename.replace(path.join(__dirname, './corpus'), 
                                 path.join(__dirname, './corpus-extracted'));
    }
    
    let text = fs.readFileSync(filename),
        iconv = require('iconv-lite'),
        book = iconv.decode(Buffer.from(text), 'ISO8859-1');
    
    if (book.charCodeAt(0) === 0xFEFF) {
      book = book.slice(1);
    }
    return debreak(book);
  };

  // Rest of implementation...
};
```

### Solution 2: S3-Based Corpus

Store corpus in S3 and load on-demand to reduce layer size.

```javascript
// s3-corpus-implementation.js
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

class S3Corpora {
  constructor(bucketName = process.env.CORPUS_BUCKET) {
    this.bucket = bucketName;
    this.cache = new Map();
    this.metadata = null;
  }

  async initialize() {
    if (!this.metadata) {
      const params = {
        Bucket: this.bucket,
        Key: 'corpus-metadata.json'
      };
      
      const result = await s3.getObject(params).promise();
      this.metadata = JSON.parse(result.Body.toString());
    }
  }

  async getText(textName) {
    // Check cache first
    if (this.cache.has(textName)) {
      return this.cache.get(textName);
    }

    // Download from S3
    const params = {
      Bucket: this.bucket,
      Key: `texts/${textName}.txt`
    };

    try {
      const result = await s3.getObject(params).promise();
      const text = result.Body.toString('utf-8');
      
      // Cache for this invocation
      this.cache.set(textName, text);
      return text;
    } catch (error) {
      console.error(`Failed to load text ${textName}:`, error);
      throw error;
    }
  }

  filter(pattern) {
    if (!this.metadata) {
      throw new Error('Corpus not initialized. Call initialize() first.');
    }

    const regex = new RegExp(pattern, 'i');
    return this.metadata.texts.filter(text => regex.test(text.name));
  }
}

// Lambda handler example
exports.handler = async (event) => {
  const corpus = new S3Corpora();
  await corpus.initialize();
  
  const category = event.pathParameters?.category || '.*';
  const texts = corpus.filter(category);
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      category,
      count: texts.length,
      texts: texts.map(t => t.name)
    })
  };
};
```

### Solution 3: Hybrid Approach

Combine small layer with S3 for large texts.

```javascript
// hybrid-corpus.js
class HybridCorpora {
  constructor() {
    this.localCorpus = new LocalCorpora(); // Small texts in layer
    this.s3Corpus = new S3Corpora();       // Large texts in S3
    this.sizeThreshold = 1024 * 1024;      // 1MB threshold
  }

  async getText(textName) {
    const metadata = this.getMetadata(textName);
    
    if (metadata.size < this.sizeThreshold) {
      return this.localCorpus.getText(textName);
    } else {
      return await this.s3Corpus.getText(textName);
    }
  }
}
```

## Implementation Recommendations

### For Lambda Layer (Recommended)

```javascript
// lambda-layer-corpus.js
'use strict';

class LambdaCorpora {
  constructor() {
    this.isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
    this.corpusPath = this.isLambda 
      ? '/opt/nodejs/node_modules/common-corpus/corpus-extracted'
      : path.join(__dirname, './corpus');
    
    this.texts = this.scanCorpus();
  }

  scanCorpus() {
    const texts = [];
    const files = this.walkSync(this.corpusPath);
    
    files.forEach(filename => {
      // Only process .txt and .js files in Lambda (no zip extraction)
      if (this.isLambda && filename.match(/\.(zip|7z)$/)) {
        return; // Skip zip files in Lambda
      }
      
      const cleanName = this.cleanName(filename);
      
      if (filename.includes('sentences')) {
        texts.push({
          name: cleanName,
          text: () => require(filename).join('\n'),
          sentences: () => require(filename)
        });
      } else {
        texts.push({
          name: cleanName,
          text: () => this.gettext(filename),
          sentences: () => this.textutil.sentencify(this.gettext(filename))
        });
      }
    });
    
    return texts;
  }

  gettext(filename) {
    // Simplified for Lambda - no zip handling
    const fs = require('fs');
    const iconv = require('iconv-lite');
    
    const text = fs.readFileSync(filename);
    let book = iconv.decode(Buffer.from(text), 'ISO8859-1');
    
    if (book.charCodeAt(0) === 0xFEFF) {
      book = book.slice(1);
    }
    
    return this.debreak(book);
  }
}

module.exports = LambdaCorpora;
```

### Deployment Script

```bash
#!/bin/bash
# deploy-lambda-layer.sh

echo "Building Lambda layer for Common Corpus..."

# Clean previous builds
rm -rf lambda-layer common-corpus-layer.zip

# Create layer structure
mkdir -p lambda-layer/nodejs/node_modules/common-corpus

# Copy source files
cp lambda-layer-corpus.js lambda-layer/nodejs/node_modules/common-corpus/index.js
cp -r lib lambda-layer/nodejs/node_modules/common-corpus/
cp package.json lambda-layer/nodejs/node_modules/common-corpus/

# Extract and copy corpus (pre-extracted for Lambda)
echo "Extracting corpus texts..."
mkdir -p lambda-layer/nodejs/node_modules/common-corpus/corpus-extracted

# Process each category
for dir in corpus/*/; do
  if [ -d "$dir" ]; then
    category=$(basename "$dir")
    mkdir -p "lambda-layer/nodejs/node_modules/common-corpus/corpus-extracted/$category"
    
    # Extract zips in this category
    find "$dir" -name "*.zip" -exec unzip -o {} -d "lambda-layer/nodejs/node_modules/common-corpus/corpus-extracted/$category/" \;
    
    # Copy text files
    find "$dir" -name "*.txt" -exec cp {} "lambda-layer/nodejs/node_modules/common-corpus/corpus-extracted/$category/" \;
    find "$dir" -name "*.js" -exec cp {} "lambda-layer/nodejs/node_modules/common-corpus/corpus-extracted/$category/" \;
  fi
done

# Copy root level texts
find corpus -maxdepth 1 -name "*.txt" -exec cp {} lambda-layer/nodejs/node_modules/common-corpus/corpus-extracted/ \;

# Install dependencies in layer
cd lambda-layer/nodejs/node_modules/common-corpus
npm install --production --no-optional
cd ../../../../

# Create layer zip
cd lambda-layer
zip -r ../common-corpus-layer.zip . -x "*.DS_Store*" "*/test/*" "*/tests/*"
cd ..

# Check size
SIZE=$(du -h common-corpus-layer.zip | cut -f1)
echo "Layer size: $SIZE"

if [ $(stat -f%z common-corpus-layer.zip 2>/dev/null || stat -c%s common-corpus-layer.zip) -gt 262144000 ]; then
  echo "WARNING: Layer exceeds 250MB limit!"
  exit 1
fi

echo "Lambda layer ready: common-corpus-layer.zip"

# Deploy to AWS (optional)
if [ "$1" = "deploy" ]; then
  aws lambda publish-layer-version \
    --layer-name common-corpus \
    --description "Common Corpus text collection for NLP/NLG" \
    --zip-file fileb://common-corpus-layer.zip \
    --compatible-runtimes nodejs14.x nodejs16.x nodejs18.x
fi
```

### Lambda Function Example

```javascript
// lambda-function.js
const Corpora = require('/opt/nodejs/node_modules/common-corpus');

exports.handler = async (event) => {
  try {
    const corpus = new Corpora();
    
    const category = event.pathParameters?.category;
    const textName = event.pathParameters?.text;
    
    if (textName) {
      // Get specific text
      const matches = corpus.filter(textName);
      if (matches.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Text not found' })
        };
      }
      
      const text = matches[0];
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: text.name,
          content: text.text(),
          sentenceCount: text.sentences().length
        })
      };
    } else {
      // List texts by category
      const texts = category ? corpus.filter(category) : corpus.texts;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: category || 'all',
          count: texts.length,
          texts: texts.map(t => ({ name: t.name }))
        })
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
```

## Performance Considerations

### Cold Start Optimization
- Pre-extract all texts in build process
- Minimize layer size by removing unnecessary files
- Use lazy loading for text content
- Cache frequently accessed texts in memory

### Memory Management
```javascript
// Memory-efficient text access
class MemoryEfficientCorpora extends Corpora {
  constructor(maxCacheSize = 10) {
    super();
    this.textCache = new Map();
    this.maxCacheSize = maxCacheSize;
  }

  getText(name) {
    if (this.textCache.has(name)) {
      return this.textCache.get(name);
    }

    const text = super.getText(name);
    
    // Implement LRU cache
    if (this.textCache.size >= this.maxCacheSize) {
      const firstKey = this.textCache.keys().next().value;
      this.textCache.delete(firstKey);
    }
    
    this.textCache.set(name, text);
    return text;
  }
}
```

### Size Optimization
```bash
# Remove unnecessary files from layer
find lambda-layer -name "*.md" -delete
find lambda-layer -name "test*" -type d -exec rm -rf {} +
find lambda-layer -name "*.test.js" -delete
find lambda-layer -name "node_modules/.cache" -type d -exec rm -rf {} +
```

## Recommended Approach

For your Lambda deployment, I recommend **Solution 1 (Pre-Extracted Layer)** because:

1. **Predictable Performance**: No runtime extraction delays
2. **Simpler Implementation**: Minimal code changes required
3. **Better Caching**: Lambda container reuse benefits
4. **Size Control**: Can optimize which texts to include

The key changes needed:
1. Pre-extract all zipped texts during build
2. Modify the corpus scanning to skip zip files in Lambda
3. Use `/opt/nodejs/node_modules/common-corpus` path for layer
4. Implement memory-efficient caching for frequently accessed texts

Would you like me to create the complete Lambda-optimized implementation files?