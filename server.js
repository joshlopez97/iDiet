// NPM-installed dependencies
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const unirest = require('unirest');
const querystring = require('querystring');

// Connecting MYSQL Database
const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'idiet.cqywkz4otd3h.us-east-2.rds.amazonaws.com',
  user: 'idiet',
  password: '1a2b3c4d5e',
  database: 'idiet',
  // for casting type BIT to boolean values
  typeCast: function castField(field, useDefaultTypeCasting) {

    if ( ( field.type === "BIT" ) && ( field.length === 1 ) ) {

      let bytes = field.buffer();
      return( bytes[0] === 1 );

    }

    return( useDefaultTypeCasting() );
  }
});
connection.connect(function(err){
  if(!err) {
    console.log("Database is connected");
//     connection.query(`
// DESCRIBE Account;
//     `,
//       (e,r)=>{if(e)throw(e);console.log(r);});
  } else {
    console.log("Error connecting database");
  }
});

// iDiet node modules
let mockuser = {"email" : "joshlopez97@gmail.com",
                 "targetCalories" : 2000,
                 "dietType" : "",
                 "restrictions" : ""};

const accountModule = require('./user/account.js'),
      account = accountModule.create({"connection":connection});

const preferencesModule = require('./user/preferences.js'),
      preferences = preferencesModule.create({"connection":connection});

const mealApi = require('./health/mealsapi.js'),
      meals = mealApi.create({"connection": connection,
                              "unirest": unirest,
                              "account": account,
                              "preferences": preferences,
                              "mysql": mysql});

const fitbitApi = require('./health/fitbit.js'),
      fitbit = fitbitApi.create({"connection":connection,
                                 "unirest": unirest,
                                 "account": account});

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
    let fitbit_key = req.query.code;
    if (typeof fitbit_key !== 'undefined')
    {
      fitbit.login(req.session.user.id, fitbit_key, function(resp) {
        if (resp.result === "success")
          return res.redirect("/");
        else
        {
          account.get_account_info(req.session.user.id, function(account_info){
            console.log(account_info);
            return res.render('pages/home', {'email': req.session.user.id, "acc": account_info});
          });
        }
      });
    }
    else
    {
      account.get_account_info(req.session.user.id, function(account_info){
        console.log(account_info);
        return res.render('pages/home', {'email': req.session.user.id, "acc": account_info});
      });
    }
  }
  else
  {
    // User not logged in
    return res.redirect('/start');
  }
});

// Temporary route for bypassing login
router.get('/home', (req, res) => {
  req.session.user = {id: mockuser.email, password: "password"};

  let fitbit_key = req.query.code;
  if (typeof fitbit_key !== 'undefined')
  {
    fitbit.login(req.session.user.id, fitbit_key, function(result) {
      console.log(result);
    });
  }
  account.get_account_info(req.session.user.id, function(account_info){
    // connection.query(`DELETE FROM UserMeal WHERE email='${req.session.user.id}'`,
    //   (e,r)=>{if (e) throw e; console.log(r);});

    return res.render('pages/home', {'email': req.session.user.id, "acc": account_info});
  });
});

// API Endpoint to get meals for specified user and day
router.get('/api/meals', (req, res) => {
  const email = req.query.email,
        day   = req.query.day;
  res.setHeader('Content-Type', 'application/json');
  if (typeof email !== 'undefined' && typeof day !== 'undefined')
  {
    const sql = `
    SELECT me.*
    FROM
      MealEntry me
    WHERE
      me.mid IN (
        SELECT
          um.mid
        FROM
          UserMeal um
        WHERE
          um.email = '${email}'
          AND um.mindex = ${day}
      );
    `;
    connection.query(sql, function(err, result){
      if (err) throw err;
      return res.json({"result": "success", "data": result});
    });
  }
  else
  {
    return res.json({"result": "error", "data": {}});
  }
});

router.get('/api/create/meals', (req, res) => {
  const email = req.query.email;
  res.setHeader('Content-Type', 'application/json');
  if (typeof email !== 'undefined')
  {
    account.account_exists(email, function(result)
    {
      if (result)
      {
        meals.getMealPlan(email, function(mealplan)
        {
          return res.json({"result": "success", "data": mealplan});
        });
      }
      else
      {
        return res.json({"result": "error", "reason": "account does not exist", "data": {}});
      }
    });
  }
  else
  {
    return res.json({"result": "error", "reason": "email not provided", "data": {}});
  }

});

router.get('/api/like', (req, res) => {
  const email  = req.query.email,
        mid    = req.query.mid;
  res.setHeader('Content-Type', 'application/json');
  if (typeof email !== 'undefined' && typeof mid !== 'undefined')
  {
    preferences.likeMeal(email, mid, function(err, resp){
      if (err)
        throw err;
      console.log(resp);
      return res.json({"result": "success"});
    });
  }
  else
  {
    return res.json({"result": "error"});
  }
});

router.get('/api/dislike', (req, res) => {
  const email  = req.query.email,
        mid    = req.query.mid,
        mindex = req.query.mindex;
  res.setHeader('Content-Type', 'application/json');
  if (typeof email !== 'undefined' && typeof mid !== 'undefined' && mindex !== 'undefined')
  {
    preferences.dislikeMeal(email, mid, mindex, function(err, resp){
      console.log(resp);
      meals.replaceMeal(email, mid, mindex, function(newMeal){
        console.log(newMeal);
        return res.json({"result": "success", "data":newMeal});
      });
    });

  }
  else
  {
    return res.json({"result": "error"});
  }
});

router.get('/api/search', (req, res) => {
  const query  = req.query.q;
  console.log(query);
  res.setHeader('Content-Type', 'application/json');
  if (typeof query !== 'undefined')
  {
    console.log('searching')
    meals.search(query, function(results){
      console.log(results);
      return res.json({"result": "success", "data": results})
    });
  }
  else
  {
    console.log("error");
    return res.json({"result": "error"});
  }
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
                   "age" : req.body.age,
                   "gender": req.body.gender};
  const values = Object.assign({}, user_info);

  // Verify Sign Up Info
  const problems = account.verify_user_info(user_info);

  // If no problems found with Sign Up Info, proceed to create user and sign in
  if (problems.length === 0) {
    const query = querystring.stringify(user_info);
    return res.redirect('/personalize?' + query);
  }
  // Sign up info invalid, display error on signup page
  else {
    return res.render('pages/signup', {"problems":problems, "values":values});
  }
});

// Personalize Page
router.post('/personalize', (req, res) => {
  let user_info = {"email" : req.query.email,
                   "password" : req.query.password,
                   "firstname" : req.query.firstname,
                   "height" : req.query.height,
                   "weight" : req.query.weight,
                   "age" : req.query.age,
                   "gender" : req.query.gender,
                   "budget" : req.body.budget,
                   "goalWeight" : req.body.goalWeight,
                   "activityLevel" : req.body.activityLevel};
  const values = Object.assign({}, user_info);
  console.log(user_info);

  // Verify Sign Up Info
  const problems = account.verify_user_info(user_info);
  console.log(problems);

  // If no problems found with Sign Up Info, proceed to create user and sign in
  if (problems.length === 0) {
    account.create_user(user_info);
    req.session.user = {id: user_info.email, password: user_info.password};
    return res.redirect('/');
  }
  else
  {
    return res.render('pages/personalize', {"problems":problems, "values":values});
  }
});

router.get('/personalize', (req, res) => {
  return res.render("pages/personalize");
});

// Profile Page
router.get('/profile', (req, res) => {
  account.get_account_info(req.session.user.id, function(info){
    return res.render('pages/profile', {"info":info});
  });
});

router.post('/profile', (req, res) => {
  account.get_account_info(req.session.user.id, function(info){
    return res.render('pages/profile', {"info":info});
  });
});

router.get('/search', (req, res) => {
  return res.render('pages/search');
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

