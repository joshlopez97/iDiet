/**
 * This module is responsible for making calls to the Nutrition API in order to generate meal plans for
 * users, store meals plans in the SQL database, and generate price/nutritional information.
 */
(function() {
  const sqlstr = require('sqlstring');

  /**
   * This constructor creates a new MealsApi object with injected dependencies.
   * @param dependencies
   * @constructor
   */
	function MealsApi(dependencies) {
	  this.dependencies = dependencies;
    this.mealRatios   = [0.2, 0.4, 0.4];
    this.budgetRatios = [0.3, 0.35, 0.35];
	}

  /**
   * Creates MealsApi object
   */
  exports.create = function(dependencies) {
    return new MealsApi(dependencies);
  };

  /**
   * Queries for all meals currently in Meals table for user with
   * provided email.
   */
	function getRecipesFor(email, connection, callback)
	{

		connection.query(`SELECT * FROM UserMeal m WHERE m.email = '${email}'`, function(error, results, fields){
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
    foodData["mid"] = meal_id;
    console.log(`Getting info for ${meal_id}`)
		unirest.get(`https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/${meal_id}/information?includeNutrition=true`)
		.header("X-RapidAPI-Key", "62649045e6msh29f8aefde649a9bp1591edjsnf389cd9bbedf")
		.end(function(results) {
		  // Store nutritional info
      for (let nutrient of results.body.nutrition.nutrients)
      {
        if (nutrient.title.toLowerCase() === 'calories')
          foodData["calories"] = Math.round(nutrient.amount);
        if (nutrient.title.toLowerCase() === 'protein')
          foodData["protein"] = Math.round(nutrient.amount);
        if (nutrient.title.toLowerCase() === 'carbohydrates')
          foodData["carbs"] = Math.round(nutrient.amount);
        if (nutrient.title.toLowerCase() === 'fat')
          foodData["fats"] = Math.round(nutrient.amount);
      }
      foodData["imagelink"] = results.body.image;
      foodData["title"] = results.body.title;
      foodData["link"] = results.body.sourceUrl;
      foodData["slink"] = results.body.spoonacularSourceUrl;
      foodData["vegetarian"] = results.body.vegetarian;
      foodData["glutenfree"] = results.body.glutenFree;
      foodData["vegan"] = results.body.vegan;
      foodData["dairyfree"] = results.body.dairyFree;
      foodData["ketogenic"] = results.body.ketogenic;

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
          const priceRegex = /(?:Cost per Serving: )(\$\d+\.\d\d)/;
          let res = priceRegex.exec(results.body);
          if (res !== null && typeof res !== 'undefined' && res.length > 1)
            foodData["price"] = res[1];
          else
          {
            foodData["price"] = "$7.69";
            console.log("ERROR:\n");
            console.log(results.body)
          }
          for (let key in foodData) {
            foodData[key] = sqlstr.escape(foodData[key]);
          }
          callback(foodData);
        });
    });
	}

  /**
   * Assigns list of meals to user by mid (meal id).
   */
  function assignMealsToUser(meals, current, email, connection, callback, offset = 0)
  {
    if (meals.length === 0 || current >= meals.length)
      return callback();
    else
    {
      let index = Math.floor(current / 3) + offset;
      const expire = new Date(),
            dateOfMeal = new Date();

      expire.setHours(24*(index+1),0,0,0);
      dateOfMeal.setHours(24*index,0,0,0);
      let adjustedIndex = dateOfMeal.getDay();

      const id = meals[current]["id"] || meals[current]["mid"];

      const sql = `INSERT into UserMeal(email, mid, expire, mindex) 
		  	            values ('${email}', ${id}, '${expire.toUTCString()}', ${adjustedIndex})`;
      console.log(sql);
      current++;
      if (current >= meals.length)
        connection.query(sql, callback);
      else {
        connection.query(sql, function (err) {
          if (err) throw err;
          assignMealsToUser(meals, current, email, connection, callback, offset);
        });
      }
    }
  }

  MealsApi.prototype.search = function(query, callback)
  {
    let mysql = this.dependencies.mysql;
    let words = query.split(" ");
    if (words.length > 0)
    {
      let condition_str = "title LIKE " + mysql.escape('%' + words[0] + '%');
      for (let i = 1; i < words.length; ++i)
      {
        condition_str += "OR title LIKE " + mysql.escape('%' + words[i] + '%');
      }
      this.dependencies.connection.query(`SELECT * FROM MealEntry WHERE ${condition_str};`,
        function(err, results){
          if (err)
          {
            console.log(err);
            return callback([]);
          }
          else
          {
            return callback(results);
          }
        });
    }
    else
      return callback([]);
  };

  MealsApi.prototype.replaceMeal = function(email, mid, mindex, callback)
  {
    let connection = this.dependencies.connection,
        preferences = this.dependencies.preferences;
    connection.query(`SELECT * FROM MealEntry WHERE mid=?`, [mid], function(err,resp){
      console.log(resp);
      let replacedMealData = resp[0];
      connection.query(`
        SELECT * FROM MealEntry
          WHERE
            type = ?
          AND mid NOT IN (
            SELECT
              d.mid
            FROM
              Dislikes d
            WHERE
              email = ?
          );
      `, [replacedMealData.type, email], function(err, resp){
        // Get past user food preferences
        preferences.getPreferences(email, function(preferenceData) {
          let result = choose(resp, replacedMealData.price, replacedMealData.budget, 1, [], preferenceData)[0];
          connection.query(`UPDATE UserMeal SET mid=? WHERE email=? AND mindex=? AND mid=?`, [result.mid, email, mindex, mid],
            function (err, resp) {
              if (err) throw err;
              return callback(result);
            });
        });
      });
    });
  };

  /**
   * Generate meal plan for user.
   * @param email
   * @param callback Action to perform after meals are generated
   */
	MealsApi.prototype.getMealPlan = function (email, callback)
	{
	  // Define dependencies for inner functions
    const connection = this.dependencies.connection,
          unirest = this.dependencies.unirest,
          account = this.dependencies.account,
          preferences = this.dependencies.preferences;

    // Define callback functions for getting nutrition/price info
    let recipeCallback = function(meals)
    {
      checkForExpiredMeals(meals, 0, connection, new Set(), function(expired){
        console.log(expired);
        account.getTargetCaloriesAndBudget(email,
          function(targetCalories, weeklyBudget) {
            let numberOfMealsToReplace = 21 - expired.length;
            replaceExpiredMeals(meals, [], targetCalories, weeklyBudget, numberOfMealsToReplace, email, connection, preferences, function (mealsToAdd) {
              assignMealsToUser(mealsToAdd, 0, email, connection, function () {
                getMealsInformation(meals, 0, connection, unirest, [], callback);
              }, 7 - mealsToAdd.length);
            });
          });
      });
    };

    account.getTargetCaloriesAndBudget(email,
      function(targetCalories){
        // Check for existing meal plan
        connection.query(`SELECT * FROM UserMeal m WHERE m.email='${email}';`, function(err,res){
          if (err) throw err;
          if (res.length > 0)
          {
            getRecipesFor(email, connection, recipeCallback);
          }
          else
          {
            connection.query(`SELECT WeeklyBudget FROM Account WHERE Email='${email}'`, function(err, resp){
              if (err) throw err;
              console.log(resp);
              let mealplan = Array(21);
              createMealPlan(email, targetCalories, resp[0].WeeklyBudget / 7, connection, unirest, preferences, mealplan, callback);
            });

          }
        });
      });
	};

  /**
   * Function chooses (count) meals out of mealOptions array incorporating:
   * 1.) How much cheaper the meal is than goalBudget
   * 2.) How close in calories the meal is to goalCalories
   * 3.) Meal cannot be in mealsNotAllowed
   * 4.) The user's preferences towards categories that the food falls under
   */
  function choose(mealOptions, goalBudget, goalCalories, count, mealsNotAllowed, preferences){
    return Array.from(mealOptions)
      .filter(function(choice){
        for (let meal of mealsNotAllowed)
          if (meal.mid === choice.mid)
            return false;
        return true;
      })
      .sort(function(c1, c2){
        // Create weights to measure how close food is to target calories/price
        let c1calorieDiff = Math.abs(c1.calories - goalCalories),
            c2calorieDiff = Math.abs(c2.calories - goalCalories),
            c1Weight      = (c1calorieDiff / goalCalories) + (parseFloat(c1.price.replace("$","")) / goalBudget),
            c2Weight      = (c2calorieDiff / goalCalories) + (parseFloat(c2.price.replace("$","")) / goalBudget);

        // Adjust weights based on user preferences
        for (let category of ["vegetarian", "vegan", "ketogenic", "glutenfree", "dairyfree"])
        {
          if (!!c1[category])
            c1Weight *= preferences[category];
          if (!!c2[category])
            c2Weight *= preferences[category];
        }
        // Return difference in weight
        return c1Weight - c2Weight;
      })
      .slice(0, count);
  }

  /**
   * New Create Meal Plan function uses cached meals over API calls to gather meals.
   */
	function createMealPlan(email, dailyCalories, dailyBudget, connection, unirest, preferences, mealplan, callback)
  {
    const mealRatios   = [0.2, 0.4, 0.4],
          budgetRatios = [0.3, 0.35, 0.35],
          chooseFunct  = [];
    console.log(`
    --- Create Meal Parameters ---
    Daily Calories: ${dailyCalories}
    Daily Budget:   $${dailyBudget}
    Breakfast:      $${dailyBudget * budgetRatios[0]}
                    ${dailyCalories * mealRatios[0]}
    Lunch:          $${dailyBudget * budgetRatios[1]}
                    ${dailyCalories * mealRatios[1]}
    Dinner:         $${dailyBudget * budgetRatios[2]}
                    ${dailyCalories * mealRatios[2]}
    `);

    // Get past user food preferences
    preferences.getPreferences(email, function(preferenceData){
      preferences.getLikeDislikeData(email, function(likes, dislikes){

        // Create 3 choosing functions for breakfast/lunch/dinner
        for (let i = 0; i < 3; i++)
        {
          chooseFunct.push(function(choices){
            return choose(choices, dailyBudget * budgetRatios[i], dailyCalories * mealRatios[i], 7, dislikes, preferences);
          });
        }

        // Breakfasts
        selectMeals(0, chooseFunct[0], mealplan, connection, function(mealplan){
          // Lunches
          selectMeals(1, chooseFunct[1], mealplan, connection, function(mealplan){
            // Dinners
            selectMeals(2, chooseFunct[2], mealplan, connection, function(mealplan){
              console.log("MEALPLAN: ");
              console.log(mealplan);
              assignMealsToUser(mealplan, 0, email, connection, function(){
                return callback(mealplan);
              });
            })
          });
        });

      });
    });

  }

  function selectMeals(typeIndex, choosingFunction, mealplan, connection, callback)
  {
    const mealTypes = ["breakfast", "lunch", "dinner"];
    connection.query(`
      SELECT * FROM MealEntry
        WHERE type='${mealTypes[typeIndex]}';
      `,
      function (err, resp){
        if (err)
          throw err;
        let chosenMeals = choosingFunction(resp);
        for (let i = 0, j = typeIndex; j < 21; i++, j+=3)
          mealplan[j] = chosenMeals[i];
        return callback(mealplan);
      });
  }



  /**
   * Checks for meals that were created in past dates. These meals will need to be replaced
   * this meals for future dates.
   */
	function checkForExpiredMeals(meals, current, connection, expired, callback)
  {
    if (current >= meals.length || meals.length === 0)
      return callback(expired);
    else
    {
      let now = new Date();
      if (Date.parse(meals[current].expire) - now <= 0)
      {
        expired.add(meals[current].index);
        const sql = `DELETE FROM UserMeal WHERE email='${meals[current].email}' AND mid=${meals[current].mid}`;
        console.log(sql);
        connection.query(sql, function(err){
          if (err) throw err;
          current++;
          if (current >= meals.length)
            callback(expired);
          else
            checkForExpiredMeals(meals, current, connection, expired, callback);
        });
      }
      else
      {
        current++;
        checkForExpiredMeals(meals, current, connection, expired, callback);
      }
    }
  }

  /**
   * Generates new set of meals and pushes into array named mealsBuffer which is passed
   * into callback. numberOfMealsToAdd defines how many meals to replace
   */
  function replaceExpiredMeals(meals, mealsBuffer, targetCalories, weeklyBudget, numberOfMealsToAdd, email, connection, preferences, callback)
  {
    let budgetRatios = this.budgetRatios,
        mealRatios   = this.mealRatios;
    if (numberOfMealsToAdd === 0)
      callback(mealsBuffer);
    else
    {
      preferences.getPreferences(email, function(preferenceData) {
        preferences.getLikeDislikeData(email, function (likes, dislikes) {

          connection.query(`SELECT * FROM MealEntry WHERE type='breakfast'`, function (err, res1) {

            mealsBuffer.push(choose(res1, (weeklyBudget / 7) * budgetRatios[0], targetCalories * mealRatios[0], 1, dislikes, preferences));
            connection.query(`SELECT * FROM MealEntry WHERE type='lunch'`, function (err, res2) {
              mealsBuffer.push(choose(res2, (weeklyBudget / 7) * budgetRatios[1], targetCalories * mealRatios[1], 1, dislikes, preferences));
              connection.query(`SELECT * FROM MealEntry WHERE type='dinner'`, function (err, res3) {
                mealsBuffer.push(choose(res3, (weeklyBudget / 7) * budgetRatios[2], targetCalories * mealRatios[2], 1, dislikes, preferences));
                numberOfMealsToAdd--;
                replaceExpiredMeals(meals, mealsBuffer, targetCalories, weeklyBudget, numberOfMealsToAdd, email, connection, callback);
              });
            })
          });
        });
      });
    }
  }

  /**
   * FIXME: The following 4 functions must be deleted or refactored, as they are unused
   *
   * Meal plans are now created using SQL queries only without any API calls, so this function can be
   * converted to a fallback if the generated meal plan fails to meet some budget/calorie threshold
   * and new data is needed.
   */
  function createMealPlanFromScratch(email, targetCalories, connection, unirest, recipeCallback)
  {
    const endpoint   = "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/mealplans/" +
      "generate?timeFrame=week" +
      "&targetCalories=" + targetCalories;
    unirest.get(endpoint)
      .header("X-RapidAPI-Key", "62649045e6msh29f8aefde649a9bp1591edjsnf389cd9bbedf")
      .end(function (result) {
        const meals = [];
        for (let item of result.body.items)
          meals.push(JSON.parse(item.value));
        assignMealsToUser(meals, 0, email, connection, function(err){
          if (err)
            throw err;
          let q = `SELECT * FROM UserMeal WHERE email=${email}`;
          console.log(q);
          connection.query(q,(e,res)=>{console.log(res)});
          getRecipesFor(email, connection, recipeCallback);
        });
      });
  }


  /**
   * This function recursively calls the API to get detailed information on meals
   * stored in the list named meals. The meal information is stored in mealplan and
   * passed to callback after all meals have been processed.
   */
	function getMealsInformation(meals, current, connection, unirest, mealplan, callback)
  {
    if (meals === null || typeof meals === "undefined" || meals.length === 0 || current >= meals.length)
    {
      return callback();
    }
    else
    {
      const mealTypes = ["'breakfast'", "'lunch'", "'dinner'"];
      getMealFromCache(meals[current].mid, connection, function(result)
      {
        if (result.length > 0)
        {
          mealplan.push(result[0]);
          current++;
          if (current >= meals.length)
            callback(mealplan);
          else
            getMealsInformation(meals, current, connection, unirest, mealplan, callback);
        }
        else
        {
          getFoodInfo(meals[current].mid, unirest, function(result){
            result["type"] = mealTypes[current % 3];
            addMealToCache(result, connection);
            mealplan.push(result);
            current++;
            if (current >= meals.length)
              callback(mealplan);
            else
              getMealsInformation(meals, current, connection, unirest, mealplan, callback);
          });
        }
      });
    }
  }

  /**
   * Add meal information to MealEntry table for future use. This helps
   * limit API calls by pulling foods from a cache.
   */
	function addMealToCache(food_data, connection, callback=()=>{})
  {
    let sql = `INSERT into MealEntry(mid, title, type, price, imagelink, calories, protein, carbs, fats, link, slink, vegetarian, vegan, glutenfree, dairyfree, ketogenic) 
    values(${food_data.mid},${food_data.title},${food_data.type},${food_data.price},${food_data.imagelink},${food_data.calories},${food_data.protein},${food_data.carbs},${food_data.fats},${food_data.link},${food_data.slink},${food_data.vegetarian},${food_data.vegan},${food_data.glutenfree},${food_data.dairyfree},${food_data.ketogenic});`;
    console.log(sql);
    connection.query(sql,
      function(err){
        if (err) throw err;
        callback();
      });
  }

  /**
   * Try to get meal information from cache with matching mid (meal id).
   */
  function getMealFromCache(meal_id, connection, callback=()=>{})
  {
    connection.query(`SELECT * FROM MealEntry m WHERE m.mid=${meal_id};`, function(err, result, fields){
      if (err) throw err;
      callback(result);
    });
  }

}());