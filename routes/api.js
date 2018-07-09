'use strict';
var Thread = require('../models/thread');
var Reply = require('../models/reply');
var expect = require('chai').expect;

module.exports = function (app) {

  // Added this route for testing purposes
  // To be able to create threads without the recommended redirect
  app.route('/api/_threads/:board')
  .post( ( req, res) => {
    const { board } = req.params;
    const { body } = req;
    Thread.post(board, body)
    .then(t => res.json(t))
    .catch(err => res.status(400).send(err));
  })
  
  app.route('/api/threads/:board')
  .post( ( req, res) => {
    const { board } = req.params;
    const { body } = req;
    Thread.post(board, body)
    .then(() => res.redirect(303,`/b/${board}`))
    .catch(err => res.status(400).send(err));
  })
  .get( (req, res) => {
    const { board } = req.params;
    Thread.getRecentThreads(board)
    .then(threads => res.json(threads))
    .catch(err => res.status(400).send(err));
  })
  .delete( (req, res) => {
    const { board } = req.params;
    const { body } = req;
    Thread.deleteThread(board, body)
    .then(() => res.send('success'))
    .catch(err => res.send('incorrect password'));
  })
  .put( (req, res) => {
    const { board } = req.params;
    const { thread_id } = req.body;
    Thread.report(board, thread_id)
    .then(() => res.send('success'))
    .catch(err => res.send('error reporting'));
  });


  app.route('/api/_replies/:board')
  .post( ( req, res) => {
    const { board } = req.params;
    const { body } = req;
    Thread.reply(board, body)
    .then(reply => res.json(reply))
    .catch(err => {
      res.status(400).send(err)
    });
  });

  app.route('/api/replies/:board')
  .post( ( req, res) => {
    const { board } = req.params;
    const { body } = req;
    Thread.reply(board, body)
    .then(reply => res.redirect(303,`/b/${reply.board}/${reply.thread_id}`))
    .catch(err => res.status(400).send(err));
  })
  .get( (req, res) => {
    const { board } = req.params;
    const { thread_id } = req.query;
    Thread.getFullThread(board, thread_id)
    .then(thread => {
      return res.json(thread);
    })
    .catch(err => res.status(400).send(err));
  })
  .delete( (req, res) => {
    const { board } = req.params;
    const { body } = req;
    Reply.deleteReply(
      board,
      body.thread_id,
      body.reply_id,
      body.delete_password,
    )
    .then(() => res.send('success'))
    .catch(err => {
      res.send('incorrect password');
    });
  })
  .put( (req, res) => {
    const { board } = req.params;
    const { thread_id, reply_id } = req.body;
    Reply.report(board, thread_id, reply_id)
    .then(() => res.send('success'))
    .catch(err => res.send('error reporting'));
  });

};
