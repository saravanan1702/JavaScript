'use strict';

/*
//covention for constructor function(first Letter must be capital letter)
//NOTE: The arrow function not work in contructor,because it doesn't have  own this keyword
//constructor accept only function declaration and function expression
//HINTS: The regular function and constructor function little bit same the difference is constructor function that we create only using new keyword
//!NOTE :function constrcutor are not a feature of javascript instead simply they're pattern has been developed by other developers, now everyone simply use this

const Person = function (firstName, birthYear) {
  // console.log(this); //now this is empty object like Person{} we have to set propery and values
  //create property and assign values (values that we are getting from parameter)

  //!HINTS ->these properties are instance property and values,these values will be available on all the instances that are created through this constructor function
  this.firstName = firstName;
  this.birthYear = birthYear; //create property and set values to that property
  //!we can give different property names also
  // this.fn = firstName;
  // this.by = birthYear;
  //?Whatif if we want to add methods like Property is it possible to create method inside constructor: ans is yes we can create method also
  //!creating a method like this is okie but never do this inside of a constructor function
  //if we had a thousand of objects,we would essentially create thousand copies of this function so that will be terrible for the perfarmance of our code don't do this but
  //!instead to solve this problem we're going to use prototype and prototype inheritance
  this.calcAge = function () {
    console.log(`Your Age is :${2024 - this.birthYear}`);
  };
};

//new Operator is very special operators it will call this function (Person)
//HINTS: the object will return so we need to store
// new person('Saravanan', 1999);
//HINTS: Person objects are stored in saravanan variable
const saravanan = new Person('Saravanan', 1999);
console.log(saravanan);
//getting specific value also
console.log(saravanan.firstName); //getting firstName only o/p saravanan

//What happen when we call the function with new Keyword?
//behind this it'll happend four steps
//======Object Creation Process Behind========
//1. New Empty object {} is created
//2. Function is called, this=>{} ( in execution context the this keyword  will point  the the new object here that was created in step number one)
//3. Newly crated object{} is linked to prototype
//4. the object that was created in the beginning is then automatically returned from the construction function (Function automatically return  that empty object from the beggining )
//HINTS: at this point the object no longer to be empty

//HINTS: when we use this contructors function we can create as many  different object as we want
// const jasmine = new Person('Jasmine', 2001);
// console.log(jasmine);

const allwin = new Person('Allwin', 2005);
console.log(allwin);
//Now each of them is its own new object that we crate programatically using function constructor
//HINTS:
//Remember javascript doesn't have classical object oriended programming, an object created from a class is called an Instance
//now we didn't technically a create class here, because javascript doesn't have classes in the sense of traditional OOP.
//! however we did crate an object using constructor function
//constructor used beginning of the javascript to kind of simulate classes
//we we can say  "Jasmine is Instance(object)"
//?what is instance?
//objects that have been created from a constructor function.
const jasmine = new Person('Jasmine', 2001);
console.log(jasmine);
jasmine.calcAge();
console.log(jasmine instanceof Person); //true
//other from this contrsutor
const sara = 'sara';
console.log(sara instanceof Person); //false
*/
/*
//======Prototypes======
const Person = function (firstName, birthYear) {
  this.firstName = firstName;
  this.birthYear = birthYear;
};

const jasmine = new Person('jasmine', 2001);
console.log(jasmine);
//First Each and every function in javascript automatically has a property called prototype and that includes, ofcourse,constructor function
//now every object that's created by a certain constrcutor function will get access to all the methods and properties that we define on the constructor prototype property.

console.log(Person.prototype); //{constructor:f} empty object
//Visualize
//Prototype property of the constrctor function
//!All the objects are created through this constrctor function here will inherit, so they will get access to all the methods and properties that are defined on this protype property
//person.(prototype) now this is on object
//create method to constructor using prototype object
Person.prototype.calcAge = function () {
  console.log(2024 - this.birthYear);
};
//!Remember: Once again, Each object crated by this constructor function(Person) will now get access to all the methods of this prototype property

const saravanan = new Person('Saravanan', 1999);
saravanan.calcAge(); //25
//we use this calcAge method here on the saravanan object even though it's not really on the object itself
console.log(saravanan); //Person {firstName: 'Saravanan', birthYear: 1999}

//each object has a special property called __proto__
console.log(saravanan.__proto__); //this is prototype of saravanan, it's not a prototype property
//so the prototype of the saravanan object is essentially  the prototype property of the constructor function
console.log(saravanan.__proto__ === Person.prototype); //true
console.log(Person.prototype.isPrototypeOf(saravanan)); //true
console.log(Person.prototype.isPrototypeOf(Person)); //false
//.Prototypeof linked objects

//HINTS:
//we can also set properties to prototype not only methods
Person.prototype.species = 'Homo  Sapiens';
console.log(saravanan, jasmine); //this property not in directly constrcutor but it's available in prototype
//we will able to access this property both of them inherite from prototype so we can access it from the prototype
console.log(saravanan.species + '  ' + jasmine.species);
//!hints:
console.log(saravanan); //this propery not directly in object so it's not a owm property, Own properties that are declared on the object itself not including inheritace property

//to check this
console.log(saravanan.hasOwnProperty('firstName')); //true Indeed this object does have its own propery with this name
console.log(saravanan.hasOwnProperty('species')); //false  Because that property is not really inside of saravanan object. it's simply has access to it because of its protype
console.clear();
//=====Prototypal inheritance on built-in objects=====
console.log(saravanan.__proto__); //we alredy know that this is the prototype of saravanan which is exactly the prototype property of Person

//object.prototype(top of the prototype chain)
console.log(saravanan.__proto__.__proto__);
console.log(saravanan.__proto__.__proto__.__proto__); //null

// console.log(Person.prototype.constructor); //we can get funcion itself
//if we want to inspect that function we use (dir)
console.dir(Person.prototype.constructor); //we can get funcion itself

//--------------

const arr = [2, 3, 4, 52, 52, 4, 6, 7, 7, 3, 4, 5, 9]; //this is shorthand but we can use like this also new Array===[]
//HINTS: whenever we create array like this const arr = [2, 3, 4, 52, 4, 5, 9]; it is indeed created by the array constructor that's why all of these works behind seces like we can use methods(map,filter,find,at push,pop so on..)
console.log(arr.__proto__); //prototype of array we can see all the methods that we use regualary in array(fill,filter,find,map,forEach,at so on....)
//HINTS:Each array doesn't contain all these methods instead each array inherite methods from its prototype
console.log(arr.__proto__ === Array.prototype); //true
// console.log(arr.__proto__);and it's not a end of prototype
console.log(arr.__proto__.__proto__); //this is end of prototype (prototype top)
//HINTS:
//the prototype inheritance is really a mechanism for reusing code. so all of these built-in method here have to exist in only once somewhere in javascript engine and then all the array in our code get access to the functions through the prototype chain and prototypal inheritance

//now we can add new method to Array.Prototype object
//create method for array object that return all unique elements in the array
Array.prototype.unique = function () {
  return [...new Set(this)];
};
// arr = [2, 3, 4, 52, 52, 4, 6, 7, 7, 3, 4, 5, 9];

console.log(arr.unique(arr)); //[2, 3, 4, 52, 6, 7, 5, 9]
//!HINTS:
//Extending the prototype of built-in object is generally not a good idea
//if we work on very small project then we can do this like add our new methods to array prototype object otherwise don't do like this

//Reson for don't add new methods
//1. The first reason is that the next version of javascript might add  a method with same name that we are adding(unique) but that next version same name method will work on different way then proberly break our code
//2. The second reason is we shouldn't do this because when we are work on a team of developers, then it might be bad idea because multiple developers implement the same method with the different name that's gonna create so many bugs
//!add new features(method) to array is really nice expriment and fun but never do this

const h1 = document.querySelector('h1');
console.dir(x => x + 1); //as we learn earlier function itself also object therefore it has also prototype and in this case the prototype will contain the methods that we've used previously on functions. so that (bind,apply,call so on..   )

//!Once again this is reason why we can actually call methods on functions it's because they're objects and objects have prototypes and in this case this is function prototype

*/
//====coding challange#1=====
/* 
1. Use a constructor function to implement a Car. A car has a make and a speed property. The speed property is the current speed of the car in km/h;
2. Implement an 'accelerate' method that will increase the car's speed by 10, and log the new speed to the console;
3. Implement a 'brake' method that will decrease the car's speed by 5, and log the new speed to the console;
4. Create 2 car objects and experiment with calling 'accelerate' and 'brake' multiple times on each of them.

DATA CAR 1: 'BMW' going at 120 km/h
DATA CAR 2: 'Mercedes' going at 95 km/h

GOOD LUCK 😀
*/

/*
const Car = function (make, speed) {
  //state
  this.maek = make;
  this.speed = speed;
};
//create methods
//behaviour
Car.prototype.accelerate = function () {
  this.speed += 10;
  console.log(`${this.make} is going  at ${this.speed} km/h 🚘`);
};
Car.prototype.break = function () {
  this.speed -= 5;
  console.log(`${this.make} is going at ${this.speed} km/h 🚘`);
};
const bmw = new Car('BMW', 120);
const mercedes = new Car('Mercedes', 95);

bmw.accelerate(); //130 default speed is 120 + 10(accelerate)
bmw.accelerate(); //130+10=> 140
bmw.accelerate(); //140+10 =>150

bmw.break(); // 150-5(break) => 145
bmw.break(); // 145-5(break) => 140

mercedes.accelerate(); //95+10 =>105
mercedes.break(); //105-5=>100
mercedes.accelerate(); //100+10=>110

*/

//=============ES6 Classes==============
//class expression
// const PersonCl = class {}; just like a function expression we pick anyone
//Inface classes are just like a spcial type of functions although we uses class keywords, Behind the scences classes are function therefore we have class expressions and class declarations
/*
//class declaration
class PersonCl {
  //add constructor method to our class
  //this constructor method work similar like constructor functions
  //but this one is actually method of this class and it need to be called constrcutor so that's the rule but just like a constructor functions we pass arguments basically for the properties that we want to object to have.
  constructor(firstName, birthYear) {
    //properites
    this.firstName = firstName;
    this.birthYear = birthYear;
  }
  //method(Automatically method created in prototype property)
  //Just like Regular function
  //!HINTS:
  //Important to undestand here is that all of these methods that we write in the class, so outside of the constructor will be on the prototype of the objects. And not on the object themselves
  //!Method will be added to .prototype property
  calcAge() {
    console.log(2024 - this.birthYear);
  }
  greet() {
    console.log(`hi ${this.firstName} 👋`);
  }

  //this is same like a calcAge method
  //now we can read the age of any object using property
  get age() {
    return 2024 - this.birthYear;
  }
}

//create instance
const jasmine = new PersonCl('jasmine', 2001); //when we create new instance here then it is gonna called and it will return a new object and it will be stored here into jessica
console.log(jasmine);
jasmine.calcAge();
//to proof that
console.log(jasmine.__proto__ === PersonCl.prototype); //true

//method(method created in prototype Manually)
//we can add method manually it's gonna work same as but we do it manually

// PersonCl.prototype.greet = function () {
//   console.log(`hey ${this.firstName} 👋`);
// };

jasmine.greet(); //hey jasmine 👋

//getter and setter
//getter (read property)
console.log(jasmine.age);

//=====Classes=====
//!We need to understand couple of things about the class
//1. Classes are not hoisted(In function we can use before that declare but it's not possible in class)
//2. Just like function classes are also first-class citizens.(that mean we can pass them into functions and also return them from functions)
//3. The body of the class is always executed in strict mode(Even if we didn't activate for entire script, all the code  that is in the class  will be executed in strict mode)

*/
//==============Setters and Getters in Javascript===========
//Every object in javascript can have setter and getter properties
//And we call these special properties accessor properties while the more normal properties are called data properties
//Getters and Setter are just a  function that set and get a value but on the outside they still look like a regular properties

/*
//Example
const accounts = {
  owner: 'saravanan',
  movements: [200, 300, 444, 500, 98, 101],

  get latest() {
    return this.movements.slice(-1).pop();
  },
  //!HINTS:
  //any setter method need to have  exactly  one paramter
  set latest(mov) {
    this.movements.push(mov);
  },
};

//getter property
console.log(accounts.latest); //if it was a method then it would be like this latest() now this is property
//This can be very useful when we want to read something as a property but still need to do some calculation before

//setter property
//don't assing values like a regular method because it's not a method like account.latest(10);

//set values to setter property
accounts.latest = 500;
console.log(accounts.movements);

//!HINTS:
//getter and setter can actually very usefull for data validation
//example
class PersonCl {
  constructor(fullName, birthYear) {
    //properites
    this.fullName = fullName;
    this.birthYear = birthYear;
  }
  //instance methods
  //method will be added to .prototype.property
  calcAge() {
    console.log(2024 - this.birthYear);
  }
  greet() {
    console.log(`hi ${this.fullName} 👋`);
  }

  //this is same like a calcAge method
  //now we can read the age of any object using property
  get age() {
    return 2024 - this.birthYear;
  }
  //check if it full name

  //set a property that already exists
  set fullName(name) {
    console.log(name);
    //logic
    if (name.includes(' ')) {
      //now _fullName is new variable
      this._fullName = name;
    } else {
      alert(`${name} is not a full name!`);
    }
  }

  //to avoid undefined we must return that value that we set in setter method
  get fullName() {
    return this._fullName;
  }

  //static method
  static hey() {
    console.log(`hey there 👋`);
    console.log(this); //this will point entire class
  }
}

//create instance
//getter and setter exampel with data validation
//basically full name contain some spaces
const jasmine = new PersonCl('jasmine Saravanan', 2001);
jasmine.greet(); //hey jasmine 👋

//getter and setter
//getter (read property)
console.log(jasmine.age);

//just give another object that contain single name
// const sara = new PersonCl('Sara', 2005);
const sara = new PersonCl('Sara Arumugam', 2005);
console.log(sara.fullName); //it will give alert box that tell about sara doesn't have full name and it will assing as undefined

//static method
PersonCl.hey();

//!HINTS:
//setter and getter method is sometimes very usefull when we do some validation at the time of object creation

//===========Static Methods==========
//constructor function
const Person = function (firstName, birthYear) {
  this.firstName = firstName;
  this.birthYear = birthYear; //create property and set values to that property
  this.calcAge = function () {
    console.log(`Your Age is :${2024 - this.birthYear}`);
  };
};
Person.hey = function () {
  console.log('hey there 👋');
  console.log(this);
};

//call that function
Person.hey();

//but it couldn't inherite from saravanan object

const saravanan = new Person('Saravanan', 1999);
// saravanan.hey(); //error is hey is not a function
*/
//=======object.create=======
//Manual way of creating object
/*
const PersonProto = {
  calcAge() {
    console.log(2024 - this.birthYear);
  },
  //create method
  //instead of giving values to the properties with object.property="value" we can use functionally or automatically like constructor but this is not a constructor
  //and this method name whatever we can give
  //this method is like little bit like a constructor that we have in classes (constructor mostly in inside the classes)
  //However, this has acutually nothing to do with any constructor function, because we're not using new operators to call this we will simply call object.function(arg1,arg2) like saravanan.init("saravanan",1999);
  init(firstName, birthYear) {
    this.firstName = firstName;
    this.birthYear = birthYear; //here is this keyword also point which object we create like saravanan or jasmine
  },
};
const saravanan = Object.create(PersonProto);
console.log(saravanan);
//add properties to our object
//object literals
//HINS: Assingining values is not ideal ,we want it programatically we can do that later now it's just for test
saravanan.name = 'Saravanan';
saravanan.birthYear = 1999;
saravanan.calcAge();
console.log(saravanan.__proto__);

//another object
const jasmine = Object.create(PersonProto);
jasmine.init('Jasmine', 2001);
jasmine.calcAge();

//==========Coding Challange#2===========

/* 
1. Re-create challenge 1, but this time using an ES6 class;
2. Add a getter called 'speedUS' which returns the current speed in mi/h (divide by 1.6);
3. Add a setter called 'speedUS' which sets the current speed in mi/h (but converts it to km/h before storing the value, by multiplying the input by 1.6);
4. Create a new car and experiment with the accelerate and brake methods, and with the getter and setter.

DATA CAR 1: 'Ford' going at 120 km/h

GOOD LUCK 😀
*/
/*
class Car {
  constructor(make, speed) {
    this.make = make;
    this.speed = speed;
  }
  accelerate() {
    this.speed += 10;
    console.log(`${this.make} is  going at ${this.speed} km/h`);
  }
  break() {
    this.speed -= 10;
    console.log(`${this.make} is  going at ${this.speed} km/h`);
  }
  //getter method doesn't need any input (arguments)
  get speedUS() {
    return this.speed / 1.6;
  }
  //converting km/h to mi/h (miles per hour)
  set speedUS(speed) {
    this.speed = speed * 1.6;
  }
}

const ford = new Car('Ford', 120);
console.log(ford.speedUS);
ford.accelerate();
ford.accelerate();
ford.accelerate();
ford.break();
ford.speedUS = 50; //setter values to set property
console.log(ford);
*/
//=========Inheritance Between Class : Constructor function======
//1.Constructor Function

/*
const Person = function (fullName, birthYear) {
  this.fullName = fullName;
  this.birthYear = birthYear;
};

Person.prototype.calcAge = function () {
  console.log(`Your Age is :${2024 - this.birthYear}`);
};

const Student = function (fullName, birthYear, course) {
  //we have some common properties in Person Constructor also having dublicate values vialote this don't repeat yourself in order to avoid reapted code we can use parent constructor properties
  // this.firstName = firstName;
  // this.birthYear = birthYear;
  // Person(firstName, birthYear); //now it's simply normal function or regular function so it so it can't set this keyword it will throw error in console because compiler doesn't itentity what is fristName, birthYear if we want to set this keyword we can use call () this method point Person Constructor function
  Person.call(this, fullName, birthYear);
  this.course = course;
};

//now student.prototype is inherite from object.create(person.prototye)
//object.create() return empty object
//----Linking Prototype----
//This format is using so long before ES6
Student.prototype = Object.create(Person.prototype);
// Student.prototype = Person.prototype;//it doesn't work at all
Student.prototype.introduce = function () {
  console.log(`My name is ${this.fullName} and i'm study ${this.course}`);
};

const saravanan = new Student('saravanan', 1999, 'Computer Science');
console.log(saravanan);

saravanan.introduce();

saravanan.calcAge(); //accessing calcAge() method eventhough it's not in Student constructor function

console.log(saravanan.__proto__); //this gonna be Person object
console.log(saravanan.__proto__.__proto__); //this is now indeed prototype which contain calcAge method
console.log(saravanan instanceof Student); //true
console.log(saravanan instanceof Person); //true HINTS: it will be false if we are not inherite Person object because we can't access calcAge function
console.log(saravanan instanceof Object); //true this is inherite prototype
console.log(Object.prototype); //this prototype is end of the prototype herafter we try to access it will give null
console.log(Object.prototype.__proto__); //null
Student.prototype.constructor = Student;

console.dir(Student.prototype.constructor);
*/
//==========challange#3============
/* 
1. Use a constructor function to implement an Electric Car (called EV) as a CHILD "class" of Car. Besides a make and current speed, the EV also has the current battery charge in % ('charge' property);
2. Implement a 'chargeBattery' method which takes an argument 'chargeTo' and sets the battery charge to 'chargeTo';
3. Implement an 'accelerate' method that will increase the car's speed by 20, and decrease the charge by 1%. Then log a message like this: 'Tesla going at 140 km/h, with a charge of 22%';
4. Create an electric car object and experiment with calling 'accelerate', 'brake' and 'chargeBattery' (charge to 90%). Notice what happens when you 'accelerate'! HINT: Review the definiton of polymorphism 😉

DATA CAR 1: 'Tesla' going at 120 km/h, with a charge of 23%

GOOD LUCK 😀

//constructor function
const Car = function (make, speed) {
  this.make = make;
  this.speed = speed;
};

//create method in prototype
Car.prototype.accelerate = function () {
  this.speed += 10;
  console.log(`${this.make} is  going at ${this.speed} km/h`);
};
Car.prototype.break = function () {
  this.speed -= 10;
  console.log(`${this.make} is  going at ${this.speed} km/h`);
};

const EV = function (make, speed, charge) {
  //call just constructor function which contain make and speed
  Car.call(this, make, speed);
  this.charge = charge;
};

//link the prototype

EV.prototype = Object.create(Car.prototype); //manually inherite Car Prototype
//object create for EV
const tesla = new EV('Tesla', 120, 23);
EV.prototype.chargeBattery = function (chargeTo) {
  //charge is variable =(assing)chargeTo(parameter)(this paramter contain passing value)
  this.charge = chargeTo;
};
//override parent prototype method which is already exists in parent prototype
EV.prototype.accelerate = function () {
  this.speed += 20; //increase by 20
  this.charge--; //decrease the charge by (%1) just for example
  console.log(
    `${this.make} is  going at ${this.speed} km/h and charege is ${this.charge}`
  );
};

tesla.chargeBattery(90);
console.log(tesla);
// we can access car.prototype methods also later we will use override method
tesla.accelerate();
tesla.accelerate();
tesla.break();
tesla.accelerate();
tesla.accelerate();
tesla.accelerate();

//===========Inheritance between classes and object.creat()============
const PersonProto = {
  calcAge() {
    console.log(2037 - this.birthYear);
  },
  init(firstName, birthYear) {
    this.firstName = firstName;
    this.birthYear = birthYear;
  },
};

//create inherite from personProt object
const saravana = Object.create(PersonProto);

//Linking Object instead of using fake inheritance class
const studentProto = Object.create(PersonProto);

const allwin = Object.create(studentProto); //now allwin object will inherite all the prototype form studentProto objects

//HINTS: allwin parent prototype is studentProto
//   studentProto parents is PersonProto

//========Prototype Chain=========
//Person prototype----->StudentProto----->Alliwn
studentProto.init = function (firstName, birthYear, courses) {
  // we don't need to write same properties again instead we use inheite properties to child prototype
  //override tht parents class method
  PersonProto.init.call(this, firstName, birthYear);
  this.courses = courses;
};
studentProto.introduce = function () {
  console.log(`Hello...👋, I'm ${this.firstName} and i study ${this.courses}`);
};

allwin.init('Allwin Edwin', 1999, 'Computer Science');
allwin.introduce();
allwin.calcAge();
*/

//1)public fields
//2)private fields
//3)public methods
//4)private methods
class Account {
  //1)public fields(instances)
  //these public fields are going to be in all the present instances that we're creating through the class
  locale = navigator.language;

  //2)private fields
  //# sysntax mean we make this fiels as private
  #movements = [];
  #pin;

  //owne name, currency, and pin
  constructor(owner, currency, pin) {
    this.owner = owner;
    this.currency = currency;
    //private fields instances
    this.#pin = pin;
    //we can create evem more properties on any instances and properties that are not based on any inputs
    //producted
    // this._pin = pin;
    //_ is meaning is this is private or producted this is just for convension not a  mondatory one
    // this._movements = [];
    // this.locale = navigator.language;
    console.log(`Thanks for Opening an account, ${owner} ❤️`);
  }
  getMovements() {
    return this.#movements;
  }
  //3)public methods
  //===public interface====
  //whenever we want we can use this method instead of manualy acc1.movements.push(value...value.....)
  //this is public interface for out project
  //create deposit  method that method get only positive values
  deposit(val) {
    this.#movements.push(val);
    return this; //return denoting current object
  }
  //create withdrawl method that method get only negative values
  //we abstract this method because people won't bother about positive value if they give it will automatically convert to negative values
  //they don't need to give negative values for withdrawl just they can give usual withdraw amount it will automatically convert to negative values
  withdraw(val) {
    // this.movements.push(val); instead of using like that we can call another method because both are doing the same
    this.deposit(-val);
    return this;
  }
  //HINTS: and this is shouldn't be not a part of public API but all the other should be like requestLoan and deposit and withdrawal
  _approveLoan(val) {
    return true;
  }
  //we can approve loadn based on some condition and that condition should come from other methods
  requestedLoan(val) {
    if (this._approveLoan) {
      this.deposit(val);
      console.log(`Loan approved...`);
      return this;
    }
  }
  //static method this is also called helper class because it's not instances it belongs to class
  //we usually use static for helper function
  //HINTS:
  //static will not be availble in instaces it will only avaible on class itself
  static helper() {
    console.log('helper');
  }
  //4) Private methods
  //private methods are very useful to hide the implementation details from the outside
  //now big problem is no browser support this syntax
  // #approveLoan(val) {
  //   return true;
  // }
}
//negative value reference
// let a = 10;
// let b = -a;b=-10;

// console.log(b);
// console.log(-20);-(value)

//create new account
const acc1 = new Account('Saravnan', 'IND', 1111);
// acc1._movements.push(100);
// acc1._movements.push(250);
acc1.deposit(300);
acc1.withdraw(120);
acc1.requestedLoan(1001);
acc1._approveLoan(1000);
console.log(acc1.getMovements());
console.log(acc1);
Account.helper();
// console.log(acc1._pin);
//====now try to access producted one====
// console.log(acc1.#pin);error
// console.log(acc1.#movements); it give error we can access private property

//call static method

//Chaining
//in chaining previously we can do like first map and filter and reduce we can do that all thin linear way this is chaining
acc1
  .deposit(300)
  .deposit(500)
  .withdraw(140)
  .requestedLoan(25000)
  .withdraw(4000);

console.log(acc1.getMovements());

//////////////////////////////////////////////////////////////
// Coding Challenge #4

/* 
1. Re-create challenge #3, but this time using ES6 classes: create an 'EVCl' child class of the 'CarCl' class
2. Make the 'charge' property private;
3. Implement the ability to chain the 'accelerate' and 'chargeBattery' methods of this class, and also update the 'brake' method in the 'CarCl' class. They experiment with chining!

DATA CAR 1: 'Rivian' going at 120 km/h, with a charge of 23%

GOOD LUCK 😀
*/
class CarCl {
  constructor(make, speed) {
    this.make = make;
    this.speed = speed;
  }
  accelerate() {
    this.speed += 10;
    console.log(`${this.make} is  going at ${this.speed} km/h`);
  }
  break() {
    this.speed -= 10;
    console.log(`${this.make} is  going at ${this.speed} km/h`);
    return this;
  }
  //getter method doesn't need any input (arguments)
  get speedUS() {
    return this.speed / 1.6;
  }
  //converting km/h to mi/h (miles per hour)
  set speedUS(speed) {
    this.speed = speed * 1.6;
  }
}

class EV extends CarCl {
  #charge;
  constructor(make, speed, charge) {
    super(make, speed); //parent class instances
    this.#charge = charge; //current class instances
  }
  chargeBattery(chargeTo) {
    this.#charge = chargeTo;
    return this;
  }
  accelerate() {
    this.speed += 20;
    this.#charge--;
    console.log(
      `${this.make} is going at ${this.speed}km/h, with a charge of  ${
        this.#charge
      }`
    );
    return this;
  }
}
const saravanan = new EV('Saravanan', 120, 23);
console.log(saravanan);
// console.log(saravanan.#charge); //we get error because we can't access private property outside the class
//chaining method
saravanan
  .accelerate()
  .accelerate()
  .break()
  .chargeBattery(50)
  .accelerate()
  .chargeBattery(60)
  .accelerate();
