'use strict';
//String also primitive Date types
//but Javascript is very smart it will convert primitive data types into object that's why we can use method like slice, index of ,so on
//this converting process called as boxing
//Practice String method and fun with String

const airline = 'Asia Super Fast'; //In String space also count as String
const plane = 'A320';
//we can get certain position at String
console.log(plane[3]); //0
console.log(plane[0]); //A
console.log('B7373'[0]); //B same like previous one
//we can read the length propery of String  just like an Array
console.log(airline.length);
console.log('B7373'.length);

//String also have Methods
//indexof - it will give first occuranace
console.log(airline.indexOf('S')); //we can get certain position of element's index
//if we want last occurance then we can use lastIndexof
console.log(airline.lastIndexOf('s'));
//we can get index of words also
console.log(airline.indexOf('Super'));
//Slice Method
console.log(airline.slice(5)); //it will print string after 5th index and also this called substring
//substring -just part of original string

//We can specifi end parameter in slice also
console.log(airline.slice(5, 10)); //string start with 5th index end with 9th index position
//Extract specific String from original string
console.log(airline.slice(0, airline.indexOf(' '))); //start with 0th index end with empty space
//last String from original string
console.log(airline.slice(airline.lastIndexOf(' ') + 1));

//Negative - arguments
//if we give Negative Argument then it will count from last or right side usauly string count from left side
console.log(airline.slice(-2)); //it will give last two index values fast (st)
console.log(airline.slice(1, -1)); //cut of first letter and cut of last letter (sia Super fas) o/p

//Practice
const checkMiddleSeat = function (seat) {
  //one row for example the seats would be like this
  //A B C D E F like single row with 6 seats for small aeroplane
  //B AND E are middle seats
  const s = seat.slice(-1);
  if (s === 'B' || s == 'E') console.log(`you got the middle seats 🥺`);
  else console.log(`you got lucky 😎`);
};
checkMiddleSeat('11B');
checkMiddleSeat('23C');
checkMiddleSeat('3E');
checkMiddleSeat('10A');

console.log(new String('Saravanan')); //now it's an object whenever we use new keyword this is denoting object
console.log(typeof new String('Jasime')); //Object
//this is the behind the scence of javascript convert primitive data to object
//whenever we called the method when operation done then object convert into regular String
console.log(typeof airline); //now the type is String
