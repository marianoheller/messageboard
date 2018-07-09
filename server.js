'use strict';
require('dotenv').config();

var express     = require('express');
var bodyParser  = require('body-parser');
var expect      = require('chai').expect;
var cors        = require('cors');
var mongoose    = require('mongoose');
var morgan      = require('morgan');

var apiRoutes         = require('./routes/api.js');
var fccTestingRoutes  = require('./routes/fcctesting.js');
var runner            = require('./test-runner');


mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URL,{
  useNewUrlParser: true,
  socketTimeoutMS: 10000,
}).then(
  () => { console.log("Connected to DB succesfully!") },
  err => { console.log("Error connecting to the DB.", err.message); }
);


var app = express();

app.use(morgan('combined'));
app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/*',function(req,res,next) {
  //Only allow your site to be loading in an iFrame on your own pages.
  res.header('X-Frame-Options', 'SAMEORIGIN');
  //Do not allow DNS prefetching
  res.header('X-DNS-Prefetch-Control' , 'off');
  //Only allow your site to send the referrer for your own pages.
  res.header('Referrer-Policy', 'same-origin');
  next();
});

//Sample front-end
app.route('/b/:board/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/board.html');
  });
app.route('/b/:board/:threadid')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/thread.html');
  });

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);

//Sample Front-end

    
//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port " + (process.env.PORT || 3000));
  if(process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch(e) {
        var error = e;
          console.log('Tests are not valid:');
          console.log(error);
      }
    }, 1500);
  }
});

module.exports = app; //for testing
