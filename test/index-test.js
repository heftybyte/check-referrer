var chai = require('chai');
var expect = chai.expect;
var express = require('express');
var request = require('supertest');
var checkReferrer = require('../index');

describe('check-referrer', function(){

  function setRoutes(app) {
    app.get('/secret', function(req, res){ res.send('recipe'); });
    app.get('/rosy', function(req, res){ res.send('rosy'); });
  }

  beforeEach(function(){
    this.app = express();
  });


  it("should redirect all by default", function(done){
    this.app.use(checkReferrer('-example.com', '/rosy'));
    setRoutes(this.app);

    request(this.app)
      .get('/secret')
      .end(function(err, res){
        var exprected = "Moved Temporarily. Redirecting to /rosy";
        expect(res.text).to.equal(exprected);
        done();
      });
  });

  it("shoudn't redirect from redirect url (infinite loop)", function(done){
    this.app.use(checkReferrer('-example.com', '/rosy'));
    setRoutes(this.app);

    request(this.app)
      .get('/rosy')
      .end(function(err, res){
        var exprected = "rosy";
        expect(res.text).to.equal(exprected);
        done();
      });
  });

  it("should set fromAllowedReferrer boolean on whitelisted", function(done){
    this.app.use(checkReferrer('-example.com', '/rosy'));
    setRoutes(this.app);
    this.app.use(function(req, res){
      expect(req.fromAllowedReferrer).to.equal(true);
      res.send(200);
    });

    request(this.app)
      .get('/secret')
      .set('Referrer', 'test.com/example.com')
      .end(function(err, res){
        done();
      });
  });

  it("should not redirect or be whitelisted", function(done){
    this.app.use(checkReferrer('+example.com'));
    setRoutes(this.app);
    this.app.use(function(req, res, next){
      expect(req.fromAllowedReferrer).to.equal(false);
      next();
    });
    request(this.app)
      .get('/secret')
      .set('Referrer', 'www.example.com')
      .end(function(err, res){
        var exprected = "recipe";
        expect(res.text).to.equal(exprected);
        done();
      });
  });


  it("should allow certain referrers", function(done){
    this.app.use(checkReferrer('-example.com', '/rosy'));
    setRoutes(this.app);

    request(this.app)
      .get('/secret')
      .set('Referrer', 'test.com/example.com')
      .end(function(err, res){
        var exprected = "recipe";
        expect(res.text).to.equal(exprected);
        done();
      });
  });


  describe("should only redirect certain referrers", function(){
    it("and should redirect specific referrer", function(done){
      this.app.use(checkReferrer('+example.com', '/rosy'));
      setRoutes(this.app);

      request(this.app)
        .get('/secret')
        .set('Referrer', 'www.example.com')
        .end(function(err, res){
          var exprected = "Moved Temporarily. Redirecting to /rosy";
          expect(res.text).to.equal(exprected);
          done();
        });
    });

    it("and should allow all others", function(done){
      this.app.use(checkReferrer('+example.com', '/rosy'));
      setRoutes(this.app);

      request(this.app)
        .get('/secret')
        .set('Referrer', 'www.other.com')
        .end(function(err, res){
          var exprected = "recipe";
          expect(res.text).to.equal(exprected);
          done();
        });
    });

  });

});