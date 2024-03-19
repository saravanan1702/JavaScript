'use strict';

const restaurant = {
  //couples of array
  name: 'Classico Italiano',
  location: 'Via Angelo Tavanti 23, Firenze, Italy',
  categories: ['Italian', 'Pizzeria', 'Vegetarian', 'Organic'],
  starterMenu: ['Focaccia', 'Bruschetta', 'Garlic Bread', 'Caprese Salad'],
  mainMenu: ['Pizza', 'Pasta', 'Risotto'],
  //object inside object
  openingHours: {
    thu: {
      open: 12,
      close: 22,
    },
    fri: {
      open: 11,
      close: 23,
    },
    sat: {
      open: 0, //Open 24 Hours
      close: 24,
    },
  },
  order: function (startedIndex, mainIndex) {
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
  orderPasta: function (inc1, inc2, inc3) {
    console.log(
      `Here is Your Delicious pasta with ${inc1},${inc2} and ${inc3}`
    );
  },
  orderPizza: function (mainIncredient, ...otherIncredient) {
    console.log(mainIncredient); //show induvidial value
    console.log(otherIncredient); //rest of the values packed and show in array format
  },
};
// =====Looping Array=========
//The For-of-loop

const menu = [...restaurant.starterMenu, ...restaurant.mainMenu];
for (const item of menu) console.log(item);
//now using destructuring way

//Hints:
//we can get element index in for of loop
//the Reason for of loop iterate based on elements not values

//There's another way of getting index but we use map
// for (const item of menu.entries()) console.log(item);
// console.log(menu.entries()); //iterator{}
// console.log([...menu.entries()]); //each element contain index and it's value(using map class  method)

//this is old school way
for (const item of menu.entries()) {
  console.log(`${item[0] + 1}:${item[1]}`);
}
console.log('\n\n');
//now using Destructuring way
for (const [i, el] of menu.entries()) {
  //i for index and el for elements
  console.log(`${i + 1}:${el}`);
}

/*
const rest1 = {
  name: 'capri',
  // numGuests: 20,
  numGuests: 0, //we can use nullish coalesing oprators
};
const rest2 = {
  name: 'la pizza',
  owner: 'saravanan',
};


//=====LOGICAL ASSIGNMENT OPERATORS=======
//it's indroduced in ES2021
//===OR ASSIGNMENT OPERATORS======

//adding numofGuest property to the object doesn't have that one
// rest1.numGuests = rest1.numGuests || 10; //it exist then return existing value if not return default values this is shortcircuit or operators
// rest2.numGuests = rest2.numGuests || 10;
//instead of doing assign like we can assign directy
// rest1.numGuests ||= 10; //if there then truthy value will print if not falsy (default) value will be print
// rest2.numGuests ||= 10;
//if there is values assingned like zero or empty string '' then it will become falsy valueus
//in this suitvation we can use nullish coalesing operator it will give true when we assign 0 or empty string '' except null and undefined
//===NULLISH ASSIGNMENT OPERATORS======

rest1.numGuests ??= 10; //if 0 assinged in numguest then it will become true it will print zero
rest2.numGuests ??= 10; //if not exist then will print default value

console.log(rest1); //20
console.log(rest2); //10

//===AND ASSIGNMENT OPERATORS======

// rest1.owner = rest1.owner && '<ANNOYMOUS';
// rest2.owner = rest2.owner && '<ANNOYMOUS';
rest1.owner &&= '<ANNOYMOUS';
rest2.owner &&= '<ANNOYMOUS';
console.log(rest1);
console.log(rest2);

*/
/*
console.log('====Nullish coalescing Operators =======');
// nullies values sysntax ??
restaurant.numGuests = 0; //setting default value as false value 0
const guest = restaurant.numGuests || 10; //if guest is there then print guest no print it default value(false)
//it's introduced in ES2020
//nullish values : null and undefined (it doesn't include 0 an "" empty string) if nullish coalesing oprators it is as if zero (0) or empty string ('') they're not falshy values instead they're truthy values
const guestCorrect = restaurant.numGuests ?? 10; //it almost do the same thing of Or operators but it will fix the error if assign as zero then it will print zero if not then only give next one
console.log(guestCorrect); //actually we get real value that we assign as numGuest
//it works based on nuliesh values instead of falshy values

*/
/*
///////////////////////////////////
//=======Short Circuiting(&& ||)
console.log(`=====OR=======`);
//logical operators
//Use Any data types, retur Any data types,Short-circuiting
//OR operators we know it will return true either one is true
//Circuiting Mean if first value is truthy value then it will return immediatly that first values if not then only it wil check second values if it's true then return that value
//if first Operant is truth then it will return that first values if not then check second one it's also false return second false value
//if first oprant is true then second operant not even evaluate that's what we mean short circuiting
console.log(3 || 'sara'); //if first one is true it won't check second one it will return 3
//now give first value as false values
console.log('' || 'sara'); //sara will be print
console.log(true || 0);
console.log(undefined || null); //null also falsy value but it will return second one
//now generalize with more operants
console.log('' || 0 || undefined || 'hello' || 23 || true || null); // as soon as if it's find first   truthy values it will return it won't evaluate rest of the operant thought they are true
//we know very well about OR operants if at least one operents is true it will return  true

//Example
//intentionaly giving not existing method
//Ternary Opeartors
// restaurant.numGuests = 20; //if we assign propery and values then it will return 20;
// console.log(restaurant);
const guests1 = restaurant.numGuests ? restaurant.numGuests : 10; //if there it will return number of guests if not it will return default value
console.log(guests1); // o/p 10 the reason numGuests is not exists so it will return false value
//instead of using ternary operators we can use advantage of short circuiting and OR Operators
const guests2 = restaurant.numGuests || 10; //restaurent.numGuests is undefined(false) so default value is true so it will return 10
console.log(guests2);

console.log(`=====AND=======`);
//AND Operator also doing shor circuiting (&&)
//and operator terminalogy it will return only both operants are true
//if either one is false it will return false
//InShortCircuitng and (&&) operators check first operants if first operant is false values then immediatly return false if not then check second operants the reason second oprants might have been false it will check
//we can say that in simply way && short circuiting work opposite of OR

console.log(0 && 'sara'); //the first value is falsy so then it will immidiatly return false
console.log('' && undefined);
console.log(22 && 'Sara'); //sara will print the reason first is true it will evaluate next one and print last value
//genaralize
console.log('hello' && 22 && true && null && 'sara'); //null

//practical Example
//traditional if else statement for evaluate inner values if() condition is true then inside the part will be work 
//if execute only the condition is true same as use && short circuit use for evaulate
if (restaurant.orderPizza) {
  restaurant.orderPizza('mushroom', 'redchilli');
}
//instead of using if statment we can use && short-circuiting it will evaluate 2nd statement only first statement is true
restaurant.orderPizza && restaurant.orderPizza('mushroom', 'green chilli');
*/
/*
//=======Rest pattern and  Parameter=======
//REST PATTERN HOW IT WORKS:
//Collect Elements in a destructuring assginment
//The Rest syntax is taking multiple numbers or multiple values and then packs them all into one array onceagain it doing opposite of spread operators

//=========part 1===========
//SPREAD,Because on RIGHT SIDE of =
const arr = [1, 2, ...[3, 4]];
//REST, Because of LEFT SIDE OF  =
//the remaining elements will be collected as array or we can say that like unused elements
const [a, b, ...others] = [1, 2, 3, 4, 5];
console.log(a, b, others);
//NOTES =>Rest elments ... always be last and we can use only one rest pattern we can't use multiple pattern
const [pizza, , ristoto, ...otherfood] = [
  ...restaurant.mainMenu,
  ...restaurant.starterMenu,
];
console.log(pizza, ristoto, otherfood);
//Now Working with Objects
//same as array the remaining elements will be collected as object
const { sat, ...weekdays } = restaurant.openingHours;
console.log(sat, weekdays);

//=======part 2 functions========
const add = function (...numbers) {
  // console.log(numbers);
  let sum = 0;
  for (let x of numbers) {
    sum += x;
  }
  console.log(sum);
};
add(2, 3);
add(4, 5, 6);
add(3, 4, 5, 6, 1, 9);
const x = [1, 2, 3, 4, 5];
add(...x); //now uinng spread ,spread is opposite of rest
//calling object's method using rest pattern
restaurant.orderPizza('mashroom', 'onion', 'tomoto', 'spinach'); //we specifiy only one thing in arguments then rest of the arguments will packed into array
restaurant.orderPizza('mushroom'); //now specify argument will show rest of the arguments will be empty array
*/
//=======The Spread Operators=======
/*
const a = [7, 8, 9];
const badNewArr = [1, 2, a[0], a[1], a[2]];
console.log(badNewArr);
//ES6 spread operators
//spread operators what it does, basically to take all the values of this (a) array then write them individualy
const newarray = [1, 2, ...a]; //syntax (...(arrayName))
console.log(newarray); //[1,2,7,8,9]
console.log(...newarray); //now it would be individualy element of array like 1,2,7,8,9
console.log(1, 2, 7, 8, 9); //same like this
//now for example if we want to add new dish to main menu
const newMenu = [...restaurant.mainMenu, 'Gnocci']; //not manipulating original array just crete another array with new elementens
//note that [] with symbol this is array
console.log(newMenu);

//copy Array
const mainMenuCopy = [...restaurant.mainMenu]; //now we did shallow copy of mainMen ,just similiar like using dot operatos
console.log(mainMenuCopy);
//exmple
// const coyy = [restaurant.mainMenu]; //same as ... using spread operatos
// console.log(coyy);

//Join Two Array
const Menu = [...mainMenuCopy, ...restaurant.starterMenu];
console.log(Menu);
//spread operators only work on array no isn't true it will work on so all-called iterables
//Iterables are like arrays,strings,map and set except object
const str = 'saravanan';
// const letter = [...str]; //store in indiduvial letters in array
const letter = [...str, '', 'A']; //store in indiduvial letters in array
console.log(letter); //in individual array format
console.log(...str);
//function
//Real-World Examples
// const incredients = [
//   prompt("let's make pasta ! Ingrident!? "),
//   prompt("let 's make pasta with incredient2?"),
//   prompt("let's make pasta with incredient3?"),
// ];
// console.log(incredients);
//order pasta with our faviour incredient (for example)
// restaurant.orderPasta(...incredients);

//NOTE That without spread operators we write like this
// restaurant.orderPasta(incredients[0], incredients[1], incredients[2]);

//Since ES2018 spread operators also works on objects ,though the objects aren't literals
//OBJECTS -REAL WORLD EXAMPLE
//...restaurent this is copy all the properties and values into new object
const newRestaunrent = {
  FoundedIn: 1999,
  ...restaurant,
  Founder: 'Saravanan',
};
console.log(newRestaunrent);
//we can shallow copy of original and change peroperities also it won't affect original
const restaurantCopy = { ...restaurant };
restaurantCopy.name = 'Ristarante Roma';
console.log(restaurantCopy.name);
*/
//========destructuring========
//call the function of orderDelivery
//passing object in object's function
/*
restaurant.orderDelivery({
  time: '22:10',
  address: '10/13 A veenush st,trichy',
  mainIndex: 2,
  startedIndex: 2,
});
//when we called object we didn't give other 3 propeties and values it will take default values
restaurant.orderDelivery({
  address: '10 a veenush street,trichy',
});
//=============Destructuring objects==========
//syntax for destructuring object {} we use curly braces for Destructuring Objects like array we use [] squre bracket
const { name, openingHours, categories } = restaurant;
console.log(name, openingHours, categories);
//if we want variable name different from the propery names, then we can assign separate variable name or properties
//Original Object Name :third party variable name(dublicate variable)
const {
  name: restaurantName,
  openingHours: hours,
  categories: tags,
} = restaurant;
console.log(restaurantName, hours, tags); //this immensely really help full with dealing third-party datas

//setting default values like array destructuring instead of getting undefined we can set default values
//there is no menu array in object but we set that
//menu array is not there but startedMenu array is there in restaurent object
//Defaut values
const { menu = [], starterMenu: starters = [] } = restaurant; //also give default values it doesn't exit
console.log(menu, starters);

//mutating Variables while Destructuring Object
let a = 111;
let b = 999;
const obj = { a: 22, b: 33, c: 14 };

({ a, b } = obj); //when javascript see {} it will thing this is code block so it will give error unexped token we need wrap up with ()when we use destructuring object
console.log(a, b);

//nested Object
// const { fri } = openingHours;
// console.log(fri);
//getting only values inside the object
// const {
//   fri: { open, close },
// } = openingHours;
// console.log(open, close);

//we can give different name also
const {
  fri: { open: o, close: c },
} = openingHours;
console.log(o, c);
*/
/*
==========Destructuring Array=============
const arr = [2, 3, 4];
const a = arr[0];
const b = arr[1];
const c = arr[2];

//destructuing we can actually declare three variables at the same time
//syntax for destructuring [variables] look like a array but it's not really
//whenever we assign [] before = sign javascript knows it would be destructuring
const [x, y, z] = arr;
console.log(x, y, z); //destructuing
console.log(arr); //original array

// const [first, second] = restaurant.categories; //it will take 0th and 1st index position values
// console.log(first, second);

//if we want to take 2nd index(3rd element) from array we can use (,)it will just skip
// const [first, , second] = restaurant.categories; //it will take 0th and 2st index position values(1st and 3rd values)
// console.log(first, second);

//if owner want to change the main dish
let [main, , secondary] = restaurant.categories;
console.log(main, secondary);

//create temparary variable
//before Destructuing
//We need to Switching Variables
// let temp = main;
// main = secondary;
// secondary = temp;
// console.log(main, secondary);

//After Destructuring
//now we don't need temparay variabeles
[main, secondary] = [secondary, main];
console.log(main, secondary);

// console.log(restaurant.order(2, 0));

//Receive 2 return values from function
const [starter, mainItem] = restaurant.order(2, 0);
console.log(starter, mainItem);

//Nested Array
//Array inside another array
const nested = [2, 4, [5, 6]]; //0th index and 1st index 2nd index(another Array)
// const [i, , j] = nested;
// console.log(i, j);

//NESTED DESTRUCTURING
//if want to access specific 2nd array index values as separate variables
//1st element and skip second values then [j,k] acess 2nd array index values
const [i, , [j, k]] = nested;
console.log(i, j, k);

//DEFAULT VALUES
const [p, q, r] = [8, 9];
console.log(p, q, r); //8,9,undefined
//if there is no values for desctruturing we can set default values instead of getting undefined

const [A = 1, B = 1, C = 1] = [8]; //is ther any values available it will take otherwise it will assign 1
console.log(A, B, C); //8,1,1
*/
