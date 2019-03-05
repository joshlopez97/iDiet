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
	function getRecipesFor(username, callback)
	{
		// REPLACE EMAIL LATER WITH USER INPUT
		connection.query(`SELECT m.mrid FROM Meals m WHERE m.memail = '${username}'`, function(error, results, fields){
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

	function getPriceInfo(meal)
  {

  }

	// Function to generate day meals (Name is outdated will eventually change func name to generateDailyMeal)
	MealsApi.prototype.generateWeeklyMeals = function(callback)
	{

      //** STORING MEALS SHOULD FIND A WAY TO STORE UNIQUE MEAL ID PER USER RIGHT NOW ONLY STORING ALL RECIPES FOR AN EMAIL ** // SEMI DONE

		let link = "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/mealplans/generate?timeFrame=day&targetCalories=" + this.options.targetCalories + "&diet=" + this.options.dietType + "&exclude=shellfish%2C+olives";
		
		//INITIAL MEAL PLAN CREATION FOR USER

		unirest.get(link)
		.header("X-RapidAPI-Key", "62649045e6msh29f8aefde649a9bp1591edjsnf389cd9bbedf")
		.end(function (result) {
			// Logs everything for now (Testing)
		  console.log(result.status, result.headers, result.body);

		  for (let i = 0; i < result.body.meals.length; i++)
		  {
		  	const sql = `INSERT into Meals(memail, mid, mrid) 
		  	            values ('josephbarbosaa@gmail.com', '1', '${result.body.meals[i].id}')`;

		  	console.log(sql);
		  	connection.query(sql, (err) => {
		  	  	console.log(sql);
		  	});
		  }
		});

		//HANDLE INGREDIENTS AND NUTRITIONAL INFO 

		//****** NOTES ******
		//API Call to get ingredients
		//Parse ingredients to put a new line per ingredient
		//Pass in parsed ingredient list into Cost Analysis API call
		//This method below uses a callback using getIngredients which getRecipesFor also uses a callback.


		//******************************************************//
		// PROBLEM IS HERE!! Commented out to conserve API calls
		//******************************************************//
		// - Uncomment and run to test

		// Ingredients extraction, extracts the ingredients from each index of meals which is is a list of recipe IDs returned by callback function (getRecipesFor)
		// Semi-finished just need to figure out how the inner loop work please read problem:

		getRecipesFor("josephbarbosaa@gmail.com", function(recipes)
		{
		  let recipeStr = "";
			for (let i = 0; i < recipes.length; i++)
			{
			  getIngredients(recipes[i].mrid, function(ingredients){
			    callback(ingredients);
			    for (let ingredient of ingredients.extendedIngredients)
          {
            recipeStr += ingredient.originalString + "\n";
          }
          // unirest.post("https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/visualizePriceEstimator")
          //   .header("X-RapidAPI-Key", "62649045e6msh29f8aefde649a9bp1591edjsnf389cd9bbedf")
          //   .header("Accept", "text/html")
          //   .header("Content-Type", "application/x-www-form-urlencoded")
          //   .send("defaultCss=true")
          //   .send("mode=1")
          //   .send("showBacklink=false")
          //   .send(`ingredientList=${recipeStr}`)
          //   .send("servings=1")
          //   .end(function (result) {
          //     console.log(result.body);
          //   });
        });
			}
		});





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