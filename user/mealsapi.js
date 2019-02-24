(function() {

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

	const unirest = require('unirest');




	function MealsApi(options) {
	  this.options = options;
	}

	function queryRecipes(callback)
	{
		// REPLACE EMAIL LATER WITH USER INPUT
		connection.query(`SELECT m.mrid FROM Meals m WHERE m.memail = 'josephbarbosaa@gmail.com'`, function(error, results, fields){
			return callback(results);
		});
	}

	function getIngredients(meal, callback)
	{
		unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/"+meal+"/information")
		.header("X-RapidAPI-Key", "62649045e6msh29f8aefde649a9bp1591edjsnf389cd9bbedf")
		.end(function (result) {
			return callback(result.body);
		});

	}

	MealsApi.prototype.generateWeeklyMeals = function()
	{
/* 
		* TOTAL API CALLS PER USER *
		- 1 to generate the meal plan for the day
		- 3 to extract ingredients list per day (1 per meal)
		- 1 to do total cost analysis of all accumulated ingredients list
		TOTAL : 5 API calls per user 

		* NEW SQL New Tables To Be Added *

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


		- Nutritional table
		rid varchar(50) PRIMARY KEY Referenced FROM Meals,
		day int(1) PRIMARY KEY Referenced FROM Meals,
		calories DECIMAL(10),
		protein DECIMAL(10),
		fat DECIMAL(10),
		carbs DECIMAL(10)
		

		* User info that will be passed in (Here for reference) *

			let user_info = {"targetCalories" : 2000,
			               "dietType" : (vegeterian, etc)
			               "restriction1" : ""
			               "restriction2" : ""

	  * Indexing into API Results (Instructions) *

	  result.status has all the status regarding num calls left, etc.

	  result.body.meals[1] // GET INDEX 1 OF MEALS (Day)
	  result.body.nutrition // GET INDEX OF TOTAL NUTRITION (Can't index bc only has total)

*/

		// **STORING MEALS SHOULD FIND A WAY TO STORE UNIQUE MEAL ID PER USER RIGHT NOW ONLY STORING ALL RECIPES FOR AN EMAIL** // SEMI DONE

		// let link = "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/mealplans/generate?timeFrame=day&targetCalories=" + this.options.targetCalories + "&diet=" + this.options.dietType + "&exclude=shellfish%2C+olives";
		
		// //INITIAL MEAL PLAN CREATION FOR USER
		// unirest.get(link)
		// .header("X-RapidAPI-Key", "62649045e6msh29f8aefde649a9bp1591edjsnf389cd9bbedf")
		// .end(function (result) {
		// 	// Logs everything for now (Testing)
		//   console.log(result.status, result.headers, result.body);

		//   for (i = 0; i < result.body.meals.length; i++)
		//   {
		//   	const sql = `INSERT into Meals(memail, mrid) 
		//   	            values ('josephbarbosaa@gmail.com', '${result.body.meals[i].id}')`;

		//   	console.log(sql);
		//   	connection.query(sql, (err) => {
		//   	  if(err) throw err;
		//   	  // IF DUP ENTRY JUST CLOSE CONNECTION, RECIPE EXISTS
		//   	  if (err === "ER_DUP_ENTRY")
		//   	  	console.log(sql);
		//   	});

		//   	//console.log(result.body.meals[i].id);
		//   }
		// });



		// HANDLE INGREDIENTS AND NUTRITIONAL INFO 

		// NOTESSSS *****

		// API Call to get ingredients
		// Parse ingredients to put a new line per ingredient
		// Pass in parsed ingredient list into Cost Analysis API call
		// This method below uses a callback using getIngredients which queryRecipes also uses a callback.

		queryRecipes(function(meals)
		{
			for (i = 0; i < meals.length; i++)
			{	
				getIngredients(meals[i].mrid, function(ingredients)
				{
					// @ Josh - 2/23/19 - Joseph
					// Need a way to do ingredients[i].extendedIngredients.originalString.
					// Async process lets us do ingredients.extendedIngredients rn to print all the ingredient info
					// But probably need another callback to do a loop.
					//
					console.log(ingredients.extendedIngredients);
				});
			}
		});


		  //console.log(result.status, result.headers, result.body);



		// console.log(num);

		// Cost Analysis Of Meal plan (1 API Call)
		// unirest.post("https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/visualizePriceEstimator")
		// .header("X-RapidAPI-Key", "62649045e6msh29f8aefde649a9bp1591edjsnf389cd9bbedf")
		// .header("Accept", "text/html")
		// .header("Content-Type", "application/x-www-form-urlencoded")
		// .send("defaultCss=false")
		// .send("mode=1")
		// .send("showBacklink=false")
		// .send("ingredientList=3 oz flour\n5oz cheese")
		// .send("servings=2")
		// .end(function (result) {
		//   console.log(result.status, result.headers, result.body);
		//   var str = result.body;



		// // Extracting the total cost from return.
	 //    let prices = str.match(/\$((?:\d|\,)*\.?\d+)/g) || []
	 //    let finalPrice = prices[prices.length-1]

		//   console.log(finalPrice);

		//   // Store into DB
		// });






		// TODO Notes:

		// 1) RUN COST ANALYSIS FOR MEAL PLAN (1 API call per ingredient list)

		// 2) STORE Meal Plan Info IN mySQL Database

		// 3) QUERY DB FOR THE PRICE OF MEAL PLAN CLOSEST TO USER BUDGET








	}











	
	exports.create = function(options) {
	  return new MealsApi(options);
	};

}());