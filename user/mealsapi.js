(function() {

	// MealsAPI constructor taking in a dependencies object
	function MealsApi(dependencies) {
	  this.dependencies = dependencies;
	}

	// Callback function to get a list of recipe IDs 
	MealsApi.prototype.getRecipesFor = function(username, callback)
	{
		this.dependencies.connection.query(`SELECT m.mrid FROM Meals m WHERE m.memail = '${username}'`, function(error, results, fields){
			return callback(results);
		});
	};

	// Callback function to get a list of ingredients
	function getIngredients(meal, unirest, callback)
	{
		unirest.get("https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/"+meal+"/information")
		.header("X-RapidAPI-Key", "62649045e6msh29f8aefde649a9bp1591edjsnf389cd9bbedf")
		.end(function (result) {
			return callback(result.body);
		});

	}

  function addNewMeal(meal, connection, callback)
  {
    const sql = `INSERT into Meals(memail, mid, mrid) 
		  	            values ('josephbarbosaa@gmail.com', '1', '${meal.id}')`;

    console.log(sql);
    connection.query(sql, (err) => {
      console.log(sql);
      callback();
    });
  }

	// Function to generate day meals (Name is outdated will eventually change func name to generateDailyMeal)
	MealsApi.prototype.generateWeeklyMeals = function(callback)
	{
    let link = "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/mealplans/generate?timeFrame=day&targetCalories=" + this.dependencies.mockuser.targetCalories + "&diet=" + this.dependencies.mockuser.dietType + "&exclude=shellfish%2C+olives";
		
		//INITIAL MEAL PLAN CREATION FOR USER
    const connection = this.dependencies.connection,
          unirest = this.dependencies.unirest;

		unirest.get(link)
		.header("X-RapidAPI-Key", "62649045e6msh29f8aefde649a9bp1591edjsnf389cd9bbedf")
		.end(function (result) {
			// Logs everything for now (Testing)
		  console.log(result.status, result.headers, result.body);

		  for (let i = 0; i < result.body.meals.length; i++)
		  {
		    addNewMeal(result.body.meals[i], connection, function(){});
		  }
		});

		// Ingredients extraction, extracts the ingredients from each index of meals
    // which is is a list of recipe IDs returned by callback function (getRecipesFor)

    let recipeCallback = function(recipes)
    {
      let recipeStr = "";
      for (let i = 0; i < recipes.length; i++)
      {
        getIngredients(recipes[i].mrid, unirest, function(ingredients){
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
    };
		this.getRecipesFor("josephbarbosaa@gmail.com", recipeCallback);





		// TODO Notes:
		// 1) RUN COST ANALYSIS FOR MEAL PLAN (1 API call per ingredient list)
		// 2) STORE Meal Plan Info IN mySQL Database
		// 3) QUERY DB FOR THE PRICE OF MEAL PLAN CLOSEST TO USER BUDGET
	}











	// Providing interface for users to create a MealsApi object.
	exports.create = function(dependencies) {
	  return new MealsApi(dependencies);
	};

}());