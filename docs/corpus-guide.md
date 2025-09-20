# Corpus Guide

## Overview

The Common Corpus library contains 100+ carefully curated texts spanning multiple genres, time periods, and domains. This guide provides detailed information about the available texts, their organization, and how to effectively use them in your NLP/NLG projects.

## Corpus Statistics

- **Total Texts**: ~100+ individual documents
- **Total Size**: ~75MB uncompressed, ~25MB compressed
- **Categories**: 9 major categories plus individual texts
- **Languages**: Primarily English
- **Formats**: Plain text (.txt), compressed archives (.zip), sentence arrays (.js)
- **Encoding**: Standardized to UTF-8 (converted from various source encodings)

## Text Categories

### Literature (`literature/`)
Classic and notable literary works, primarily from Project Gutenberg.

**Subcategories**:
- `childrens/` - Children's literature
- `folklore/` - Folk tales and mythology
- `gertrudestein/` - Works by Gertrude Stein
- `james.joyce/` - James Joyce works
- `poetry/` - Poetry collections
- `shakespeare/` - Shakespeare plays and sonnets

**Notable Texts**:
- `herman.melville.moby.dick.or.the.whale.txt` - Melville's classic novel
- `jane.austen.pride.and.prejudice.txt` - Austen's beloved romance
- `vatsyayana.the.kama.sutra.of.vatsyayana.txt` - Ancient Sanskrit text

**Use Cases**: 
- Literary analysis and style studies
- Classical language model training
- Historical linguistics research
- Writing style comparison

### Cyberpunk (`cyberpunk/`)
Science fiction novels from the cyberpunk genre, featuring works by seminal authors.

**Texts**:
- `william.gibson.neuromancer.txt` - The foundational cyberpunk novel
- `william.gibson.count.zero.txt` - Second book in Gibson's Sprawl trilogy
- `william.gibson.mona.lisa.overdrive.txt` - Third book in the trilogy
- `richard.kadrey.metrophage.txt` - Underground cyberpunk classic

**Use Cases**:
- Science fiction text generation
- Futuristic vocabulary analysis
- Genre-specific language modeling
- Comparative literature studies

### Film Scripts (`filmscripts/`)
Screenplays from notable films across various genres.

**Notable Scripts**:
- `2001.a.space.odyssey.kubrick.clarke.txt` - Kubrick's sci-fi masterpiece
- `bladerunner.txt` - The influential sci-fi noir film
- `brazil.terry.gilliam.tom.stoppard.charles.mckeown.scifi.txt` - Gilliam's dystopian satire
- `ghostbusters.dan.aykroyd.harold.ramis.scifi.paranormal.txt` - The comedy classic
- `marx.brothers.duck.soup.txt` - Classic comedy screenplay
- `the.fifth.element.luc.besson.scifi.txt` - Besson's colorful sci-fi adventure

**Use Cases**:
- Dialogue analysis and generation
- Screenplay format studies
- Character interaction modeling
- Genre-specific language patterns

### Computer Culture (`computerculture/`)
Texts related to computing history, hacker culture, and technology.

**Key Texts**:
- `Hackers Heroes of the Computer Revolution by Steven Levy.txt` - Seminal hacker culture book
- `The Hacker Crackdown law and disorder on the electronic frontier by Bruce Sterling.txt` - Cybercrime history
- `The Jargon File Version 4.2.2 20 Aug 2000 by Various.txt` - Hacker terminology dictionary
- `The Cyberpunk Fakebook by R. U. Sirius and St. Jude.txt` - Cyberpunk culture guide
- `ascii text history.txt` - History of ASCII art and text culture
- `emoticons_01.txt` - Early emoticon collections

**Use Cases**:
- Technical writing analysis
- Jargon and terminology extraction
- Computing history research
- Technical documentation generation

### NASA (`nasa/`)
Official NASA documentation and technical reports.

**Documents**:
- `computers.in.spaceflight.the.nasa.experience.txt` - Computing in space programs
- `deep.space.telecommunications.systems.engineering.txt` - Space communication systems
- `the.living.universe.nasa.and.the.development.of.astrobiology.txt` - Astrobiology research
- `the.nastran.programmers.manual.txt` - Technical software documentation

**Use Cases**:
- Technical documentation analysis
- Scientific writing studies
- Aerospace terminology extraction
- Government document processing

### Quotations (`quotations/`)
Collections of famous quotes and sayings.

**Collections**:
- `bartletts.familiar.quotations.txt` - Classic quotation collection
- `book.of.wise.sayings.txt` - Wisdom and proverbs
- `dictionary.of.quotations.from.ancient.and.modern,.english.and.foreign.sources.txt`
- `the.lincoln.year.book.axioms.and.aphorisms.from.the.great.emancipator.txt`
- `the.worlds.best.poetry.volume.10.txt` - Poetry quotations

**Use Cases**:
- Wisdom and aphorism generation
- Quote attribution systems
- Inspirational text creation
- Historical figure analysis

### Sentences (`sentences/`)
Pre-processed sentence collections in JavaScript array format.

**Datasets**:
- `arpa.js` - ARPA research sentences
- `geneng.js` - General English sentences
- `harvard.sentences.js` - Harvard sentence corpus
- `wsj.sentences.js` - Wall Street Journal sentences

**Format Example**:
```javascript
module.exports = [
  "The quick brown fox jumps over the lazy dog.",
  "She sells seashells by the seashore.",
  // ... more sentences
];
```

**Use Cases**:
- Sentence-level NLP tasks
- Quick sentence sampling
- Phonetic analysis (Harvard sentences)
- News language modeling (WSJ)

### Spam (`spam/`)
Spam email samples for filtering and detection research.

**Samples**:
- Various spam email examples
- SMS spam messages
- Comment spam samples
- Different spam techniques and patterns

**Use Cases**:
- Spam detection algorithm training
- Text classification research
- Security research
- Pattern recognition studies

### Western (`western/`)
Western genre novels and stories.

**Texts**:
- `a.m.chisholm.the.land.of.strong.men.txt`
- `andre.norton.rebel.spurs.txt`
- `j.fenimore.cooper.the.prairie.txt`
- `owen.wister.the.virginian.txt`
- `Riders of the Purple Sage by Zane Grey.txt`

**Use Cases**:
- Genre analysis
- Historical fiction studies
- American literature research
- Dialect and regional language analysis

### Holidays (`holidays/`)
Holiday-related texts and stories.

**Subcategories**:
- `christmas/` - Christmas stories and texts

**Use Cases**:
- Seasonal content generation
- Cultural studies
- Holiday-themed applications
- Sentiment analysis of celebratory texts

## Individual Root-Level Texts

The corpus also includes numerous individual texts at the root level:

### Historical and Cultural Texts
- `A History of Art for Beginners and Students by Clara Erskine Clement Waters.txt`
- `American Hero-Myths by Daniel Garrison Brinton.txt`
- `The Witch-cult in Western Europe by Margaret Alice Murray.txt`

### Reference and Educational
- `A List of Factorial Math Constants by Unknown.txt`
- `fifteen.thousand.useful.phrases.by.greenville.kleiser.txt`
- `hoyles.games.modernized.txt`

### Political and Social
- `karl.marx.frederick.engels.manifesto.of.the.communist.party.txt`
- `lawrence.lessig.free.culture.txt`
- `cia.world.factbook.2010.txt`

### Literary and Artistic
- `allen.ginsberg.howl.txt` - Beat generation poetry
- `Technical Manifesto of Futurist Painting.txt`
- `The Futurist Manifesto.txt`
- `tristan.tzara.to.make.a.dadaist.poem.txt`

## Usage Patterns

### Finding Texts by Category

```javascript
const corpus = new Corpora();

// Get all cyberpunk texts
const cyberpunk = corpus.filter('cyberpunk');

// Get all literature
const literature = corpus.filter('literature');

// Get specific author works
const gibson = corpus.filter('gibson');

// Get film scripts
const scripts = corpus.filter('filmscripts');
```

### Exploring Available Texts

```javascript
// List all available texts
corpus.texts.forEach(text => {
  console.log(text.name);
});

// Get texts by pattern
const nasa = corpus.filter('nasa');
const quotes = corpus.filter('quotations');
const sentences = corpus.filter('sentences');
```

### Working with Different Text Types

```javascript
// Regular text files
const novel = corpus.filter('neuromancer')[0];
const content = novel.text();
const sentences = novel.sentences();

// Pre-processed sentence files
const harvardSentences = corpus.filter('harvard.sentences')[0];
const sentenceArray = harvardSentences.sentences(); // Already processed
```

## Text Quality and Characteristics

### Encoding and Format
- **Source Encoding**: Various (ISO8859-1, UTF-8, Windows-1252)
- **Output Encoding**: Standardized UTF-8
- **Line Endings**: Normalized to Unix format (\n)
- **Paragraph Structure**: Reconstructed from line-wrapped text

### Text Processing Applied
1. **Encoding Conversion**: All texts converted to UTF-8
2. **BOM Removal**: Unicode BOM markers stripped
3. **Debreaking**: Line-wrapped paragraphs reconstructed
4. **Hyphenation Handling**: End-of-line hyphens processed
5. **Whitespace Normalization**: Consistent spacing applied

### Known Limitations
- Some OCR artifacts may remain in older texts
- Formatting variations across different source materials
- Potential encoding issues with special characters
- Large texts may have performance implications

## Best Practices

### Performance Considerations
```javascript
// Efficient text access
const texts = corpus.filter('cyberpunk');
texts.forEach(text => {
  // Access text content only when needed
  if (someCondition) {
    const content = text.text();
    // Process content...
  }
});
```

### Memory Management
```javascript
// For large-scale processing, consider chunking
function processLargeCorpus(corpus) {
  const texts = corpus.texts;
  const chunkSize = 10;
  
  for (let i = 0; i < texts.length; i += chunkSize) {
    const chunk = texts.slice(i, i + chunkSize);
    // Process chunk...
    // Allow garbage collection between chunks
  }
}
```

### Error Handling
```javascript
function safeTextAccess(corpus, pattern) {
  try {
    const matches = corpus.filter(pattern);
    if (matches.length === 0) {
      console.warn(`No texts found for pattern: ${pattern}`);
      return null;
    }
    return matches[0].text();
  } catch (error) {
    console.error(`Error accessing text: ${error.message}`);
    return null;
  }
}
```

## Contributing New Texts

### Text Selection Criteria
- Public domain or appropriate licensing
- Cultural, historical, or educational significance
- Diverse representation across genres and time periods
- Clean, readable format
- Reasonable file size (< 10MB per text)

### Preparation Guidelines
1. **Legal Verification**: Ensure text is legally distributable
2. **Format Standardization**: Convert to UTF-8 plain text
3. **Quality Check**: Remove OCR artifacts and formatting issues
4. **Categorization**: Place in appropriate directory
5. **Documentation**: Update corpus guide with new additions

### Submission Process
1. Fork the repository
2. Add texts to appropriate category directories
3. Update documentation
4. Submit pull request with description
5. Await review and integration

## Future Enhancements

### Planned Improvements
- **Metadata Addition**: Author, year, genre, word count
- **Search Enhancement**: Full-text search capabilities
- **Compression**: Reduce corpus size through better compression
- **Streaming**: Support for processing large texts in chunks
- **Database Integration**: SQLite for faster text discovery

### Community Requests
- More contemporary literature
- Non-English text collections
- Technical documentation samples
- Social media and web text samples
- Multilingual parallel corpora

---

*For technical details about accessing and processing these texts, see the [API Reference](./api/README.md) and [Usage Examples](./api/examples.md).*