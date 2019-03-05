/**
 * This module is responsible for making calls to the Nutrition API in order to generate meal plans for
 * users, store meals plans in the SQL database, and generate price/nutritional information.
 */
(function() {

  /**
   * This constructor creates a new MealsApi object with the provided dependencies.
   * @param dependencies
   * @constructor
   */
	function MealsApi(dependencies) {
	  this.dependencies = dependencies;
	}

  /**
   * Queries for all meals currently in Meals table for user with
   * provided email.
   */
	function getRecipesFor(email, connection, callback)
	{
		connection.query(`SELECT m.mrid FROM Meals m WHERE m.memail = '${email}'`, function(error, results, fields){
			return callback(results);
		});
	}

  /**
   * Calls Nutrition API to get list of ingredients for meal with meal_id.
   */
	function getIngredients(meal_id, unirest, callback)
	{
		unirest.get(`https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/${meal_id}/information`)
		.header("X-RapidAPI-Key", "62649045e6msh29f8aefde649a9bp1591edjsnf389cd9bbedf")
		.end(callback);
	}

  /**
   * Add new meal to table for user with provided email. This table only contains the meals
   * on the current meal plan of the user.
   */
  function addNewMeal(meal, email, connection, callback)
  {
    const sql = `INSERT into Meals(memail, mid, mrid) 
		  	            values ('${email}', '1', '${meal.id}')`;

    connection.query(sql, callback);
  }

  /**
   *
   * @param callback Action to perform after meals are retrieved
   */
	MealsApi.prototype.generateDailyMeals = function(callback)
	{
		//INITIAL MEAL PLAN CREATION FOR USER
    const connection = this.dependencies.connection,
          unirest = this.dependencies.unirest,
          email = this.dependencies.userinfo.email,
          link = "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/mealplans/" +
                 "generate?timeFrame=day" +
                 "&targetCalories=" + this.dependencies.userinfo.targetCalories +
                 "&diet=" + this.dependencies.userinfo.dietType +
                 "&exclude=" + encodeURI(this.dependencies.userinfo.restrictions);

		unirest.get(link)
		.header("X-RapidAPI-Key", "62649045e6msh29f8aefde649a9bp1591edjsnf389cd9bbedf")
		.end(function (result) {
			// Logs everything for now (Testing)
		  console.log(result.status, result.headers, result.body);

		  for (let i = 0; i < result.body.meals.length; i++)
		  {
		    addNewMeal(result.body.meals[i], email, connection, function(){});
		  }
		});

		// Ingredients extraction, extracts the ingredients from each index of meals
    // which is is a list of recipe IDs returned by callback function (getRecipesFor)

    let recipeCallback = function(recipes)
    {
      let recipeStr = "";
      for (let i = 0; i < recipes.length; i++)
      {
        getIngredients(recipes[i].mrid, unirest, function(results){
          const ingredients = results.body;
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
		getRecipesFor(email, connection, recipeCallback);
	};


  /**
   * Creates MealsApi object
   */
	exports.create = function(dependencies) {
	  return new MealsApi(dependencies);
	};

}());