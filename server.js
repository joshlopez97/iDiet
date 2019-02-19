const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();

// Connecting MYSQL Database
const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'idiet.cqywkz4otd3h.us-east-2.rds.amazonaws.com',
  user: 'idiet',
  password: '1a2b3c4d5e',
  database: 'idiet'
});

connection.connect(function(err){
if(!err) {
    console.log("Database is connected ... nn");
} else {
    console.log("Error connecting database ... nn");
}
});

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
      res.render('pages/home');
  }
  else {
    // User not logged in
    res.redirect('/start');
  }
});

// Start page
router.get('/start', (req, res) => {
  res.render('pages/start')
});
router.post('/start', (req, res) => {
  req.session.user = {id: req.body.username, password: req.body.password};
  return res.redirect('/');
});

// Sign up page (Includes INSERT into DB upon Account Creation)
router.get('/signup', (req, res) => {
  res.render('pages/signup')
});

router.post('/signup', (req, res) => {
  let username = req.body.username,
      password = req.body.password,
      firstname = req.body.firstname,
      height = req.body.height,
      weight = req.body.weight,
      age = req.body.age;

  // Inserting Post Request
  const sql = `INSERT into Users(Username, UserPassword, FirstName, Height, Weight, Age) 
                values (${username}, ${password}, ${firstname}, ${height}, ${weight}, ${age})`;
  connection.query(sql, (err) => {
          if(err) throw err;
          console.log(sql);
  });

  req.session.user = {id: username, password: password};

  return res.redirect('/');
});

// Profile Page
router.get('/profile', (req, res) => {
  res.render('pages/profile');
});

// Logout Current User
router.get('/logout', (req, res) => {
  if (req.session) {
    // delete session object
    req.session.destroy(() => {
      res.redirect('/');
    });
  }
});
