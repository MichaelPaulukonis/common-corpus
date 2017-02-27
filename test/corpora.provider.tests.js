'use strict';

(function() {

  var chai = require(`chai`),
      expect = chai.expect,
      Corpora = require(`../index.js`),
      newcorpora = new Corpora();

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

      // there is an implicit test here, that we access both the text and the sentences of the same object
      // and get each of them
      // in an earlier iteration, only the first attempt would succeed
      // perhaps these should be THREE separate tests, on 3 separate corpora objects?
      // picked exclusively (then we have to deal with THAT issue, which isn't SOOOO bad, no?)

      it(`texts should have a text property that is a function and returns a string`, function() {
        expect(newcorpora.texts[0].text()).to.be.a(`string`);
      });

      it(`texts should have a sentences property that is a function and returns an array of strings`, function() {
        this.timeout(10000); // OUCH! A History of Art for Beginners..." takes > 5 seconds....
        let sentences = newcorpora.texts[0].sentences(),
            firstSent = sentences[0];
        expect(sentences).to.be.instanceOf(Array);
        expect(firstSent).to.be.a(`string`);
      });

    });

  });

}());
