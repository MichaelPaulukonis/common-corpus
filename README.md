# Common Corpus

A curated collection of texts for Natural Language Processing (NLP) and Natural Language Generation (NLG) projects.

## Overview

Common Corpus provides easy programmatic access to 100+ carefully selected texts spanning literature, science fiction, film scripts, computer culture, and more. Perfect for researchers, developers, and data scientists working on text analysis, machine learning, and computational linguistics projects.

## Quick Start

### Installation

```bash
npm install github:michaelpaulukonis/common-corpus
```

### Basic Usage

```javascript
const Corpora = require('common-corpus');
const corpus = new Corpora();

// Get all cyberpunk texts
const cyberpunk = corpus.filter('cyberpunk');
console.log(`Found ${cyberpunk.length} cyberpunk texts`);

// Access text content
const neuromancer = corpus.filter('neuromancer')[0];
const fullText = neuromancer.text();
const sentences = neuromancer.sentences();

console.log(`Neuromancer has ${sentences.length} sentences`);
```

### Command Line Interface

```bash
# List all available texts
node util.js --list

# Filter by category
node util.js --filter "gibson"

# Get specific text
node util.js --text "neuromancer"
```

## Features

- **100+ Curated Texts** across multiple genres and domains
- **Smart Filtering** using regex patterns to find texts by category or author
- **Text Processing** with automatic paragraph reconstruction and sentence extraction
- **Multiple Formats** supporting plain text, compressed archives, and pre-processed datasets
- **CLI Interface** for exploration and shell integration
- **Zero Configuration** - works out of the box

## Text Categories

- **Literature**: Classic novels, poetry, Shakespeare
- **Cyberpunk**: Science fiction (Gibson, Kadrey, etc.)
- **Film Scripts**: Movie screenplays (Blade Runner, 2001, Brazil, etc.)
- **Computer Culture**: Hacker history, technical documentation
- **NASA**: Space program documents and technical reports
- **Quotations**: Famous quotes and sayings collections
- **Spam**: Email spam samples for research
- **Western**: Western genre novels
- **Sentences**: Pre-processed sentence datasets

## Documentation

### Getting Started
- [API Reference](docs/api/README.md) - Complete API documentation
- [Usage Examples](docs/api/examples.md) - Practical code examples
- [Corpus Guide](docs/corpus-guide.md) - Detailed text collection overview

### Development
- [Architecture Overview](docs/architecture/system-design.md) - System design
- [Deployment Guide](docs/deployment/README.md) - Publishing and deployment
- [Deployment Options](docs/deployment/DEPLOYMENT_OPTIONS.md) - Layer vs Full API deployment

### Project Information
- [Project Structure](docs/PROJECT_STRUCTURE.md) - Complete project organization
- [Repository Analysis](docs/REPOSITORY_ANALYSIS.md) - Comprehensive project overview
- [Product Requirements](docs/requirements/PRD.md) - Project goals and requirements
- [Changelog](CHANGELOG.md) - Version history

## Roadmap

### Version 1.0 (Planned)
- **Modern Dependencies**: Migrate from `nlp_compromise` to `compromise`
- **Performance**: Async/await API and caching improvements
- **Security**: Input validation and safe file handling
- **Documentation**: Comprehensive guides and examples

### Future Enhancements
- **Compression**: Reduce corpus size (75MB → 25MB)
- **Streaming**: Support for large text processing
- **Metadata**: Rich text information (author, year, genre)
- **Search**: Full-text search capabilities
- **Gitenberg Integration**: Automated text retrieval


## License

MIT License - see [LICENSE](LICENSE) for details.

Individual texts may have different licenses or be in the public domain. Please check source attribution before commercial use.

## Support

- **Issues**: [GitHub Issues](https://github.com/michaelpaulukonis/common-corpus/issues)
- **Documentation**: [docs/](docs/) directory
- **Examples**: [API Examples](docs/api/examples.md)

---

*Built for the NLP/NLG community with ❤️*
