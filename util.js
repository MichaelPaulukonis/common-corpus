'use strict';

let corpora = new require(`./index.js`)(),
    program = require(`commander`);


let dumpCorpora = function(corp) {
  corp.map(n => console.log(n.name));
  console.log(`\nTotal: ${corp.length}`);
};

program
  .version(`0.0.1`)
  .option(`-f, --filter [string]`, `string or regex`)
  .option(`-l --list`, `list all texts in corpus`)
  .option(`-t --text [string]`, `return text (exact match of a single text)`)
  .parse(process.argv);

if (program.list) {
  dumpCorpora(corpora.texts);
}

if (program.filter) {
  dumpCorpora(corpora.filter(program.filter));
}

if (program.text) {
  let book = corpora.filter(program.text)[0];
  console.log(book.text());
}
