'use strict';

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// BANKIST APP

/////////////////////////////////////////////////
// Data

// DIFFERENT DATA! Contains movement dates, currency and locale

const account1 = {
  owner: 'Jonas Schmedtmann',
  movements: [200, 455.23, -306.5, 25000, -642.21, -133.9, 79.97, 1300],
  interestRate: 1.2, // %
  pin: 1111,

  movementsDates: [
    '2019-11-18T21:31:17.178Z',
    '2019-12-23T07:42:02.383Z',
    '2020-01-28T09:15:04.904Z',
    '2020-04-01T10:17:24.185Z',
    '2020-05-08T14:11:59.604Z',
    '2020-07-26T17:01:17.194Z',
    '2020-07-28T23:36:17.929Z',
    '2020-08-01T10:51:36.790Z',
  ],
  currency: 'EUR',
  locale: 'pt-PT', // de-DE
};

const account2 = {
  owner: 'Jessica Davis',
  movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
  interestRate: 1.5,
  pin: 2222,

  movementsDates: [
    '2019-11-01T13:15:33.035Z',
    '2019-11-30T09:48:16.867Z',
    '2019-12-25T06:04:23.907Z',
    '2020-01-25T14:18:46.235Z',
    '2020-02-05T16:33:06.386Z',
    '2020-04-10T14:43:26.374Z',
    '2020-06-25T18:49:59.371Z',
    '2020-07-26T12:01:20.894Z',
  ],
  currency: 'USD',
  locale: 'en-US',
};

const accounts = [account1, account2];

/////////////////////////////////////////////////
// Elements
const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.date');
const labelBalance = document.querySelector('.balance__value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelSumInterest = document.querySelector('.summary__value--interest');
const labelTimer = document.querySelector('.timer');

const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');

const btnLogin = document.querySelector('.login__btn');
const btnTransfer = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnClose = document.querySelector('.form__btn--close');
const btnSort = document.querySelector('.btn--sort');

const inputLoginUsername = document.querySelector('.login__input--user');
const inputLoginPin = document.querySelector('.login__input--pin');
const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');
const inputCloseUsername = document.querySelector('.form__input--user');
const inputClosePin = document.querySelector('.form__input--pin');

/////////////////////////////////////////////////
// Functions
//Just Refactor this logic into function whenever we want we can use this function in our project .. the reson for separate function we use this logic over and over again so we put it into new function
// calcDaysPassed method for=> example yester or 3 days ago
const formatMovementDate = function (locale, date) {
  const calcDaysPassed = (date1, date2) =>
    Math.round(Math.abs(date2 - date1) / (1000 * 60 * 60 * 24));
  const daysPassed = calcDaysPassed(new Date(), date);
  console.log(daysPassed);
  //HINTS: it will work everything fine if any one statement is true then it will break automatically
  //rest of them won't execute before that we use if else statement but it's very fast and understable
  //most confusing part is we use multiple if statement we might thing all of them execute but the answer is no
  //because our compiler execute code top to buttom if any one is true then rest of them won't start it will terminate the code and come out from this statement
  if (daysPassed === 0) return 'Today';
  if (daysPassed === 1) return 'Yesterday';
  if (daysPassed <= 7) return `${daysPassed} days ago`;
  // const day = `${date.getDate()}`.padStart(2, 0);
  // const month = `${date.getMonth() + 1}`.padStart(2, 0);
  // const year = date.getFullYear();
  // return `${day}/${month}/${year}`;

  //=====formated Date using intelization api======
  return new Intl.DateTimeFormat(locale).format(date);
  //we don't need else statement also because all the if statement are false then it will be execute because these are last code in our block
  /*
  else {
    const day = `${date.getDate()}`.padStart(2, 0);
    const month = `${date.getMonth() + 1}`.padStart(2, 0);
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  */

  /*
  const day = `${date.getDate()}`.padStart(2, 0); //02 if its 12 then zero won't come prefix
  const month = `${date.getMonth() + 1}`.padStart(2, 0); //because month is zero based 0-jan 1 is feb like so we want 1 as feb so we add +1 to get exactly result we want
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
  */
};
//====Number format Function====
//we use this method over and over again so in order to follow DRY we put it into function
const formatCur = function (value, locale, currency) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
};

//instead of passing movements only we want times also so best way is we need to pass entire accounts to this method
//before (movements,sort=false)
//after(acc,sort=false)
const displayMovements = function (acc, sort = false) {
  containerMovements.innerHTML = '';

  const movs = sort
    ? acc.movements.slice().sort((a, b) => a - b)
    : acc.movements;

  movs.forEach(function (mov, i) {
    const type = mov > 0 ? 'deposit' : 'withdrawal';
    const date = new Date(acc.movementsDates[i]);
    const displayDate = formatMovementDate(acc.locale, date);

    //we are going to comment it out because we use this function for over and over again so it would be great it would have been as  function whenever we need we can use it ,this is reference so i won't delete it because before it how it would be that's why i don't delete it because we are going to put all these in function
    /*
    const date = new Date(acc.movementsDates[i]);
    const day = `${date.getDate()}`.padStart(2, 0); //02 if its 12 then zero won't come prefix
    const month = `${date.getMonth() + 1}`.padStart(2, 0); //because month is zero based 0-jan 1 is feb like so we want 1 as feb so we add +1 to get exactly result we want
    const year = date.getFullYear();
    const displayDates = `${day}/${month}/${year}`;

    //calcDaysPassed example yester or 3 days ago
    const calcDaysPassed = (date1, date2) =>
      Math.abs(date2 - date1) / (1000 * 60 * 60 * 24);
*/
    //====implement Intl.numberFormat in our Project=========

    //i'm gonna commment it out because we use this over and over again so we put it into function
    const formattedMov = new Intl.NumberFormat(acc.locale, {
      style: 'currency',
      // currency: 'USD',//it indepent always be what we specifi so we need to change currency based on account user
      currency: acc.currency,
    }).format(mov);
    const html = `
      <div class="movements__row">
        <div class="movements__type movements__type--${type}">${
      i + 1
    } ${type}</div>
         <div class="movements__date">${displayDate}</div>
        <div class="movements__value">${formattedMov}</div>
      </div>
    `;

    containerMovements.insertAdjacentHTML('afterbegin', html);
  });
};

const calcDisplayBalance = function (acc) {
  acc.balance = acc.movements.reduce((acc, mov) => acc + mov, 0);
  // labelBalance.textContent = `${acc.balance.toFixed(2)}`;//old method
  labelBalance.textContent = formatCur(acc.balance, acc.locale, acc.currency);
};

const calcDisplaySummary = function (acc) {
  const incomes = acc.movements
    .filter(mov => mov > 0)
    .reduce((acc, mov) => acc + mov, 0);
  // labelSumIn.textContent = `${incomes.toFixed(2)}€`;
  labelSumIn.textContent = formatCur(incomes, acc.locale, acc.currency);

  const out = acc.movements
    .filter(mov => mov < 0)
    .reduce((acc, mov) => acc + mov, 0);
  // labelSumOut.textContent = `${Math.abs(out).toFixed(2)}€`;
  labelSumOut.textContent = formatCur(out, acc.locale, acc.currency);

  const interest = acc.movements
    .filter(mov => mov > 0)
    .map(deposit => (deposit * acc.interestRate) / 100)
    .filter((int, i, arr) => {
      // console.log(arr);
      return int >= 1;
    })
    .reduce((acc, int) => acc + int, 0);
  // labelSumInterest.textContent = `${interest.toFixed(2)}€`;
  labelSumInterest.textContent = formatCur(interest, acc.locale, acc.currency);
};

const createUsernames = function (accs) {
  accs.forEach(function (acc) {
    acc.username = acc.owner
      .toLowerCase()
      .split(' ')
      .map(name => name[0])
      .join('');
  });
};
createUsernames(accounts);

const updateUI = function (acc) {
  // Display movements
  // displayMovements(acc.movements);
  //now passing entire acc to this method
  displayMovements(acc);

  // Display balance
  calcDisplayBalance(acc);

  // Display summary
  calcDisplaySummary(acc);
};

//===countertime====
// =====psuedo code for our conter time function===
//set the time to 5 minutes
//call the timer for every seconds
//In Each Call, Print the remaining time to UI
//When timer is 0 seconds, stop  the timer and log out user
const startLogOut = function () {
  //set the time to 5 minutes
  // let time = 100; //more than 1 minutes
  let time = 120; //exactly 2 minutes
  const tick = function () {
    const min = String(Math.trunc(time / 60)).padStart(2, 0); //we get minutes
    const sec = String(time % 60).padStart(2, 0); //we get seconds
    //In Each Call, Print the remaining time to UI
    labelTimer.textContent = `${min}:${sec}`;

    //When timer is 0 seconds, stop  the timer and log out user
    if (time === 0) {
      clearInterval(timer);
      // Display UI and message
      labelWelcome.textContent = `Log in to get Started`;
      containerApp.style.opacity = 0;
    }
    //Decrease 1s
    time--;
  };
  tick();
  //call the timer for every seconds
  const timer = setInterval(tick, 1000);
  return timer;
};
///////////////////////////////////////
// Event handlers
let currentAccount, timer;

//For Excercise Purpose we need to open account always so we use fake login
//=========FAKE ALWAYS LOGGED IN=============
//This way we don't have to always log in each time we want to do something
// currentAccount = account1; //fake login always login
// updateUI(currentAccount);
// containerApp.style.opacity = 100;

//formating all the dates that we write manually
//Exprimenting API
//object
//We specify property what we want and how it would be display
const option = {
  //HINTS: 'numeric','long','2-digit',etc these are format specifier for Intl.datatimeformat()
  hour: 'numeric',
  minute: 'numeric',
  day: 'numeric', //2-digit 01 or 12 'numeric' 1 2 3 4 5 so on
  month: 'long', // 'long' full name of the month
  year: 'numeric', //2-digit
  weekday: 'long', //it will give full weekdays name(thursay ,friday so on)
};
const now = new Date();
const locale = navigator.language; //it will show which contry format we are using
console.log(locale); //en-US
// labelDate.textContent = new Intl.DateTimeFormat('en-IN', option).format(now);
labelDate.textContent = new Intl.DateTimeFormat(locale, option).format(now);
// const day = `${now.getDate()}`.padStart(2, 0); //02 if its 12 then zero won't come prefix
// const month = `${now.getMonth() + 1}`.padStart(2, 0); //because month is zero based 0-jan 1 is feb like so we want 1 as feb so we add +1 to get exactly result we want
// const year = now.getFullYear();
// const hour = now.getHours();
// const minite = now.getMinutes();
// labelDate.textContent = `${day}/${month}/${year},${hour}:${minite}`;

//Date formate we want to insert that place
//   day/month/year

//=====LOGIN=============
btnLogin.addEventListener('click', function (e) {
  // Prevent form from submitting
  e.preventDefault();

  currentAccount = accounts.find(
    acc => acc.username === inputLoginUsername.value
  );
  console.log(currentAccount);

  if (currentAccount?.pin === Number(inputLoginPin.value)) {
    // Display UI and message
    labelWelcome.textContent = `Welcome back, ${
      currentAccount.owner.split(' ')[0]
    }`;
    containerApp.style.opacity = 100;

    //Create Current Date
    const now = new Date();
    const option = {
      //HINTS: 'numeric','long','2-digit',etc these are format specifier for Intl.datatimeformat()
      hour: 'numeric',
      minute: 'numeric',
      day: 'numeric', //2-digit 01 or 12
      month: 'numeric', //full name of the month
      year: 'numeric', //2-digit
      // weekday: 'long', //it will give full weekdays name(thursay ,friday so on)
    };
    //This locale come from our browser so we need to use current account locale
    // const locale = navigator.language; //it will show which contry format we are using
    // console.log(locale); //en-US
    // labelDate.textContent = new Intl.DateTimeFormat('en-IN', option).format(now);
    // labelDate.textContent = new Intl.DateTimeFormat(locale, option).format(now);

    labelDate.textContent = new Intl.DateTimeFormat(
      currentAccount.locale,
      option
    ).format(now);
    // //padStart(2,0)=>length of character if not fit then it will ad 0 to prefix if it's fit then it will print full number
    // const day = `${now.getDate()}`.padStart(2, 0); //02 if its 12 then zero won't come prefix
    // const month = `${now.getMonth() + 1}`.padStart(2, 0); //because month is zero based 0-jan 1 is feb like so we want 1 as feb so we add +1 to get exactly result we want
    // const year = now.getFullYear();
    // //we need to convert object into string then only we can use padStart method
    // const hour = `${now.getHours()}`.padStart(2, 0);
    // const minite = `${now.getMinutes()}`.padStart(2, 0);
    // labelDate.textContent = `${day}/${month}/${year},${hour}:${minite}`;

    // Clear input fields
    inputLoginUsername.value = inputLoginPin.value = '';
    inputLoginPin.blur();

    //Clear timer if already exisist
    if (timer) clearInterval(timer);
    //counter time
    timer = startLogOut();
    // Update UI
    updateUI(currentAccount);
  }
});

//=======Transfer Amount=======
btnTransfer.addEventListener('click', function (e) {
  e.preventDefault();
  const amount = Number(inputTransferAmount.value);
  const receiverAcc = accounts.find(
    acc => acc.username === inputTransferTo.value
  );
  inputTransferAmount.value = inputTransferTo.value = '';

  if (
    amount > 0 &&
    receiverAcc &&
    currentAccount.balance >= amount &&
    receiverAcc?.username !== currentAccount.username
  ) {
    // Doing the transfer
    currentAccount.movements.push(-amount);
    receiverAcc.movements.push(amount);

    //Add Transfer date
    currentAccount.movementsDates.push(new Date().toISOString());
    receiverAcc.movementsDates.push(new Date().toISOString());

    // Update UI
    updateUI(currentAccount);

    //Reset The timer
    clearInterval(timer);
    timer = startLogOut();
  }
});

//========Loan Tranfser=========
btnLoan.addEventListener('click', function (e) {
  e.preventDefault();

  // const amount = Number(inputLoanAmount.value);
  const amount = Math.floor(inputLoanAmount.value); //we don't need to type caste manualy Math.floor() do it automatically does tppe coercion

  if (amount > 0 && currentAccount.movements.some(mov => mov >= amount * 0.1)) {
    //implementing new feature that we learn setTimeout()
    //settTimeout for loan approval
    setTimeout(function () {
      // Add movement
      currentAccount.movements.push(amount);

      //Add Loan date
      //HINTS: toISOString() converting objects into string bydefault it will be in object itself
      currentAccount.movementsDates.push(new Date().toISOString());

      // Update UI
      updateUI(currentAccount);
      //Reset The timer
      clearInterval(timer);
      timer = startLogOut();
    }, 2500);
  }
  inputLoanAmount.value = ''; //back to normal
});

//========Account Closed==============
btnClose.addEventListener('click', function (e) {
  e.preventDefault();

  if (
    inputCloseUsername.value === currentAccount.username &&
    Number(inputClosePin.value) === currentAccount.pin
  ) {
    const index = accounts.findIndex(
      acc => acc.username === currentAccount.username
    );
    console.log(index);
    // .indexOf(23)

    // Delete account
    accounts.splice(index, 1);

    // Hide UI
    containerApp.style.opacity = 0;
  }

  inputCloseUsername.value = inputClosePin.value = '';
});

let sorted = false;
btnSort.addEventListener('click', function (e) {
  e.preventDefault();
  displayMovements(currentAccount.movements, !sorted);
  sorted = !sorted;
});

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// LECTURES
/*
//=========Converting and Checking Numbers=============
//Learning about Numbers
//the First thing we should know about the numbers is that in javascript
//ALL NUMBERS ARE REPRESENTED INTERNALLY AS FLOATING POINT NUMBER
//Basically,always as decimal no matter if we write them as integer or floating point number
//both are same
console.log(23 === 23.0); //true
//HINTS: That's the reason we have only data types for all the numbers
//also numbers are represented internally in a 64 base 2 format that means are always stored in binary format
//so, Basically they're only composed of zeros and ones
//Now, in this binary form it's really very hard to represent some fractions that are very easy to represent in the base 10 system that we used to.
//Base 10 basically => 0 - 9
//While binary =>0 1
//there are certain numbers are very deficult to represent in base 2
//Example that example is 0.1
console.log(0.1 + 0.2); //give wired answer 0.30000000000000004

//Base 10 basically => 0 - 9 bassicaly 1/10=>simple 0.1  3/10=>3.3333333
//so Beware that so we can't get precise values or we can't do scintic calc or finalcial calculation in javascript
// bcoz eventually, we will run into problem like this
console.log(0.1 + 0.2 === 0.3); //false it should be true but it simply error in javascript that we have to accept that

//=======Converting String to Number=======
//we know how to convert a string to a number
console.log(Number('23')); //1st way of convert string into number
//another easy way of converting string into number
console.log(+'23'); //this will work fine because javascript sees the plus operators it will do type coerion so it will automaticaly covert all the operents to numbers
//3rd way of converting called parsing

//Parsing a number from string
//Number.parseInt();we know very well that every object has own function Number object has parseInt() method this method will converting string to number
console.log(Number.parseInt('30px')); //it will take first argument(30) it will simply egnore px
console.log(Number.parseInt('30')); //it will work fine because it's number although it's string
console.log(Number.parseInt('ee23')); //it will return NaN because it's string it won't take like this if we give fully string
console.log(Number.parseInt('23rem')); // it will ignore suffix after number because it's following regx->regular expression

//also Number object have float(floating point number)
console.log(Number.parseInt('12.5rem')); //it will stop after decimal point 12
console.log(Number.parseFloat('12.5rem')); //it will print include decimal point 12.5
//HINTS: These two function(methods )so-called global function
//Global function mean we don't need to call Number object we can directly use this function
console.log(parseFloat('3.5rem')); //3.5rem //it's old school method and traditional method modern days we need to use this function proper way
//Number space called Nan(Not a Number)
//in this function we can check any values is number or not

//====CHECK IF  VALUE IS NOT A NUMBER======
console.log(Number.isNaN(20)); //false actualy it is a number
console.log(Number.isNaN('20')); //false it's just a regular values
console.log(Number.isNaN(+'20x')); //true
console.log(Number.isNaN(25 / 0)); //false it will give infinite also not a nuber
//in mathamatically divided by anything with zero will become inifity
//HINTS:
//====CHECK IF VALUES IS A NUMBER===========
//Finite method is best way to checking if a value is Number
console.log(Number.isFinite(23)); //treu
console.log(Number.isFinite('20')); //false
console.log(Number.isFinite(+'20x')); //false
console.log(Number.isFinite(25 / 0)); //false inifinity is definatly not a finite number
//if you work with integer then you can use
console.log(Number.isInteger(23)); //true
console.log(Number.isSafeInteger(2.0)); //true //we know very well that reason previously learn
console.log(Number.isSafeInteger(1.2)); //false because integer always be whole number doesn't have floating values
console.log(Number.isSafeInteger(10000000000000000000)); //false because there's limit for integer values we can't give values more than integer limit
*/
//====Math and Roundaning======
//========Math=========
/*
console.log(Math.sqrt(25));
// console.log(2 ** 3); //this mean 2 ^3=>2*2*2=>8
//using exponential operaator
console.log(25 ** (1 / 2)); // 2 square root
console.log(8 ** (1 / 3)); //same 3 cubic root
//max value
console.log(Math.max(4, 5, 3, 2, 421));
//HINTS: this Math.max actually does type coerion
console.log(Math.max(4, 5, 3, 2, '421')); //ans will be 421
//and it doesn't parsing it will return nan number
console.log(Math.max(4, 5, 3, 2, '421px')); //ans will be Nan
//min value
console.log(Math.min(4, 5, 3, 2, 421)); //ans will be 2
//Constant on Math objects
console.log(Math.PI * Number.parseFloat('10px') ** 2);
//generate random number
//HINTS: this random number only give 0 -1 in float values
console.log(Math.trunc(Math.random() * 6) + 1);

//just function for fun
const randomInt = (min, max) =>
  Math.trunc(Math.random() * (max - min) + 1) + min;
//0...1->0....(max-min)->min...max
console.log(randomInt(10, 20));

//=======Rounding===========
//Rounding integers
console.log(Math.trunc(12.4)); //this will simply remove any decimal parts
//we have also another method that's called round method it wil do the same thing
console.log(Math.round(23.54)); //it will remove decimal parts simply print 24

//Ceil this will be round down neartest part of decimal part
console.log(Math.ceil(34.45)); //34.55 nearest value is 35 so it will print 35
console.log(Math.ceil(12.15)); //12.15 nearest value is 13  so it will print 35
//floor this will be round down neartest smallest values
console.log(Math.floor(12.14)); //12.14 nereast sammlest values before decimal part 12
console.log(Math.floor(34.56)); //34
//HINTS : All these method are do type coerion
console.log(Math.floor('12.4')); //12
console.log(Math.floor('48.55')); //48
//HINTS: floor and trunc both are round the values unless the given number number is negative
console.log(Math.trunc(-12.3)); //-12
console.log(Math.floor(-23.8)); //-24 //it will work in all suitvation

//Rounding decimals
//if >.5 it will give nerest greater value
//if <.5 it will give nearest lesser values
console.log((2.7).toFixed(0)); //3 this toFixed method always give string not a number
console.log((2.4).toFixed(0)); //3 this toFixed method always give string not a number
console.log((2.4).toFixed(3)); //2.400 this toFixed method always give string not a number
//HINTS:toFixed(0)=> this is indicate how many demimal point we want after .delimeter
console.log((3.456544).toFixed(3)); //3.456
console.log((3.456544).toFixed(2)); //3.45
console.log((3.456544).toFixed(1)); //3.4
//HINTS: this toFixed method only return string but if we want to convert number then we can use + sign
console.log(+(3.44).toFixed(1)); //3.4 this time if we check it will become a number
console.log(typeof +(3.44).toFixed(1)); //number

//=======the Reminder Opeartors============
//What is reminder operators?
// Reminder Operators it simply return of a division
console.log(5 % 2); //Reminder 1
console.log(5 / 2); //2.5(division) => 5=>2*2+1
console.log(8 % 3); //2
console.log(8 / 3); //2.6666666... 8=>if we get only integer part it will be 2 so
//8=>2*3+2(2 is reminder)
//we mostly use check number is even or odd
console.log(6 % 2); //0
console.log(6 / 2); //3
console.log(7 % 2); //1
console.log(7 / 2); //3.5  round(3) 3*2=>6 and remaining is 1

console.log(7 % 3); //1
console.log(7 / 3); // (2.3333333333333335) 2*3=>6 and remaing 1

//create simple function
const isEven = n => n % 2 === 0;
console.log(isEven(3)); //false
console.log(isEven(6)); //true
console.log(isEven(5)); //2.5 (2)2*2=>4 and remaining is 1 so it won't be a zero it will be false

//Excerice for painint second row just for fun
//this is node list
// lets convert into array using spread operators
//row -current row
//i - current index

labelBalance.addEventListener('click', function () {
  [...document.querySelectorAll('.movements__row')].forEach(function (row, i) {
    if (i % 2 === 0) {
      //0,2,4,6,8.... so on
      row.style.backgroundColor = 'orangered';
    }
    if (i % 3 === 0) {
      //0,3,6,9,12... so on
      row.style.backgroundColor = 'blue';
    }
  });
});

//=========Numeric Seperators==========
//Starting from es2021 we use feature called 'Numeric Separators' to format number in a way that's easier for us or  and other developers read our code
//Example diameter of solor system
// const diameter = 287460000000; //it's really dificult to understand this is it?
//it's really hard to read is it because just so many zeros here
//Now help with it when we write number this large under normal english lang we usually use a thousand (1000) seperators for comma(,)
// 287,460,000,000 it really readable format
//HINTS: We can do the same things in Javascript
const diameter = 287_460_000_000; //java can understadn
console.log(diameter); //o/p 287460000000 the js engine simply ignore underscore
//we can use numeric separaors any we want

//Example
//So basically we can underscore to give meaning to certain parts of our numbers
const price = 359_99;
console.log(price);

// const transerFee = 15_00;
const transerFee = 1_500; //one thousand 500
console.log(transerFee);
//we can use this advantages whenever we write numbers

const PI = 3.14_15; //allowed
// const PI = 3_14_15; //Not allowed
console.log(PI); //3.1415

//Just Be ware of using numeric separators
//when we try to converting  string to int
//the result actuallly not it won't work expected
console.log(Number('13555')); //13555
//using numeric separator in string to convert int it won't work we never use underscore while converting string to number
console.log(Number('13_55')); //Nan
console.log(parseInt('13_55')); //13 we won't get 1355 it will just ignore _


// ==========Working with BigInt============
//BigInt is special type of integer that was introduced in JS2020
//HINTS: learn previusly the numbers are represented by 64 bits that mean they're exactly once or zeros to represent any given number.
//Now of these 64 bits Only 53 are used to actually store the digits themselves. the rest are for stroring the position of the decimal point and sign

console.log(2 ** 53 - 1); //9007199254740991 biggest number js represented safely
console.log(Number.MAX_SAFE_INTEGER); //9007199254740991 it gives exact same number
console.log(2 ** 53 + 1); //result won't precisely

//So sometimes we have to work large number like database id like 60 bit and api gives large numbers
//so there's no way of storing large numbers in javascript untill ES2020
//Now new premitive data type was added which is called bigInt
//BigInt stants for big integer and it can be used to store numbers as large as we want
//so matter how big it is
console.log(3899898989398292920444420299292n); //if we add n to last it will transform regular number to bigInt ,now javascript give number aquiratly
//we can also create bigInt by using bigint function
console.log(BigInt(9444420299292)); //without n NOte: this is constructor function  should probly use only  in small integer

//Operations
console.log(10000n + 10000n);
console.log(844747483383839293856644484n * 8383838473833343847483n);
//HINTS: it's not possible to make bigint to normal regular number
const huge = 8948920202093939202020202020201201019n;
const num = 23;
// console.log(huge * num); //Error
//we get error ->Cannot mix BigInt and other types, use explicit conversions
//this is where our constructor function neccessory
console.log(huge * BigInt(num)); // O/P 205825164648160601646464646464627623437n
//it won't work Math opratos also
// console.log(Math.sqrt(16n)); //it doesn't work
//comparision Operators
//Exception
console.log(20n > 15); //true
console.log(20n === 20); //false becuase when use ==== it won't type coerion because both are different primitive data types
console.log(typeof 20n); //bigint
console.log(20n == 20); //when we use loose oprators it will become true,because loose operators does type coersion
//Even work like this also
console.log(20n == '20'); //true

//String concatination
console.log(huge + ' is really big !!!'); //the number isn't actually converted the string

//Division
console.log(10n / 3n); //3 but big int simply return closet one it will cut decimal part because bigInt is integer data type
console.log(10 / 3); //3.33333333333335

//==========Creating Dates and Times=============
//Dates and Times little bit messy and confusing in javascript

//create a Date
//There are four ways of creating dates in JS
//mean they all use the date contructor function but they can accept different paramters
//1st way
const now = new Date();
console.log(now);

//2nd way just parse the date from date string
console.log(new Date('Apr 20 2024 19:44:22'));

//3rd way we can write a string ourselves
console.log(new Date('Dec 24,2023')); //Sun Dec 24 2023 00:00:00 GMT+0530 (India Standard Time)
console.log(new Date(account1.movementsDates[0]));

//4th way
//we can pass month,day,year minite even Seconds also
console.log(new Date(2037, 10, 19, 15, 23, 5)); //Thu Nov 19 2037 15:23:05 GMT+0530 (India Standard Time)
//HINTS:Month in JavaScript is zero based
//nov is actually 11th month but it gives 10 as nov because month in javascript is zero based

//HINTS: javaScript autocorrect the dates also we know very well november month only 30 days but if we give 31 it will automatically correct the dates
console.log(new Date(2037, 10, 31)); //(auto correct the next day)Tue Dec 01 2037 00:00:00 GMT+0530 (India Standard Time) //dec 1st if we 33 instead of 30 it will give dec 3

console.log(new Date(0)); //Thu Jan 01 1970 05:30:00 GMT+0530 (India Standard Time)
console.log(new Date(3 * 24 * 60 * 60 * 1000)); //Sun Jan 04 1970 05:30:00 GMT+0530 (India Standard Time)
//HINTS: 3 is day
//24 is hours
//60 is minutes
//60 is seconds
//1000 is milliseconds

//HINTS: these dates that we created here is another special type of object ,
//Therefore they have their own methods, just like array and map and strings and we can use these dates to get or set components of date

//=====Working with Dates========
const future = new Date(2037, 10, 19, 15, 23, 5);
console.log(future); //Thu Nov 19 2037 15:23:05 GMT+0530 (India Standard Time)
console.log(future.getFullYear()); //2037
console.log(future.getMonth()); //10 month is zero based
console.log(future.getDate()); //19
console.log(future.getDay()); //4 it's not a day of the month it's  actually day of the week zero based so 0 is sunday 4 is thurday
console.log(future.getHours()); //15
console.log(future.getMinutes()); //23
console.log(future.getSeconds()); //5
console.log(future.getMilliseconds()); //0
//we can nicely formated the string
console.log(future.toISOString()); //it follows international format 2037-11-19T09:53:05.000Z
//we can get timestamp for the date
console.log(future.getTime()); //2142237185000
//if we want to create date based on milisonds we can use timestamps
console.log(new Date(2142237185000)); //Thu Nov 19 2037 15:23:05 GMT+0530 (India Standard Time)
//Actually timeStamps are very important that there is special method that we can use to get a timestamps now
//we don't need to create object
console.log(Date.now()); //1713624159383

//Finnlay set version also available for all these method
console.log(future.setFullYear(2045));
console.log(future); //Sun Nov 19 2045 15:23:05 GMT+0530 (India Standard Time)

console.log(future.getDay());


//===========Operation with Dates===========
const future = new Date(2037, 10, 19, 15, 23, 5);
// console.log(Number(future));
console.log(+future);
*/
const calcDaysPassed = (date1, date2) =>
  Math.abs(date2 - date1) / (1000 * 60 * 60 * 24);
/**
 * 24 -hours a day
 * 60 -minutes
 * 60 -seconds
 * 1000 -milliseconds


const day1 = calcDaysPassed(new Date(2037, 3, 4), new Date(2037, 3, 14));
console.log(day1);

//==========Internationalizing Dates(INTL)================
 */
//=========Internationalizing Numbers===============
//Expriment

//object for formating
//format specifier for Intl.NumberFormat
const options = {
  // style: 'unit',
  // style: 'percent',
  style: 'currency', //we have define which currency
  // unit: 'mile-per-hour',
  unit: 'celsius',
  //define currency
  currency: 'EUR',
  //we can trun on and turn off grouping
  // useGrouping: false, //this mean number is just printed without separated
};
const num = 3244393.23;
console.log('US :' + new Intl.NumberFormat('en-US', options).format(num)); //US :3,244,393.23
console.log('GERMAN :' + new Intl.NumberFormat('de-DE', options).format(num)); //3.244.393,233
console.log('INDIAN :' + new Intl.NumberFormat('en-IN', options).format(num)); //32,44,393.23
console.log('SYRIA :' + new Intl.NumberFormat('ar-SY', options).format(num)); //٣٬٢٤٤٬٣٩٣٫٢٣
//browser default number format
console.log('BROWSER:' + new Intl.NumberFormat(navigator.language).format(num)); //BROWSER:3,244,393.23
console.log(
  navigator.language +
    ' ' +
    new Intl.NumberFormat(navigator.language).format(num)
); // (en-US):3,244,393.23
//========Timers(setIntervel and setTimeout)==========
//===Set timeout timer=====
//runs just once, after a defined time,while
//=====Set time intervel timer=====
//keeps running basically forever,untill we stop it,Basically use set time out to execute some code at some point in the future
//Example
//setTimeout()->need call back function
//don't confuse yourself with these example there's no conncection between in this topic this is just fun example
/*
const error = function () {
  console.log(`sorry the website couldn't reach 😢`);
};
const error2 = function () {
  console.log(`sorry for this website take too long 🥺`);
};
console.log(setTimeout(error, 3000)); //1st is call back function ,2nd argument is milliseconds when to this code execude we give 3000(3s) milliseconds after delay it will work
const timeOut = setTimeout(error2, 3000);//we store this setTimeout to another variable
console.log(timeOut);
*/

//=========setTimeout()==========
/*
simply schedules a function to run after a certain amoung of time, but the callback function  is only executed once
 */
/*
setTimeout(() => console.log(`Here is your pizza 🍕`), 3000); //give seconds for call this function in future it won't called suddently it will after 3 seconds
//1st call back function(we can call this function what we want)
//2nd argument is scheduler we can give specific timeout for delay when to execute call back(just scdule the function)
console.log('waiting...'); //it will execute first
//HINTS: as soon as javascript hit setTimeout((register first then wait for call this function),delay) it will waiting for call callback function then after the setTimeout code will be executed ,
//immidiately javascript move on next line but never forger to execute settimeout function()->definetly it will be execute once given time elapsed
//! ****THIS MECHANISM CALLED ASYNCHRONOUS IN JAVASCRIP*******
setTimeout(() => console.log('Waiting for your next order..'), 4000);
//inbelow that we give arguments to function after delay it will be execute with given arguments
/*
setTimeout(
  (ing1, ing2) => console.log(`here is your pizza with ${ing1} and ${ing2} 🍕`),
  6000,
  'cheese',
  'chikan'
);
*/
/*
//We can cancel the delay
const ingrents = ['cheese', 'chikan'];
//Assing timer
const pizzaTimer = setTimeout(
  (ing1, ing2) =>
    console.log(`here is your pizza with ${ing1} and ${ing2}  🍕`),
  6000,
  //won't give like this actually it will work but instead we can use spread operators
  // ingrents[0],
  // ingrents[1]
  ...ingrents
);
//cancel time out
//for example somepeople don't like add chikan in pizza
if (ingrents.includes('chikan')) clearTimeout(pizzaTimer); //cancel the timer before it called because we give delay there to setTimeout
//hints:
//We need to give variable for delete timeout(example pizzaTimer)
//=========setIntervel()==========
/*
now, what if  we wanted  to run a function  over and over again, like every five seconds or ten minutes? well for that we have setIntervel
 */
/*
//Example
setInterval(function () {
  const date = new Date();
  console.log(date);
}, 2500); //it will call this call back function evey 2.5 seconds Untill we stop
//for every 2.5 seconds new date created

//Mini project for clock just for fun
const time = new Date();
const clock = function () {
  const hours = `${time.getHours()}`.padStart(2, '0');
  const minutes = `${time.getMinutes()}`.padStart(2, '0');
  const seconds = `${time.getSeconds()}`.padStart(2, '0');
  console.log(hours + ':' + minutes + ':' + seconds);
};
setInterval(clock, 1000);
*/
//=========Countdown Timer==========
