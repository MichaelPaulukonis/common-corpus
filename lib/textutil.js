'use strict';

// > var c = require('./defaultTexts.js')
// undefined
// > var util = require('./lib/textutil.js');
// undefined
// > var wf = util.wordfreqs(c[0].text)
// undefined
// > wf.slice(0,10).map(function(e) { return e.word;}).join(' ').toUpperCase()
// ' PICTURES ONE PAINTING GREAT PAINTED WORKS MADE PICTURE TIME'

var textutils = function() {

  // would be nice to ignore some stop words
  var stopwords = require(`./stopwords.js`);

  var splitwords = function(text) {
    // handle possible contractions http://stackoverflow.com/questions/27715581/how-do-i-handle-contractions-with-regex-word-boundaries-in-javascript
    return text.match(/(?!'.*')\b[\w']+\b/g);
  };

  // this is an awkward, annoying intermediate step
  var wordbag = function(text) {

    var wb = {},
        splits = (Object.prototype.toString.call(text) === `[object Array]`)
          ? text // if it's an array keep it
          : splitwords(text); // otherwise split it


    for( var i = 0, len = splits.length; i < len; i++) {
      var word = splits[i];
      // TODO: alphanumeric test should be optional
      // TODO: stop word should be part of util, and it's painful
      // if (stopwords.indexOf(word.toLowerCase()) == -1) {
        // if (alphanumeric.test(word) && word.length > 3) {
        let key = `_` + word.toUpperCase();
        if (!wb[key]) {
          wb[key] = { 'word': word, count: 0 };
        }
        wb[key].count++;
    }

    return wb;

  };

  var sortedArray = function(wordbag) {

    var words = Object.keys(wordbag).map(k => wordbag[k])
          .sort(function(a,b) {
            if (a.count < b.count) {
              return 1;
            }

            if (a.count > b.count) {
              return -1;
            }

            return 0;
          });

    return words;

  };

  var wordfreqs = function(text) {
    return sortedArray(wordbag(text));
  };

  // TODO: drop this into textutils AND TEST IT
  // based on some code I saw in https://github.com/scotthammack/ebook_ebooks/blob/master/ebook_ebooks.py
  // I've contemplated a different version for years, which I should complete
  // that would add in the missing pieces.
  let cleaner = function(poem) {
    // a first implementation of a naive cleaner
    let plines = poem.split(`\n`),
        cleanlines = [];

    for(let i = 0, len = plines.length; i < len; i++) {
      let line = plines[i];

      // multiple underscores to single
      line = line.replace(/_+/g, `_`);

      // remove beginning and ending punctuation?
      // trouble is, this is used on sentences AND words
      // we want a word-level cleanup for one utility.... aaargh.

      let leftbrackets = line.match(/\[/g),
          lbCount = (leftbrackets ? leftbrackets.length : 0),
          rightbrackets = line.match(/\]/g),
          rbCount = (rightbrackets ? rightbrackets.length : 0);

      if ((leftbrackets || rightbrackets) && lbCount !== rbCount) {
        line = line.replace(/[\[\]]/g, ``);
      }

      let leftparens = line.match(/\(/g),
          lpCount = (leftparens ? leftparens.length : 0),
          rightparens = line.match(/\)/g),
          rpCount = (rightparens ? rightparens.length : 0);

      if ((leftparens || rightparens) && lpCount !== rpCount) {
        line = line.replace(/[\(\)]/g, ``);
      }

      cleanlines.push(line);

    }

    return cleanlines.join(`\n`);
  };

  // phonetic algorithm replaces "th" with zero (0)
  // this switches it back, becuase it look awful in my use-case
  let fonetikfix = function(text) {
    return text.replace(/\b([a-z]*)?0([a-z]*)?\b/ig, `$1th$2`);
  };

  let sentencify = function(text) {
    // if array of texts, join 'em together
    if (Object.prototype.toString.call(text) === `[object Array]`) {
      text = text.reduce((p,c) => p + ` ` + c, ``).trim();
    }

    let debreak = require(`../lib/debreak.js`),
        nlp = require(`nlp_compromise`),
        t = debreak(text)
          .replace(/\t/g, ` `)
          .replace(/^ +/g, ``),
        s = nlp.text(t),
        sentences = s.sentences.map(s => s.str.trim());
    return sentences;
  };


  return { wordbag: wordbag,
           wordfreqs: wordfreqs,
           cleaner: cleaner,
           splitwords: splitwords,
           fonetikfix: fonetikfix,
           sentencify: sentencify
         };
};

module.exports = textutils();
