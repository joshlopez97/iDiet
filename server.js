const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
var mysql = require('mysql');

var con = mysql.createConnection({
  host: "idiet.cqywkz4otd3h.us-east-2.rds.amazonaws.com",
  user: "idiet",
  password: "1a2b3c4d5e"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

// Set static files folder
app.use(express.static('static'));

// Set view engine
app.set('view engine', 'ejs');

// Add modules for parsing forms and url params
let urlEncodedParser = bodyParser.urlencoded({extended: true});
app.use(urlEncodedParser);
app.use(bodyParser.json());

// Add express session module
app.use(session({secret: "secret key",
                 resave: true,
                 saveUninitialized: true}));

// Mount the router on the app
const router = express.Router();
app.use('/', router);

// Start the app
const port = 5000;
app.listen(port, function () {
    console.log(`Running on port ${port}`);
});

// Home Page
router.get('/', function (req, res) {
  // User is logged in
  if (req.session && req.session.user) {
      res.render('pages/home');
  }
  else {
    // User not logged in
    res.redirect('/start');
  }
});

// Start page
router.get('/start', function(req, res) {
  return res.render('pages/start')
});
router.post('/start', function(req, res) {
  req.session.user = {id: req.body.username, password: req.body.password};
  return res.redirect('/');
});

// Sign up page
router.get('/signup', function(req, res) {
  return res.render('pages/signup');
});
router.post('/signup', function(req, res) {
  return res.redirect('/');
});

// Login page
router.get('/login', function(req, res) {
  return res.render('pages/login');
});
router.post('/login', function(req, res) {
  req.session.user = {id: req.body.username, password: req.body.password};
  return res.redirect('/');
});

// Profile Page
router.get('/profile', function(req, res) {
  res.render('pages/profile');
});

// Logout Current User
router.get('/logout', function(req, res) {
  if (req.session) {
    // delete session object
    req.session.destroy(function(err) {
      res.redirect('/');
    });
  }
});
