'use strict';

(function() {

  var chai = require(`chai`),
      expect = chai.expect,
      Corpora = require(`../index.js`),
      newcorpora = new Corpora();

  // setup should make sure that the unzip-temp folder is empty
  // so, perhaps that should be exposed by the library?
  // or just make it a parallel dependency?

  describe(`Corpora tests`, function() {

    describe(`API tests`, function() {

      it(`should return a new instance with new`, function() {
        expect(newcorpora).to.be.a(`object`);
        expect(newcorpora).to.be.an.instanceof(Corpora);
      });

      it(`should return a new instance even without new`, function() {
        var corpora = Corpora();
        expect(corpora).to.be.a(`object`);
        expect(corpora).to.be.an.instanceof(Corpora);
      });

      // also exposes readFile (does anything use this?), cleanName, and filter
      // TODO: tests for these

      it(`should expose an array of texts`, function() {
        expect(newcorpora.texts).to.be.instanceOf(Array);
      });

      it(`texts should have a name property that is a string`, function() {
        expect(newcorpora.texts[0].name).to.be.a(`string`);
      });

      it(`texts should have a text property that is a function`, function() {
        expect(newcorpora.texts[0].text).to.be.a(`function`);
      });

      it(`texts should have a sentences property that is a function`, function() {
        expect(newcorpora.texts[0].sentences).to.be.a(`function`);
      });
    });

    describe(`functional tests`, function() {
      // there is an implicit test here, that we access both the text and the sentences of the same object
      // and get each of them
      // in an earlier iteration, only the first attempt would succeed
      // perhaps these should be THREE separate tests, on 3 separate corpora objects?
      // picked exclusively (then we have to deal with THAT issue, which isn't SOOOO bad, no?)

      it(`text property returns a string`, function() {
        expect(newcorpora.texts[0].text()).to.be.a(`string`);
      });

      it(`sentences property returns an array of strings`, function() {
        this.timeout(10000); // OUCH! A History of Art for Beginners..." takes ~= 8..10 seconds....
        let sentences = newcorpora.texts[0].sentences(),
            firstSent = sentences[0];
        expect(sentences).to.be.instanceOf(Array);
        expect(firstSent).to.be.a(`string`);
      });

      // TODO: test special sentences folders

      // TODO: test filter
      it(`special sentences files function like other texts`, function() {
        let blob = newcorpora.filter(`sentences`)[0];
        expect(blob).to.be.an(`object`);

        describe(`specicial sentneces provide text and sentences normally`, function() {
          it(`text property returns a string`, function() {
            expect(blob.text()).to.be.a(`string`);
          });

          it(`sentences property returns an array of strings`, function() {
            let sentences = blob.sentences(),
                firstSent = sentences[0];
            expect(sentences).to.be.instanceOf(Array);
            expect(firstSent).to.be.a(`string`);
          });
        });

      });

    });

  });

}());
