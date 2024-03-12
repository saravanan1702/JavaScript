'use strict';
/*
We're building a football betting app (soccer for my American friends 😅)!

Suppose we get data from a web service about a certain game (below). In this challenge we're gonna work with the data. So here are your tasks:

1. Create one player array for each team (variables 'players1' and 'players2')
2. The first player in any player array is the goalkeeper and the others are field players. For Bayern Munich (team 1) create one variable ('gk') with the goalkeeper's name, and one array ('fieldPlayers') with all the remaining 10 field players
3. Create an array 'allPlayers' containing all players of both teams (22 players)
4. During the game, Bayern Munich (team 1) used 3 substitute players. So create a new array ('players1Final') containing all the original team1 players plus 'Thiago', 'Coutinho' and 'Perisic'
5. Based on the game.odds object, create one variable for each odd (called 'team1', 'draw' and 'team2')
6. Write a function ('printGoals') that receives an arbitrary number of player names (NOT an array) and prints each of them to the console, along with the number of goals that were scored in total (number of player names passed in)
7. The team with the lower odd is more likely to win. Print to the console which team is more likely to win, WITHOUT using an if/else statement or the ternary operator.

TEST DATA FOR 6: Use players 'Davies', 'Muller', 'Lewandowski' and 'Kimmich'. Then, call the function again with players from game.scored

GOOD LUCK 😀
*/

/*
const game = {
  team1: 'Bayern Munich',
  team2: 'Borrussia Dortmund',
  players: [
    [
      'Neuer',
      'Pavard',
      'Martinez',
      'Alaba',
      'Davies',
      'Kimmich',
      'Goretzka',
      'Coman',
      'Muller',
      'Gnarby',
      'Lewandowski',
    ],
    [
      'Burki',
      'Schulz',
      'Hummels',
      'Akanji',
      'Hakimi',
      'Weigl',
      'Witsel',
      'Hazard',
      'Brandt',
      'Sancho',
      'Gotze',
    ],
  ],
  score: '4:0',
  scored: ['Lewandowski', 'Gnarby', 'Lewandowski', 'Hummels'],
  date: 'Nov 9th, 2037',
  odds: {
    team1: 1.33,
    x: 3.25,
    team2: 6.5,
  },
};

//task 1
//using desctructuring
const [player1, player2] = game.players;
console.log(player1, player2);

//task 2
//take one goal keeper and rest of the players in feilder
const [gk, ...fieldPlayers] = player1;
console.log(gk, fieldPlayers);

//task 3
//all players
const allPlayers = [...player1, ...player2];
console.log(allPlayers);

//task 4
//create new array with subtitude player for final
const playerFinal = [...player1, 'Thiago', 'Coutinho', 'Perisic'];
console.log(playerFinal);

//task 5
//object destructuring
//object desstructing object inside objects odd={something inside the object} into variable
const {
  odds: { team1, x: draw, team2 },
} = game;
console.log(team1, draw, team2);

//task 6 goal function
const printGoals = function (...players) {
  console.log(players);
  console.log(`${players.length} goals were scored`);
};
// printGoals('Davies', 'Muller', 'Lewandowski', 'Kimmich');
// printGoals('Davies', 'Muller');
printGoals(...game.scored); //passing object's scored properities and values
//task 7
//the team will win who's having less odds
//using logical operators
//using & shor circuit operators to evaulute who's the going to win
//instead of using if else and ternary operators

team1 < team2 && console.log(`team 1 is more likly to win the game...🏆`);
team1 > team2 && console.log(`team 2 is more likly to win the game...🏆`);

*/

//===Object literals==========
//ES6 javascript introduced three ways to write object literals which is make easier to write
//outside the object
// ==================3rd way of writing object literals===========
//that we can now actually compute propery names instead of writing them manualy and literaly
//Compute mean just like calculation
//example
const weekdays = ['mon', 'thu', 'wed', 'thus', 'fri', 'sat', 'sun'];
const openingHours = {
  //object literals
  // thu: {//instead of writing manualy
  [weekdays[1]]: {
    open: 12,
    close: 22,
  },
  // fri: {
  [weekdays[4]]: {
    open: 11,
    close: 23,
  },
  // sat: {
  [weekdays[5]]: {
    //compute
    open: 0, //Open 24 Hours
    close: 24,
  },
};

const restaurant = {
  //couples of array
  name: 'Classico Italiano',
  location: 'Via Angelo Tavanti 23, Firenze, Italy',
  categories: ['Italian', 'Pizzeria', 'Vegetarian', 'Organic'],
  starterMenu: ['Focaccia', 'Bruschetta', 'Garlic Bread', 'Caprese Salad'],
  mainMenu: ['Pizza', 'Pasta', 'Risotto'],
  //object inside object
  //Assinging the object which is declared in outside
  // ==================1st way of writing object literals===========
  //====Before ES6====
  //propery and value
  // openingHours: openingHours, //it's not a problem but variable and value name both are same  it wil annoying
  //====After ES6====
  //ES6 enhanced Object literals we don't need create variable we direcly assing the object
  openingHours,
  // ==================2nd way of writing object literals in methods===========
  //Enhancement object literals in writing methods
  //===Before ES6 we writing function with functionn exprsssion property and values
  // order: function (startedIndex, mainIndex) {
  //   return [this.starterMenu[startedIndex], this.mainMenu[mainIndex]];
  // },
  //====After ES6 we don't need to write function expression we can directly assign it will work same as before
  //IN ES6 we no longer have to create property,and then set to function expression like always we've been doing
  order(startedIndex, mainIndex) {
    return [this.starterMenu[startedIndex], this.mainMenu[mainIndex]];
  },
  // orderDelivery: function (obj) {
  //   console.log(obj);
  // },

  // orderDelivery: function ({ startedIndex, mainIndex, time, address }) {
  //   console.log(
  //     `Order Recived! ${this.starterMenu[startedIndex]} and ${this.mainMenu[mainIndex]} will be delivered  to ${address} at ${time}`
  //   );

  //default values for desctructors object's aruguments if not in function called
  //======BEFORE ES6=========
  /*
  orderDelivery: function ({
    startedIndex = 0,
    mainIndex = 1,
    time = '12:00',
    address,
  }) {
    console.log(
      `Order Recived! ${this.starterMenu[startedIndex]} and ${this.mainMenu[mainIndex]} will be delivered  to ${address} at ${time}`
    );
  },
  */
  orderDelivery({ startedIndex = 0, mainIndex = 1, time = '12:00', address }) {
    console.log(
      `Order Recived! ${this.starterMenu[startedIndex]} and ${this.mainMenu[mainIndex]} will be delivered  to ${address} at ${time}`
    );
  },
  orderPasta(inc1, inc2, inc3) {
    console.log(
      `Here is Your Delicious pasta with ${inc1},${inc2} and ${inc3}`
    );
  },
  orderPizza(mainIncredient, ...otherIncredient) {
    console.log(mainIncredient); //show induvidial value
    console.log(otherIncredient); //rest of the values packed and show in array format
  },
};
// =====Map Challange #3======
/*
1. Create an array 'events' of the different game events that happened (no duplicates)
2. After the game has finished, is was found that the yellow card from minute 64 was unfair. So remove this event from the game events log.
3. Print the following string to the console: "An event happened, on average, every 9 minutes" (keep in mind that a game has 90 minutes)
4. Loop over the events and log them to the console, marking whether it's in the first half or second half (after 45 min) of the game, like this:
      [FIRST HALF] 17: ⚽️ GOAL

GOOD LUCK 😀
*/

const gameEvents = new Map([
  [17, '⚽️ GOAL'],
  [36, '🔁 Substitution'],
  [47, '⚽️ GOAL'],
  [61, '🔁 Substitution'],
  [64, '🔶 Yellow card'],
  [69, '🔴 Red card'],
  [70, '🔁 Substitution'],
  [72, '🔁 Substitution'],
  [76, '⚽️ GOAL'],
  [80, '⚽️ GOAL'],
  [92, '🔶 Yellow card'],
]);

//task 1
//converting new array with unique values
const events = [...new Set(gameEvents.values())]; //using set for getting only unique values
console.log(events);
//task 2 delete the event 65 from gameEvents
gameEvents.delete(64); //use the exactkey
//task 3
console.log(
  `"An event happened, on average, every ${90 / gameEvents.size} minutes" `
);
const time = [...gameEvents.keys()].pop(); //pop mean remove last element from array also it will return the deleted elements
console.log(time);
console.log(
  `"An event happened, on average, every ${time / gameEvents.size} minutes" `
);

//Task 4 Bonus
for (const [min, event] of gameEvents) {
  const half = min <= 45 ? 'FIRST' : 'SECOND';
  console.log(`[${half}HALF] ${min}:${event}`);
}
//=====MAP Iteration==========
/*
const qustion = new Map(
  //array key and value
  //alway prefare best way of setting all the key and values
  //if you want to add extra values then you can use set keywords
  [
    ['Qustion', 'What is the best programming language in the world?'],
    [1, 'C'],
    [2, 'Java'],
    [3, 'javaScript'],
    ['Correct', 3],
    [true, 'Correct 🎉'],
    [false, 'Try Again!'],
  ]
);
console.log(qustion);
//Covert Object to the Map
console.log(Object.entries(openingHours));
const hoursMap = new Map(Object.entries(openingHours)); //because this object exactly same as Map so we can easily convert object into map
console.log(hoursMap);
//Iteration
//iterables are possible in map because map also iterable
//Quiz App
console.log(qustion.get('Qustion')); //getting key only
for (const [key, value] of qustion) {
  //want to print only numbers
  if (typeof key === 'number') console.log(`Answer ${key}:${value}`);
}
// const Answer = Number(prompt('Your answer is ')); //converting string into number
// console.log(Answer);
const Answer = 3;
console.log(qustion.get(qustion.get('Correct') === Answer)); //if true we get 'Correct 🎉 this string from map

//Converting Map to Array
console.log([...qustion]); //back to array using destructor
// console.log(qustion.entries());
// console.log(qustion.keys());
console.log([...qustion.keys()]);
// console.log(qustion.values());
console.log([...qustion.values()]);

*/
// ======Looping Objects,keys,values and Entries===============
//PROPERY NAMES
/*
const properties = Object.keys(openingHours); //getting keys only like thu wed and fri in object type
console.log(properties);
let openStr = `we are open on  ${properties.length} days :`; //size of propery

for (const day of Object.keys(openingHours)) {
  openStr += `${day},`;
}
console.log(openStr);
//PROPERTY VALUES
const value = Object.values(openingHours);
console.log(value); //getting only values

//ENTIRE OBJECT
//Entries mean getting keys and values together
const entries = Object.entries(openingHours);
console.log(entries);

//LOOP over the object
// for (const x of entries) {
//   console.log(x);
// }
//Throw Array Destructuring and object destruturing
//if we have a simple key and value then we can we can use [key,value]
//{open,close} these values are in object that's why we give in curly paranthese
for (const [key, { open, close }] of entries) {
  console.log(`on ${key}  we open at ${open} and close at ${close}`);
}
console.clear();
/////////////////////////////////////////////////////////

// =======Optional Chaining===========
// console.log(restaurant.openingHours.mon); //actualy monday doesn't exist
if (restaurant.openingHours.mon) console.log(restaurant.openingHours.mon.open);
if (restaurant.openingHour && restaurant.openingHours.mon)
  console.log(restaurant.openingHours.mon.open);
//we need to write many property for checking single conditio
//here's javascript introduced ES20 great solution for this, which is feature called optional chaining
//in optional chainging if some properties doesn't exist then undefined return immediately
//=======With Optional Chaining========
console.log(restaurant.openingHours.mon?.open); //?.if exist it will open if not return undefined
//it work like nullish coalish operators if user defied 0 or empty string it won't return undefined
//=======WithOut Optional Chaining========
// console.log(restaurant.openingHours.mon.open); //!we can get error now(!this is special extension that's avaialbe in vs code)
//=======With multiple  Optional Chaining========
console.log(restaurant.openingHours?.mon?.open);
/*
//existed one
//we don't need it now just showing is exists
if (restaurant.openingHours.fri) console.log(restaurant.openingHours.fri.open); //opening time


//example
const days = ['mon', 'thu', 'wed', 'thus', 'fri', 'sat', 'sun'];

for (const day of days) {
  //if we want to access variable inside the enhance loop we can use [day]
  //?.optional chainging it will return true satement if previous is true if not then or(?? nullish coalising operatos) will work we can set default values as close
  const open = restaurant.openingHours[day]?.open ?? 'closed'; //[day] it's dynamicly access elements in the array
  console.log(`on ${day}, we open at ${open}`);
}

//optional chaining in methods
//it's also work in method
console.log(restaurant.order?.(0, 1) ?? "method doesn't exist");
//try with doesn't exist method
console.log(restaurant.orderRoseburry?.(0, 1) ?? "method doesn't exist");

//optional chaining in Arrays
const user = [
  {
    name: 'saravanan',
    email: 'hello@gmail.com',
  },
];
const user1 = [];
//get first element of the array
console.log(user1[0]?.name ?? 'user array is empty'); //user[0] retrive 0th index

//Before this feature we need to write like this logicaly
//that's look like a lot of work here
if (user.length > 0) console.log(user[0].name);
else console.log('user array is empty');
*/

///////////////////////////////////////////////////
const game = {
  team1: 'Bayern Munich',
  team2: 'Borrussia Dortmund',
  players: [
    [
      'Neuer',
      'Pavard',
      'Martinez',
      'Alaba',
      'Davies',
      'Kimmich',
      'Goretzka',
      'Coman',
      'Muller',
      'Gnarby',
      'Lewandowski',
    ],
    [
      'Burki',
      'Schulz',
      'Hummels',
      'Akanji',
      'Hakimi',
      'Weigl',
      'Witsel',
      'Hazard',
      'Brandt',
      'Sancho',
      'Gotze',
    ],
  ],
  score: '4:0',
  scored: ['Lewandowski', 'Gnarby', 'Lewandowski', 'Hummels'],
  date: 'Nov 9th, 2037',
  odds: {
    team1: 1.33,
    x: 3.25,
    team2: 6.5,
  },
};

//Challange 2
/* 
Let's continue with our football betting app!

1. Loop over the game.scored array and print each player name to the console, along with the goal number (Example: "Goal 1: Lewandowski")
2. Use a loop to calculate the average odd and log it to the console (We already studied how to calculate averages, you can go check if you don't remember)
3. Print the 3 odds to the console, but in a nice formatted way, exaclty like this:
      Odd of victory Bayern Munich: 1.33
      Odd of draw: 3.25
      Odd of victory Borrussia Dortmund: 6.5
Get the team names directly from the game object, don't hardcode them (except for "draw"). HINT: Note how the odds and the game objects have the same property names 😉

BONUS: Create an object called 'scorers' which contains the names of the players who scored as properties, and the number of goals as the value. In this game, it will look like this:
      {
        Gnarby: 1,
        Hummels: 1,
        Lewandowski: 2
      }

GOOD LUCK 😀

//task 1
//printing playes whom goal in game
for (const [i, player] of game.scored.entries()) {
  //getting index with elements
  console.log(`Goal ${i + 1}: ${player}`); //array always start with oth index so in-order to play 1 we add with 1 0+1=1 player
}

//task 2
//finding average
let avg = 0;
const odds = Object.values(game.odds);
for (const odd of odds) {
  avg += odd;
  avg /= odds.length; //length of the array
  console.log(avg);
}

//task 3
//content of the object
// Odd of victory Bayern Munich: 1.33
// Odd of draw: 3.25
// Odd of victory Borrussia Dortmund: 6.5
for (const [team, odd] of Object.entries(game.odds)) {
  //getting key and values while getting keys and values
  //if value (team)==x 'draw' or 'victory
  const teamStr = team === 'x' ? 'Draw' : `victory${game[team]}`; //getting object object name and [propery value]
  console.log(`odd of ${teamStr} ${odd}`);

  // console.log(team, odd);
}
console.log(game.odds.team1);
*/

//=====SET in JAVASCRIPT==========
/*
//Set => collection of unique values
//Set can never have Dublicate Values
//it's look similar like array it's desn't contain key and values
//it contain set of values like array but array allow dublicate values but set won't
//Just like array set also iterables though it similar like array but set is irrelevent

const orderSet = new Set([
  'pasta',
  'pizza',
  'pizza',
  'Risatto',
  'pasta',
  'pizza',
]);
console.log(orderSet);
//String also iterable
console.log(new Set('saravanan')); //iterable

//working with set
console.log(orderSet.size); //size of set  it won't calculate dublicate values it compute only unique values
//checking is certain element is there in set
console.log(orderSet.has('pizza')); //true
console.log(orderSet.has('Bread')); //false

//we can also add new elements to the set
orderSet.add('Garlic Bread');
orderSet.add('Garlic Bread'); //intentialy give two time
console.log(orderSet);
//delete set
//HINTS : All the methods are stright forward we can understand set work very easily
orderSet.delete('Risatto');
console.log(orderSet);
// console.log(orderSet[2]); //it will return undefined
//the reson there is no index in set infact there is no way of getting values from set
//There is no need of getting data out from set because all the values are unique

//HINTS if our goal is insert values and retrive it then we can use array in this case

//Delete all the elements from set
// orderSet.clear();
// console.log(orderSet); //now the set is empty and size also 0

//Set also iterable
for (const x of orderSet) {
  console.log(x);
}

//EXAMPLE IN REAL CASE
const staff = [
  'waiter',
  'chef',
  'waiter',
  'chef',
  'manager',
  'chef',
  'manager',
];
//if we want to only unique position in array then we can use set
// const staffUniqe = new Set(staff);
//we want into an array formate then we can use spread operators
const staffUniqe = [...new Set(staff)];
console.log(staffUniqe); //now getting only unique elements

console.log(
  new Set(['waiter', 'chef', 'waiter', 'chef', 'manager', 'chef', 'manager'])
    .size
);
//count how many different values in array
console.log(new Set('saravanan').size);

//HINTS: whenever we want to store values and that values contains dublicate then we can use array
//Example array
const myself = ['Saravanan', 25, 'Softwere Developer', 'Trichy', true, 5.9];
console.log(myself);
*/

//=====MAP in JAVASCRIPT==========
/*

//it will store values in key and value pair(key,value);
//although map similar like object but it's totally different
//object =>object can have only String key
//map =>is also similar like object, but map can have any diffent type of key ,it could be
//String or array,object or other maps

const rest = new Map(); //create empty map
//then assign values to the map
//and we know very well that map can contain different type of key
rest.set('name', 'Classic Italiano'); //set is similar to add method we use set method to insert values in map
rest.set(1, 'Fireze', 'italy');
console.log(rest.set(2, 'Lisban', 'portugal')); //it' not calling spefic one it will call entire map
//the reason set method actually return updated map
rest
  .set('categories', ['Italian', 'Pizzeria', 'Vegetarian', 'Organic']) //String
  .set('open', 11)
  .set('close', 23)
  .set(true, 'We Are Open 😀') //boolean
  .set(false, 'we are closed 😔');
console.log(rest);
// In order to read the data from map , map have get method
//we can use get method to retrive the data
//all we need to pass the key passing the key to get data
console.log(rest.get('name'));
console.log(rest.get(1));
console.log(rest.get(true));

//let's fun with Map open and close these are related to true or false
const time = 8; //9 pm
console.log(rest.get(time > rest.get('open') && time < rest.get('close'))); //rest.get(true or false);

//check map contain certain key
console.log(rest.has('categories'));
console.log(rest.has(2)); //also exists
console.log(rest.has('Menu')); //false menu isn't exists
//delete key
rest.delete(2);
console.log(rest);
//size propery
//HINT: variable name without () is called propery and name end with () is called method
//clear,Remove all the items from map
// rest.clear();
const arr = [1, 2];
// rest.set([1, 2], 'Test');//it won't work it though we set the object we can't get the object inorder to get the the value we need to create separate array
rest.set(arr, 'Test');
//map using in DOM Elements
rest.set(document.querySelector('h1'), 'Heading');
console.log(rest);
console.log(rest.get(arr));
console.log(`Map size is :${rest.size}`);
*/
