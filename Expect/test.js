var expect = require('expect.js');

var a = {pr:{}};
a.pr.a = 1;
a.pr.b = null;

expect(a.pr.a).to.be(1);
expect(a.pr.b).to.be(null);
expect(a.pr.c).to.be(undefined);
