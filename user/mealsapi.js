(function() {

	const unirest = require('unirest');

	function MealsApi(options) {
	  this.options = options;
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

		- Meals Table
		rid varchar(50) PRIMARY KEY,
		day int(1),
		price varchar(10),
		calories int,
		picture varchar(255),

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

ß*/

		 // INITIAL MEAL PLAN CREATION FOR USER
		unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/mealplans/generate?timeFrame=day&targetCalories=10000&diet=vegetarian&exclude=shellfish%2C+olives")
		.header("X-RapidAPI-Key", "62649045e6msh29f8aefde649a9bp1591edjsnf389cd9bbedf")
		.end(function (result) {
			// Logs everything for now (Testing)
		  console.log(result.status, result.headers, result.body);
		});


		// TODO Notes:

		// 1) RUN COST ANALYSIS FOR MEAL PLAN (1 API call per ingredient list)

		// 2) STORE Meal Plan Info IN mySQL Database

		// 3) QUERY DB FOR THE PRICE OF MEAL PLAN CLOSEST TO USER BUDGET








	}











	
	exports.create = function(options) {
	  return new MealsApi(options);
	};

}());