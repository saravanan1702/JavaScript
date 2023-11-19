//strict mode
"use strict";
//strict mode use for 2 reason
//1.forbid to do certain things
//2.create visible errors for us in console what we made which line we made it mistake

//ex


//show visible errror in console
let hasDriversLicense = false;
const passTest = true;
if (passTest) hasDriversLicense = true; //it shows error what we did  if we don't use strict mode it will  omid that we hardly to find that bug
if (hasDriversLicense) console.log("i can drive :D");

//forbid to do certain things in Javascirpt

//const interface = "audtio"; //error in this line we can't use variable name as reserved keywords it shows in console
//this one also reserved keywords
// const private = 101;


//function in javascript
//function is a piece of code that we can reuse them over and over again as many times we want

function logger() {
  console.log("hello, my name is saravanan!");
}

//calling /running/invoking function
logger();
logger();

//return method

function fruitProcessor(apple, orange) {
  console.log(apple, orange);
  const juice = `Juice with ${apple} apples and ${orange} Oranges.`;
  return juice;
}
//we can store that return value in variable or we can print it directly
//passinging arguments for function parameter

//1.store it in variable

const applejuice = fruitProcessor(3, 0);
console.log(applejuice);

//2. directly printing
console.log(fruitProcessor(3, 0));

//for oranges
const orangejuice = fruitProcessor(0, 4);
console.log(orangejuice);

//adding two values

function add(a, b) {
  const total = a + b;
  return total;
  // return a + b;
}
console.log(add(2, 3));

const totalval = add(5, 5);
console.log("total is :" + totalval);


//Function Declaration vs Expression

//Function Declartion

function calcAge1(birthYear) {
  //current year and birth year (input from user while function call)
  return 2023 - birthYear;
}

//we need to capture that values or save values in order to show in console
//that retun values in calcge1
const age1 = calcAge1(1999); //specifiying the arguments which is passing for function paramter
//print the return value
console.log(`Your age is now ${age1}`);

//Function Expression
//the other type of function is exists it look like this
//function expression is we declare a function with variable then function doesn't have any name so it became annoymous function
//expression produce some value

//store it into variable
const calcAge2 = function (birthYear) {
  return 2023 - birthYear;
};
//we can print it directly or store it separately and print it that value
console.log(calcAge2(2000)); //23
const age2 = calcAge2(1999); //24
//function dec vs expression
console.log(age1, age2); //24 24


//Arrow Function in JavaScript
//this is third type of function it was added to javascript in ES6
//Arrow Functionn simply special form of functional expression that's shorter and therefore fasater to write

//just for comparision

//function expression
const calcAge2 = function (birthYear) {
  return 2023 - birthYear;
};

//Arrow Function
const calcAge3 = (birthYear) => 2023 - birthYear; //it's only work if we have only one statemetent incase if we have multiple statement we write currly braces and define block of code
//this is implicity  return the values without having us to explicity  return keywords
const age3 = calcAge3(1999);
console.log(age3);
console.log(`your age is now ${age3}`);

//example a block of code in arrow function =>in this case we need to do lot of thing so we use block of code with currly braces
const retirementUntilYear = (birthYear, firstName) => {
  //in this suitvation we do lots so we define in block
  //1st find the age of the person
  const age = 2023 - birthYear;
  //2nd find the retermint year left
  const retirement = 60 - age;
  return `${firstName} you have only ${retirement} years left to retairement`;
  // return retirement; //we return the values explicity because aren't define the function in sinle line we do lot of things in this block
};
//3rd capture that return values
const retirementyearLeft = retirementUntilYear(1999, "jasmine");
console.log(retirementyearLeft);
const retirement2 = retirementUntilYear(1995, "Saravanan");
console.log(retirement2);
//if we pass multiple parameter then we should wrap up in wrap meter

//example

const addition = (a, b) => {
  const total = a + b;
  return total;
};
const add = addition(12, 2);
console.log(add);

const mul = (a, b) => {
  return a * b;
};

console.log(mul(12, 3));


//1 function declartion
function add(a, b) {
  let total = a + b;
  return total;
}
//call this function
//since it return type so we can store in a variable or directly print it out
console.log(add(12, 2));

//2 function Expression
const addition = function (a, b) {
  return a + b;
};
console.log(addition(12, 2));

//3 Arrow Function

const multiple = (mul) => mul * mul;
console.log(multiple(5));


//function calling other function
//one function inside of another function

//function expression
const cutPieces = function (fruit) {
  return fruit * 4;
};

//function declaration
function fruitProcessor(apples, oranges) {
  //calling another function inside function
  //capture that return values
  const applePieces = cutPieces(apples); //passing apples as a arguments
  const orangePieces = cutPieces(oranges); // passing oranges as arguments
  const juice = `juice with ${applePieces} pieces of apples and ${orangePieces} pieces of Oranges.`;
  return juice;
}
console.log(fruitProcessor(2, 4));

//37 Reviwing Function
const calcAge = function (birthYear) {
  return 2023 - birthYear;
};

const retirementUntilYear = function (birthYear, firstName) {
  //let's call these two function separately(function inside function)
  // const age = 2023 - birthYear;
  const age = calcAge(birthYear);
  const retirement = 65 - age;
  if (retirement > 0) {
    return retirement;
    //once it return it will immidiatly exit from the block it will return the values and exit from block whatever we write after that it won't execute
    //just ignored
    console.log(`${firstName} retaire in ${retirement} year `); //and it will actually work if this statement before return statment(alt+^Up arrow)
  } else {
    return -1; //make sense if values give negative he's already retaired
    console.log(`${firstName} is already retaired 🥳`); //this part of statement won't executed because before that statement we give return statement so it will omit that statement and once return the values it will leave immidiatly
  }
  // return `${firstName} retaire in ${retirement} year`;
};
console.log(retirementUntilYear(1920, "saravanan"));
console.log(retirementUntilYear(2000, "jasmine"));

//taks 3 functions

//calculating average
const calcAverage = (a, b, c) => (a + b + c) / 3;

//test 1

let scroeDolphines = calcAverage(44, 23, 71);
let scroeKoalas = calcAverage(65, 54, 49);
console.log(scroeDolphines, scroeKoalas);

//function expression

// const checkWinner = function (avgDolphines, avgKoalas) {
//   if (avgDolphines >= 2 * avgKoalas) {
//     console.log("Dolphines win the 🏆");
//   } else if (avgKoalas >= 2 * avgDolphines) {
//     console.log("Koalas win the 🏆");
//   } else {
//     console.log("No Teams win the 🏆");
//   }
// };

//samething in function declaration

function checkWinner(avgDolphines, avgKoalas) {
  if (avgDolphines >= 2 * avgKoalas) {
    console.log("Dolphines win the 🏆");
  } else if (avgKoalas >= 2 * avgDolphines) {
    console.log("Koalas win the 🏆");
  } else {
    console.log("No Teams win the 🏆");
  }
}
checkWinner(scroeDolphines, scroeKoalas);
//we can pass our own values these arguments are independent
checkWinner(450, 130); //indipendent arguments to parameter for checkwinner function

scroeDolphines = calcAverage(85, 54, 41);
scroeKoalas = calcAverage(23, 34, 27);
checkWinner(scroeDolphines, scroeKoalas);
scroeDolphines = calcAverage(85, 54, 41);
scroeKoalas = calcAverage(123, 134, 127);
checkWinner(scroeDolphines, scroeKoalas);


//Arrays =>data Structure
//instead of writing multiple values we can write multiple values with single variable

const friends = ["jasmine", "allwin", "santhosh"];
console.log(friends);
//another way of creating arrays
const year = new Array(1991, 1992, 1993, 1994, 1995);
console.log(year);

//if we want to get specific values from array
console.log(friends[0]); //arrays are zero based it meaans arrrays always start with zero th position to n numbers
//if we want to get 3rd values of the arrray then it must be in 2nd position of array
console.log(friends[2]);

//total lenth of the array
console.log(friends.length);
//last element from array
console.log(friends[friends.length - 1]); //3-1=2nd position values

//add new element to the array
friends[3] = "saravanan";
console.log(friends);
//also overwrite that values if we give another values in same position
friends[3] = "bhuttu";
console.log(friends); //now 3rd position values overwrite now that values changed(replaced) to bhuttu
console.log(friends.length);
//passing multiple values in array

const firstName = "jasmine";
const jasmine = [firstName, "saravanan", 2023 - 2000, "Programmer", "Trichy"];
console.log(jasmine);

//exercise

const calcAge = function (birthYear) {
  return 2023 - birthYear;
};
const y = [1999, 2000, 2001, 2002, 2003];
const age1 = calcAge(y[0]); //oth position
const age2 = calcAge(y[y.length - 1]); //last position
console.log(age1, age2);

//for loop for just demo not yet started this lesson
// for (let i = 0; i < y.length - 1; i++) {
//   console.log(calcAge(y[i]));
// }

//store that values in new array

// const ages = [age1, age2];

//we can do this in expression way also
const ages = [calcAge(y[0]), calcAge(y[y.length - 1])];
console.log(ages);


//Array Methods

const friends = ["jasmine", "allwin", "santhosh", "Saravanan"];
console.log(friends);
//1.push =>add elements end of the array
friends.push("Bhuttu");
console.log(friends);
//2.unshift=> to add elements begining of the array list
//since unshift()is function(method) so it has return type or it return values we can store it separate variable and print it
//most of the time we don't use this method
// const newArray = friends.unshift("paapu");
// console.log(newArray);//it give lenth of the array
friends.unshift("Paapu");
console.log(friends);
//3.pop => opposite of push method,it will remove last elements from array
friends.pop(); //this time we don't need to pass the any elements we just delete it, we don't add any elements
console.log(friends); //last element will be removed
//4.shift =>remove first element from array while we delete we never pass any argument inside the paranthese
// friends.shift(); //first element will be deleted in array
const shiftedEl = friends.shift();
console.log(shiftedEl); //removed elements we can see that
//we need to see removed element capture we can store it variable and see that
//5.indexof=>it will return the element which position it's located
console.log(friends.indexOf("allwin"));
//6.includes =>it's ES6 method if the given values available in array list it will return true if not give false
console.log(friends.includes("allwin"));
console.log(friends.includes("paapu"));
//HINTs; includes => and  this method used strict equality Strict equality we know only compare same type of data types doesn't do type coerion
//example
friends.push(23);
console.log(friends.includes("23")); //false
console.log(friends.includes(23)); //true

//included method very useful to write conditional statement as well

if (friends.includes("allwin")) {
  console.log("you have a frined called allwin");
}

//task
// Steven wants you to improve his tip calculator, using the same rules as before — tip 15% of the bill if the bill value is between 50 and 300, and if the value is different, the tip is 20%.

// Your tasks:

// Write a function calcTip that takes any bill value as an input and returns the corresponding tip, calculated based on the rules above (you can check out the code from the first tip calculator challenge if you need to). Use the function type you like the most. Test the function using a bill value of 100.

// And now let's use arrays! So, create an array called bills containing the test data below.

// Create an array called tips containing the tip value for each bill, calculated from the function you created before.

// BONUS: Create an array totals containing the total values, so the bill + tip.

// TEST DATA: 125, 555, and 44.

const calcTip = function (bill) {
  //using ternary operators it's AN expression it produce values
  return bill > 50 && bill < 300 ? bill * 0.15 : bill * 0.2;
};
//normal function
// function calctips(bill){
//   return bill>=50 && bill<=300?bill*0.15:bill*0.20;
// }
//arrow function
//variable,parameter,and operators
const calctip = (bills) =>
  bills > 50 && bills <= 300 ? bills * 0.15 : bills * 0.2;

//create array for bill
const bills = [125, 555, 44];
const tips = [calcTip(bills[0]), calcTip(bills[1]), calcTip(bills[2])];
const total = [bills[0] + tips[0], bills[1] + tips[1], bills[2] + tips[2]];
console.log(bills, tips, total);

//object=>another important data structure in javascript
//we can't give names in array values we can just pass the values store them and print them and we can't give specific name to the values
//but we can do in object that it's spciality

//Array Recap it's not a object

const arr = [
  "saravanan", //first name
  "arumugam", //last name
  2023 - 1999, //age (number)
  "Full Stack Developer", //job
  "Trichy", //Location

  //array of array (array inside array)
  ["jasmine", "allwin", "santhosh"], //my firends

  //these all the values i can't give separate names but we can do it objects
];
//we can print them in console, because array allowes to store mutiple values in single name but not give separate names for each values
console.log(arr);

//In object we can do that because object do with key and pairs
//object properties =>the object properities contain key and values each key contain some specific values not only specific(i mean different data types or maybe same data types)

//create object

const saravanan = {
  //inside the curly brases these all the key and values call properites

  //key       values
  firstName: "saravanan",
  lastName: "Arumugam",
  //current year - my birthYear
  age: 2023 - 1999,
  job: "full stack Developer",
  location: "Trichy,TamilNadu",
  friends: ["Jasmine", "allwin", "santhosh"],
};
console.log(saravanan); //if i say saravanan these are my profile i can say it (just for fun😁)

//HINTs =>Array we use[], ==>store multiple values can't give specific name to each values and Arrays are orderd datas
//Objects we use{}, ==>store multiple values simitinously we can giv specific name for each values (key =variable names,value=>actual value for variable) and objects are unstructured data



//dot (.) notation and bracket[] notaion two ways of getting properties values
const saravanan = {
  //inside the curly brases these all the key and values call properites

  //key       values
  firstName: "saravanan",
  lastName: "Arumugam",
  //current year - my birthYear
  age: 2023 - 1999,
  job: "full stack Developer",
  location: "Trichy,TamilNadu",
  friends: ["Jasmine", "allwin", "santhosh"],
};
//dot . notation

//object name(saravanan).property name(lastName);

console.log(saravanan.lastName); //getting lastName from object using dot notation

//bracket notation
console.log(saravanan["firstName"]); //getting first name from object using bracket notation while using bracket we give properties name in string type

//bracket notation is expression so expression produce some values if we have same variable that repeated name we can store it and print it
//example
//first(Name) and last(Name) both are reapeated part  so we do it in bracket notation

const keyName = "Name";
//insert expression but we can't do in dot notaion
//in Squre bracket we can put any expression
console.log(saravanan["first" + keyName]); //concadinate firstName=saravanan
console.log(saravanan["last" + keyName]); //concadinate lastName=arumugam

//another example for bracket notation
// const interestedIn = prompt(
//   "what do you want to know about saravanan?choose the one firstName,LastName,age,location,friends,job"
// );
//how will we get perfect values of saravanan (object).the reason is promt function is build function in javaScript and also it will return string
//and moreover bracket notation inside the bracket we give values as string format so promt function give string retunt type the string match with propety name
//that's how it will give perfect answer to us
//HINTs when we pass promt in without property name it will return undefine
// console.log(saravanan[interestedIn]); //if interestedIn="job"=>it look similar with saravanan['job'];that's why it give perfect answer to us
//we can give it like a condition
//whenever user give avaialble property value it will return appropiate values. if give not a available value it will return something we write
//instead of get undefined words

// if (saravanan[interestedIn]) {
//   console.log(saravanan[interestedIn]);
// } else {
//   console.log("it's not available");
// }

//if we want to add properties in object we can use dot notation to add
saravanan.study = "B.E Civil";
console.log(saravanan);
//also we can add new properties with bracket notatin as like dot
saravanan["socialMedia"] = "@saravanan1702";
console.log(saravanan);

//challange
//sarvanan has 3 friends ,and his  best friens is called jasmine
//using templete literal
console.log(
  `${saravanan.firstName} has  ${saravanan.friends.length} friends , and his best frined called ${saravanan.friends[0]}`
);


//object methods

const saravanan = {
  firstName: "saravanan", //(String value)
  lastName: "Arumugam",
  birthYear: 1999, //(number value)
  job: "full stack Developer",
  location: "Trichy,TamilNadu",
  friends: ["Jasmine", "allwin", "santhosh"], //(array values)
  hasDriverLicense: true, //(boolean values)

  //Add function as key and pair values
  //Method
  //Any function that's attached to an object is called method.
  //it's not a regular function it's method
  // calcAge: function (birthYear) {  //(function vaues also)
  //   return 2023 - birthYear;
  // },

  //this mean=>this keyword basicaly eqauls to the object on which method is called,
  //In other words, it's equal to object calling the method.
  calcAge: function () {
    // console.log(this); //this keyword now point to saravanan(object) now
    //though  we can otherway of pointing birthyear like
    //return 2023-saravanan.birthyear =>yeah, it work well but if we change object name it will lead error we have to change the point manualy
    //it'd better give to this keyword =>this keyword simply pointing current object whatever object name has
    // return 2023 - this.birthYear;

    //we can store it in new propery like this
    //store birthyear in age property
    this.age = 2023 - this.birthYear;
    return this.age;
  },

  //challage task in object
  getSummary: function () {
    return `${this.firstName} is a ${this.age} old ${this.job}, and he has  ${
      this.hasDriverLicense ? "a" : "no"
    } driver's license `;
  },
};
console.log(saravanan.calcAge());

//this is simila like normal function
//syntax is different because calcAge is not a regualar variable it's object of (saravanan) properties that's why we use (:)syntax
// calcAge: function (birthYear) {
//   return 2023 - birthYear;
// },

//like(normal function declaration)
// const calcAge=function(birthYear){
//   return 2023-birthYear;
// }

//access peroperties
// saravanan.calcAge(1999);//lock this result into console
// console.log(saravanan.calcAge(1999));

//also called with bracker notation
//while access properties with bracket notaiton inside bracket that key  must be string formated
// console.log(saravanan["calcAge"](1999));

//we can call that object method without passing any arguments
console.log(saravanan.age);
console.log(saravanan.getSummary());

// CHALLENGE #3
// Let's go back to Mark and John comparing their BMIs!

// This time, let's use objects to implement the calculations! Remember: BMI = mass / (height * height) (mass in kg and height in meters).

// Your tasks:

// For each of them, create an object with properties for their full name, mass, and height (Mark Miller and John Smith). Name these objects as mark and john, and their properties exactly as fullName, mass and height.

// Create a calcBMI method on each object to calculate the BMI (the same method on both objects). Assign the BMI value to a property, and also return it from the method.

// Log to the console who has the higher BMI, together with the full name and the respective BMI. Example: "John Smith's BMI (28.3) is higher than Mark Miller's (23.9)!".

// TEST DATA: Marks weighs 78 kg and is 1.69 m tall. John weighs 92 kg and is 1.95 m tall.
const mark = {
  fullName: "Mark Miller",
  mass: 78,
  height: 1.69,
  calcBMI: function () {
    this.bmi = (this.mass / this.height) * this.height;
    return this.bmi;
  },
};
const john = {
  fullName: "John Smith",
  mass: 92,
  height: 1.95,
  calcBMI: function () {
    this.bmi = (this.mass / this.height) * this.height;
    return this.bmi;
  },
};
//without calling calcBMI method we can't access inside property(bmi)
//without this calcbmi method called it wouldn;t be access inside propery bmi
//because bmi it doesn't called itselft we need to exlicity call it
mark.calcBMI();
john.calcBMI();

if (mark.bmi > john.bmi) {
  console.log(
    `${mark.fullName}'s BMI ${mark.bmi} is higher than ${john.fullName}'s BMI ${john.bmi}`
  );
} else {
  console.log(
    `${john.fullName}'s BMI ${john.bmi} is higher than ${mark.fullName}'s BMI ${mark.bmi}`
  );
}


//Iteration :The for loop
//instead of writing multiple times in console we can use for loop

//for loop keep running while condition is true
for (let rep = 1; rep <= 10; rep++) {
  console.log(`lifting weight repetition ${rep} 🏋️‍♀️`);
}


//looping in arrays,breaking and continue

const arr = [
  "saravanan",
  "arumugam",
  2023 - 1999,
  "Full Stack Developer",
  "Trichy",
  ["jasmine", "allwin", "santhosh"],
  true,
];

//create new empty array for store original into new array
const arr1 = [];
//getting all the array elemennts throw for loop
//let i=0 ...//this is counter variable to retrive all the elements one by one

for (let i = 0; i < arr.length; i++) {
  //Reading From jonas Array
  console.log(arr[i], typeof arr[i]); //printing which types as well

  //1st way of adding element into another array
  //Filling types Array
  // arr1[i] = arr[i]; //storing all the elements into new array (arr1);
  // arr1[i] = typeof arr[i]; //storing only which data types
  //another way of adding element into new array
  //push method
  arr1.push(arr[i]); //pushing original elements into another new array that we create
  //also add data types
  // arr1.push(typeof arr[i]); //it will add datatype of array
}
console.log(arr1);

//task for array understanting
const year = [1999, 2000, 2001, 2002, 2003]; //birthyear
const ages = []; // empty array for strong ages
//0,1,2,3,4;
for (let i = 0; i < year.length; i++) {
  ages.push(2023 - year[i]);
  // ages[i] = 2023 - year[i];
}
console.log(ages);

//continue and break Statement
//(continue) is to exit current iteration of the loop and cotinue to the next one
//In other hand (break) is used  to completely terminate the whole loop

//demo for continue and break
//this for loop for already writen code in previously
// don't confuse with unary operator with comparision operator
// unary logical Not operator it's gives values based on boolean if condtion is true logical not operator give false,it workd single values or condtion
//comparision operators !== it's equality operators to check both condtion it works only if there two condition ()!==() anything not only condtion might have been values also
console.log(`-----only Strings------`);
for (let i = 0; i < arr.length; i++) {
  if (typeof arr[i] !== "string") {
    continue; //skip the current iteration and move to next one
  }
  console.log(arr[i], typeof arr[i]);
}

console.log(`-----Break with Number------`);
for (let i = 0; i < arr.length; i++) {
  if (typeof arr[i] !== "string") {
    break; //terminal whole loop when it's get true
  }
  console.log(arr[i], typeof arr[i]);
}


//48.(udemy)looping Backwards and loops in loops

const arr = [
  "saravanan",
  "arumugam",
  2023 - 1999,
  "Full Stack Developer",
  "Trichy",
  ["jasmine", "allwin", "santhosh"],
];
// forward => o,1,...,4
//backward =>4,3,...0

//backward
for (let i = arr.length - 1; i >= 0; i--) {
  console.log(i, arr[i]);
}

//Loop Inside another Loop(nested Loop)
for (let excerice = 1; excerice < 4; excerice++) {
  console.log(`---------Starting Excerice--------${excerice}`);
  for (let rep = 1; rep < 6; rep++) {
    console.log(`lifting weight repetition ${rep}🏋️‍♀`);
  }
}

//we write explicit components in while loop
//while loop
// let rep = 1; //counter variable 1
// while (rep <= 10) {
//   //condition 2
//   //this condition run while it's true
//   console.log(`lifting weight repetition ${rep}🏋️‍♀️`);
//   rep++; //increement operators 3
// }

//math.trunc=>this.method getting values only decimal not flaot values
//onemore thing math function is inbuild function in javascript
// let dice = Math.trunc(Math.random() * 6) + 1;
// //                   it will give numbe 1 to 5 then add 1 for getting 6
while (dice !== 6) {
  console.log(`You Rolled a ${dice}`); //it will stop once condition check, we need to tell them to change the condition, so re assgin the dice value for check condition
  dice = Math.trunc(Math.random() * 6) + 1; //again we give condition, that's why we reassgin inside the loop
  if (dice === 6) console.log(`loop is about to end...`);
}


// CHALLENGE #4
// Let's improve Steven's tip calculator even more, this time using loops!

// Your tasks:

// Create an array called bills containing all 10 test bill values.

// Create empty arrays for the tips and the totals (tips and totals)

// Use the calcTip function we wrote before (included in the starter code) to calculate tips and total values (bill + tip) for every bill value in the bills array. Use a for loop to perform the 10 calculations!

// TEST DATA: 22, 295, 176, 440, 37, 105, 10, 1100, 86, and 52.

// BONUS:

// Write a function calcAverage which takes an array called arr as an argument. This function calculates the average of all numbers in the given array. This is a DIFFICULT challenge (we haven't done this before)! Here is how to solve it if you feel like it:

// First, you will need to add up all values in the array. To do the addition, start by creating a variable sum that starts at 0. Then loop over the array using a for loop. In each iteration, add the current value to the sum variable. This way, by the end of the loop, you have all values added together.

// To calculate the average, divide the sum you calculated before by the length of the array (because that's the number of elements).

// Call the function with the totals array.

const calcTip = function (bill) {
  return bill >= 50 && bill <= 300 ? bill * 0.15 : bill * 0.2;
};
const bills = [22, 295, 176, 440, 37, 105, 10, 1100, 86, 52];
const tips = [];
const totals = [];
for (let i = 0; i < bills.length; i++) {
  const tip = calcTip(bills[i]);
  tips.push(tip);
  // tips[i] = calcTip(bills[i]);
  totals.push(tip + bills[i]);
  // totals[i] = tips + bills[i];
}
console.log(bills, tips, totals);

//bonus task
const calcAverage = function (arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    //sum=sum+arr[i];
    sum += arr[i];
  }
  return sum / arr.length;
};
console.log(calcAverage([2, 3, 4]));
console.log(calcAverage(totals));
console.log(calcAverage(tips));
