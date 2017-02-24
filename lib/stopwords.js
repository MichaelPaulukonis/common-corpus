'use strict';

// based on stopword lists from
// https://raw.githubusercontent.com/stanfordnlp/CoreNLP/master/data/edu/stanford/nlp/patterns/surface/stopwords.txt
// and https://github.com/NaturalNode/natural/blob/master/lib/natural/util/stopwords.js

var stopwords =
      [`about`, `above`, `after`, `again`, `against`, `all`, `am`, `an`,
       `and`, `any`, `are`, `aren't`, `arent`, `as`, `at`, `be`, `because`,
       `been`, `before`, `being`, `below`, `between`, `both`, `but`, `by`,
       `can`, `can't`, `cannot`, `cant`, `could`, `couldn't`, `couldnt`,
       `did`, `didn't`, `didnt`, `do`, `does`, `doesn't`, `doesnt`,
       `doing`, `don't`, `dont`, `down`, `during`, `each`, `few`, `for`,
       `from`, `further`, `had`, `hadn't`, `hadnt`, `has`, `hasn't`,
       `hasnt`, `have`, `haven't`, `havent`, `having`, `he`, `he'd`,
       `he'll`, `he's`, `her`, `here`, `here's`, `heres`, `hers`,
       `herself`, `hes`, `him`, `himself`, `his`, `how`, `how's`, `hows`,
       `i`, `i'd`, `i'll`, `i'm`, `i've`, `if`, `im`, `in`, `into`, `is`,
       `isn't`, `isnt`, `it`, `it's`, `its`, `its`, `itself`, `let's`,
       `lets`, `me`, `more`, `most`, `mustn't`, `mustnt`, `my`, `myself`,
       `no`, `nor`, `not`, `of`, `off`, `on`, `once`, `only`, `or`, `other`,
       `ought`, `our`, `ours `, `ourselves`, `out`, `over`, `own`, `return`,
       `same`, `shan't`, `shant`, `she`, `she'd`, `she'll`, `she's`,
       `shes`, `should`, `shouldn't`, `shouldnt`, `so`, `some`, `such`,
       `than`, `that`, `that's`, `thats`, `the`, `their`, `theirs`, `them`,
       `themselves`, `then`, `there`, `there's`, `theres`, `these`, `they`,
       `they'd`, `they'll`, `they're`, `they've`, `theyll`, `theyre`,
       `theyve`, `this`, `those`, `through`, `to`, `too`, `under`, `until`,
       `up`, `very`, `was`, `wasn't`, `wasnt`, `we`, `we'd`, `we'll`,
       `we're`, `we've`, `were`, `were`, `weren't`, `werent`, `what`,
       `what's`, `whats`, `when`, `when's`, `whens`, `where`, `where's`,
       `wheres`, `which`, `while`, `who`, `who's`, `whom`, `whos`, `why`,
       `why's`, `whys`, `with`, `won't`, `wont`, `would`, `wouldn't`,
       `wouldnt`, `you`, `you'd`, `you'll`, `you're`, `you've`, `youd`,
       `youll`, `your`, `youre`, `yours`, `yourself`, `yourselves`, `youve`,
       `a`, `b`, `c`, `d`, `e`, `f`, `g`, `h`, `i`, `j`, `k`, `l`, `m`, `n`,
       `o`, `p`, `q`, `r`, `s`, `t`, `u`, `v`, `w`, `x`, `y`, `z`, `$`, `1`,
       `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `0`, `_`];

module.exports = stopwords;
