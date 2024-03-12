'use strict';
const airline = 'Asia Super Fast';
const plane = 'A320';

//changing the case of String
console.log(airline.toLowerCase());
console.log(airline.toUpperCase());

//we can directly call the method
console.log('Saravanan'.toLowerCase());

//Fix Captitalazation in Name
const passanger = 'sAravAnan'; //Actualy it would be like this saravanan
//1st put everything in lower case
const passangerLower = passanger.toLowerCase();
//then put Firstletter(oth index because String represent in indices) to Uppercase then concat with rest of them
const passangerCorrect =
  passangerLower[0].toUpperCase() + passangerLower.slice(1); //concat with uppercase letter to rest of the letter
console.log(passangerCorrect);

//instead of writing manual we can put into function then we can use many time whenever we want

//creating own method for fixing captialize
function FixCaptilize(fix) {
  //Fix Captitalazation in Name
  const passanger = fix;
  //1st put everything in lower case
  const passangerLower = passanger.toLowerCase();
  //then put Firstletter(oth index because String represent in indices) to Uppercase then concat with rest of them
  const passangerCorrect =
    passangerLower[0].toUpperCase() + passangerLower.slice(1);
  console.log(passangerCorrect);
}

FixCaptilize('jAsMiNe');
FixCaptilize('sAnThoSH');

//Some Real Life Example
//Comparing  Emails
const email = 'hello@saravanan.io';
const loginEmail = '  Hello@saravanan.Io \n';

//1st put everything lowercase
// const lowerEmail = loginEmail.toLowerCase();
//2nd get rid of unwanted spaces
// const trimmedEmail = lowerEmail.trim(); //trim method will remove unwanted white spaces
// console.log(trimmedEmail);

//Actually we can do this in linear way

const normalizedEmail = loginEmail.toLowerCase().trim();
console.log(normalizedEmail);
console.log(email === normalizedEmail); //false
//compare
//small challage
function compareTwoStrings(originalOne, Modified) {
  if (originalOne === Modified) {
    return true;
  } else {
    return false;
  }
}
console.log(compareTwoStrings(email, normalizedEmail));

//Replacing
const priceRS = '1,00,00,000RS';
const priceUS = priceRS.replace('RS', 'US').replaceAll(',', '.');
console.log(priceUS);
//replace - we can change only one first occurance of the string
//replaceall - we can change multiple occurrance of the string

const announcement =
  'All passangers come to boarding door 23. Boarding door 23';
console.log(announcement.replaceAll('door', 'gate'));

//Another way of replacing String
//Using Regular Expression
//syntax for regular expression /  /
console.log(announcement.replaceAll(/door/g, 'gate')); //g flag it's meaning g-globaly
//replace methood also casesentive

//Booleans
const Plane = 'Airbus A320neo';
console.log(Plane.includes('A320')); //true
console.log(Plane.includes('airCraft')); //false
console.log(Plane.startsWith('A')); //true
console.log(Plane.startsWith('Air')); //true

if (Plane.startsWith('Airbus') && Plane.endsWith('neo')) {
  console.log(`part of The New Airbus Family`);
}
//Practice Excersice
const checkBaggage = function (items) {
  //converting arugments to lowercase incase some String might be Uppercase it's hard to compare it might have been missing
  //every possible variation like Gun guN KNIFE KNIfe so on
  const baggage = items.toLowerCase(); //easy to compare
  if (baggage.includes('knife') || baggage.includes('gun'))
    console.log(`You're Not allowd on board`);
  else console.log(`You're Welcome on board`);
};
checkBaggage('I have a Laptop, and some Foods and a pocket Knife');
checkBaggage('Socks and Camera');
checkBaggage('Got some snacks and a gun for protection');
