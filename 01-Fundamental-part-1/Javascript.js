//external script

let js = "Amazing";
// if (js === "Amazing") alert("JavaScript is Fun!");
//to showing in console tool we use console.log function
console.log(40 + 20 + 20 - 30);
console.log("Jasmine");
// let firstName = "Saravanan";
let Age = 23;
// console.log(firstName);
console.log(Age);
//always use camal case for declare variable name
//camal case =>firstName ,lastName,MarkObtain or use underscrore first_name,last_name and also use doller symbol in variavle $firstname;
//javascript don't allow number don't declare variable names start with number and symbol and recerved keywords
//ex =>3firstname;
//first&lastname;
//and one more thing variable names shouldn't be start with upper case example=>Firstname Person Age that's convention but it's not a illegal
//we use upper case in specific convention in javascript (class names and so one)
//newfirstname =>these are restricted in javascript always use camelcase for declare variable names

//boolean it's has only trur or false
true;
console.log(true);
//we can store boolean in variable
let javascriptisFun = true;
console.log("javascriptisFun ", javascriptisFun);
//we can see which data type is it there is one oprators called (typeof)
console.log(typeof true);
let age = 23;
console.log(typeof age); //number
let name = "saravanan";
console.log(typeof name); //string
let PI = 3.141592653589793;
console.log(typeof PI); //number

//Dynamic typing which means simple change the values in variable
let firstName = "Jasmine";
console.log(typeof firstName); //string
firstName = 23;
console.log(typeof firstName); //number
firstName = true;
console.log(typeof firstName); //boolean

//undefined =>which means simply empty values
//just declare a variable but not assigning values to varible
//it's it legal in javascript
let first;
console.log(typeof first); //undefined
//we can assign values later on
first = 100;
console.log(first);

//let,const and var

//let => it's mutated variable we can change the values
let a = 10; //mutated
a = 20; //mutated
a = 50; //now a value is 50
console.log(a);

//const =>cons stand for constant it cannot change the values at any cast
//in technical term we say it's immutable
const year = 2023;
//if we change const variable values it gives type error in console
//year = 2024;  //can't change the values once assigne the values to const variable it's fixed
console.log(year); //2023

//var =>variable it's older way of declare variables
//var is function scoped and let is block scoped altought it work similar like let keyword but lot of different in internaly
var myName = "jasmine";
myName = "saravanan";

//and most of the don't declare variable type just type varible name and assigning values
lastName = "Arumugam";
console.log(lastName); //javascript will take it not gives any error but it's not a good practice to do ,put always let or const any type of varible names which you want

//operators

//mathamatical operators or arithmatic operators
//minus operators
const currentYear = 2023;
// const ageJasmine = 2023 - 2000;
const ageJasmine = currentYear - 2000;
console.log(ageJasmine);
// const ageOfSaravanan = 2037 - 1990;
const ageOfSaravanan = currentYear - 1990;

console.log(ageJasmine, ageOfSaravanan); //23 47
//some other mathematical oeprators
console.log(ageJasmine * 2, ageJasmine / 10, 2 ** 3);
//2**3 =>which means 2 to the power of 3 =>2*2*2

//using + operators to join two string ,or concatenate different string
const firstName = "Jasmine";
const lastName = "Saravanan";
console.log(firstName + lastName);
console.log(firstName + " " + lastName); //with white space

//assignments operators
let x = 10 + 5;
console.log(x); //15
x += 10; //which means x=x+10;
console.log(x); //15+10 =>25
x *= 4;
console.log(x); //25*4=>100
x++; //x=x+1;
console.log(x);
x--;
x--;
console.log(x);

//comparision operators
//comparision operators produce boolean values
console.log(ageJasmine < ageOfSaravanan); //if we want to check greater we use > (<,>,<=,>=)
console.log(ageJasmine >= 20); //either 20 or more than 20 (20 also included)
console.log(ageOfSaravanan <= ageJasmine);

const isFullYear = ageJasmine >= 20;
//javascript operation procuded left to right first minus then move another one because that one have two number then come to compare the values(middle)
console.log(currentYear - 1999 > currentYear - 2000);

//operator precedence
const currentYear = 2023;
const ageJasmine = currentYear - 2000;
const ageOfSaravanan = currentYear - 1990;
console.log(currentYear - 1999 > currentYear - 2000);
//left to right(most of the mathamatical operators work in left to right)
// console.log(25 - 10 - 5); //10
//hint =>if it's right to left the values are differenet

//rigght to left have low predence
let x, y;
x = y = 25 - 10 - 5;
console.log(x, y);

//In this case first calculate paranthese next divide by 2 paranthese has high precedence
const averageAge = (ageJasmine + ageOfSaravanan) / 2;
console.log(ageJasmine, ageOfSaravanan, averageAge);
// task bmi calculation

const markMass = 78;
const markHeight = 1.69;
const johnMass = 92;
const JohnHeight = 1.92;
const BMIMark = (markHeight * markHeight) / markMass;
const BMIJohn = (JohnHeight * JohnHeight) / johnMass;
const markHigerBmi = johnMass > markMass;
console.log(BMIMark, BMIJohn, markHigerBmi);

//string and template literal
const firstName = "saravanan";
const job = "softwer engineer";
const birthDay = 1999;
const year = 2023;
const aboutMe =
  "Hi..i'm " + firstName + ", a " + (year - birthDay) + " years " + job + "!";
console.log(aboutMe); //writing string like this is really pain
//instead of writing this javascript introduced ES6 in template literal
//it will make very easier to write long content string

//template literal
const saravanan = `helllo, I'm ${firstName}, a ${
  year - birthDay
} year old ${job} !`;
console.log(saravanan);

//hint => we can use backticks as regualar strings
console.log(`hello, i'm regular strings`);
//for printing  string in multiple line
//before Es6
console.log("hello\nwelcome to\njavascript");
//hello
//welcome to
//javascript

//instead we can do this with next line tap
console.log(`hello
welcome to 
javascript`);

//decision taking if /else
const age = 13;
// const isOldEnough = age >= 18;
if (age >= 18) {
  console.log(`Jasmine can strat driving license 🚗`);
} else {
  const yearLeft = 18 - age;
  console.log(`Jasmine is too young...wait for another ${yearLeft} years 😉`);
}

//another Example

const birthYear = 2001;
let century;
if (birthYear <= 2000) {
  century = 20;
  //inside the variable we can't access outside  we can acces only inside the or we declare varialbe in outside
} else {
  century = 21;
}
console.log(century);
//task2
const markMass = 78;
const markHeight = 1.69;
const johnMass = 92;
const JohnHeight = 1.92;
const BMIMark = (markHeight * markHeight) / markMass; //we can write it also markHeight ** 2 which mean 2 time Markheight (height*height)
const BMIJohn = (JohnHeight * JohnHeight) / johnMass;
const markHigerBmi = johnMass > markMass;
console.log(BMIMark, BMIJohn, markHigerBmi);

if (BMIMark > BMIJohn) {
  console.log(`mark BMI is ${BMIMark} higher than John's ${BMIJohn}`);
} else {
  console.log(`John BMI is ${BMIJohn} higher than Mark's ${BMIMark}`);
}

// type convertion and type coersion

//type convertion it's explicityly convert one data into another data manually
//tye coersion it's implicitly convert one data into another data automatically it's happend behind us it will take of javascript automatically

// 1) type convertion

const year = "2000";
//using inbuild function to convert string into number
console.log(Number(year), year); //it give number 2000
console.log(year + 10); //20010 because we concatenate with string not a number
console.log(Number(year) + 18); //2018;

//now converting number into string
const age = 23;
console.log(String(age), age); //22(string)  22(original value (Number ))

//we can't convert string values(group of charactors) into to number
console.log(Number("Sara")); //Nan not a number
console.log(typeof NaN); //number still number but not valid one

//type coercion
console.log("i'm " + 23 + " years Old ");
//this time convert string as number if we give negative values
console.log("10" - "5" - 2); //10-5=>5-2=>3
console.log("10" ** "2"); //10*10=>100
console.log("10" / "2");

let n = "1" + 1; //'11'(string) + operators automatically convert string into a number
n = n - 1; //11-1=>10  (Number) - opeators if have string or more string it will convert into a Number
console.log(n);


//falsy and truthy
//falsy values that's not exactly false but when we attempt to convert into boolean it will become false
//5 falsy values (zero,''(empytString),undefined,null,Nan)
//and everything else called truthy values =>a values doesn't have zero or any empty string

//example
console.log(Boolean(0)); //zero false
console.log(Boolean("")); //empty string   false
console.log(Boolean("Jasmsine")); //true
console.log(Boolean(undefined)); //false
console.log(Boolean({})); //empty object //true

//best example to understant it
const money = 0; //100 it truthy values so if block will be executed
if (money) {
  //this part execute only if the condition is true otherwise the (else)false blockl will be executed
  console.log("don't spend money at all!");
} else {
  console.log("you should get a  Job!"); //this will be executed the reason money we assign at 0 (false)
}
//another example
//hint if we undefined using we can't use const variable
let height; //undefined also falsy values,and onemorething though we assign height as 0 it's also falsy value
height = 0;
if (height) {
  //this statement false so else block will execute
  //if height is assigned then if block will be executed
  console.log("Yey! Height is defined!");
} else {
  console.log("please define the height!");
}


//Equality operator difference == & ===

//ex
const age = "18"; //'18' if we give String only loose equality only execute
//hint => whenever our condition only have one statement we don't need to put curly prases we can print statement directly
// if (age === 18) {
// }
if (age === 18) console.log("you Just become an Adult :) (strict)");
if (age == 18) console.log("you Just become an Adult :) (loose)"); //this one will be execute

//=== =>it's called strict equality opeators. it doesn't perfome type coercion
//it return only if the both values are same
//example

console.log(18 === 18); //true
console.log("18" === 18); //false it's not same values

//== =>it's called loose equality operators \. it does type coercion
console.log("18" == 18); //true
console.log(18 == 18); //true

//getting input from user
//using promt
//const favourite = prompt("what's your favourite Number"); //it give values as string
//console.log(favourite);
//console.log(typeof favourite); //string
//but we can wrap it at a Number lets do this
const favourite = Number(prompt("what's your favourite Number"));
//now strict operators will work :)
console.log(favourite);
console.log(typeof favourite); //number
// if (favourite === 23) {
//   //'23' ==23 =>it's true if we use strick operators it won't work lets try it
//   console.log("Great! 23 is cool Number.");
// } else if (favourite === 7) {
//   console.log("cool 7 also greate Number");
// } else {
//   console.log("not a 23 or 7");
// }
//if condition is true it will give opposite result false ,it statement is false it give opposite result true
if (favourite !== 23) console.log("why not 23!");

//boolean Logic In javascript
//AND OR NOT
//AND =>it return true ,if both condition is true
//OR =>it return true ,if either one condition is false or both condition are false it return false
//NOT =>it inverts the values ,and it won't check multiple condition not operators has only one condition if true it give false ,if the condtion is false it give true

//and Operators
let age = 16;
if (age >= 20 && age <= 30) {
  //both condition are false so false block will be executed
  console.log("Perfect ...");
} else {
  console.log("Not a Perfect ");
}

//or operators
age = 16;
if (age >= 20 || age <= 30) {
  //2nd condition is true so if block will be executed
  console.log("Perfect ...");
} else {
  console.log("Not a Perfect ");
}
//Not Operators just invert the values
//it doesn't compine multiple values just one values
if (!age >= 16) {
  //inside condtion is true but using not operators it will return false so else part will be excuted
  console.log("perfect");
} else {
  console.log("Not a perfect");
}

//compining operator with not operators

age = 16;
if (!(age >= 20 || age <= 30)) {
  //2nd conditin is true so true block (if) will be executed but since we assign in not operators so it will inverts the condition so else block will be executed
  console.log("Perfect ...");
} else {
  console.log("Not a Perfect ");
}

//another exaple
const hasDrivingLicens = true; //A
const hasGoodVision = true; //B
console.log(hasDrivingLicens && hasGoodVision);
console.log(hasDrivingLicens || hasGoodVision);
console.log(!(hasDrivingLicens || hasGoodVision));

// const shouldDrive = hasDrivingLicens && hasGoodVision;
// if (shouldDrive) {
//   console.log("Sarah is able to drive");
// } else {
//   console.log("sarah is not able to drive");
// }

const isTried = false; //C
console.log((hasDrivingLicens && hasGoodVision) || isTried);

const shouldDrive = hasDrivingLicens && hasGoodVision && !isTried;
if (shouldDrive) {
  console.log("Sarah is able to drive");
} else {
  console.log("sarah is not able to drive");
}


//task


const scoreDolphins = 96 + 108 + 89;
const avgDolphins = scoreDolphins / 3;
const scoreKoalas = 88 + 91 + 110;
const avgKoalas = scoreKoalas / 3;
if (avgDolphins > avgKoalas) {
  console.log("Average of Dolphine " + avgDolphins);
  console.log("Dolphines win the trophy");
} else if (avgKoalas > avgDolphins) {
  console.log("Average of Koalas " + avgKoalas);
  console.log("koalas win the trophy");
} else {
  console.log("Both win the trophy");
}

//Swith stament => it's alternative for else if ladder, compare one value to multiple options

const day = "thursday";

//set swithc case
switch (
  day //define switch block
) {
  //define case
  case "monday": //it's similar to strict equality monday====monday
    console.log("plan course Structure");
    break;
  case "thuesday":
    console.log("Prepare therory Lecture");
    break;
  case "wednesday":
  case "thursday":
    console.log("Writing code Example");
    break;
  case "friday":
    console.log("Record Videos");
    break;
  case "saturday":
  case "sunday":
    console.log("Enjoy Weekends :)");
    break;

  //default only executed if all the cases are failed
  default:
    console.log("Not a valid day!");
}

//same logic in else if ladder
//in this suitvation we don't need any break javascript execute blockwise
if (day === "monday") {
  console.log("Prepare for coffeee");
} else if (day === "thursday") {
  console.log("meet my friends this evening");
} else if (day === "wednesday") {
  console.log("Arrange meet up");
} else if (day === "thurday" || day === "friday") {
  console.log("Let's go cinema");
} else if (day === "saturday" || day === "sunday") {
  console.log("Enjoying my weekends with my parents");
} else {
  console.log("not valid day");
}


//ternory operators
//it's similar like if/esle statment
const age = 25;
// age >= 18
//   ? console.log("You can drink wine🍷")
//   : console.log("You can't drink wine 🍷 ,but drink soft beverages 🧃 ");

//this operators is an expression ,expression produce the value and we can store it in variable

const drink = age >= 18 ? "wine🍷" : "water 🥤";
console.log(drink);

//same thing in if / else

let drink2;
if (age >= 18) {
  drink2 = "wine";
} else {
  drink2 = "water";
}
console.log(drink2);
//since ternary operators is an expression so we can test it on the template literal unlike if else
console.log(`i like to drink ${age >= 18 ? "wine🍷" : "water 🥤"}`);

//task 4 for ternory operators

const bill = 430;
const tip = bill >= 50 && bill <= 300 ? bill * 0.15 : bill * 0.2;
console.log(
  `the bill was ${bill},and the tip was ${tip} ,and the total value is ${
    bill + tip
  }`
);
