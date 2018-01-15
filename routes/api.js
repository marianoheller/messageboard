'use strict';

var expect = require('chai').expect;

module.exports = function (app) {
  
  app.route('/api/threads/:board')
  .post( function( req, res) {
    const { board } = req.params;
    return res.redirect(`/b/${board}`);
  })
    
  app.route('/api/replies/:board');

};
