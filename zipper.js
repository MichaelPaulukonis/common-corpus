'use strict';

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
    unzipLoc = path.join(__dirname, `./zipped-corp`),
    root = path.join(__dirname, `./corpus`),
    books = walkSync(root),
    texts = [];

for(let i = 0, len = books.length; i < len; i++) {
  let filename = books[i],
      cleanname = filename.replace(/ /g, `.`).replace(/&/g, `and`);

  if (filename !== cleanname) { fs.renameSync(filename, cleanname); }
  filename = cleanname;

  let targName = filename.replace(root, unzipLoc) + `.7z`,
      targPath = path.dirname(targName);
  if (!fs.existsSync(targPath)) {
    mkdirp(targPath);
  }
  console.log(targName, `"${filename}"`);
  zipkit.zipSync(targName, `"${filename}"`);
}
