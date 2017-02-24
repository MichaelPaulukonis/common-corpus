'use strict';

(function() {

  var chai = require(`chai`),
      expect = chai.expect,
      Corpora = require(`../lib/corpora`),
      newcorpora = new Corpora();


  describe(`Corpora tests`, function() {

    describe(`Corpora API tests`, function() {

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

      it(`texts should have a text property that is a function and returns a string`, function() {
        expect(newcorpora.texts[0].text()).to.be.a(`string`);
      });

    });

  });

}());
