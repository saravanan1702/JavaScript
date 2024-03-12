'use strict';
function calcAge(birthyear) {
  const age = 2023 - birthyear;
  // console.log(firstName);
  // console.log(Lastname); //javascript will be looking for this variable(last name) if not found anywhere it will return error in console

  //creating another function inside the function
  function printAge() {
    let output = `${firstName},You are ${age},born in ${birthyear}`;
    console.log(output);

    //block scope
    if (birthyear >= 1995 && birthyear <= 2010) {
      // var str = `Oh, you're millenial,${firstName}`; //if i set var instead of const it will be accessed outside the bloack scope because var variables are functional scope they can access outside the block, they will just ingore the block

      //though the variable name are same it's not a problem because they're in different scope
      const firstName = 'Jasmine'; //now it will print jasmine instead of saravanan, the reason javascript looking for within the block scope for this given variable if not then only it will looking for parant class also if not in parents class it will looking for global variable;

      //Reassingning outer scope's variable
      output = 'new Output!';
      const str = `Oh, you're millenial,${firstName} ${lastName}`; //if i set const or let it can't be access outside the block scope
      // console.log(`ohh,You're millenial,${firstName}`);
      console.log(str);

      //function also block scope started in ES6, it won't be acessed if we enable strict mode if not this function also access outside the block scope
      //example
      function add(a, b) {
        return a + b;
      }
    }
    console.log(output);
    // console.log(str); //give error the reason const and let are block scope we can't access outside the block scope
    // console.log(add(10, 3)); //accessing block scope function because we disable strict mode
  }
  printAge();
  return age;
}

const firstName = 'Saravanan'; //global variable
const lastName = 'Saravanan'; //global variable don't confuse i create this variable for block scope which is present in calcage function
calcAge(1999);
// printAge(); //can't call outside the scope
// console.log(age); //we can't access age variable it's inside the function scope or local scope, it will show error
//only inner score can access the outer scope we can't access directyly the child scope
console.clear();

//Hoisting and TDZ(temporal Dead Zone)

//Variables
console.log(me);
// console.log(job);
// console.log(year);

var me = 'saravanan';
let job = 'Softwere';
const year = 1999;

//functions
console.log(addDecl(2, 3)); // only the normal function can hoisting,normal function can call before it declaration
// console.log(addExp(2, 3));
// console.log(addArr(2, 3));

function addDecl(a, b) {
  return a + b;
}
//const variable =temporal dead zone
const addExp = function (a, b) {
  return a + b;
};

const addArr = (a, b) => {
  return a + b;
};

//Examples
console.log(numProducts); //undefined also false values so it reverse the result so all prouducts deleted
if (!numProducts) {
  //numberproducts is undefined so false logical Not operators reverse the results to true
  deleteShoppingCart();
}
var numProducts = 10;

function deleteShoppingCart() {
  console.log('all product Deleted!');
}

var x = 1; //variable declare with var will be created object in global window object
let y = 2;
const z = 3;
//window is global object in javascript in the browser we can see the details in console

console.clear();

//This Keyword in javascript
console.log(this); //parens's scope (window)
//a simple function or function without having any object it the this keyword won't work
//it will give error
//we can't use this keyword in normal function because it doesn't have any owner (object)
const calage = function (BirthYear) {
  console.log(2024 - BirthYear);
  console.log(this); //this is undefined because it doesn't have any owener
};
calage(1999); //24

//Arrow Function
const calage2 = BirthYear => {
  console.log(2024 - BirthYear);
  console.log(this); //arrow function doesn't get own this keyword so arrow function simply uses lexigal this keyword
  //lexigal this keyword using parent object in this scaneio this is denoting window ,window is parent for all the object
};
calage2(2000);

//this keyword using inside the method
const saravanan = {
  fullName: 'Saravanan',
  birthyear: 1999,
  city: 'Trichy',
  //function inside the object it's called as method
  calcAge: function () {
    console.log(this);
    console.log(2024 - this.birthyear);
  },
};
saravanan.calcAge(); // it will denoting saravanan's object

//copying one object to another object
const jasmine = {
  birthyear: 2001,
  firstName: 'Jasmine',
  fullName: saravanan.fullName, //copying saravanan values into jasmine object
};
jasmine.calcAge = saravanan.calcAge; //this is called method borrowing, one object to another we don't need to write dublicate
//calling the object of jasmine
jasmine.calcAge(); //don't forget whenever you called object or function ,after function name must be open and close paranthese
console.log(jasmine.firstName + ' ' + jasmine.fullName);

//storeing method to normal function
const f = saravanan.calcAge;
// f(); //it will give error because it behave like normal function this keywrod denotinng parent class there is no parent class for this regular function so it will error in undefined

console.clear();

// var fullName = 'Jasmine'; //we know very well var keyword will be create global propery
//Regular Function and Arrow Function
const Saravanan = {
  fullName: 'Saravanan',
  birthyear: 1999,
  city: 'Trichy',
  //function inside the object it's called as method
  calcAge: function () {
    console.log(this);
    console.log(2024 - this.birthyear);

    //SOLUTION #1
    //method inside the function
    //to solve error problm like undefiend just refer to the object
    // const self = this; //now this keyword denoting current objce, //this is called self or that
    // const isMillenial = function () {
    //   console.log(self); //now it will work
    //   console.log(self.birthyear >= 1995 && self.birthyear <= 2010); //undefined
    //   // console.log(this.birthyear >= 1995 && this.BirthYear <= 2010); //undefined
    // };

    //SOLUTION #2
    //use arrow function instead of normal function
    //now arrow function work because arrow function inherit this from parent method
    const isMillenial = () => {
      console.log(this); //now it will work
      console.log(this.birthyear >= 1995 && this.birthyear <= 2010); //undefined
      // console.log(this.birthyear >= 1995 && this.BirthYear <= 2010); //undefined
    };
    isMillenial(); //it will make error eventhough method inside the function
  },

  //arrow function
  // greeting: () => {
  //   console.log(`hey,${this.fullName}`); //print jasime instead of saravanan ,because this keyword in arrow function denating global propery values
  // },

  //HINTS:
  //always use regular function in object
  greeting: function () {
    console.log(`hey,${this.fullName}`);
  },
};
Saravanan.greeting(); //it will give undefined, which is fact arrow function doesn't contain this keyword
Saravanan.calcAge();
console.clear();
//Arguements Keywords

const addExp1 = function (a, b) {
  console.log(arguments);
  return a + b;
};
addExp1(2, 5);
addExp1(2, 4, 5, 54); //multiple arguments passing also exist in javascript modern days javascript we don't worry about that
const addArr1 = (a, b) => {
  console.log(arguments);
  return a + b;
};
// addArr1(2, 5, 7);
console.clear(); //to see clear output in console it's also inbuild method

//PRIMITIVE DATA TYPES AND OBJECT(REFERENCE TYPES)
//primitives are like numbers, boolean and string etc

let age = 24;
let oldAge = age;
age = 25;
console.log(age); //24 //25
console.log(oldAge); //24 once assign it will remain until we change
console.log(age); //25 if we change age it will affect all age variable

const itsme = {
  name: 'Saravanan',
  age: 24,
};

//Primitive Types
const friend = itsme; //copying name and age to friend
friend.age = 30; //set age
friend.name = 'jasmine'; //set new name
console.log('Friend :', friend); //changing name and age also in itsme object
console.log('me :', itsme);

//Referece Type
console.clear();
let lastname = 'Edwin';
let oldLastname = lastname;
lastname = 'saravanan';
console.log(oldLastname, lastname);

const sara = {
  firstName: 'sara',
  lastName: 'edwin',
  age: 27,
};

//copying Objects
const marriedSara = sara;
//the reason maried sara is not a new variable in heap it's simply referece to the same heap memory of sara
//so married sara also hold the original object
marriedSara.lastName = 'Saravanan';
console.log('Before Marriage :', sara);
console.log('after Marriage :', marriedSara);

//copying Objects
const sara2 = {
  //original
  firstName: 'sara',
  lastName: 'edwin',
  age: 27,
  family: ['santhosh', 'allwin'],
};
//it will help only first level not deep clone just swallow clone
const sara2Copy = Object.assign({}, sara2); //copy note that it won't deep copy just swallow copy however both property values also in this object like Family array
sara2.lastName = 'saravanan';
sara2Copy.family.push('Arumugam');
sara2Copy.family.push('Vasuki');
console.log('Before Marriage :', sara2);
console.log('after Marriage :', sara2Copy);
