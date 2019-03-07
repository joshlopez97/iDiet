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



  /**
   * Generate meal plan for user.
   * @param callback Action to perform after meals are generated
   */
	MealsApi.prototype.generateMealPlan = function(callback)
	{
	  // Define dependencies for inner functions
    const connection = this.dependencies.connection,
          unirest = this.dependencies.unirest,
          email = this.dependencies.userinfo.email;

    // API endpoint for getting new mealplan
    const endpoint = "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/mealplans/" +
      "generate?timeFrame=week" +
      "&targetCalories=" + this.dependencies.userinfo.targetCalories +
      "&diet=" + this.dependencies.userinfo.dietType +
      "&exclude=" + encodeURI(this.dependencies.userinfo.restrictions);

    // Define callback functions for getting nutrition/price info
    let recipeCallback = function(recipes)
    {
      checkForExpiredMeals(recipes, 0, connection, new Set(), function(expired){
        connection.query(`SELECT * FROM UserMeal WHERE email='${email}'`,(e,r)=>{
          let numberOfMealsToReplace = 21 - r.length;
          replaceExpiredMeals([], numberOfMealsToReplace, email, connection, function(mealsToAdd){
            assignMealsToUser(mealsToAdd, 0, email, connection, function(){
              getMealsInformation(recipes, 0, connection, unirest, [], callback);
            }, 7 - mealsToAdd.length);
          });
        });
      });
    };

    // Check for existing meal plan
    connection.query(`SELECT * FROM UserMeal m WHERE m.email='${email}';`, function(err,res){
      if (err) throw err;
      if (res.length > 0)
      {
        getRecipesFor(email, connection, recipeCallback);
      }
      else
      {
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
    });
	};

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

  function replaceExpiredMeals(meals, expired, email, connection, callback)
  {
    if (expired === 0)
      callback(meals);
    else
    {
      connection.query(`SELECT * FROM MealEntry WHERE type='breakfast'`,function(err, res1){
        meals.push(choose(res1));
        connection.query(`SELECT * FROM MealEntry WHERE type='lunch'`, function(err, res2){
          meals.push(choose(res2));
          connection.query(`SELECT * FROM MealEntry WHERE type='dinner'`, function(err, res3) {
            meals.push(choose(res3));
            expired--;
            replaceExpiredMeals(meals, expired, email, connection, callback);
          });
        })
      });
    }
  }

  function choose(array)
  {
    return array[Math.floor(Math.random()*array.length)];
  }

  MealsApi.prototype.replaceMeal = function(dayIndex, type, callback)
  {
  };

	function getMealsInformation(meals, current, connection, unirest, mealplan, callback)
  {
    if (meals === null || typeof meals === "undefined" || meals.length === 0 || current >= meals.length)
    {
      return callback();
    }
    else
    {
      const mealTypes = ["breakfast", "lunch", "dinner"];
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
    values(${food_data.mid},'${food_data.title}','${food_data.type}','${food_data.price}','${food_data.imagelink}',${food_data.protein},${food_data.calories},${food_data.carbs},${food_data.fats},'${food_data.link}','${food_data.slink}',${food_data.vegetarian},${food_data.vegan},${food_data.glutenfree},${food_data.dairyfree},${food_data.ketogenic});`;
    console.log(sql)
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



  /**
   * Creates MealsApi object
   */
	exports.create = function(dependencies) {
	  return new MealsApi(dependencies);
	};

}());