'use strict';

let Corpora = function() {

  if(!(this instanceof Corpora)) {
    return new Corpora();
  }
  // https://gist.github.com/VinGarcia/ba278b9460500dad1f50
  // List all files in a directory in Node.js recursively in a synchronous fashion
  let walkSync = function(dir, filelist) {

    if (dir[dir.length-1] != `/`) { dir = dir.concat(`/`); }

    var files = fs.readdirSync(dir);
    filelist = filelist || [];
    if (dir.indexOf(`###`) === -1) {
      files.forEach(function(file) {
        if (fs.statSync(dir + file).isDirectory()) {
          filelist = walkSync(dir + file + `/`, filelist);
        }
        else {
          filelist.push(dir + file);
        }
      });
    }
    return filelist;
  };

  let fs = require(`fs`),
      path = require(`path`),
      zipkit = require(`node-zipkit`),
      unzipLoc = path.join(__dirname, `./unzip-temp`),
      debreak = require(`./lib/debreak`),
      textutil = require(`./lib/textutil`),
      // root = path.join(__dirname, `./corpus.zip`),
      root = path.join(__dirname, `./corpus`),
      books = walkSync(root),
      texts = [],
      cleanName = (name) => name.replace(/.(txt|js|zip)$/g, ``)
        .replace(root, ``)
        .replace(/^\/|\\/, ``),
      gettext = function(filename) {
        // if zip file, unzip it, and retrieve the zipped file
        // if unzip folder does not exist, create it
        // if unzipped file already exists, do not unzip!
        if (filename.match(/zip$/)) {
          let unzipName = filename.replace(root, unzipLoc).replace(/\.zip$/, ``);
          if (!fs.existsSync(unzipName)) {
            if (!fs.existsSync(unzipLoc)) {
              fs.makeDir(unzipLoc);
            }
            zipkit.unzipSync(`"${filename}"`, unzipLoc);
          }
          filename = unzipName;
        }
        let text = fs.readFileSync(filename),
            iconv = require(`iconv-lite`),
            book = iconv.decode(new Buffer(text), `ISO=8859-1`);
        // discard windows encoding thingy
        if (book.charCodeAt(0) === 0xFEFF) {
          book = book.slice(1);
        }
        return debreak(book);
      };

  for(let i = 0, len = books.length; i < len; i++) {
    let filename = books[i];
    // only "problem" here is that we read the text EVERY TIME we need it
    // but... if we need it only once, that's not a problem, so... leave it for now
    if (filename.indexOf(`sentences`) > -1) {
      var sentences = require(filename);
      texts.push({name: cleanName(filename), text: () => sentences.join(`\n`), sentences: () => sentences});
    } else {
          // let sentences = textutil.sentencify(opts.text),
      texts.push({name: cleanName(filename), text: () => gettext(filename), sentences: () => textutil.sentencify(gettext(filename)) });
    }
  }

  this.texts = texts;

  // TODO: request random number of texts

  // include: string, or regex
  // exclude: filter(/^(?!.*literature|sentence.*).*$/)
  this.filter = function(filter) {
    let r = new RegExp(filter, `i`);
    return texts.filter(m => m.name.match(r) !== null);
  };

  this.readFile = gettext;
  this.cleanName = cleanName;

};

module.exports = Corpora;
