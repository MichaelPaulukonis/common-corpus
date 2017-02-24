'use strict';

// TODO: wrap this up as its own npm module

var altmethod = function(text) {

  var lines = text.split(`\n`),
      newlines = [],
      curline = [];

  for (let i = 0, lineslength = lines.length; i < lineslength; i++) {
    let line = lines[i].trim();
    if (line.length == 0) {
      newlines.push(curline.join(``).trim());
      curline = [];
    } else {
      // drop ending hyphen (NOTE: false loss 5% of time, [citation])
      var endsWithHyphen = (line.slice(line.length-1) === `-`);
      curline.push((endsWithHyphen ? line.slice(0, line.length-1) : line + ` `));
      if (i === lineslength - 1) {
        newlines.push(curline.join(``).trim());
      }
    }
  }

  return newlines;

};


/**
 takes in multi-line, word-wrapped text
 returns paragraphs as single lines
 optionally set blank-lines between paragraphs
 **/
var debreak = function(text, config) {

  var cleanText;
  if (config === undefined) {
    config = {
      lineArary: false
    };
  }

  // TODO: rename altmethod, since it's no longer an alternate
  cleanText = altmethod(text).join(`\n`);

  if (config.lineArray) {
    cleanText = cleanText.split(`\n`);
  }

  return cleanText;

};


module.exports = debreak;
