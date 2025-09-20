# Common Corpus - Repository Analysis & Documentation Snapshot

## 1. Project Overview

**Project Name**: common-corpus  
**Purpose**: A curated collection of common texts used in Natural Language Generation (NLG) and Natural Language Processing (NLP) projects  
**Technology Stack**: Node.js, JavaScript (ES6), Mocha/Chai testing, Gulp build system  
**Project Type**: NPM library/module for text corpus access  
**Target Audience**: NLP/NLG developers, researchers, and data scientists working with text processing  
**Current Status**: Early development (v0.1.0), functional but needs modernization

## 2. Architecture Summary

**Overall Architecture**: Simple Node.js library with file-based text corpus management
- **Core Module**: `index.js` - Main Corpora class that provides text access and filtering
- **Utilities**: Text processing utilities in `/lib` for debreaking and text analysis
- **CLI Interface**: `util.js` provides command-line access to corpus functionality
- **Text Storage**: File-based corpus in `/corpus` directory with categorized text collections

**Key Components**:
- **Corpora Class**: Main API for accessing texts, filtering, and text processing
- **Text Utilities**: Word frequency analysis, sentence extraction, text cleaning
- **File Management**: Automatic zip file handling and text encoding conversion
- **CLI Tool**: Command-line interface for corpus exploration

**Data Flow**:
1. Corpus files are scanned recursively from `/corpus` directory
2. Text files are loaded on-demand with encoding conversion (ISO8859-1 to UTF-8)
3. Zip files are automatically extracted to temporary directory
4. Text processing utilities provide sentence extraction and word analysis
5. Filtering system allows regex-based text selection

**External Dependencies**:
- `nlp_compromise` (v6.5.3) - NLP processing (outdated)
- `iconv-lite` - Character encoding conversion
- `node-zipkit` - Zip file handling
- `mkdirp`, `rimraf` - File system utilities

**Design Patterns**: Factory pattern (Corpora constructor), Lazy loading (texts loaded on demand)

## 3. Repository Structure Analysis

**Directory Organization**:
```
├── corpus/                 # Text collection (75MB uncompressed)
│   ├── literature/         # Literary works
│   ├── cyberpunk/         # Cyberpunk novels
│   ├── filmscripts/       # Movie scripts
│   ├── computerculture/   # Tech culture texts
│   ├── sentences/         # Sentence collections (JS files)
│   └── [various texts]    # Individual text files
├── lib/                   # Utility libraries
│   ├── debreak.js         # Text paragraph reconstruction
│   └── textutil.js        # Text analysis utilities
├── test/                  # Test suite
├── docs/                  # Documentation (empty directories)
└── [config files]        # Build and project configuration
```

**Key Files**:
- `index.js` - Main library entry point and Corpora class
- `util.js` - CLI interface for corpus interaction
- `package.json` - Project configuration and dependencies
- `gulpfile.js` - Build automation and linting

**Configuration Files**:
- `.eslintrc` - Code linting rules (backtick quotes, 2-space indent)
- `.gitignore` - Git ignore patterns
- `gulpfile.js` - Gulp build tasks for linting and testing

**Entry Points**:
- Library: `require('common-corpus')` → `index.js`
- CLI: `node util.js` with command-line options

## 4. Feature Analysis

**Core Features**:
- **Text Access**: Load and access 100+ curated texts from various domains
- **Filtering**: Regex-based filtering to find specific texts by name/category
- **Text Processing**: Automatic paragraph reconstruction from line-wrapped text
- **Sentence Extraction**: Convert texts to sentence arrays using NLP
- **Word Analysis**: Word frequency analysis and text statistics
- **Format Support**: Automatic handling of zip files and encoding conversion
- **CLI Interface**: Command-line tool for corpus exploration

**User Workflows**:
1. **Library Usage**: `const corpus = new Corpora()` → `corpus.filter('cyberpunk')` → `text.text()`
2. **CLI Exploration**: `node util.js --list` → `node util.js --filter "gibson"` → `node util.js --text "neuromancer"`
3. **Text Analysis**: Access `.sentences()` method for NLP processing

**API Methods**:
- `new Corpora()` - Create corpus instance
- `.texts` - Array of all available texts
- `.filter(regex)` - Filter texts by name pattern
- `.readFile(filename)` - Direct file reading utility
- `.cleanName(name)` - Filename cleaning utility

**Data Models**:
Each text object contains:
```javascript
{
  name: "cleaned filename",
  text: () => "full text content",
  sentences: () => ["array", "of", "sentences"]
}
```

## 5. Development Setup

**Prerequisites**:
- Node.js (version not specified - recommend Node 14+)
- npm or pnpm package manager

**Installation Process**:
```bash
# Install from GitHub
npm install -s github:michaelpaulukonis/common-corpus

# For development
git clone [repository]
npm install
```

**Development Workflow**:
- `npm test` - Run test suite
- `gulp lint` - Code linting with auto-fix
- `gulp test` - Run tests via Gulp
- `npm run cover` - Generate test coverage reports

**Testing Strategy**:
- Mocha/Chai test framework
- Basic API and functional tests
- Istanbul for coverage reporting
- Tests focus on API contract and basic functionality

**Code Quality**:
- ESLint with custom rules (backtick quotes, 2-space indentation)
- Gulp-based linting with auto-fix
- Windows line endings configured

## 6. Documentation Assessment

**Current Documentation Status**:
- ✅ **README**: Basic but minimal - covers installation and roadmap
- ❌ **Code Documentation**: Limited inline comments
- ❌ **API Documentation**: No formal API docs
- ❌ **Architecture Documentation**: Missing system design docs
- ❌ **User Documentation**: No usage examples or tutorials

**Documentation Gaps**:
- No comprehensive API documentation
- Missing usage examples and tutorials
- No contributor guidelines
- No changelog or version history
- Empty documentation directories exist but are unused

## 7. Missing Documentation Suggestions

**Critical Documentation Needed**:

1. **Enhanced README** - Add comprehensive usage examples
2. **API Documentation** → `/docs/api/README.md`
3. **Changelog** → `CHANGELOG.md`
4. **Architecture Documentation** → `/docs/architecture/system-design.md`
5. **Usage Examples** → `/docs/examples/`
6. **Corpus Documentation** → `/docs/corpus-guide.md`

**Suggested Documentation Structure**:
```
docs/
├── api/
│   ├── README.md           # API reference
│   └── examples.md         # Code examples
├── architecture/
│   ├── system-design.md    # Architecture overview
│   └── decisions/          # ADRs directory
├── requirements/
│   └── PRD.md             # Product requirements
├── deployment/
│   └── README.md          # Deployment guide
└── corpus-guide.md        # Corpus content guide
```

## 8. Technical Debt and Improvements

**Critical Issues**:
- **Outdated Dependencies**: `nlp_compromise` is deprecated (should migrate to `compromise`)
- **Large Repository Size**: 75MB uncompressed corpus needs compression strategy
- **Encoding Issues**: Hardcoded ISO8859-1 encoding assumption
- **Memory Usage**: All texts loaded into memory simultaneously
- **Error Handling**: Minimal error handling throughout codebase

**Performance Concerns**:
- Synchronous file operations block event loop
- No caching mechanism for processed texts
- Sentence processing takes 8-10 seconds for large texts
- Recursive directory scanning on every instantiation

**Security Considerations**:
- No input validation for file paths
- Zip file extraction without path validation (potential zip bomb vulnerability)
- No sanitization of user-provided regex patterns

**Scalability Issues**:
- File-based storage doesn't scale for large corpus collections
- No pagination or streaming for large texts
- Memory usage grows linearly with corpus size

**Dependency Management**:
- Multiple outdated dependencies (2017-era versions)
- Missing security updates
- `nlp_compromise` → `compromise` migration needed

## 9. Project Health Metrics

**Code Complexity**: Medium - Simple architecture but some complex text processing
**Test Coverage**: Low - Basic API tests only, no edge case coverage
**Documentation Coverage**: Very Low - Minimal documentation
**Maintainability Score**: Medium-Low - Needs modernization and better structure
**Technical Debt Level**: High - Multiple outdated dependencies and architectural issues

## 10. Recommendations and Next Steps

### Critical Issues (High Priority)
1. **Dependency Updates**: Migrate from `nlp_compromise` to `compromise`
2. **Security Fixes**: Add path validation for zip extraction
3. **Performance**: Implement lazy loading and caching
4. **Error Handling**: Add comprehensive error handling

### Documentation Improvements (High Priority)
1. **API Documentation**: Create comprehensive API reference
2. **Usage Examples**: Add practical usage examples
3. **Corpus Guide**: Document available texts and categories
4. **Contributing Guidelines**: Enable community contributions

### Code Quality (Medium Priority)
1. **Modernization**: Update to modern JavaScript (ES2020+)
2. **Async/Await**: Replace callbacks with async/await
3. **TypeScript**: Consider TypeScript migration for better API
4. **Testing**: Expand test coverage significantly

### Feature Gaps (Medium Priority)
1. **Streaming API**: Add streaming support for large texts
2. **Metadata**: Add text metadata (author, year, genre, etc.)
3. **Search**: Implement full-text search capabilities
4. **Compression**: Implement corpus compression strategy

### Infrastructure (Low Priority)
1. **CI/CD**: Set up GitHub Actions for testing
2. **Publishing**: Automate npm publishing
3. **Monitoring**: Add usage analytics
4. **Documentation Site**: Create documentation website

## Quick Start Guide

1. **Install**: `npm install github:michaelpaulukonis/common-corpus`
2. **Use**: `const corpus = new (require('common-corpus'))(); corpus.filter('cyberpunk')[0].text()`
3. **Explore**: `node util.js --list` to see all available texts

## Key Contact Points

- **Repository**: https://github.com/michaelpaulukonis/common-corpus
- **Issues**: https://github.com/michaelpaulukonis/common-corpus/issues
- **License**: MIT License (2017 Michael Paulukonis)

## Related Resources

- **NLP Compromise**: https://github.com/spencermountain/compromise (migration target)
- **Project Gutenberg**: Source for many corpus texts
- **Gitenberg**: Mentioned in roadmap for text retrieval

## Project Roadmap (From README)

- Add more texts to corpus
- Implement zipped content delivery (reduce 75MB → 25MB)
- Tool consolidation and modernization
- Migrate to modern `compromise` library
- Implement original text algorithms to remove boilerplate
- Add Gitenberg text retrieval integration

---

*This analysis was generated on 2025-09-19 and reflects the current state of the repository. Regular updates recommended as the project evolves.*