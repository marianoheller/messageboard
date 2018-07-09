/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      test('posting message', done => {
        chai.request(server)
        .post('/api/threads/testBoard')
        .send({
          text: '123',
          delete_password: 'asd',
        })
        .end(function(err) {
          assert(!Boolean(err), 'Error not null');
          done();
        })
      })
    });
    
    suite('GET', function() {
      test('getting board', done => {
        chai.request(server)
        .get('/api/threads/testBoard')
        .end(function(err) {
          console.log(err);
          assert(!Boolean(err), 'Error not null');
          done();
        })
      })
    });
    
    suite('DELETE', function() {
      
    });
    
    suite('PUT', function() {
      
    });
    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      
    });
    
    suite('GET', function() {
      
    });
    
    suite('PUT', function() {
      
    });
    
    suite('DELETE', function() {
      
    });
    
  });

});
