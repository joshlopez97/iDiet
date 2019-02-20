# iDiet
## Overview
iDiet is a mobile web application that prescribes users customizable meal plans based on health goals, dietary preferences/restrictions, and weekly budget for food.

## MySQL Database Schema
CREATE TABLE Users (  
    Username varchar(255) UNIQUE,  
    UserPassword varchar(255),  
    Email varchar(255),  
    FirstName varchar(255),  
    LastName varchar(255),  
    Height int,  
    Weight int,  
    Age int,  
    Phone varchar(255),  
    Email varchar(255)  
);

## Development
To set up iDiet for local development:
1. Clone this repository via:  
`git clone https://github.com/joshlopez97/iDiet.git`

2. From the root directory, install the dependencies by running:  
`npm install`

3. Run the application via:  
`node server.js`  
and then go to http://localhost:5000 to view the application.
