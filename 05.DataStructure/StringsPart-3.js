'use strict';
//===split and Join======
//split allows us to split the string into multiple parts based on a divider String
console.log('a+very+nice+string'.split('+')); //it will split up the string by (+) sign and it will store the result into element in new array
//example  the result ['a','very','nice','string']

//now split by space
console.log('Saravanan Arumugam'.split(' '));

//now using destructuring to store the split values

const [firstName, lastName] = 'Saravanan Arumugam'.split(' ');
console.log(firstName, lastName);

//Join Method which is opposite of split method
//Join it will join the different string into single string
//example
//three parts of array joined together into sinle string
const newName = ['Mr.', firstName, lastName.toUpperCase()].join(' ');
console.log(newName);

function capitalize(name) {
  const names = name.split(' '); //now this will be in array because split method will give the result in array format
  const nameUppercase = []; //create empty string for to store returning values
  for (const n of names) {
    //1st method
    // nameUppercase.push(n[0].toUpperCase() + n.slice(1));//changing upper case 0th index and join rest of them using slice method
    //2nd method
    //another way of capitalize the first letter
    nameUppercase.push(n.replace(n[0], n[0].toUpperCase())); //using replace method
  }
  console.log(nameUppercase.join(' ')); //join together as Single String
}
//call the function
capitalize('saravanan and jasmine');
capitalize('ram and sita');
capitalize('i need cup of coffee');

//Padding a String
//to add the number of characters to the String untill the string has a certain desired length.
//in padding we can give both start and end
const message = 'go to gate 23!';
console.log(message.padStart(25, '+').padEnd(35, '+')); //lenth and what we want to add
console.log('jasmine'.padStart(25, '+').padEnd(30, '+'));

//Real life Example
const maskCreditCard = function (number) {
  const str = number + ''; //converting number to string
  const last = str.slice(-4); //getting last four string (reverse) if we give negative it will count in last(4893)
  return last.padStart(str.length, '*'); //print * length of str untill reach last four characters
};
console.log(maskCreditCard(45682226688843));
console.log(maskCreditCard(45682226681548));
console.log(maskCreditCard(44444456));

//Repeat method
//this one simply allows us to repeat same string multiple times
const message2 = `Bad Weather... All Departues Delayed...`;
console.log(message2.repeat(5));

const planeInLine = function (n) {
  console.log(`There are ${n} planes in line ${'✈️'.repeat(n)}`); // ${'✈️'} it will consider as string
};
planeInLine(5);
planeInLine(2);
planeInLine(4);
planeInLine(12);
console.clear();

// Coding Challenge #4

/* 
Write a program that receives a list of variable names written in underscore_case and convert them to camelCase.

The input will come from a textarea inserted into the DOM (see code below), and conversion will happen when the button is pressed.

THIS TEST DATA (pasted to textarea)
underscore_case
 first_name
Some_Variable 
  calculate_AGE
delayed_departure

SHOULD PRODUCE THIS OUTPUT (5 separate console.log outputs)
underscoreCase      ✅
firstName           ✅✅
someVariable        ✅✅✅
calculateAge        ✅✅✅✅
delayedDeparture    ✅✅✅✅✅

HINT 1: Remember which character defines a new line in the textarea 😉
HINT 2: The solution only needs to work for a variable made out of 2 words, like a_b
HINT 3: Start without worrying about the ✅. Tackle that only after you have the variable name conversion working 😉
HINT 4: This challenge is difficult on purpose, so start watching the solution in case you're stuck. Then pause and continue!

Afterwards, test with your own test data!

GOOD LUCK 😀
*/
/*
document.body.append(document.createElement('textarea'));
document.body.append(document.createElement('button'));
document.querySelector('button').addEventListener('click', function () {
  const text = document.querySelector('textarea').value;
  const rows = text.split('\n'); //split with next line, now we get arrays based on next line
  // console.log(rows);
  for (const row of rows) {
    const [first, second] = row.toLowerCase().trim().split('_'); //tolowecase and remove unwanted space and split up string with next line
    const output = `${first}${second.replace(
      second[0],
      second[0].toUpperCase()
    )}`;
    console.log(output);
  }
});
*/
//test Datas
// underscore_case
//  first_name
// Some_Variable
//   calculate_AGE
// delayed_departure

//
// underscoreCase      ✅
// firstName           ✅✅
// someVariable        ✅✅✅
// calculateAge        ✅✅✅✅
// delayedDeparture    ✅✅✅✅✅

//to in-order to to achive tick mark we need index bases on tick

document.body.append(document.createElement('textarea'));
document.body.append(document.createElement('button'));
document.querySelector('button').addEventListener('click', function () {
  const text = document.querySelector('textarea').value;
  const rows = text.split('\n'); //split with next line, now we get arrays based on next line
  // console.log(rows);
  for (const [i, row] of rows.entries()) {
    const [first, second] = row.toLowerCase().trim().split('_'); //tolowecase and remove unwanted space and split up string with next line
    const output = `${first}${second.replace(
      second[0],
      second[0].toUpperCase()
    )}`;
    console.log(`${output.padEnd(20)}${'✅'.repeat(i + 1)}`);
  }
});

console.clear();

//String method Practice

const flights =
  '_Delayed_Departure;fao93766109;txl2133758440;11:25+_Arrival;bru0943384722;fao93766109;11:45+_Delayed_Arrival;hel7439299980;fao93766109;12:05+_Departure;fao93766109;lis2323639855;12:30';

// 🔴 Delayed Departure from FAO to TXL (11h25)
//              Arrival from BRU to FAO (11h45)
//   🔴 Delayed Arrival from HEL to FAO (12h05)
//            Departure from FAO to LIS (12h30)

//small function for repeating process
const getCode = str => str.slice(0.3).toUpperCase();
for (const flight of flights.split('+')) {
  // console.log(flight.split(';'));
  //Array destructuring to get out from array
  const [type, from, to, time] = flight.split(';');
  const output = `${type.startsWith('_Delayed') ? '🔴' : ''}${type.replaceAll(
    '_',
    ' '
  )} ${from.getCode} ${to} (${time.replace(':', 'h')})`;
  console.log(output);
}
