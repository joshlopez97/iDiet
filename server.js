const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();

// Creating the MySQL Connection


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

// Sign up page (Includes INSERT into DB upon Account Creation)
router.get('/signup', function(req, res) {
  return res.render('pages/signup');
});
router.post('/signup', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var firstname = req.body.firstname;
  var height = req.body.height;
  var weight = req.body.weight;
  var age = req.body.age;

  // Connecting MYSQL Database
  var mysql = require('mysql');
  var connection = mysql.createConnection({
    host: 'idiet.cqywkz4otd3h.us-east-2.rds.amazonaws.com',
    user: 'idiet',
    password: '1a2b3c4d5e',
    database: 'idiet'
  });

  // Inserting Post Request
  var sql= "INSERT into Users(Username, UserPassword, FirstName, Height, Weight, Age) values ('"+username+"',  '"+ password+"', '"+ firstname+"', '"+ height+"', '"+ weight+"', '"+ age+"' )";
  connection.query(sql,function(err,rows){
          if(err) throw err;
          res.send("Inserted (1)");
  })

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
