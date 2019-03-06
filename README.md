# iDiet
## Overview
iDiet is a mobile web application that prescribes users customizable meal plans based on health goals, dietary preferences/restrictions, and weekly budget for food.

## Development
To set up iDiet for local development:
1. Clone this repository via:  
`git clone https://github.com/joshlopez97/iDiet.git`

2. From the root directory, install the dependencies by running:  
`npm install`

3. Run the application via:  
`node server.js`  
and then go to http://localhost:5000 to view the application.

## MySQL Database Schema
iDiet accounts:
- Email: User's email used to sign in
- UserPassword: Chosen password used to sign in (will be replaced with PasswordHash)
- FirstName: User's first name
- Height: User's height stored in inches
- Weight: User's weight stored in pounds
- Age: User's age (will be replaced with date of birth)
- Allergies: String containing comma separated list of allergies to avoid in diet plan

```
CREATE TABLE Account (
  Email varchar(255) UNIQUE NOT NULL,
  UserPassword varchar(255) NOT NULL,
  FirstName varchar(255) NOT NULL,
  Height int NOT NULL,
  Weight int NOT NULL,
  Age int NOT NULL,
  Allergies varchar(255)
);
```
Meal Entries cached from API
```
CREATE TABLE MealEntry (
  mid int UNIQUE NOT NULL,
  title varchar(255) NOT NULL,
  type varchar(32) NOT NULL,
  price varchar(10),
  calories int,
  protein int,
  carbs int,
  fats int
);
```

