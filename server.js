// NPM-installed dependencies
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const unirest = require('unirest');

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
    console.log("Database is connected");
  } else {
    console.log("Error connecting database");
  }
});

// iDiet node modules
let mockuser = {"email" : "josephbarbosaa@gmail.com",
                 "targetCalories" : 2000,
                 "dietType" : "vegetarian",
                 "restrictions" : "shellfish,olives"};

const mealApi = require('./user/mealsapi.js'),
      meals = mealApi.create({"connection": connection,
                              "unirest": unirest,
                              "userinfo": mockuser});

const fitbitApi = require('./user/fitbit.js'),
      fitbit = fitbitApi.create({"connection":connection,
                                 "unirest": unirest});
      
const accountModule = require('./user/account.js'),
      account = accountModule.create({"connection":connection});

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
  if (req.session && req.session.user)
  {
    console.log(req.session.user);
    return res.render('pages/home');
  }
  else
  {
    // User not logged in
    return res.redirect('/start');
  }
});

// Temporary route for bypassing login
router.get('/home', (req, res) => {
  req.session.user = {id: "anon@gmail.com", password: "password"};
  meals.generateDailyMeals(function(){});
  return res.render('pages/home')
});

// Start page
router.get('/start', (req, res) => {
  return res.render('pages/start', {'action':req.query.action, 'error':req.query.error});
});
router.post('/start', (req, res) => {
  let username = req.body.username,
      password = req.body.password;
  account.authenticate(username, password, function(loginSuccess){
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
  let user_info = {"email" : req.body.email,
                 "password" : req.body.password,
                 "firstname" : req.body.firstname,
                 "height" : req.body.height,
                 "weight" : req.body.weight,
                 "age" : req.body.age};
  const values = Object.assign({}, user_info);
  console.log(user_info);

  // Verify Sign Up Info
  const problems = account.verify_user_info(user_info);
  console.log(problems);

  // If no problems found with Sign Up Info, proceed to create user and sign in
  if (problems.length === 0) {
    account.create_user(user_info);
    req.session.user = {id: user_info.email, password: user_info.password, "firstname": user_info.firstname};
    return res.redirect('/personalize');
  }
  // Sign up info invalid, display error on signup page
  else {
    return res.render('pages/signup', data={"problems":problems, "values":user_info});
  }
});

// Personalize Page
router.get('/personalize', (req, res) => {
  return res.render('pages/personalize');
});

router.post('/personalize', (req, res) => {
  return res.redirect('/');
});

// Profile Page
router.get('/profile', (req, res) => {
  return res.render('pages/profile');
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

