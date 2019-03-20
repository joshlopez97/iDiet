/**
 * This module is responsible for modifying, retrieving, and analyzing user LIKE
 * and DISLIKE data, as well as calculating Dietary Preferences based on this data.
 */
(function() {
  const DEFAULT_CATEGORY_WEIGHT = 1.0;
  const CATEGORY_WEIGHT_MAX = 1.5;
  const CATEGORY_WEIGHT_MIN = 0.5;

  /**
   * This constructor creates a new Preferences object with injected dependencies.
   * @param dependencies
   * @constructor
   */
  function Preferences(dependencies) {
    this.connection = dependencies.connection;
  }

  /**
   * Returns starting preference data for users with no Likes or Dislikes
   */
  function getDefaultPreferences(email)
  {
    return {
      "email":email,
      "totalLikes":0,
      "totalDislikes":0,
      "vegetarian":DEFAULT_CATEGORY_WEIGHT,
      "vegan":DEFAULT_CATEGORY_WEIGHT,
      "glutenfree":DEFAULT_CATEGORY_WEIGHT,
      "dairyfree":DEFAULT_CATEGORY_WEIGHT,
      "ketogenic":DEFAULT_CATEGORY_WEIGHT,
      "averageLikePrice":0.0,
      "averageDislikePrice":0.0,
      "averageLikeCalories":0.0,
      "averageDislikeCalories":0.0
    };
  }

  /**
   * Returns adjusted preferences based on a user Liking a meal that contains
   * data in foodData.
   */
  function applyLike(preferences, foodData)
  {
    preferences.totalLikes++;

    // Update averages
    let price = parseFloat(foodData.price.replace("$",""));
    preferences.averageLikePrice = (preferences.averageLikePrice + price) / preferences.totalLikes;
    preferences.averageLikeCalories = (preferences.averageLikeCalories + foodData.calories) / preferences.totalLikes;

    // Approximate preferences
    for (let category of ["vegetarian", "vegan", "glutenfree", "dairyfree", "ketogenic"])
    {
      if (foodData[category])
      {
        // Increase affinity for food category if food contains category
        preferences[category] = Math.min(CATEGORY_WEIGHT_MAX, preferences[category] * 1.05);
      }
    }
    return preferences;
  }

  /**
   * Returns adjusted preferences based on a user Disliking a meal that contains
   * data in foodData.
   */
  function applyDislike(preferences, foodData)
  {
    preferences.totalDislikes++;

    // Update averages
    let price = parseFloat(foodData.price.replace("$",""));
    preferences.averageDislikePrice = (preferences.averageDislikePrice + price) / preferences.totalDislikes;
    preferences.averageDislikeCalories = (preferences.averageDislikeCalories + foodData.calories) / preferences.totalDislikes;

    // Approximate preferences
    for (let category of ["vegetarian", "vegan", "glutenfree", "dairyfree", "ketogenic"])
    {
      if (foodData[category])
      {
        // Decrease affinity for food category if food contains category
        preferences[category] = Math.max(CATEGORY_WEIGHT_MIN, preferences[category] * 0.95);
      }
    }
    return preferences;
  }


  /**
   * Creates row in Like table for when user likes a meal and adjusts FoodPreferences
   * table with updated preferences based on data of the meal that was Liked
   */
  Preferences.prototype.likeMeal = function(email, mid, callback)
  {
    console.log("Liking food");
    let conn = this.connection;
    conn.query(`INSERT into Likes(email, mid) values(?, ?)`, [email, mid], callback);

    this.getPreferences(email, function(preferences)
    {
      conn.query(`SELECT * FROM MealEntry WHERE mid = ?`, [mid], function(err, data)
      {
        if (!err && data.length !== 0)
        {
          let newPreferences = applyLike(preferences, data[0]);
          console.log(newPreferences);
          conn.query(`INSERT INTO FoodPreferences SET ?`, newPreferences, (error, results, fields) => {
            if (error)
              console.log(error);
          });
        }
      });

    });
  };

  /**
   * Creates row in Dislike table for when user likes a meal and adjusts FoodPreferences
   * table with updated preferences based on data of the meal that was Disliked
   */
  Preferences.prototype.dislikeMeal = function(email, mid, mindex, callback)
  {
    console.log("Disliking food");
    let conn = this.connection;
    conn.query(`INSERT into Dislikes(email, mid) values(?, ?)`, [email, mid], callback);

    this.getPreferences(email, function(preferences)
    {
      conn.query(`SELECT * FROM MealEntry WHERE mid = ?`, [mid], function(err, data)
      {
        if (err || data.length === 0) console.log(err);
        let newPreferences = applyDislike(preferences, data[0]);
        console.log(newPreferences);
        conn.query(`INSERT INTO FoodPreferences SET ?`, newPreferences, (err) => {
          if (err) console.log(err);
        });
      });

    });
  };

  /**
   * Retrieves two lists of mids (Meal IDs) that users have liked and disliked
   * and passes them as parameters to the provided callback function
   */
  Preferences.prototype.getLikeDislikeData = function(email, callback)
  {
    let conn = this.connection;
    conn.query(`SELECT mid FROM Dislikes WHERE email = ?`, [email], function(err, dislike_data){
      if (err)
        console.log(err);
      conn.query(`SELECT mid FROM Likes WHERE email = ?`, [email], function(err, like_data){
        if (err)
          console.log(err);
        callback(like_data, dislike_data);
      });
    });
  };

  Preferences.prototype.getPreferences = function(email, callback)
  {
    this.connection.query(`SELECT * FROM FoodPreferences WHERE email = ?`, [email], function(err, resp)
    {
      if (err)
        console.log(err);
      let preferences;
      if (resp.length === 0) {
        preferences = getDefaultPreferences(email);
      } else {
        preferences = resp[0];
      }
      callback(preferences);
    });
  };

  exports.create = function(dependencies) {
    return new Preferences(dependencies);
  };
}());