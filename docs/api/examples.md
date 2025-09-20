# Usage Examples

## Basic Text Access

### Getting Started

```javascript
const Corpora = require('common-corpus');
const corpus = new Corpora();

// List all available texts
console.log('Available texts:', corpus.texts.length);
corpus.texts.forEach(text => {
  console.log(`- ${text.name}`);
});
```

### Finding Specific Texts

```javascript
// Find cyberpunk novels
const cyberpunk = corpus.filter('cyberpunk');
console.log('Cyberpunk texts found:', cyberpunk.length);

// Find William Gibson works
const gibson = corpus.filter('gibson');
gibson.forEach(book => {
  console.log(`Gibson book: ${book.name}`);
});

// Find a specific book
const neuromancer = corpus.filter('neuromancer')[0];
if (neuromancer) {
  console.log(`Found: ${neuromancer.name}`);
}
```

## Text Processing

### Reading Full Text

```javascript
const book = corpus.filter('pride.and.prejudice')[0];
const fullText = book.text();

console.log(`Text length: ${fullText.length} characters`);
console.log(`First paragraph: ${fullText.substring(0, 200)}...`);
```

### Working with Sentences

```javascript
const book = corpus.filter('neuromancer')[0];
const sentences = book.sentences();

console.log(`Total sentences: ${sentences.length}`);
console.log(`First sentence: ${sentences[0]}`);
console.log(`Last sentence: ${sentences[sentences.length - 1]}`);

// Find sentences containing specific words
const aiSentences = sentences.filter(s => 
  s.toLowerCase().includes('artificial intelligence')
);
console.log(`AI-related sentences: ${aiSentences.length}`);
```

## Text Analysis

### Word Frequency Analysis

```javascript
const textutil = require('common-corpus/lib/textutil');
const book = corpus.filter('moby.dick')[0];
const text = book.text();

// Get word frequencies
const wordFreqs = textutil.wordfreqs(text);
console.log('Top 10 words:');
wordFreqs.slice(0, 10).forEach((word, i) => {
  console.log(`${i + 1}. ${word.word}: ${word.count}`);
});
```

### Text Statistics

```javascript
function analyzeText(textObj) {
  const text = textObj.text();
  const sentences = textObj.sentences();
  const words = text.split(/\s+/).length;
  const characters = text.length;
  
  return {
    name: textObj.name,
    characters,
    words,
    sentences: sentences.length,
    avgWordsPerSentence: Math.round(words / sentences.length),
    avgCharsPerWord: Math.round(characters / words)
  };
}

// Analyze multiple texts
const literature = corpus.filter('literature');
literature.slice(0, 3).forEach(book => {
  const stats = analyzeText(book);
  console.log(`${stats.name}:`);
  console.log(`  Words: ${stats.words.toLocaleString()}`);
  console.log(`  Sentences: ${stats.sentences.toLocaleString()}`);
  console.log(`  Avg words/sentence: ${stats.avgWordsPerSentence}`);
});
```

## Working with Categories

### Exploring Different Genres

```javascript
const categories = [
  'literature',
  'cyberpunk', 
  'filmscripts',
  'computerculture',
  'nasa',
  'quotations'
];

categories.forEach(category => {
  const texts = corpus.filter(category);
  console.log(`${category}: ${texts.length} texts`);
  
  if (texts.length > 0) {
    console.log(`  Example: ${texts[0].name}`);
  }
});
```

### Random Text Selection

```javascript
function getRandomText(category = null) {
  let texts = category ? corpus.filter(category) : corpus.texts;
  const randomIndex = Math.floor(Math.random() * texts.length);
  return texts[randomIndex];
}

// Get random text from any category
const randomText = getRandomText();
console.log(`Random text: ${randomText.name}`);

// Get random cyberpunk text
const randomCyberpunk = getRandomText('cyberpunk');
console.log(`Random cyberpunk: ${randomCyberpunk.name}`);
```

## Advanced Usage

### Batch Processing

```javascript
async function processTextsAsync(textObjects, processor) {
  const results = [];
  
  for (const textObj of textObjects) {
    console.log(`Processing: ${textObj.name}`);
    
    // Wrap synchronous operations to avoid blocking
    const result = await new Promise(resolve => {
      setImmediate(() => {
        try {
          const processed = processor(textObj);
          resolve({ success: true, data: processed, name: textObj.name });
        } catch (error) {
          resolve({ success: false, error: error.message, name: textObj.name });
        }
      });
    });
    
    results.push(result);
  }
  
  return results;
}

// Example: Get sentence counts for all literature
const literature = corpus.filter('literature');
processTextsAsync(literature, (text) => ({
  name: text.name,
  sentenceCount: text.sentences().length
})).then(results => {
  results.forEach(result => {
    if (result.success) {
      console.log(`${result.data.name}: ${result.data.sentenceCount} sentences`);
    } else {
      console.error(`Error processing ${result.name}: ${result.error}`);
    }
  });
});
```

### Text Comparison

```javascript
function compareTexts(text1, text2) {
  const sentences1 = text1.sentences();
  const sentences2 = text2.sentences();
  
  const textutil = require('common-corpus/lib/textutil');
  const words1 = textutil.wordfreqs(text1.text());
  const words2 = textutil.wordfreqs(text2.text());
  
  return {
    text1: text1.name,
    text2: text2.name,
    sentenceRatio: sentences1.length / sentences2.length,
    vocabularyOverlap: calculateVocabularyOverlap(words1, words2),
    lengthRatio: text1.text().length / text2.text().length
  };
}

function calculateVocabularyOverlap(words1, words2) {
  const vocab1 = new Set(words1.map(w => w.word.toLowerCase()));
  const vocab2 = new Set(words2.map(w => w.word.toLowerCase()));
  
  const intersection = new Set([...vocab1].filter(x => vocab2.has(x)));
  const union = new Set([...vocab1, ...vocab2]);
  
  return intersection.size / union.size;
}

// Compare two Gibson novels
const neuromancer = corpus.filter('neuromancer')[0];
const countZero = corpus.filter('count.zero')[0];

if (neuromancer && countZero) {
  const comparison = compareTexts(neuromancer, countZero);
  console.log('Text Comparison:', comparison);
}
```

## CLI Usage Examples

### Command Line Interface

```bash
# List all available texts
node util.js --list

# Filter texts by pattern
node util.js --filter "gibson"
node util.js --filter "literature"
node util.js --filter "cyberpunk"

# Get specific text content
node util.js --text "neuromancer"
node util.js --text "pride.and.prejudice"
```

### Combining with Shell Commands

```bash
# Count words in a specific text
node util.js --text "neuromancer" | wc -w

# Search for specific terms
node util.js --text "neuromancer" | grep -i "cyberspace"

# Save text to file
node util.js --text "neuromancer" > neuromancer.txt
```

## Error Handling Examples

### Robust Text Access

```javascript
function safeGetText(corpus, pattern) {
  try {
    const matches = corpus.filter(pattern);
    
    if (matches.length === 0) {
      console.warn(`No texts found matching: ${pattern}`);
      return null;
    }
    
    if (matches.length > 1) {
      console.warn(`Multiple matches for ${pattern}, using first match`);
    }
    
    const textObj = matches[0];
    const text = textObj.text();
    
    if (!text || text.length === 0) {
      console.warn(`Empty text for: ${textObj.name}`);
      return null;
    }
    
    return { textObj, text };
    
  } catch (error) {
    console.error(`Error accessing text ${pattern}:`, error.message);
    return null;
  }
}

// Usage
const result = safeGetText(corpus, 'neuromancer');
if (result) {
  console.log(`Successfully loaded: ${result.textObj.name}`);
  console.log(`Length: ${result.text.length} characters`);
}
```

### Handling Large Texts

```javascript
function processLargeText(textObj, chunkSize = 1000) {
  console.log(`Processing large text: ${textObj.name}`);
  
  const sentences = textObj.sentences();
  const chunks = [];
  
  for (let i = 0; i < sentences.length; i += chunkSize) {
    const chunk = sentences.slice(i, i + chunkSize);
    chunks.push(chunk);
  }
  
  console.log(`Split into ${chunks.length} chunks of ~${chunkSize} sentences`);
  return chunks;
}

// Process large text in chunks
const largeText = corpus.filter('moby.dick')[0];
if (largeText) {
  const chunks = processLargeText(largeText, 500);
  console.log(`First chunk has ${chunks[0].length} sentences`);
}
```