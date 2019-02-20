// NPM-installed dependencies
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');

// iDiet node modules
const userauth = require('./user/auth.js');

const app = express();

// Set static files folder
app.use(express.static('static'));

// Set view engine
app.set('view engine', 'ejs');

// Add modules for parsing forms and url params
const urlEncodedParser = bodyParser.urlencoded({extended: true});
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
app.listen(port, () => {
  console.log(`Running on port ${port}`);
});


// Home Page
router.get('/', (req, res) => {
  // User is logged in
  if (req.session && req.session.user) {
      return res.render('pages/home');
  }
  else {
    // User not logged in
    return res.redirect('/start');
  }
});

// Start page
router.get('/start', (req, res) => {
  return res.render('pages/start', {'action':req.query.action, 'error':req.query.error});
});
router.post('/start', (req, res) => {
  let username = req.body.username,
      password = req.body.password;
  userauth.authenticate(username, password, function(loginSuccess){
    if (loginSuccess)
    {
      req.session.user = {id: req.body.username, password: req.body.password};
      return res.redirect('/');
    }
    else
    {
      return res.redirect('/start?action=login&error=1');
    }
  });
});

// Sign up page (Includes INSERT into DB upon Account Creation)
router.get('/signup', (req, res) => {
  return res.render('pages/signup')
});

router.post('/signup', (req, res) => {
  let user_info = {"username" : req.body.username,
                 "password" : req.body.password,
                 "firstname" : req.body.firstname,
                 "lastname" : req.body.lastname,
                 "height" : req.body.height,
                 "weight" : req.body.weight,
                 "email" : req.body.email,
                 "phone" : req.body.phone,
                 "age" : req.body.age};

  info = user_info;
  // Sign up info is valid, create user and sign in
  if (userauth.verify_user_info(user_info)) {
    userauth.create_user(user_info);
    req.session.user = {id: user_info.username, password: user_info.password};
    return res.redirect('/');
  }
  // Sign up info invalid, display error on signup page
  else {
    return res.render('pages/signup');
  }
});

// Callback function for profile page
function myFunc(username, password, callback) {
  const mysql = require('mysql');
  const connection = mysql.createConnection({
    host: 'idiet.cqywkz4otd3h.us-east-2.rds.amazonaws.com',
    user: 'idiet',
    password: '1a2b3c4d5e',
    database: 'idiet'
  });

   connection.query('SELECT * FROM Users WHERE UserName = ?', [username], function (err, result, fields){
    if (err) throw err;
    return callback(result);
  });
};

// Profile Page
router.get('/profile', (req, res) => {

  // Using callback
  myFunc(req.session.user.id, req.session.user.password, function(returnVariable)
  {

    return res.render('pages/profile', {name:returnVariable[0].FirstName, username: returnVariable[0].UserName, lname: returnVariable[0].LastName, height: returnVariable[0].Height, weight: returnVariable[0].Weight, age: returnVariable[0].Age, phone: returnVariable[0].Phone, email: returnVariable[0].Email});
  });
});



// Logout Current User
router.get('/logout', (req, res) => {
  if (req.session) {
    // delete session object
    req.session.destroy(() => {
      return res.redirect('/');
    });
  }
});
