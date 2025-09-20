# System Architecture

## Overview

The `common-corpus` library is designed as a lightweight Node.js module that provides programmatic access to a curated collection of texts for Natural Language Processing and Generation projects. The architecture prioritizes simplicity and ease of use over performance optimization.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Corpora API                                 │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────┐   │
│  │   Filter    │ │ Text Access  │ │   CLI Interface     │   │
│  │   System    │ │   Methods    │ │     (util.js)       │   │
│  └─────────────┘ └──────────────┘ └─────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Text Processing Layer                        │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────┐   │
│  │  Debreak    │ │   TextUtil   │ │  NLP Processing     │   │
│  │ (lib/debreak│ │(lib/textutil)│ │ (nlp_compromise)    │   │
│  │    .js)     │ │     .js)     │ │                     │   │
│  └─────────────┘ └──────────────┘ └─────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                File System Layer                            │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────┐   │
│  │   Corpus    │ │ Zip Handler  │ │  Encoding Convert   │   │
│  │ Directory   │ │(node-zipkit) │ │   (iconv-lite)      │   │
│  │   Scanner   │ │              │ │                     │   │
│  └─────────────┘ └──────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Corpora Class (`index.js`)

**Responsibility**: Main API interface and corpus management

**Key Functions**:
- Recursive directory scanning of corpus files
- Lazy loading of text content
- Regex-based filtering system
- File format detection and handling

**Design Patterns**:
- **Factory Pattern**: Constructor can be called with or without `new`
- **Lazy Loading**: Text content loaded only when accessed
- **Strategy Pattern**: Different handling for regular texts vs. sentence files

```javascript
// Simplified architecture
class Corpora {
  constructor() {
    this.texts = this.scanCorpus();
  }
  
  scanCorpus() {
    // Recursive file discovery
    // Format detection (txt, zip, js)
    // Metadata extraction
  }
  
  filter(pattern) {
    // Regex-based filtering
  }
}
```

### 2. Text Processing Layer

#### Debreak Module (`lib/debreak.js`)
**Purpose**: Reconstructs paragraphs from line-wrapped text files

**Algorithm**:
1. Split text into lines
2. Identify paragraph boundaries (empty lines)
3. Join lines within paragraphs, handling hyphenation
4. Return reconstructed paragraphs

#### TextUtil Module (`lib/textutil.js`)
**Purpose**: Text analysis and processing utilities

**Features**:
- Word frequency analysis
- Text cleaning and normalization
- Sentence extraction using NLP
- Word tokenization

### 3. File System Layer

#### Directory Scanner
**Responsibility**: Discover and catalog corpus files

**Process**:
1. Recursive traversal of `/corpus` directory
2. File type detection (`.txt`, `.zip`, `.js`)
3. Path normalization and cleaning
4. Exclusion of system directories (marked with `###`)

#### Format Handlers

**Text Files (`.txt`)**:
- Encoding conversion (ISO8859-1 → UTF-8)
- BOM removal
- Debreak processing

**Zip Files (`.zip`, `.7z`)**:
- Automatic extraction to `unzip-temp/`
- Cached extraction (don't re-extract existing files)
- Path mapping from archive to filesystem

**Sentence Files (`.js`)**:
- Direct require() of JavaScript arrays
- Special handling for pre-processed sentence collections

## Data Flow

### Text Access Flow

```
User Request
     │
     ▼
Filter/Search ──────┐
     │              │
     ▼              ▼
Text Object ──► File Path
     │              │
     ▼              ▼
text() method ──► File Reader
     │              │
     ▼              ▼
Encoding ──────► Debreak
Conversion         │
     │              ▼
     └──────► Text Content
```

### Sentence Processing Flow

```
Text Content
     │
     ▼
NLP Processing
(nlp_compromise)
     │
     ▼
Sentence Array
```

## Storage Architecture

### Corpus Organization

```
corpus/
├── [category]/          # Organized by genre/type
│   ├── text1.txt       # Individual text files
│   ├── text2.zip       # Compressed texts
│   └── ...
├── sentences/          # Pre-processed sentences
│   ├── dataset1.js     # JavaScript arrays
│   └── ...
└── individual_texts.txt # Root-level texts
```

### Temporary Storage

```
unzip-temp/             # Temporary extraction directory
├── [category]/         # Mirrors corpus structure
│   ├── extracted1.txt  # Extracted from zip files
│   └── ...
└── ...
```

## Memory Management

### Current Approach
- **Lazy Loading**: Text content loaded on-demand
- **No Caching**: Each access re-reads and re-processes files
- **Full Memory Loading**: Entire text loaded into memory

### Memory Usage Patterns
```
Startup: ~10MB (metadata only)
Per Text Access: +[text size] (no deallocation)
Peak Usage: Potentially 100MB+ with multiple large texts
```

## Performance Characteristics

### Time Complexity
- **Corpus Scanning**: O(n) where n = number of files
- **Text Filtering**: O(m) where m = number of texts
- **Text Loading**: O(k) where k = file size
- **Sentence Processing**: O(k × s) where s = NLP complexity

### Bottlenecks
1. **Synchronous I/O**: Blocks event loop during file operations
2. **NLP Processing**: 8-10 seconds for large texts
3. **No Caching**: Repeated processing of same texts
4. **Memory Usage**: No garbage collection of loaded texts

## Security Considerations

### Current Vulnerabilities
1. **Zip Bomb**: No size limits on zip extraction
2. **Path Traversal**: No validation of zip entry paths
3. **Regex DoS**: User-provided regex patterns not validated
4. **File System Access**: No sandboxing of file operations

### Mitigation Strategies (Recommended)
```javascript
// Path validation for zip extraction
function validatePath(entryPath) {
  const normalized = path.normalize(entryPath);
  return !normalized.includes('..') && !path.isAbsolute(normalized);
}

// Regex timeout protection
function safeRegex(pattern, timeout = 1000) {
  // Implementation with timeout mechanism
}
```

## Scalability Limitations

### Current Constraints
- **File-based storage**: No database indexing
- **Memory-bound**: All content loaded into RAM
- **Single-threaded**: No parallel processing
- **No streaming**: Large texts must be fully loaded

### Scaling Bottlenecks
- Corpus size limited by available memory
- Processing time increases linearly with corpus size
- No horizontal scaling capabilities
- No caching layer for frequently accessed texts

## Integration Points

### External Dependencies
```javascript
{
  "nlp_compromise": "6.5.3",    // NLP processing (deprecated)
  "iconv-lite": "0.4.15",       // Character encoding
  "node-zipkit": "0.1.2",       // Zip file handling
  "mkdirp": "0.5.1",           // Directory creation
  "rimraf": "2.6.1"            // Directory removal
}
```

### API Boundaries
- **Input**: File paths, regex patterns, text names
- **Output**: Text strings, sentence arrays, metadata objects
- **Side Effects**: Temporary file creation, directory scanning

## Future Architecture Considerations

### Recommended Improvements

1. **Async/Await Migration**
```javascript
async getText(name) {
  const file = await this.findFile(name);
  const content = await this.readFile(file);
  return this.processText(content);
}
```

2. **Caching Layer**
```javascript
class TextCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  get(key) { /* LRU implementation */ }
  set(key, value) { /* Cache with eviction */ }
}
```

3. **Streaming Support**
```javascript
createTextStream(name) {
  return fs.createReadStream(this.getPath(name))
    .pipe(new EncodingTransform())
    .pipe(new DebreakTransform());
}
```

4. **Database Integration**
```javascript
// Metadata storage for fast searching
{
  id: "neuromancer",
  title: "Neuromancer",
  author: "William Gibson",
  category: "cyberpunk",
  wordCount: 67000,
  path: "/corpus/cyberpunk/william.gibson.neuromancer.txt"
}
```

## Monitoring and Observability

### Current State
- No logging or monitoring
- No performance metrics
- No error tracking
- No usage analytics

### Recommended Additions
- Performance timing for text processing
- Memory usage monitoring
- Error logging and reporting
- Usage pattern analytics