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


const board = 'testBoard';
const threadKeys = [
  '_id', 'board', 'text', 'delete_password', 'created_on', 'bumped_on', 'reported', 'replies'
];
const replyKeys = [
  '_id', 'text', 'created_on', 'delete_password', 'reported'
];

suite('Functional Tests', function() {
  this.timeout(10000);
  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      test('posting message', done => {
        chai.request(server)
        .post(`/api/threads/${board}`)
        .redirects(0)
        .send({
          text: '123',
          delete_password: 'asd',
        })
        .end(function(err, res) {
          // Redirects counts as errors apparently (in this version of chai-http)
          assert(err.status == 303, `Wrong redirect status code: ${err.status}`);
          done();
        })
      })

      test('posting message with no text', done => {
        chai.request(server)
        .post(`/api/threads/${board}`)
        .redirects(0)
        .send({
          delete_password: 'asd',
        })
        .end(function(err, res) {
          assert(!!err, "Error should not be null");
          done();
        })
      });

      test('posting message with no delete_password', done => {
        chai.request(server)
        .post(`/api/threads/${board}`)
        .redirects(0)
        .send({
          text: 'asd',
        })
        .end(function(err, res) {
          assert(!!err, "Error should not be null");
          done();
        })
      });
    });
    
    suite('GET', function() {
      test('getting board', done => {
        const filteredReplyKeys = ['reported', 'delete_password'];
        chai.request(server)
        .get(`/api/threads/${board}`)
        .end(function(err, res) {
          assert(!Boolean(err), 'Error not null');
          assert(Array.isArray(res.body), 'Reeponse is not array');
          res.body.forEach(t => {
            threadKeys.forEach(k => {
              assert(
                t.hasOwnProperty(k),
                `Object does not have the corresponding keys: ${k}, ${JSON.stringify(t)}`
              );
            });
            t.replies.forEach(r => {
              filteredReplyKeys.forEach(k => {
                assert(
                  !r.hasOwnProperty(k),
                  `Object MUST NOT have the corresponding key: ${k}, ${JSON.stringify(r)}`
                );
              });
            })
          })
          done();
        })
      })
    });
    
    suite('DELETE', function() {
      test('deletting thread succesfully', done => {
        const delete_password = 'lalalala';
        chai.request(server)
        .post(`/api/_threads/${board}`)
        .send({
          text: '123',
          delete_password,
        })
        .end(function(err, postRes) {
          assert(!err, `Error should be null`);
          assert(typeof postRes.body == 'object', `Wrong body type response: ${typeof postRes.body}`);
          threadKeys.forEach(k => {
            assert(
              postRes.body.hasOwnProperty(k),
              `Object does not have the corresponding keys: ${k}, ${JSON.stringify(postRes.body)}`
            );
          });
          chai.request(server)
          .del(`/api/threads/${board}`)
          .send({
            thread_id: postRes.body._id,
            delete_password,
          })
          .end( (err, res) => {
            assert(!err, `Error should be null`);
            assert(res.text === 'success' , `Wrong text response: ${res.text}`);
            done();
          })
        });
      });

      test('deletting thread with wrong password', done => {
        const delete_password = '2123123';
        chai.request(server)
        .post(`/api/_threads/${board}`)
        .send({
          text: '123',
          delete_password,
        })
        .end(function(err, postRes) {
          assert(!err, `Error should be null`);
          assert(typeof postRes.body == 'object', `Wrong body type response: ${typeof postRes.body}`);
          threadKeys.forEach(k => {
            assert(
              postRes.body.hasOwnProperty(k),
              `Object does not have the corresponding keys: ${k}, ${JSON.stringify(postRes.body)}`
            );
          });
          chai.request(server)
          .del(`/api/threads/${board}`)
          .send({
            thread_id: postRes.body._id,
            delete_password: `asdasd${delete_password}dasda`,
          })
          .end( (err, res) => {
            assert(!err, `Error should be null`);
            assert(res.text === 'incorrect password' , `Wrong text response: ${res.text}`);
            done();
          })
        });
      });
    });
    
    suite('PUT', function() {
      test('report thread', done => {
        chai.request(server)
        .post(`/api/_threads/${board}`)
        .send({
          text: '123',
          delete_password: 'asd',
        })
        .end(function(err, postRes) {
          assert(!err, `Error should be null`);
          assert(typeof postRes.body == 'object', `Wrong body type response: ${typeof postRes.body}`);
          threadKeys.forEach(k => {
            assert(
              postRes.body.hasOwnProperty(k),
              `Object does not have the corresponding keys: ${k}, ${JSON.stringify(postRes.body)}`
            );
          });
          chai.request(server)
          .put(`/api/threads/${board}`)
          .send({
            thread_id: postRes._id,
          })
          .end(function(err, res) {
            assert(!err, 'Error not null');
            assert(res.text == "success", `Response not success: ${res.text}`);
            done();
          })
        });
      });
    });
  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {

    const sendThread = () => (
      new Promise((resolve, reject) => {
        chai.request(server)
        .post(`/api/_threads/${board}`)
        .send({
          text: '123',
          delete_password: 'aaaa',
        })
        .end(function(err, res) {
          if(err) return reject(err);
          resolve(res.body._id);
        })
      })
    );

    const sendReply = (thread_id, delete_password) => (
      new Promise((resolve, reject) => {
        chai.request(server)
        .post(`/api/_replies/${board}`)
        .send({
          text: '123',
          delete_password: delete_password || 'lol',
          thread_id,
        })
        .end(function(err, res) {
          if(err) return reject(err);
          resolve(res.body);
        })
      })
    );
    
    suite('POST', function() {
      test('posting message, check redirect', done => {
        chai.request(server)
        .post(`/api/_threads/${board}`)
        .send({
          text: '123',
          delete_password: 'aaaa',
        })
        .end(function(err, thread) {
          assert(!err, `Error should be null`);
          chai.request(server)
          .post(`/api/replies/${board}`)
          .redirects(0)
          .send({
            thread_id: thread.body._id,
            text: 'asdasd',
            delete_password: 'asd',
          })
          .end( (err, res) => {
            assert(Boolean(err), 'Redirect throws error, so error should NOT be null');
            assert(err.status == 303, 'Redirect status should be 303');
            done();
          });
        });
      });

      test('posting message', done => {
        chai.request(server)
        .post(`/api/_threads/${board}`)
        .send({
          text: '123',
          delete_password: 'aaaa',
        })
        .end(function(err, thread) {
          assert(!err, `Error should be null`);
          chai.request(server)
          .post(`/api/_replies/${board}`)
          .send({
            thread_id: thread.body._id,
            text: 'asdasd',
            delete_password: 'asd',
          })
          .end( (err, res) => {
            assert(!err, 'Error should be null');
            replyKeys.forEach(k => {
              assert(
                res.body.hasOwnProperty(k),
                `Object does not have the corresponding keys: ${k}, ${JSON.stringify(res.body)}`
              );
            });
            done();
          });
        });
      });
    });
    
    suite('GET', function() {

      test('get replies', done => {
        const CANT_REPLIES = 10;
        const filteredKeys = ['reported', 'delete_password'];
        sendThread()
        .then(thread_id => {
          Promise.all(Array(CANT_REPLIES).fill(0).map( () => sendReply(thread_id)))
          .then( () => {
            chai.request(server)
            .get(`/api/replies/${board}`)
            .query({
              thread_id
            })
            .end((err, res) => {
              assert(!err, 'Error should be null');
              assert(!Array.isArray(res.body), 'Response should NOT be an Array');
              assert(res.body.hasOwnProperty('replies'), 'Theres no replies prop');
              assert(res.body.replies.length == CANT_REPLIES, 'Qty replies do not match');
              replyKeys.filter(k => !filteredKeys.includes(k)).forEach(k => {
                res.body.replies.forEach(r => {
                  assert(r.hasOwnProperty(k), `Propterties do not match: ${k} -> ${JSON.stringify(r)}`);
                })
              });
              filteredKeys.forEach(k => {
                res.body.replies.forEach(r => {
                  assert(!r.hasOwnProperty(k), `Propterties should be filtered: ${k} -> ${JSON.stringify(r)}`);
                })
              });
              done();
            }); 
          })
          .catch( err => {
            assert(!err, "Error should be null");
          });
        })
        .catch( err => {
          assert(!err, "Error should be null");
        });
      });
    });
    
    suite('PUT', function() {
      test('report reply', done => {
        const CANT_REPLIES = 1;
        sendThread()
        .then(thread_id => {
          Promise.all(Array(CANT_REPLIES).fill(0).map( () => sendReply(thread_id)))
          .then( replies => {
            chai.request(server)
            .put(`/api/replies/${board}`)
            .send({
              thread_id,
              reply_id: replies[0]._id,
            })
            .end((err, res) => {
              assert(!err, 'Error should be null');
              assert(res.text == "success", `Text should be success got: ${res.text}`);
              done();
            }); 
          })
          .catch( err => {
            assert(!err, "Error should be null");
          });
        })
        .catch( err => {
          assert(!err, "Error should be null");
        });
      });
    });
    

    suite('DELETE', function() {
      test('delete reply with correct password', done => {
        const CANT_REPLIES = 1;
        const delete_password = 'aaaaa';
        sendThread()
        .then(thread_id => {
          Promise.all(Array(CANT_REPLIES).fill(0).map( () => sendReply(thread_id, delete_password)))
          .then( replies => {
            chai.request(server)
            .del(`/api/replies/${board}`)
            .send({
              thread_id,
              reply_id: replies[0]._id,
              delete_password,
            })
            .end((err, res) => {
              assert(!err, 'Error should be null');
              assert(res.text == "success", `Text should be success got: ${res.text}`);
              done();
            }); 
          })
          .catch( err => {
            assert(!err, "Error should be null");
          });
        })
        .catch( err => {
          assert(!err, "Error should be null");
        });
      });

      test('delete reply with incorrect password', done => {
        const CANT_REPLIES = 1;
        const delete_password = 'aaaaa';
        sendThread()
        .then(thread_id => {
          Promise.all(Array(CANT_REPLIES).fill(0).map( () => sendReply(thread_id, delete_password)))
          .then( replies => {
            chai.request(server)
            .del(`/api/replies/${board}`)
            .send({
              thread_id,
              reply_id: replies[0]._id,
              delete_password: `NoPE${delete_password}`,
            })
            .end((err, res) => {
              assert(!err, 'Error should be null');
              assert(res.text === "incorrect password", `Text should be incorrect password, got: ${res.text}`);
              done();
            }); 
          })
          .catch( err => {
            assert(!err, "Error should be null");
          });
        })
        .catch( err => {
          assert(!err, "Error should be null");
        });
      });
    });
  });
});
