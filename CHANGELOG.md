# Changelog

All notable changes to the Common Corpus project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation structure in `/docs` directory
- API reference documentation with detailed examples
- Architecture documentation and system design overview
- Product Requirements Document (PRD)
- Corpus guide with detailed text descriptions
- Contributing guidelines for community participation
- Performance benchmarking framework
- Error handling improvements

### Changed
- Improved project structure and organization
- Enhanced README with better installation and usage instructions
- Updated development workflow documentation

### Deprecated
- `nlp_compromise` dependency (will be replaced with `compromise` in v1.0.0)

### Security
- Added recommendations for zip file extraction security
- Input validation guidelines for regex patterns

## [0.1.0] - 2017-XX-XX

### Added
- Initial release of Common Corpus library
- Core Corpora class for text access and management
- Text filtering system using regex patterns
- Support for multiple text formats (txt, zip, js)
- Automatic encoding conversion (ISO8859-1 to UTF-8)
- Text processing utilities (debreak, sentence extraction)
- Command-line interface for corpus exploration
- Basic test suite with Mocha/Chai
- Gulp-based build system with ESLint
- Initial corpus collection with 100+ texts across multiple categories:
  - Literature (classic novels, poetry, Shakespeare)
  - Cyberpunk science fiction (Gibson, Kadrey)
  - Film scripts (2001, Blade Runner, Brazil, etc.)
  - Computer culture texts (Hacker history, jargon files)
  - NASA documentation
  - Quotation collections
  - Spam samples for research
  - Western genre novels
  - Pre-processed sentence datasets

### Dependencies
- `iconv-lite@0.4.15` - Character encoding conversion
- `mkdirp@0.5.1` - Directory creation utility
- `nlp_compromise@6.5.3` - Natural language processing
- `node-zipkit@0.1.2` - Zip file handling
- `rimraf@2.6.1` - Directory removal utility

### Development Dependencies
- `chai@3.5.0` - Assertion library for testing
- `gulp@3.9.1` - Build automation
- `gulp-eslint@3.0.1` - Code linting
- `gulp-if@2.0.2` - Conditional gulp operations
- `gulp-mocha@4.0.1` - Test runner integration
- `istanbul@0.4.5` - Code coverage reporting
- `mocha@3.2.0` - Test framework

## [0.0.1] - 2017-XX-XX

### Added
- Project initialization
- Basic project structure
- MIT License
- Initial README

---

## Release Notes

### Version 0.1.0 Notes

This initial release provides a functional text corpus library with the following key features:

**Core Functionality:**
- Access to 100+ curated texts from various domains
- Regex-based filtering for text discovery
- Automatic text processing and encoding normalization
- Both programmatic API and command-line interface

**Text Collection:**
The corpus includes diverse texts suitable for NLP/NLG research:
- Classic literature from Project Gutenberg
- Science fiction novels (especially cyberpunk genre)
- Historical documents and government publications
- Technical documentation and computer culture texts
- Film scripts and creative works
- Reference materials (quotations, phrases)

**Technical Implementation:**
- Node.js library with ES6 features
- Lazy loading for memory efficiency
- Support for compressed archives
- Cross-platform compatibility
- Comprehensive test coverage

**Known Limitations:**
- Synchronous file operations (performance impact)
- Large memory usage for concurrent text access
- Dependency on deprecated `nlp_compromise` library
- Limited error handling and validation
- No caching mechanism for processed texts

### Upgrade Path

Future versions will address current limitations:

**Version 1.0.0 (Planned):**
- Migration to modern `compromise` NLP library
- Async/await API for better performance
- Improved error handling and validation
- Caching system for frequently accessed texts
- Enhanced documentation and examples
- Performance optimizations
- Security improvements

**Version 2.0.0 (Future):**
- Streaming API for large texts
- Database integration for metadata
- Plugin system for custom processors
- Web-based corpus browser
- Advanced text analytics features
- Multi-language support

### Migration Guide

When upgrading between versions, please note:

**From 0.0.x to 0.1.0:**
- No breaking changes
- New features are additive
- Existing code should continue to work

**Future Breaking Changes:**
- Version 1.0.0 will introduce async APIs
- Some method signatures may change
- Deprecated features will be removed


### Support

For support and questions:
- **Issues**: [GitHub Issues](https://github.com/michaelpaulukonis/common-corpus/issues)
- **Documentation**: [docs/](docs/) directory
- **Examples**: [docs/api/examples.md](docs/api/examples.md)

### License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

Individual texts in the corpus may have different licenses or be in the public domain. Please check the source attribution for each text before use in commercial applications.