# API Reference

## Overview

The `common-corpus` library provides a simple API for accessing and processing text corpora for NLP/NLG projects. The main interface is through the `Corpora` class.

## Installation

```bash
npm install github:michaelpaulukonis/common-corpus
```

## Basic Usage

```javascript
const Corpora = require('common-corpus');
const corpus = new Corpora();

// Get all available texts
console.log(corpus.texts.length); // ~100+ texts

// Filter texts by name/category
const cyberpunkTexts = corpus.filter('cyberpunk');
console.log(cyberpunkTexts[0].name); // "william.gibson.neuromancer"

// Get text content
const neuromancer = cyberpunkTexts[0];
const fullText = neuromancer.text();
const sentences = neuromancer.sentences();
```

## API Reference

### Class: Corpora

#### Constructor

```javascript
new Corpora()
// or
Corpora() // Returns new instance even without 'new'
```

Creates a new Corpora instance and scans the corpus directory for available texts.

#### Properties

##### `texts`
- **Type**: `Array<TextObject>`
- **Description**: Array of all available text objects in the corpus

```javascript
const corpus = new Corpora();
console.log(corpus.texts.length); // Number of available texts
```

#### Methods

##### `filter(pattern)`
- **Parameters**: 
  - `pattern` (string): Regular expression pattern to match against text names
- **Returns**: `Array<TextObject>` - Filtered array of matching texts
- **Description**: Filters texts by name using case-insensitive regex matching

```javascript
// Find all Gibson texts
const gibsonTexts = corpus.filter('gibson');

// Find all literature
const literature = corpus.filter('literature');

// Find specific text
const neuromancer = corpus.filter('^william\\.gibson\\.neuromancer$');
```

##### `readFile(filename)`
- **Parameters**:
  - `filename` (string): Path to file to read
- **Returns**: `string` - File content with encoding conversion and debreaking applied
- **Description**: Utility method to read and process individual files

##### `cleanName(name)`
- **Parameters**:
  - `name` (string): Filename to clean
- **Returns**: `string` - Cleaned filename without extensions and path
- **Description**: Utility method to clean filenames for display

### TextObject Structure

Each text in the `texts` array has the following structure:

```javascript
{
  name: string,        // Cleaned filename (e.g., "william.gibson.neuromancer")
  text: () => string,  // Function that returns full text content
  sentences: () => Array<string>  // Function that returns array of sentences
}
```

#### TextObject Methods

##### `text()`
- **Returns**: `string` - Full text content of the document
- **Description**: Loads and returns the complete text with paragraph reconstruction applied

```javascript
const book = corpus.filter('neuromancer')[0];
const content = book.text();
console.log(content.substring(0, 100)); // First 100 characters
```

##### `sentences()`
- **Returns**: `Array<string>` - Array of sentences extracted from the text
- **Description**: Processes text through NLP pipeline to extract individual sentences
- **Note**: Can be slow for large texts (8-10 seconds for very large documents)

```javascript
const book = corpus.filter('neuromancer')[0];
const sentences = book.sentences();
console.log(sentences[0]); // First sentence
console.log(sentences.length); // Total sentence count
```

## Text Categories

The corpus is organized into several categories:

- **Literature**: Classic novels and literary works
- **Cyberpunk**: Science fiction novels (Gibson, Kadrey, etc.)
- **Film Scripts**: Movie screenplays
- **Computer Culture**: Tech history and hacker culture texts
- **NASA**: Space program documentation
- **Quotations**: Collections of famous quotes
- **Sentences**: Pre-processed sentence collections
- **Spam**: Spam email samples for filtering research
- **Western**: Western genre novels

## Error Handling

The library currently has minimal error handling. Common issues:

- **File not found**: No explicit error thrown, may return undefined
- **Encoding issues**: Some texts may have encoding problems
- **Memory usage**: Large texts loaded entirely into memory
- **Zip extraction**: Temporary files created in `unzip-temp/` directory

## Performance Considerations

- **Lazy Loading**: Text content is loaded only when `.text()` or `.sentences()` is called
- **Caching**: No caching implemented - each call re-processes the text
- **Memory Usage**: Full text content loaded into memory
- **Sentence Processing**: Uses NLP processing which can be slow for large texts

## Examples

See [examples.md](./examples.md) for detailed usage examples and common patterns.

## Limitations

- Synchronous file operations (blocks event loop)
- No streaming support for large texts
- Limited error handling and validation
- Hardcoded encoding assumptions (ISO8859-1)
- No metadata about texts (author, year, genre, etc.)

## Migration Notes

This library uses the deprecated `nlp_compromise` package. Future versions should migrate to the modern `compromise` library for better performance and features.