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
      mkdirp = require(`mkdirp`),
      unzipLoc = path.join(__dirname, `./unzip-temp`),
      debreak = require(`./lib/debreak`),
      textutil = require(`./lib/textutil`),
      root = path.join(__dirname, `./corpus`),
      books = walkSync(root),
      texts = [],
      // uncompress is poorly named and/or poorly written
      // it returns a filename, uncompressing it as a side-effect
      uncompress = function(filename) {
        if (filename.match(/.(zip|7z)$/)) {
          let unzipName = filename.replace(root, unzipLoc).replace(/\.(zip|7z)$/, ``),
              targPath = path.dirname(unzipName);
          if (!fs.existsSync(unzipName)) {
            if (!fs.existsSync(targPath)) {
              mkdirp(targPath);
            }
            zipkit.unzipSync(`"${filename}"`, targPath);
          }
          filename = unzipName;
        }
        return filename;
      },
      cleanName = (name) => name.replace(/.(txt|js|zip)$/g, ``)
        .replace(root, ``)
        .replace(/^\/|\\/, ``),
      gettext = function(filename) {
        // if zip file, unzip it, and retrieve the zipped file
        // if unzip folder does not exist, create it
        // if unzipped file already exists, do not unzip!
        filename = uncompress(filename);
        let text = fs.readFileSync(filename),
            iconv = require(`iconv-lite`),
            book = iconv.decode(new Buffer(text), `ISO8859-1`);
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
      texts.push({name: cleanName(filename),
        text: () => require(uncompress(filename)).join(`\n`),
        sentences: () => require(uncompress(filename))});
    } else {
      texts.push({name: cleanName(filename),
        text: () => gettext(filename),
        sentences: () => textutil.sentencify(gettext(filename)) });
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
