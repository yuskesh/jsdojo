var should = require('should');

var a = {pr: {}};
a.pr.a = 1;
a.pr.b = null;

a.pr.a.should.equal(1);
a.pr.b.should.equal(null);
