(function() {




	/* Whoever working on the code, please conserve API calls when you can :) */
	//******** COMMENTED OUT API CALLS TO CONSERVE, UNCOMMENT TO TEST ********//




	// Connecting MYSQL Database // Will export into server.js later (here for convenience)
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

	// Need unirest module to work with API (Will eventually be taken in by module and defined in server.js)
	const unirest = require('unirest');

	// MealsAPI constructor taking in a JSON with email, targetCals, dietType, etc.
	function MealsApi(options) {
	  this.options = options;
	}

	// Callback function to get a list of recipe IDs 
	function queryRecipes(callback)
	{
		// REPLACE EMAIL LATER WITH USER INPUT
		connection.query(`SELECT m.mrid FROM Meals m WHERE m.memail = 'josephbarbosaa@gmail.com'`, function(error, results, fields){
			return callback(results);
		});
	}

	// Callback function to get a list of ingredients
	function getIngredients(meal, callback)
	{
		unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/"+meal+"/information")
		.header("X-RapidAPI-Key", "62649045e6msh29f8aefde649a9bp1591edjsnf389cd9bbedf")
		.end(function (result) {
			return callback(result.body);
		});

	}

	// Function to generate day meals (Name is outdated will eventually change func name to generateDailyMeal)
	MealsApi.prototype.generateWeeklyMeals = function()
	{
/* 
		* TOTAL API CALLS PER USER *
		- 1 to generate the meal plan for the day
		- 3 to extract ingredients list per day (1 per meal)
		- 1 to do total cost analysis of all accumulated ingredients list
		TOTAL : 5 API calls per user 

		------------------------------------------------

		* New SQl Tables Interace *
		CREATE Table Meals
		(
			memail varchar(255),
			mid varchar(255),
			mrid varchar(200),
			PRIMARY KEY(mrid)
		);

		CREATE Table Recipes
		(
			r_rid varchar(200),
			r_mid varchar(255),
			price DECIMAL(18,4),
			ingredients varchar(1000), // Make new line 
			calories DECIMAL(18,4),
			protein DECIMAL(10, 4),
			fat DECIMAL(10,4),
			carbs DECIMAL(10,4),
			pricture varchar(255),
			PRIMARY KEY(r_rid, r_mid)
		);
		
		--------------------------------------------------
		
		* User info that will be passed in (Here for reference) *

			let user_info = {"targetCalories" : 2000,
			               "dietType" : (vegeterian, etc)
			               "restriction1" : ""
			               "restriction2" : ""

	  * Indexing into API Results (Instructions) *
	  running index function returns result JSON object
	  result.status has all the status regarding num calls left, etc.
	  result.body.meals[1] // GET INDEX 1 OF MEALS (Day)
	  result.body.nutrition // GET INDEX OF TOTAL NUTRITION (Can't index bc only has total)

*/

/*      ** STORING MEALS SHOULD FIND A WAY TO STORE UNIQUE MEAL ID PER USER RIGHT NOW ONLY STORING ALL RECIPES FOR AN EMAIL ** // SEMI DONE

		let link = "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/mealplans/generate?timeFrame=day&targetCalories=" + this.options.targetCalories + "&diet=" + this.options.dietType + "&exclude=shellfish%2C+olives";
		
		//INITIAL MEAL PLAN CREATION FOR USER
		unirest.get(link)
		.header("X-RapidAPI-Key", "62649045e6msh29f8aefde649a9bp1591edjsnf389cd9bbedf")
		.end(function (result) {
			// Logs everything for now (Testing)
		  console.log(result.status, result.headers, result.body);

		  for (i = 0; i < result.body.meals.length; i++)
		  {
		  	const sql = `INSERT into Meals(memail, mrid) 
		  	            values ('josephbarbosaa@gmail.com', '${result.body.meals[i].id}')`;

		  	console.log(sql);
		  	connection.query(sql, (err) => {
		  	  if(err) throw err;
		  	  // IF DUP ENTRY JUST CLOSE CONNECTION, RECIPE EXISTS
		  	  if (err === "ER_DUP_ENTRY")
		  	  	console.log(sql);
		  	});

		  	//console.log(result.body.meals[i].id);
		  }
		});

		HANDLE INGREDIENTS AND NUTRITIONAL INFO 

		****** NOTES ******
		API Call to get ingredients
		Parse ingredients to put a new line per ingredient
		Pass in parsed ingredient list into Cost Analysis API call
		This method below uses a callback using getIngredients which queryRecipes also uses a callback.

*/
		//******************************************************//
		// PROBLEM IS HERE!! Commented out to conserve API calls
		//******************************************************//
		// - Uncomment and run to test

		// Ingredients extraction, extracts the ingredients from each index of meals which is is a list of recipe IDs returned by callback function (queryRecipes)
		// Semi-finished just need to figure out how the inner loop work please read problem:
		// queryRecipes(function(meals)
		// {
		// 	for (i = 0; i < meals.length; i++)
		// 	{	
		// 		getIngredients(meals[i].mrid, function(ingredients)
		// 		{
		// 			// @ Josh - 2/23/19 - Joseph
		// 			// Need a way to do ingredients[i].extendedIngredients.originalString.
		// 			// Async process lets us do ingredients.extendedIngredients rn to print all the ingredient info
		// 			// But probably need another callback to do a loop.
		// 			//
		// 			console.log(ingredients.extendedIngredients);
		// 		});
		// 	}
		// });
/*
		** Cost Analysis Of Meal plan (1 API Call) ** 
			- DONE (Just need to pass in one full string of all ingredients separated by '\n' per ingredient extracted by function above)

		unirest.post("https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/visualizePriceEstimator")
		.header("X-RapidAPI-Key", "62649045e6msh29f8aefde649a9bp1591edjsnf389cd9bbedf")
		.header("Accept", "text/html")
		.header("Content-Type", "application/x-www-form-urlencoded")
		.send("defaultCss=false")
		.send("mode=1")
		.send("showBacklink=false")
		.send("ingredientList=3 oz flour\n5oz cheese")
		.send("servings=2")
		.end(function (result) {
		  console.log(result.status, result.headers, result.body);
		  var str = result.body;

		Returned in HTML, used regex below to extract final price (Working) // Store into DB Under
	 	let prices = str.match(/\$((?:\d|\,)*\.?\d+)/g) || []
	 	let finalPrice = prices[prices.length-1]
		console.log(finalPrice);

		  Store into DB
		});
*/


		// TODO Notes:
		// 1) RUN COST ANALYSIS FOR MEAL PLAN (1 API call per ingredient list)
		// 2) STORE Meal Plan Info IN mySQL Database
		// 3) QUERY DB FOR THE PRICE OF MEAL PLAN CLOSEST TO USER BUDGET
	}











	// Providing interface for users to create a MealsApi object.
	exports.create = function(options) {
	  return new MealsApi(options);
	};

}());