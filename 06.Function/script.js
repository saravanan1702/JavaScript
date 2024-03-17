'use strict';
//Default parameter

/*
const bookings = []; //globally array created

const createBooking = function (
  flightNum,
  numPassanger = 1,
  price = 2500 * numPassanger
) {
  //setting default parameter
  //============ES5================
  //we can do this thing in ES5
  // numPassanger = numPassanger || 1; //short circuiting if it false then default value will take as parameter
  // price = price || 2500;
  //============ES6================
  //ES 6 we can assign default values while creating parameter
  //function(flighNum,numPassanger=1,price=2500)//this is called default paramter it's introduced in ES6
  //And one more thing this default parameter also do some expression we can compute values in default parameter
  //example price=2500*numPassanger =>this is expression

  const booking = {
    // flighNO: flightNum,
    // Pass: numPassanger,
    // pr: price,

    //We don't need to create propery for objects in ES6
    flightNum,
    numPassanger,
    price,
  };
  console.log(booking);
  bookings.push(booking); //push objects into array flighNumber,numofPassanger and Price
};
createBooking('LH123'); //we specifi only one paramter rest of them take default parameter values
createBooking('AIR24', 4, 3500);
createBooking('ASIA45', 2); //in this aruguments we passed only 2 passanger so it will compute price based on price and num of passanger
createBooking('AIR12', 5); //price will be computed dynamically
//we can't skip the parameter
// createBooking('SJ1702',,10000);//we skip the number of passanger but we can't do this
//if we want to skip there's nice trick
createBooking('SJ02', undefined, 15000); //now we can skip 2nd parameter as default

//=======How Passing arguments works values vs Reference=========
const flight = 'SJ1702';
const saravanan = {
  name: 'Saravanan',
  passport: 12345678910,
};

const checkIN = function (flightNum, passanger) {
  //actually we never change parameter values
  flightNum = 'JS0217'; //redefined flight number
  passanger.name = 'Mr.' + passanger.name;
  if (passanger.passport === 12345678910) {
    alert('Checked In');
  } else {
    alert('Wrong Passport!');
  }
};

// checkIN(flight, saravanan); //passing primitive and objects as parameter
// console.log(flight); //primitive type (String)
// console.log(saravanan); //Object

//Is the same as doing..
// const flightNumber = flight;
// const person = saravanan;

const newPassport = function (person) {
  person.passport = Math.trunc(Math.random() * 1000000000000);
};
//cmd this function call for annoying alert meg
// newPassport(saravanan);
// checkIN(flight, saravanan);

//HINTS:
//These are just example but in real javascript doesn't have pass by reference it has only pass by values
//in other language like c++ it has both pass by values and pass by reference evern in primitive types

//function accepting and call back function in javascript
//That function accept input as an input

//this is the function that get string(multiple string with space) it will return it as single string without space
const oneWord = function (str) {
  //replace space as empty string  example java script =>javascript
  //   /space/g ... g-> mean globally if we give i-> i mean ignore case sensitivity
  return str.replace(/ /g, '').toLowerCase();
};

const upperFirstWord = function (str) {
  //ex Javascript is best! transform first words as uppercase JAVASCRIPT
  const [first, ...others] = str.split(' ');
  return [first.toUpperCase(), ...others].join(' ');
};
console.clear();

//HIGER ORDER FUNCTION
//this function take argument and function as arguments
const transformer = function (str, fn) {
  //arguments and function
  console.log(`Original String :${str}`);
  console.log(`Transform String :${fn(str)}`); //passing arguments to call back function
  //HINTS Function even have methods, besides methods function also have someproperties
  console.log(`Transformed By  :${fn.name}`);
};

//Calling higher order Function
//how actually call the function
transformer(
  'javascript is the best programming language in the world!',
  upperFirstWord
); //NOTE that we aren't calling the function we are only passing function values itself, really just a value
transformer(`Javascript is really fun to learn!`, oneWord); //arguments and call back function
//call back we didn't call the fucntion javascript call this function latter
//Best example Add event listener function

//JS CALL BACK ALL THE TIME
const high5 = function () {
  console.log('👋');
};
//emoji will be diplayed when we click the body of the document
document.body.addEventListener('click', high5); //addEventListener function inside call back function
//No matter addEventListener is higher order function and high5 is call back funtion

//other example with array
['Saravanan', 'Jasmine', 'Santhosh', 'Allwin'].forEach(high5); //call back function

//Why we use call back function?
//Why call back function used many times in javascript?

//1st big advantage is
//that's make it easy to split up our code into more re-usual and interconnected parts

//2nd Important advantage is
//Call back function allows us to crate abstraction
//Abstraction is one of the core concept in oops
//abstraction mean we don't need to care about what inside the happening we just use the function otherwise we don't care about how it work, we don't care about the details
//we want to achieve something but we don't care about internal level of details that's all
//Even our trasnformer function also abstraction we just call the function we never worry about how it's transfored though we write code

//Own Excerice
const ageCalc = function (birthyear) {
  const currentYear = new Date();
  return currentYear.getFullYear() - birthyear;
};

const details = function (name, year, fn) {
  console.log(`your Name is ${name} and your age is ${fn(year)}`);
};
details('saravanan', 1999, ageCalc);

//Voter Check

const vote = function (age) {
  if (age > 18) {
    return `your age is ${age} you can vote now...👆`;
  } else {
    return `your age is ${age} you can't vote now wait for ${
      18 - age
    } year to vote 🥺`;
  }
};

const person = function (name, age, fn) {
  console.log(`Hello! ${name}, ${fn(age)}`);
};

//call the person function
//In this example we just pass the arguments and function
//we know the name and age but we don't worry about how it's computing inside the function in vote
person('jasime', 21, vote);
person('Allwin', 17, vote);

// Function Returns Function
//function return another function
//this is called functional paradigm
const greet = function (greeting) {
  return function (name) {
    console.log(`${greeting} ${name}`);
  };
};
//greet is return function, it return function so we store it another variable so that variable also function
const greeterHey = greet('Hey');
//now greeterHey also function so we just call the function that inside
//how inside the function work how can it work because it's called clouser
//it hard to understand becuase it's difucult
//clouser's most misunderstood topic in javascript
greeterHey('Saravanan');
greeterHey('Jasmine');

//another way of calling inside the function
greet('Hi')('Saravanan'); //look wired

//writing function return function in (arrow function)
//arrow function is liner way function we don't need to write function and return type
const greetArrow = greeting => name => console.log(`${greeting} ${name}`);
const greetArr = greetArrow('Hello');
greetArr('Jasmine');
greetArr('Saravanan');
greetArrow('hello')('Allwin');

console.clear();

//The Call and Apply Method
const airAsia = {
  airline: 'Air Aisa',
  airCode: 'AS',
  booking: [],
  //enhance object literal writing ,simpley defining method only
  //writing method without having function
  //before this we need to write like this book :function(){}
  //this keyword denoting current object itself
  book(flightNo, name) {
    console.log(
      `${name} booked a seat on ${this.airline} flight ${this.airCode}${flightNo}`
    );
    //add book values into booking array in object type
    this.booking.push({ flight: `${this.airCode}${flightNo}`, name });
  },
};
airAsia.book(239, 'Jasmine');
airAsia.book(154, 'Saravanan');
console.log(airAsia.booking);

//Example assuming only
//after few years air asia plan to lanch new airline

const airWings = {
  airline: 'Air Wings',
  airCode: 'AW',
  booking: [], //empty array
};

const book = airAsia.book; //assinginng object method to book variable
//now this book function is totaly different
//it doesn't work
// book(12, 'Allwin'); //it will give error because it's not relation with air Aisa object and outside book is just take copy of air Asia object method not passing values to air Asia Object

//how to call the method inside the object
//they're three function available call,bind and apply

//Instead of
//now this book is really object and object have method and then function have methods too and call method is one of them
book.call(airWings, 23, 'Saravanan'); //first arguments is exactly what we want to this keyword point to,
console.log(airWings);
//manipulating this keyword using call() method
book.call(airAsia, 17, 'Santhosh');
console.log(airAsia);

//Crate another object
//HINTs :object propery names must be name of invoking method's propeties's names
//we don't change the propery name if we change it won't work thought work it will return undefined

const airIndia = {
  airline: 'Air India',
  airCode: 'IND',
  booking: [],
};
book.call(airIndia, 25, 'Sajitha');
book.call(airIndia, 10, 'Divya');
console.log(airIndia);

//Apply Method
//The apply method do exactly as same as call method, the only difference is that apply doesn't recive list of arguments
//instead it will take array of arguments

//example for apply
const flightData = [172, 'Sara'];
book.apply(airIndia, flightData); //first arugment is this keyword and second arguments is array or array of data
//HINTS : in modern way we never often use apply method, we always prefer better way of exact same thing as arguments

//instead of using apply we simply use call method we don't need to create separate array for passing argumetns

book.call(airIndia, 333, 'Rose'); //tradional or exact same thing
//we can use spread operators also
book.call(airIndia, ...flightData);

//The Bind Method
//just like call method bind method also set this keyword manually for any function call
//The different the bind method doesn't immidiately call the function, instead it will return new function where this new keyword bound

//book.call(airWings, 25, 'Sajitha');

const bookAW = book.bind(airWings); //it will return new function where this keyword always be set to airWings
bookAW(111, 'Jasmine Saravanan'); //book.bind return new function we pass the arguments to the new function
//doing the same things for all the objects
const bookAA = book.bind(airAsia);
const bookAI = book.bind(airAsia);

bookAA(98, 'Arumugam');
bookAI(100, 'Vasuki');

//we could use bind method to create one specific airline and specific flight number
//specific only for one specfic airline Number
const bookAW23 = book.bind(airWings, 23); //we set preset for 23 specific airline flight
bookAW23('Rosario');
bookAW23('Edwin');

//With Event Listeners
//assume they have 3000 planes
airAsia.planes = 300; //set property and values
airAsia.buyplane = function () {
  console.log(this);
  this.planes++; //whenever we click new planes added
  console.log(this.planes);
};
// airAsia.buyplane();
//attach our even handler
document
  .querySelector('.buy')
  .addEventListener('click', airAsia.buyplane.bind(airAsia));

//partial application
//partial application means is preset parameter

//general function for addingTax

const addTax = (rate, value) => value + value * rate;
console.log(addTax(0.1, 200));

//VAT value add tax
//set preset always 23%
const addVAT = addTax.bind(null, 0.23); //first one is method name or object which we want to point this keyword now there is no function(method) here so we give null values
//null means nothing
//before bind method
// addVAT = value => value + value * 0.23; //same as use bind method previsously
console.log(addVAT(100));
console.log(addVAT(23));

const addTaxRate = function (rate) {
  return function (value) {
    return value + value * rate;
  };
};
//without bind method we just re-created bind method
const addVAT2 = addTaxRate(0.23);
console.log(addVAT2(100));
console.log(addVAT2(23));
console.log(addTaxRate(0.25)(100));

console.clear();

*/

//challange #1
/* 
Let's build a simple poll app!

A poll has a question, an array of options from which people can choose, and an array with the number of replies for each option. This data is stored in the starter object below.

Here are your tasks:

1. Create a method called 'registerNewAnswer' on the 'poll' object. The method does 2 things:
  1.1. Display a prompt window for the user to input the number of the selected option. The prompt should look like this:
        What is your favourite programming language?
        0: JavaScript
        1: Python
        2: Rust
        3: C++
        (Write option number)
  
  1.2. Based on the input number, update the answers array. For example, if the option is 3, increase the value AT POSITION 3 of the array by 1. Make sure to check if the input is a number and if the number makes sense (e.g answer 52 wouldn't make sense, right?)
2. Call this method whenever the user clicks the "Answer poll" button.
3. Create a method 'displayResults' which displays the poll results. The method takes a string as an input (called 'type'), which can be either 'string' or 'array'. If type is 'array', simply display the results array as it is, using console.log(). This should be the default option. If type is 'string', display a string like "Poll results are 13, 2, 4, 1". 
4. Run the 'displayResults' method at the end of each 'registerNewAnswer' method call.

HINT: Use many of the tools you learned about in this and the last section 😉

BONUS: Use the 'displayResults' method to display the 2 arrays in the test data. Use both the 'array' and the 'string' option. Do NOT put the arrays in the poll object! So what shoud the this keyword look like in this situation?

BONUS TEST DATA 1: [5, 2, 3]
BONUS TEST DATA 2: [1, 5, 3, 9, 6, 1]

GOOD LUCK 😀

const poll = {
  qustion: 'What is your favourite Programming Language?',
  options: ['0: Javascript', '1:Python', '2:Rust', '3.C++'],
  answers: new Array(4).fill(0), //[0,0,0,0]
  registerNewAnswer() {
    //get answer
    const answer = Number(
      prompt(
        `${this.qustion}\n${this.options.join('\n')}\n(Write Option Number)`
      )
    );
    console.log(answer);
    //register answer
    //using short circuit in && operator
    //short circuting
    typeof answer === 'number' &&
      answer < this.answers.length &&
      this.answers[answer]++;
    // console.log(this.answers);
    this.displayResults(); //without passing any arguments
    this.displayResults('string'); //this is for string arguments we will see results inn both format
  },
  displayResults(type = 'array') {
    if (type === 'array') {
      console.log(this.answers);
    } else if (type === 'string') {
      //example like this 12, 3, 5, 18
      console.log(`Poll Results are ${this.answers.join(', ')}`);
    }
  },
};

poll.registerNewAnswer();
document
  .querySelector('.poll')
  .addEventListener('click', poll.registerNewAnswer.bind(poll));

//Bonus Tasks it's totaly individual
// BONUS: Use the 'displayResults' method to display the 2 arrays in the test data. Use both the 'array' and the 'string' option. Do NOT put the arrays in the poll object! So what shoud the this keyword look like in this situation?

// BONUS TEST DATA 1: [5, 2, 3]
// BONUS TEST DATA 2: [1, 5, 3, 9, 6, 1]

poll.displayResults.call({ answers: [5, 2, 3] }, 'string');
poll.displayResults.call({ answers: [1, 5, 3, 9, 6, 1] }); //without string



//Immidiately Invoked Function Expression
//sometimes in Javascript we need a function thats execute immidiately only once and then never again
//basically function disappeared after function called
//wrap it into paranthese then function name then immidiately call the function without function name

const runOnce = function () {
  console.log(`This will never Run again...`);
};
runOnce(); //this is normal function we can call as many times we want

//now we give just funtion expression
//or IIFE
(function () {
  console.log('This will never run again...');
})(); //()function called
//(function(){}());//this pattern called immidiately invoked function expression

//it will work same as an Arrow function
(() => console.log('this will also never run again...'))();
console.clear();
//Clousers In Javascript
//clouser is not feature that we explicitly use
//so we don't create clousers manually like create new array ,new function
//clousers simply happen automaticaly certain suitvation,we just recognize those suitvations

const secureBooking = function () {
  let passangerCount = 0;

  return function () {
    passangerCount++;
    console.log(`${passangerCount} passangers`);
  };
};

const booker = secureBooking(); //it will return new function then we store inside booker variable now it's become function

booker();
booker();
booker();

console.dir(booker);

//Clousers Example to understand that
//functionn expression withut arguments and no return type

//Example 1

let f; //global scope
const g = function () {
  const a = 23;
  //f technically not defined in inside the scope
  f = function () {
    console.log(a * 2);
  };
};
//create another function
const h = function () {
  const b = 777;
  f = function () {
    console.log(b * 2);
  };
};
g();
f();

// Re-assingin f function
h();
f();
console.dir(f);

//Example 2
const boardPassanger = function (n, wait) {
  const perGroup = n / 3; //higer priority for clousers
  //call back function passing function as aruguments
  setTimeout(function () {
    //execute 3 seconds latter
    console.log(`We are now boarding all ${n} passangers`);
    console.log(`There are 3 Groups, Each with ${perGroup} passangers`);
  }, wait * 1000); //execute after one seconds it essentaily call back function
  console.log(`Will start  boarding in ${wait} seconds`); //it will execute firstd
};
// const perGroup = 1000;//it will work only if not existed in function scope if not will
boardPassanger(180, 3);
*/

//coding Challange No 2

/* 
This is more of a thinking challenge than a coding challenge 🤓

Take the IIFE below and at the end of the function, attach an event listener that changes the color of the selected h1 element ('header') to blue, each time the BODY element is clicked. Do NOT select the h1 element again!

And now explain to YOURSELF (or someone around you) WHY this worked! Take all the time you need. Think about WHEN exactly the callback function is executed, and what that means for the variables involved in this example.

GOOD LUCK 😀
*/
//IIFE
(function () {
  const header = document.querySelector('h1');
  header.style.color = 'red';
  document.querySelector('body').addEventListener('click', function () {
    header.style.color = 'blue';
  });
})();
