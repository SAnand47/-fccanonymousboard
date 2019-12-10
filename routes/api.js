/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
const bcrypt = require("bcryptjs");
const Board = require("../database/dbModule.js");
const mongoose = require("mongoose");

//-- secure password and check password functions (returns true or false)
function securePassword(rawPassword) {
  const saltRounds = 12;
  return bcrypt.hashSync(rawPassword, saltRounds);
}

function checkPassword(givenPassword, hash) {
  return bcrypt.compareSync(givenPassword, hash);
}

module.exports = function(app) {
  app
    .route("/api/threads/:board")
    .post(function(req, res) {
      const { text, delete_password } = req.body;
      const board = req.params.board;
      //console.log(board,text,delete_password)

      //--ensure all required fields are entered by the user
      if (!(board && text && delete_password)) {
        res.send("ensure all the required fields are filled");
      }
      //-- hash the password and store in a variable for storing in database
      var hash = securePassword(delete_password);

      Board.find({})
        .exec()
        .then(docs => {
          //console.log(docs)
          var board1 = new Board({
            board: board,
            text: text,
            password: hash
          });
          board1.save();
          return res.redirect("/b/" + board + "/");
        });
    })
    .get(function(req, res) {
      const board = req.params.board;
      Board.find({ board: board })
        .select("_id text created_on bumped_on replies._id replies.text replies.created_on")
        .limit(10)
        .exec()
        .then(docs => {
          let arr = [];
          //--sort the replies array in descending order and get the replycount
          if (docs) {
            docs.forEach(doc => {
              let obj = {};
              doc.replies.sort((a, b) => {
               return Date.parse(b.created_on) - Date.parse(a.created_on);
              });
              obj._id = doc._id;
              obj.text = doc.text;
              obj.created_on = doc.created_on;
              obj.bumped_on = doc.bumped_on;
              if (doc.replies.length <= 3) {
                obj.replies = [...doc.replies];
              } else {
                obj.replies = [doc.replies[0], doc.replies[1], doc.replies[2]];
              }
              obj.replycount = doc.replies.length;
              arr.push(obj);
            });
            return res.send(arr);
          } else {
            return res.send("no document in database");
          }
        });
    })
    .put(function(req, res) {
      const { report_id } = req.body; //-- report_id is the name of the input in form in board.html
      //console.log(report_id);
      Board.findByIdAndUpdate(
        { _id: report_id },
        { reported: true },
        { new: true },
        (err, doc) => {
          if (err) {
            return res.send(
              "error in finding and updating reported field in the thread "
            );
          }
          if (doc) {
            //console.log(doc.reported)
            return res.send("success");
          } else {
            return res.send("no documents of the given id found");
          }
        }
      );
    })

    .delete(function(req, res) {
      const { thread_id, delete_password } = req.body;
      //console.log(req.body,thread_id,delete_password)

      //--find, validate the password by the user and delete if password right
      Board.findById({ _id: thread_id })
        .select("password")
        .exec()
        .then(doc => {
          if (doc) {
           // console.log(doc);
            if (checkPassword(delete_password, doc.password)) {
              doc.deleteOne();
              return res.send("success");
            } else {
              return res.send("incorrect password");
            }
          }
          if (!doc) {
            return res.send("no document found with the given id");
          }
        });
    });

  app
    .route("/api/replies/:board")
    .post(function(req, res) {
      const { thread_id, text, delete_password } = req.body;
      const board = req.params.board;
      //console.log(req.body,board,thread_id,text,delete_password)
      //--ensure all required fields are entered by the user
      if (!(board && thread_id && text && delete_password)) {
        res.send("ensure all the required fields are filled");
      }
      //-- hash the password and store in a variable for storing in database
      var hash = securePassword(delete_password);

      Board.findById({ _id: thread_id })
        .exec()
        .then(doc => {
          //console.log(doc);
          if (doc) {
            let obj = {};
            obj.text = text;
            obj.password = hash;
            doc.replies.push(obj);
            doc.save();
            return res.redirect(`/b/${board}/${thread_id}`);
          } else {
            return res.send("no threads of the given id found ");
          }
        });
    })

    .get(function(req, res) {
      const board = req.params.board;
      const { thread_id } = req.query;
      //console.log(thread_id,board);
      if(!thread_id) {return res.send("ensure thread_id entered is correct")}

      Board.findById({ _id: thread_id })
        .select({ reported: 0, board: 0, "replies.reported": 0, __v: 0 })
        .exec()
        .then(doc => {
          if (doc) {
            //console.log(doc);
            //-- get the order for display on page
            let obj = {};
            obj._id = doc._id;
            obj.text = doc.text;
            obj.created_on = doc.created_on;
            obj.bumped_on = doc.bumped_on;
            obj.replies = [...doc.replies];

            return res.json(obj);
          } else {
            return res.send("ensure thread_id entered is correct");
          }
        });
    })

    .put(function(req, res) {
      const { thread_id, reply_id } = req.body;
      //console.log(thread_id,reply_id);

      mongoose.set('useFindAndModify', false);

      Board.findOneAndUpdate(
        { _id: thread_id, "replies._id": reply_id },
        { $set: { "replies.$.reported": true } },
        { new: true },
        (err, doc) => {
          if (err) {
            return res.send(
              "error in finding and updating the reported field in replies"
            );
          }
          if (doc) {
            //console.log(doc);
            return res.send("success");
          } else {
            return res.send(
              "ensure the ids provided for thread and reply are correct"
            );
          }
        }
      );
    })

    .delete(function(req, res) {
      const { thread_id, reply_id, delete_password } = req.body;
      //console.log(thread_id, reply_id, delete_password);

      Board.findOne(
        { _id: thread_id, "replies._id": reply_id },
        { "replies.$": true }
      )
        .select("replies._id replies.text replies.password")
        .exec()
        .then(doc => {
          if (doc) {
            //console.log(doc)
            //-- validate the password and delete record upon successful validation
            if (checkPassword(delete_password, doc.replies[0].password)) {
             Board.updateOne({ _id: thread_id, "replies._id": reply_id },
            {$set:{"replies.$.text":"[deleted]"}},(err,doc)=>{
              if(err){return res.send("error in updating the text reply to deleted")}
              return res.send("success");
            })               
            } else {
              return res.send("incorrect password");
            }
          }
          if (!doc) {
            return res.send("no document found with the given ids");
          }
        });
    });
};
