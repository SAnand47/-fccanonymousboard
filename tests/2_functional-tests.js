/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var expect = chai.expect;
var server = require("../server");

//-- for testing
var threadId;
var threadText = "funtest1";
var threadPassword = "funtest1";

var replyId;
var replyText = "funreply1";
var replyPassword = "funreply1";

//-- make an array of thread and reply objects for testing. slows down testing
/* let threadArr = [];
let threadTextVal =[];
let replyArr = [];
let replyTextVal = [];

for (var i = 1; i <= 10; i++) {
  let threadObj = {};
  threadObj.text = "funtest" + i;
  threadObj.delete_password = "funtest" + i;
  threadObj.reported = false;
  threadArr.push(threadObj);
  threadTextVal.push("funtest" + i)
  let replyObj = {};
  replyObj.text = "funreply" + i;
  replyObj.delete_password = "funreply" + i;
  replyObj.reported = false;
  replyArr.push(replyObj);
  replyTextVal.push("funreply" + i)
} */

chai.use(chaiHttp);

suite("Functional Tests", function() {
  suite("API ROUTING FOR /api/threads/:board except deletes", function() {
    suite("POST", function() {
      test("test1 -post without text or delete_password", function(done) {
        chai
          .request(server)
          .post("/api/threads/functiontest")
          .send({})
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "ensure all the required fields are filled");
          });
        done();
      });

      //-- post 20 threads for testing

      test("test2 -post with text delete_password", function(done) {
        chai
          .request(server)
          .post("/api/threads/functiontest")
          .send({ text: threadText, delete_password: threadPassword })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            // assert.equal(window.location.pathname, "/b/functiontest/");
          });
        done();
      });
    });

    suite("GET", function() {
      test("test3 -Get 10 bumped threads and only 3 most recent replies", function(done) {
        chai
          .request(server)
          .get("/api/threads/functiontest")
          .end(function(err, res) {
            //console.log(res.body)

            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isAtMost(res.body.length, 10);
            //--check any value by changing 0 in res.body to 0-10
            //assert.notEqual(threadTextVal.indexOf(res.body[0].text),-1);
            assert.equal(res.body[0].text, "funtest1");
            assert.property(res.body[0], "_id");
            assert.property(res.body[0], "text");
            assert.property(res.body[0], "created_on");
            assert.property(res.body[0], "bumped_on");
            assert.property(res.body[0], "replies");
            assert.property(res.body[0], "replycount");
            assert.isArray(res.body[0].replies);
            assert.isAtMost(res.body[0].replies.length, 3);
            assert.equal(res.body[0].replycount, res.body[0].replies.length);
            if (res.body[0].replycount >= 1) {
              assert.equal(
                res.body[0].bumped_on,
                res.body[0].replies[0].created_on
              );
            }
            threadId = res.body[0]._id;
            // console.log(threadId);
            done();
          });
      });
    });

    suite("PUT", function() {
      test("test 6- Put changes reported to true by sending correct thread id ", function(done) {
        chai
          .request(server)
          .put("/api/threads/functiontest")
          .send({ thread_id: threadId })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
          });
        done();
      });
    });
  });

  suite("API ROUTING FOR /api/replies/:board and all deletes", function() {
    suite("POST", function() {
      test("test 6- Post requires a reply text and a reply delete_password ", function(done) {
        chai
          .request(server)
          .post("/api/replies/functiontest")
          .send({})
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "ensure all the required fields are filled");
          });
        done();
      });

      test("test 7- Post replies by sending thread_id, reply text and reply delete_password ", function(done) {
        chai
          .request(server)
          .post("/api/replies/functiontest")
          .send({ thread_id:threadId, text: replyText, delete_password: replyPassword })
          .end(function(err, res) {
            assert.equal(res.status, 200);
          });
        done();
      });
    });

    suite("GET", function() {
      test("test 8- incorrect or no thread_id does not provide any response ", function(done) {
        chai
          .request(server)
          .get("/api/replies/functiontest")
          .query({})
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "ensure thread_id entered is correct");
            done();
          });
      });

      test("test 9- Get replies by querying with correct thread_id ", function(done) {
        chai
          .request(server)
          .get("/api/replies/functiontest")
          .query({ thread_id: threadId })
          .end(function(err, res) {
            //console.log(res.body)

            assert.equal(res.status, 200);
            assert.isObject(res.body);

            //--check any value by changing 0 in res.body to 0-10
            //assert.notEqual(threadTextVal.indexOf(res.body[0].text),-1);
            assert.equal(res.body.text, threadText);
            assert.property(res.body, "_id");
            assert.property(res.body, "text");
            assert.property(res.body, "created_on");
            assert.property(res.body, "bumped_on");
            assert.property(res.body, "replies");
            assert.isArray(res.body.replies);

            if (res.body.replies.length >= 1) {
              let totalReplies = res.body.replies.length - 1;
              assert.property(res.body.replies[0], "_id");
              assert.property(res.body.replies[0], "text");
              assert.property(res.body.replies[0], "created_on");
              assert.equal(
                res.body.replies[totalReplies].created_on,
                res.body.bumped_on
              );
              replyId = res.body.replies[0]._id;
            }

            // console.log(threadId);
            done();
          });
      });
    });

    suite("PUT", function() {
      test("test 10- Put request updates reported if correct reply_id and correct thread_id provided", function(done) {
        //console.log(threadId,replyId)
        chai
          .request(server)
          .put("/api/replies/functiontest")
          .send({ thread_id: threadId, reply_id: replyId })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });

    suite("DELETE", function() {

      test("test 11- delete reply request does not update if incorrect reply delete_password provided", function(done) {
        chai
          .request(server)
          .delete("/api/replies/functiontest")
          .send({
            thread_id: threadId,
            reply_id: replyId,
            delete_password: "gibberish"
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });

      test("test 12- delete reply request updates reply text if correct reply_id and correct thread_id and correct reply delete_password provided", function(done) {
        chai
          .request(server)
          .delete("/api/replies/functiontest")
          .send({
            thread_id: threadId,
            reply_id: replyId,
            delete_password: replyPassword
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });

    suite("DELETE", function() {
      test("test 4- delete thread unsuccessful upon correct thread id and incorrect delete password", function(done) {
        chai
          .request(server)
          .delete("/api/threads/functiontest")
          .send({ thread_id: threadId, delete_password: "gibberish" })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "incorrect password");
          });
        done();
      });

      test("test 5- delete thread successful upon correct thread id and correct delete password", function(done) {
        chai
          .request(server)
          .delete("/api/threads/functiontest")
          .send({ thread_id: threadId, delete_password: threadPassword })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
          });
        done();
      });
    });

  });
});
