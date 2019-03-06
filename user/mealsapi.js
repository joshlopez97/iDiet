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
   * Calls Nutrition API to get nutritional information about recipe with
   * given id. Then makes second required call to get price information
   * using ingredients in recipe. Finally hands off all data to callback
   * function for further action.
   */
	function getFoodInfo(meal_id, unirest, callback)
	{
    let foodData = {};
    const priceRegex = /(?:Cost per Serving: )(\$\d+\.\d\d)/;
    foodData["mid"] = meal_id;
		unirest.get(`https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/${meal_id}/information?includeNutrition=true`)
		.header("X-RapidAPI-Key", "62649045e6msh29f8aefde649a9bp1591edjsnf389cd9bbedf")
		.end(function(results) {
		  // Store nutritional info
      for (let nutrient of results.body.nutrition.nutrients)
      {
        if (nutrient.title.toLowerCase() === 'calories')
          foodData["calories"] = nutrient.amount;
        if (nutrient.title.toLowerCase() === 'protein')
          foodData["protein"] = nutrient.amount;
        if (nutrient.title.toLowerCase() === 'carbohydrates')
          foodData["carbs"] = nutrient.amount;
        if (nutrient.title.toLowerCase() === 'fat')
          foodData["fat"] = nutrient.amount;
      }
      foodData["imagelink"] = results.body.image;
      foodData["title"] = results.body.title;

      // Get and store price info
		  let recipeStr = "";
      for (let ingredient of results.body.extendedIngredients)
        recipeStr += ingredient.originalString + "\n";

      unirest.post("https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/visualizePriceEstimator")
        .header("X-RapidAPI-Key", "62649045e6msh29f8aefde649a9bp1591edjsnf389cd9bbedf")
        .header("Accept", "text/html")
        .header("Content-Type", "application/x-www-form-urlencoded")
        .send("defaultCss=true")
        .send("mode=1")
        .send("showBacklink=false")
        .send(`ingredientList=${recipeStr}`)
        .send("servings=1")
        .end(function(results){
          foodData["price"] = priceRegex.exec(results.body)[1];
          callback(foodData);
        });
    });
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
   * Generate meal plan for user.
   * @param callback Action to perform after meals are generated
   */
	MealsApi.prototype.generateDailyMeals = function(callback)
	{
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
		  for (let i = 0; i < result.body.meals.length; i++)
		  {
		    console.log(result.body.meals[i].imageUrls);
		    addNewMeal(result.body.meals[i], email, connection, function(){});
		  }
		});


		// Ingredients extraction, extracts the ingredients from each index of meals
    // which is is a list of recipe IDs returned by callback function (getRecipesFor)
    let recipeCallback = function(recipes)
    {
      let mealplan = [];
      const priceRegex = /(?:Cost per Serving: )(\$\d+\.\d\d)/;
      let getDinner = function(){
        getFoodInfo(recipes[2].mrid, unirest, function(results){
          mealplan.push(results);
          callback(mealplan);
        });
      };
      let getLunch = function(){
        getFoodInfo(recipes[1].mrid, unirest, function(results){
          mealplan.push(results);
          getDinner();
        });
      };
      let getBreakfast = function(){
        getFoodInfo(recipes[0].mrid, unirest, function(results){
          mealplan.push(results);
          getLunch();
        });
      };
      getBreakfast();
    };
		getRecipesFor(email, connection, recipeCallback);
	};

	function getNutrients(foodData, unirest, callback)
  {
    unirest.get(`https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/${foodData["mid"]}/information?includeNutrition=true`)
      .header("X-RapidAPI-Key", "62649045e6msh29f8aefde649a9bp1591edjsnf389cd9bbedf")
      .end(callback);
  }



  /**
   * Creates MealsApi object
   */
	exports.create = function(dependencies) {
	  return new MealsApi(dependencies);
	};

}());