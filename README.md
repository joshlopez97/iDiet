# iDiet
## Overview
iDiet is a mobile web application that prescribes users customizable meal plans based on health goals, dietary preferences/restrictions, and weekly budget for food.

![iDiet](https://i.imgur.com/5zmIcAR.png) ![iDiet](https://i.imgur.com/YAcbA51.png) ![iDiet](https://i.imgur.com/UPSO7ut.png)  ![iDiet](https://i.imgur.com/mGMwMyA.png)

## Development
To set up iDiet for local development:
1. Clone this repository via:  
`git clone https://github.com/joshlopez97/iDiet.git`

2. From the root directory, install the dependencies by running:  
`npm install`

3. Run the application via:  
`node server.js`  
and then go to http://localhost:5000 to view the application.

## Project Structure
```
.  
├── health  
|   ├── fitbit.js          // Connects to FitBit API
|   └── mealsapi.js        // Creates mealplans
├── user  
|   ├── account.js         // Manages account info
|   └── preferences.js     // Manages dietary preferences
├── static                 // Static files
├── views                  // HTML
└── server.js              // Server Code
```
<b>server.js</b>: Contains all web application routes. Installs dependencies into all other modules.  
<b>fitbit.js</b>: Makes calls to FitBit API and stores FitBit related data along with each user's FitBit access token.  
<b>mealsapi.js</b>: Creates meal plan for user using cached data from Spoonacular Nutrition API. Each mealplan factors in information on user dietary preferences, calculated health state information, recommended calories, and weekly budget for food.  
<b>account.js</b>: Handles account creation, login, and overall account data management.  
<b>preferences.js</b>: Handles "liking" and "disliking" of foods and calculation of dietary preferences for each user.

## MySQL Database Schema
iDiet Accounts:
- Email: User's email used to sign in
- UserPassword: Chosen password used to sign in (will be replaced with PasswordHash)
- FirstName: User's first name
- Height: User's height stored in inches
- Weight: User's weight stored in pounds
- Age: User's age (will be replaced with date of birth)
- Allergies: String containing comma separated list of allergies to avoid in diet plan
- GoalWeight: int containing the weight that user wishes to be at
- Gender: string containing "male" or "female"
- ActivityLevel: int indicating level of physical activity indicated by user
- WeeklyBudget: int containing amount of money user wishes to spend on food
- DailyCalories: int containing amount of calories user should consume
- FitBitConnected: bit indicating if FitBit is connected
- FacebookConnected: bit indicating if Facebook is connected
```
CREATE TABLE Account (
  Email varchar(255) UNIQUE NOT NULL,
  UserPassword varchar(255) NOT NULL,
  FirstName varchar(255) NOT NULL,
  Height int NOT NULL,
  Weight int NOT NULL,
  Age int NOT NULL,
  Allergies varchar(255),
  GoalWeight int NOT NULL,
  Gender varchar(10) NOT NULL,
  ActivityLevel int NOT NULL,
  WeeklyBudget int NOT NULL,
  DailyCalories int NOT NULL,
  FitBitConnected bit NOT NULL,
  FacebookConnected bit NOT NULL  
);
```
Cached Meal Metadata from Spoonacular Nutrition API:
- mid: int containing unique Recipe ID of meal
- title: description of food
- type: breakfast, lunch, or dinner
- price: estimated price based on ingredients
- imagelink: link to thumbnail image
- calories: calories in meal
- protein: protein in meal
- carbs: total carbohydrates in meal
- fats: total fats in meal
- link: original link to recipe
- slink: Spoonacular link to recipe
- vegetarian: bit indicating if meal is vegetarian
- vegan: bit indicating if meal is vegan
- glutenfree: bit indicating if meal is gluten-free
- dairyfree: bit indicating if meal is dairy-free
- ketogenic: bit indicating if meal is ketogenic
```
CREATE TABLE MealEntry (
  mid int UNIQUE NOT NULL,
  title varchar(255),
  type varchar(32) NOT NULL,
  price varchar(10),
  imagelink varchar(255),
  calories int,
  protein int,
  carbs int,
  fats int,
  link varchar(255),
  slink varchar(255),
  vegetarian bit,
  vegan bit,
  glutenfree bit,
  dairyfree bit,
  ketogenic bit
);
```
Assigned Weekly Meals:
- email: email of account being assigned
- mid: recipe id
- expire: string containing UTC date that meal should be replaced (Midnight of day that meal was assigned)
- mindex: index of day that meal is assigned to (Sunday=0, Monday=1, etc.)
```
CREATE TABLE UserMeal (
  email varchar(255) NOT NULL,
  mid int NOT NULL,
  expire varchar(255) NOT NULL,
  mindex int NOT NULL
);
```
FitBit Data:
- email: email of iDiet account
- accessKey: access_key needed to connect to FitBit Web API
- caloriesBurned: number of calories burned in FitBit Account
- steps: number of steps taken in FitBit Account
- distance: distance (in feet) travelled in FitBit Account
```
CREATE TABLE FitBit (
  email varchar(255) UNIQUE NOT NULL,
  accessKey varchar(255) NOT NULL,
  caloriesBurned int,
  steps int,
  distance int
);
```

Liked and Disliked Meals:
- email: email of iDiet account
- mid: recipe ID of meal that was liked/disliked
```
CREATE TABLE Likes (
  email varchar(255) UNIQUE NOT NULL,
  mid int NOT NULL
);
CREATE TABLE Dislikes (
  email varchar(255) UNIQUE NOT NULL,
  mid int NOT NULL
);
```
Food Preferences:
- email: email of iDiet account
- totalLikes: total number of meals liked
- totalDislikes: total number of meals disliked
- vegetarian...ketogenic: value between 0.5 - 1.5 indicating how much a user likes foods from this category
(Likes increase this value and Dislikes decrease this value)   
- averageLikePrice: the average price of all meals that the user has liked
- averageDisikePrice: the average price of all meals that the user has disliked
- averageLikeCalories: the average calories of all meals that the user has liked
- averageDislikeCalories: the average calories of all meals that the user has disliked

```
CREATE TABLE FoodPreferences (
  email varchar(255) UNIQUE NOT NULL,
  totalLikes int NOT NULL DEFAULT 0,
  totalDislikes int NOT NULL DEFAULT 0,
  vegetarian float NOT NULL,
  vegan float NOT NULL,
  glutenfree float NOT NULL,
  dairyfree float NOT NULL,
  ketogenic float NOT NULL,
  averageLikePrice float,
  averageDislikePrice float,
  averageLikeCalories float,
  averageDislikeCalories float
);
```
