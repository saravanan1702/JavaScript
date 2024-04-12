'use strict';

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// BANKIST APP

// Data
const account1 = {
  owner: 'Jonas Schmedtmann',
  movements: [200, 450, -400, 3000, -650, -130, 70, 1300],
  interestRate: 1.2, // %
  pin: 1111,
};

const account2 = {
  owner: 'Jessica Davis',
  movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
  interestRate: 1.5,
  pin: 2222,
};

const account3 = {
  owner: 'Steven Thomas Williams',
  movements: [200, -200, 340, -300, -20, 50, 400, -460],
  interestRate: 0.7,
  pin: 3333,
};

const account4 = {
  owner: 'Sarah Smith',
  movements: [430, 1000, 700, 50, 90],
  interestRate: 1,
  pin: 4444,
};

const accounts = [account1, account2, account3, account4];

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

const displayMovements = function (movements, sort = false) {
  //fixing already defined html demo (deposi and withdrawal) style,we want only inserted element
  containerMovements.innerHTML = '';
  //.textcontent=0;
  const movs = sort ? movements.slice().sort((a, b) => a - b) : movements; //(false => default)
  //mov -current array element and i is current element index
  //using forEach method with callback function
  movs.forEach(function (mov, i) {
    //we need this type twise so we create in this logic in outside
    const type = mov > 0 ? 'deposit' : 'withdrawal';
    //string html
    const html = `
      <div class="movements__row">
       <div class="movements__type movements__type--${type}">${
      i + 1
    } ${type}</div>
        <div class="movements__value">${mov}€</div>
      </div>
      `;
    //containerMovements is element which is uniformly stored html queries in previously
    containerMovements.insertAdjacentHTML('afterbegin', html); //this method accept two string
  });
};
// displayMovements(account1.movements);

//we can see all the html tag that's inside the element
//.innerHtml //we can change the values or change the style whatever we want
// console.log(containerMovements.innerHTML);//we can see all the tags

//====ADD Amounts to our Application====

const calcDisplayBalance = function (acc) {
  //acc - accumulate(parameter) last with 0 for computing with value
  /*
  const balance = acc.movements.reduce((acc, mov) => acc + mov, 0);
  labelBalance.textContent = `${balance}€`;*/
  acc.balance = acc.movements.reduce((acc, mov) => acc + mov, 0);
  labelBalance.textContent = `${acc.balance}€`;
};
//call the function
// calcDisplayBalance(account1.movements);
//========function for Display Summary============
//we comment it out for reference because we need entire object movents it's calculate only movement with same intrese
//But our objects have different interest rate based on account so instead of calculating specific one
//we need to calculate entire accounts so we pass arguments as entire accounts so we can take movements from that account also interest rate
//NOW WE PASS ENTIRE ACCOUNT'S NOT JUST A MOVEMENTS ARRAY
/*
const calcDisplaySummary = function (movements) {
  //Incomes
  const incomes = movements
    .filter(mov => mov > 0)
    .reduce((acc, mov) => acc + mov, 0);
  labelSumIn.textContent = `${incomes}€`;

  //Outcomes
  const out = movements
    .filter(mov => mov < 0)
    .reduce((acc, mov) => acc + mov, 0);
  labelSumOut.textContent = `${Math.abs(out)}€`; //Math.abs()method inorder to remove negative(-)sign

  //Interest
  const interest = movements
    .filter(mov => mov > 0)
    .map(deposit => (deposit * 1.2) / 100)
    //now bank introduce new rule the deposit amount atleast should be 1€ if not not giving interest
    .filter((int, i, arr) => {
      console.log(arr);
      return int >= 1;
    })
    .reduce((acc, int) => acc + int, 0);

  labelSumInterest.textContent = `${interest}€`;
};
*/
//====NOW CALCULATE INTREST ENTIRE ACCOUNTS=======
const calcDisplaySummary = function (acc) {
  //Incomes
  const incomes = acc.movements
    .filter(mov => mov > 0)
    .reduce((acc, mov) => acc + mov, 0);
  labelSumIn.textContent = `${incomes}€`;

  //Outcomes
  const out = acc.movements
    .filter(mov => mov < 0)
    .reduce((acc, mov) => acc + mov, 0);
  labelSumOut.textContent = `${Math.abs(out)}€`; //Math.abs()method inorder to remove negative(-)sign

  //Interest
  const interest = acc.movements
    .filter(mov => mov > 0)
    .map(deposit => (deposit * acc.interestRate) / 100)
    //now bank introduce new rule the deposit amount atleast should be 1€ if not not giving interest
    .filter((int, i, arr) => {
      console.log(arr);
      return int >= 1;
    })
    .reduce((acc, int) => acc + int, 0);

  labelSumInterest.textContent = `${interest}€`;
};
// calcDisplaySummary(account1.movements);
//========function getting user name============
//accs->acconts multiple accunts
//forEach method is side effect because it doen't return anything because we do something in object this is called side effect
//Side Effect ->simple Example
//simply do other work or without return anything,and that's what we did here
//we simply looped over the accounts array and each iteration we manipulated current account object and edit username to based on accout owner
//Example
//saravanan arumugam =>sa
//Jasmine Saravanan =>js
//Allwin Edwin Rosario =>aer
const createUsernames = function (accs) {
  //using forEach loop(method) to actual do something and it won't return anything instead it will change the original array
  //acc->for single acctount
  accs.forEach(function (acc) {
    //creating new propery for each of the account objects
    acc.username = acc.owner
      .toLowerCase()
      .split(' ')
      .map(name => name[0])
      .join('');
  });
};
createUsernames(accounts);
// console.log(accounts);
//REFACTOR CODE UPDATE THE UI WE USE AGAIN AND AGAIN SO WE CREATE IT AS FUNCTION
const updateUI = function (acc) {
  displayMovements(acc.movements);
  calcDisplayBalance(acc);
  calcDisplaySummary(acc);
};

//=========CREATE EVENT HANDLERS==========
let currentAccount;
btnLogin.addEventListener('click', function (e) {
  //prevent form from submitting
  e.preventDefault();
  // console.log('LOGIN');//reference for is it work?
  currentAccount = accounts.find(
    //acc.owner is whole name
    //acc.username that we crate earlier in crateusername function
    acc => acc.username === inputLoginUsername.value
  );
  console.log(currentAccount);
  if (currentAccount?.pin === Number(inputLoginPin.value)) {
    //Display UI and Welcome Message
    labelWelcome.textContent = `Welcome back, ${
      currentAccount.owner.split(' ')[0] //display only first words
    }`;
    containerApp.style.opacity = 100;

    //clear the input fields once we log in we don't show that username and password anymore we need to clear that
    inputLoginUsername.value = inputLoginPin.value = ''; //it's work right to left
    inputLoginPin.blur(); //it will losses the focus on the pin field
    //Display movements
    /*
    displayMovements(currentAccount.movements);
    //Display balance
    calcDisplayBalance(currentAccount);
    //Display Summary
    // calcDisplaySummary(currentAccount.movements);//i comment it out because it show only static movements calculation
    calcDisplaySummary(currentAccount); //dynamicly calculation based on movements
    // console.log('LOGIN');//reference for is it work?
    */
    //REFACTORING THE CODE BECAUSE WE USE THIS UPDATE METHOD AGAIN AND AGAIN
    //Update the UI
    updateUI(currentAccount);
  }
});
// console.log(createUsernames('saravanan arumugam'));
// console.log(createUsernames('Steven Thomas Williams'));

// const user = 'Steven Thomas Williams'; //user name should be stw
//getting each first letter with lowerCase
//Call back function in the  Map method  always need return the new value
//bydefault arrow function is return type we don't need to write if condition is linear way
/*
const username = user
  .toLowerCase()
  .split(' ')
  .map(name => name[0])
  .join('');
console.log(username);
*/
//======SOME METHOD FOR LOAN FEATURES=========
btnLoan.addEventListener('click', function (e) {
  e.preventDefault(); //get rid of reload form
  const amount = Number(inputLoanAmount.value);
  //amount/10 (or) we can give amount * 0.1 => 0.1 is stand for 10%
  if (amount > 0 && currentAccount.movements.some(mov => mov >= amount * 0.1)) {
    //Add the movement
    currentAccount.movements.push(amount);
    //update the UI
    updateUI(currentAccount);
    // alert('Loan santined Successfully');
  }
  inputLoanAmount.value = '';
});
//======Transfer Money=========
btnTransfer.addEventListener('click', function (e) {
  //becuase this is also form element prevent reload from click
  e.preventDefault();
  const amount = Number(inputTransferAmount.value);
  //transer amount which we want to transfer
  const receiverAcc = accounts.find(
    acc => acc.username === inputTransferTo.value
  );

  // console.log(amount, receiverAcc);
  //clear from inputs values from form(transfer money)
  inputTransferAmount.value = inputTransferTo.value = '';
  //check if user have enough money to transer to someone ,if not check we just create money it's not logicaly correct
  if (
    amount > 0 &&
    receiverAcc &&
    currentAccount.balance >= amount &&
    receiverAcc?.username !== currentAccount
  ) {
    // console.log('Transfer Valid!');//reference
    //Doing the Transfer
    currentAccount.movements.push(-amount); //if we transer money our account will be minus from transer amount
    receiverAcc.movements.push(amount); //receiver get money it will add from it's already having money
    //Update the UI
    updateUI(currentAccount);
  }
});
//====CLOSE THE ACCOUNT======
//create function for delelte account
//we can create this function separately as well as we can give call back fun as findIndex(callback function) method
const delIndex = acc => {
  acc.username === currentAccount.username;
};
btnClose.addEventListener('click', function (e) {
  e.preventDefault(); //prevent from reload

  // console.log('deleted');
  if (
    inputCloseUsername.value === currentAccount.username &&
    Number(inputClosePin.value) === currentAccount.pin
  ) {
    //fin()->it will return the element
    //findIndex()->it will return the index position
    //inbuild method for array .indexof(23)//we should pass some value same as method but we need pass function(callback)
    //but otherhand findIndex()->we can create a complex condition like this one it can be anything
    const index = accounts.findIndex(
      // acc => acc.username === currentAccount.username define call back function inside the findIndex() method
      delIndex //outerside function for my practice(call back fun)
    );
    console.log(index);
    //delete account
    //splice(args,args)//starting index and how many elements want to delted
    accounts.splice(index, 1); //index->certain index which is the index that we're gonna calculate in second
    //1 ->we will remove exactly one element
    //hide UI
    containerApp.style.opacity = 0;
  }
  //Clear Inputs fields
  inputCloseUsername.value = inputClosePin.value = '';
});
//======IMPLEMENTING SORTING METHOD==========
let sorted = false; //sorted state
btnSort.addEventListener('click', function (e) {
  e.preventDefault(); //prevent from auto referesh
  displayMovements(currentAccount.movements, !sorted);
  //logical NOT! opeerator if it's false it will true , if it's true again it become false the speciality of not operators
  //FLIP THE STATE IF NOT IT WON'T WORK
  sorted = !sorted;
});
/////////////////////////////////////////////////
/////////////////////////////////////////////////
// LECTURES

const currencies = new Map([
  ['USD', 'United States dollar'],
  ['EUR', 'Euro'],
  ['GBP', 'Pound sterling'],
]);

// const movements = [200, 450, -400, 3000, -650, -130, 70, 1300];

/////////////////////////////////////////////////

/*
//Methods:
//simply they're function that we can call on object
//Basically they're function attached to object
//if have array methods,Arrays themselves are also objects.These array methods are simply function that are all attached to arrays that we crate in javascript
//they're build in method ,essentialy tool for arrays

//===============SIMPLE TOOLS=========
let arr = ['a', 'b', 'c', 'd', 'e'];

//=======1.Slice Method=============
//it's doesn't mutate the values
//Similar like String slice -we can extract some parts from array without changing original array
console.log(arr.slice(2)); //it's not mutate original array instead it will return new array only extracted parts
//We can define end parameter also
console.log(arr.slice(2, 4));
//Just like string we can define negative paramter
console.log(arr.slice(-1)); //it will copy or return values from left side,we can get last elements of any array
console.log(arr.slice(-2)); //now we can get last two elements from array
//extrct from specific elements from array
console.log(arr.slice(1, -2)); //starting from 1st positionn end with -2 position
//finnaly,we can use slice method to simply create a shallow copy of any array
//simply call the method we don't pass any parameter to the method
console.log(arr.slice()); //simply call the method
//same as spread opertors we can use any methods it's up to you or own preferenc
console.log([...arr]); //creating new array using spread operators

//=======2.Splice Method=============
//splice method works in almost the same way as slice method.
//But, the fundamental difference is that it does change the original array
//Example
//original values before splice ['a', 'b', 'c', 'd', 'e']
// console.log(arr.splice(2)); // ['c', 'd', 'e']
//it will display remaining elements that present in array
// console.log(arr); //now the original array also changed with  ['a','b']
//now the extract elements are gone from original array ,splice deleted from original array
//if we want to delete last element from array we can use splice method because it will delete from original array
arr.splice(-1); //deleting last element from array
console.log(arr);
//if we want to specific elements to delete from array
arr.splice(1, 2); //start with 1st positionn end with 2nd position
console.log(arr);

//=======3.Reverse Method=============
arr = ['a', 'b', 'c', 'd', 'e'];
const arr2 = ['j', 'i', 'h', 'g', 'f'];
console.log(arr2.reverse());
//reverse method does mutate from original array
//mutate meaning we can change the elements
//now original array also reversed to wihtout useing reverse method because we already did it
console.log(arr2); //now original array also in reversed we didn't use reverse method

//=======4.Concat Method=============
//this one is really helpful to concate two arrays
//concate also doesn't mutate
const letters = arr.concat(arr2);
console.log(letters);
//NOTE : We can do this is using spread operators also
console.log([...arr, ...arr2]); //same as concate method and it doesn't mutate any of the involved arrays

//=======5.Join Method=============
console.log(letters.join(' -'));


//=====The New At method=======
const arr = [23, 11, 64];
console.log(arr);
//if we want to get one element from array
//we did in traditional way
console.log(arr[0]); //array at position 0
//same thing in at method it's does same the thing in traditional way
//this is modern way
console.log(arr.at(0)); //now we can get exact values.

//GETTING LAST ELEMENT FROM ARRAY
//suppose we want last element from array and we don't know the length of array
console.log(arr[arr.length - 1]); //now we can get last element from array
console.log(arr.slice(-1)[0]); //getting last element from array it will return new array and get element[0]th index because we get only one value
//These two are Traditional way of getting last element from array
//NOw using Modern way at method to get last element from array
console.log(arr.at(-1)); //64
//and onemore thing at method also work on String also
console.log('Jasmine'.at(-1));
console.log('Jasmine'.at(0));



//============For Each Method============
//Looping over Arrays

const movements = [200, 450, -400, 3000, -650, -130, 70, 1300];

//for of loop
//for (const  movement of movents)
//entries() in face ,entries() is another array method it will return array of arrays
//it will return array index and values itself
//mostly we use entries for gettinng index and values get together
for (const [i, movement] of movements.entries()) {
  if (movement > 0) {
    //movement o isn't looking good so we just add 1 for movement 1
    console.log(`Movement ${i + 1} : You Deposited ${movement}`);
  } else {
    //we use Math.abs to remove sign(-)
    console.log(`Movement ${i + 1} :You withdrew ${Math.abs(movement)}`);
  }
}
// for (const movement of movements) {
//   // console.log(movement);
//   if (movement > 0) {
//     console.log(`You Deposited ${movement}`);
//   } else {
//     //we use Math.abs to remove sign(-)
//     console.log(`You withdrew ${Math.abs(movement)}`);
//   }
// }
console.log('=======FOREACH METHOD==========');
//now using for each method to achieve exact same thing
//forEach() method required call back function
//Call back function when we pass function as arguments is called call back funtion and calling function called as higher order function
//forEach is higer order function we know very well
movements.forEach(function (mov, i, arr) {
  if (mov > 0) {
    console.log(`Movement ${i + 1} : You Deposited ${mov}`);
  } else {
    //we use Math.abs to remove sign(-)
    console.log(`Movement ${i + 1} :You withdrew ${Math.abs(mov)}`);
  }
});
//annoymous function ->without function name it's called as annoymous function
//0:function(200);//call it
//1:function(450)
//untill it will reaches end of the array

//Qustion ? when to use for...of loop and when to use forEach method(loop)
//Both of them work for iterate array
//but we can't use break or continue statment is ForEach loop
//if we use break and continue statement we can use for...of method
//otherwise it based on our preference



//=======FOREACH  WITH MAPS AND SETS==========
//each array contain key and values
//MAP
const currencies = new Map([
  ['USD', 'United States dollar'],
  ['EUR', 'Euro'],
  ['GBP', 'Pound sterling'],
]);
//first para is current element 2nd para is key and 3rd para is entire map
currencies.forEach(function (value, key, map) {
  console.log(`${key}:${value}`);
});

//SET
const currenciesUnique = new Set(['USD', 'GBP', 'USD', 'EUR', 'EUR']);
console.log(currenciesUnique);
currenciesUnique.forEach(function (value, key, set) {
  //it doesn't make sense the reason
  console.log(`${key}:${value}`);
});

//The reson set doesn't have any key or indices
//so don't confuse but we keep all the three parameter for call back function
*/

// Coding Challenge #1

/* 
Julia and Kate are doing a study on dogs. So each of them asked 5 dog owners about their dog's age, and stored the data into an array (one array for each). For now, they are just interested in knowing whether a dog is an adult or a puppy. A dog is an adult if it is at least 3 years old, and it's a puppy if it's less than 3 years old.

Create a function 'checkDogs', which accepts 2 arrays of dog's ages ('dogsJulia' and 'dogsKate'), and does the following things:

1. Julia found out that the owners of the FIRST and the LAST TWO dogs actually have cats, not dogs! So create a shallow copy of Julia's array, and remove the cat ages from that copied array (because it's a bad practice to mutate function parameters)
2. Create an array with both Julia's (corrected) and Kate's data
3. For each remaining dog, log to the console whether it's an adult ("Dog number 1 is an adult, and is 5 years old") or a puppy ("Dog number 2 is still a puppy 🐶")
4. Run the function for both test datasets

HINT: Use tools from all lectures in this section so far 😉

TEST DATA 1: Julia's data [3, 5, 2, 12, 7], Kate's data [4, 1, 15, 8, 3]
TEST DATA 2: Julia's data [9, 16, 6, 8, 3], Kate's data [10, 5, 6, 1, 4]

GOOD LUCK 😀


//solution
const checkDogs = function (dogsJulia, dogsKate) {
  const dogsJuliaCorrected = dogsJulia.slice();
  //remove dogs wthich is cat
  dogsJuliaCorrected.splice(0, 1);
  dogsJuliaCorrected.splice(-2);
  // dogsJulia.slice(1,3);
  // console.log(dogsJuliaCorrected);
  const dogs = dogsJuliaCorrected.concat(dogsKate);
  console.log(dogs);
  //logic
  // ("Dog number 1 is an adult, and is 5 years old") or a puppy ("Dog number 2 is still a puppy 🐶")
  dogs.forEach(function (dogs, i) {
    if (dogs >= 3) {
      console.log(
        `("Dog number ${i + 1} is an adult, and is ${dogs} years old 🐕‍🦺")`
      );
    } else {
      console.log(`"Dog number ${i + 1} is still a puppy 🐶")`);
    }
  });
};
// TEST DATA 1: Julia's data [3, 5, 2, 12, 7], Kate's data [4, 1, 15, 8, 3]
checkDogs([3, 5, 2, 12, 7], [4, 1, 15, 8, 3]);
// TEST DATA 2: Julia's data [9, 16, 6, 8, 3], Kate's data [10, 5, 6, 1, 4]
checkDogs([9, 16, 6, 8, 3], [10, 5, 6, 1, 4]);
*/
// Coding Challenge #2

/* 
Let's go back to Julia and Kate's study about dogs. This time, they want to convert dog ages to human ages and calculate the average age of the dogs in their study.

Create a function 'calcAverageHumanAge', which accepts an arrays of dog's ages ('ages'), and does the following things in order:

1. Calculate the dog age in human years using the following formula: if the dog is <= 2 years old, humanAge = 2 * dogAge. If the dog is > 2 years old, humanAge = 16 + dogAge * 4.
2. Exclude all dogs that are less than 18 human years old (which is the same as keeping dogs that are at least 18 years old)
3. Calculate the average human age of all adult dogs (you should already know from other challenges how we calculate averages 😉)
4. Run the function for both test datasets

TEST DATA 1: [5, 2, 4, 1, 15, 8, 3]
TEST DATA 2: [16, 6, 10, 5, 6, 1, 4]

GOOD LUCK 😀


//Dogs Ages converted into human ages
const calcAverageHumanAge = function (ages) {
  //it's implicit return inside the map arrow function
  const humanAges = ages.map(age => (age <= 2 ? 2 * age : 16 + age * 4));
  // console.log(humanAges);
  const adults = humanAges.filter(age => age >= 18); //if dogs age creater than 18 then put it inot new array
  console.log(humanAges);
  console.log(adults);
  // const average = adults.reduce((acc, age) => acc + age, 0) / adults.length;
  //we want immidiate caluculatation for every element
  const average = adults.reduce(
    (acc, age, i, arr) => acc + age / arr.length,
    0
  );

  //immidiately calculated
  //2 3 (2+3)/2 =2.5 === 2/2+3/2=2.5
  return average;
};
const avg1 = calcAverageHumanAge([5, 2, 4, 1, 15, 8, 3]);
const avg2 = calcAverageHumanAge([16, 6, 10, 5, 6, 1, 4]);
console.log(avg1);
console.log(avg2);
*/
// Coding Challenge #3

/* 
Rewrite the 'calcAverageHumanAge' function from the previous challenge, but this time as an arrow function, and using chaining!

TEST DATA 1: [5, 2, 4, 1, 15, 8, 3]
TEST DATA 2: [16, 6, 10, 5, 6, 1, 4]

GOOD LUCK 😀
*/
/*
const calcAverageHumanAge = ages =>
  ages
    .map(ages => (ages <= 2 ? ages * 2 : 16 + ages * 4))
    .filter(ages => ages >= 18)
    .reduce((acc, ages, i, arr) => acc + ages / arr.length, 0);
const age1 = calcAverageHumanAge([5, 2, 4, 1, 15, 8, 3]);
const age2 = calcAverageHumanAge([16, 6, 10, 5, 6, 1, 4]);
console.log(age1);
console.log(age2);
*/

//=========THE MAP METHOD===========
/*
//map method is yet another way that we can use to loop  over the array, but unlike forEcach method, the map method will give us a brand new array and this new array will contain in each position the result of applying a call back function to the original array elements
const movements = [1, 200, 450, -400, 3000, -650, -130, 70, 1300];
const eurToUsd = 1.1;
//we know very well map method will return new array we need to store that in variable
const movementsUSD = movements.map(function (mov) {
  return mov * eurToUsd;
});
console.log(movements); //HINTS: the original array also not mutated at all
console.log(movementsUSD); //indeed the map method returns brand new array with new elements

//covert euro inot inr
const eurToInd = 90.39;
const movementsIND = movements.map(function (mov) {
  return mov * eurToInd;
});
console.log(movements);
console.log(movementsIND);

//for of loop
//we need to first define empty array
const movementsUSDfor = [];
for (const mov of movements) {
  movementsUSDfor.push(mov * eurToUsd);
}
console.log(movementsUSD);

// const movementsUSD = movements.map(function (mov) {
//   return mov * eurToUsd;
// });

//doing the samething in Call Back Function
//arrow function are very usefull for small call back function
const movementUSD = movements.map(mov => mov * eurToUsd);
console.log(movementUSD);

//arrow function for small things
// const hello = name => console.log(`hello ${name}`);
// hello('saravanan');
// const add = (a, b) => a + b;
// console.log(add(12, 3));

//HINTS: The map method also have exact three paramter like forEach method
//beside get current element from array we can get current elements index as welll as whole array

//Regular Function
// movements.map(function (mov, i, arr) {
//   if (mov > 0) {
//     console.log(`Movement ${i + 1} : You Deposited ${mov}`);
//   } else {
//     //we use Math.abs to remove sign(-)
//     console.log(`Movement ${i + 1} :You withdrew ${Math.abs(mov)}`);
//   }
// });

//Arrow Function
//1.current element from array
//2.getting index
//3.Entire array
const movementsDescription = movements.map((mov, i) => {
  //map return new array
  //Even simplify this logic because both are doing same thing(deposite and withdrawl)
  //this is arrow function we don't need return keyword also
  `Movement ${i + 1} :You ${mov > 0 ? 'Deposited' : 'Withdrawal'} ${Math.abs(
    mov
  )}`;
});
console.log(movementsDescription);
*/

//========FILTERS========
//filtering elements

/*
function withdrawal(mov) {
  return mov < 0;
}
const withdrawal1 = movements.filter(withdrawal); //we can create separate function pass the function as argumetns
console.log(withdrawal1);
*/
/*
const movements = [200, 450, -400, 3000, -650, -130, 70, 1300];

const deposits = movements.filter(function (mov) {
  return mov > 0;
});
console.log(movements);
console.log(deposits);

//we can do the same thing in for of loop
//but we need new array
const depositFor = [];
for (const mov of movements) if (mov > 0) depositFor.push(mov);
console.log(depositFor);

//For Withdrawal
const WithdrawalFilter = movements.filter(function (mov) {
  return mov < 0;
});
console.log(WithdrawalFilter);

//Same things in Arrow function
//the very usecase in arrow function we don't need to write return method by default it has return method

const WithdrawalArrowFun = movements.filter(mov => mov < 0); //parameter and return
console.log(WithdrawalArrowFun);

//same thing in for of loop
const withdrawalFor = [];
for (const mov of movements) if (mov < 0) withdrawalFor.push(mov);
console.log(withdrawalFor);
*/
// ==========REDUCE METHOD==========
//we use reduce method to essentially boil down all the elements in an array to one single value.
//example adding the all the elements from array
// const movements = [200, 450, -400, 3000, -650, -130, 70, 1300];
// console.log(movements);
//In Reduce method is different the first parameter called accumulated
//but map and foreach method they are three parameter first is current element 2nd is currnedn element index and 3rd is entire array

//Accumulatar is like a snowball
//and Reduce method has another parameter that's accumualator initial value, we need spcifiy the value
/*
const balance = movements.reduce(function (acc, curr, i, arr) {
  console.log(`Iteration ${i}:${acc}`);
  return acc + curr;
}, 0); //adding all the elements with 0+current elements then so on and we can any values whatever we want to do with array elements
console.log(balance);

//Doing samething in Arrow function
const balance = movements.reduce((acc, cur) => acc + cur, 0);
console.log(balance);
//Using Reduce method we can avoid unwated variable declaration


//Doing the same thing in for loop
// let sum = 0;
let balance1 = 0;
for (const mov of movements) {
  balance1 += mov;
}
// console.log('Using in For Loop :' + sum);
console.log('Balance is :(FOR LOOP) :' + balance1);

// //Using for loop
// let sum = 0;
// const calCbal = function (mov) {
//   for (const add of mov) {
//     sum += add;
//   }
//   return sum;
// };
// console.log(calCbal(movements));

//Filter filter values
const addValues = movements.filter(mov => mov > 0);
console.log(addValues);

//map also another for loop it will return brand new  array
let indianRupee = 91.18;
const addValuesUsingMap = movements.map(function (mov) {
  return mov * indianRupee;
});
console.log(addValuesUsingMap);

//Maximum Value of the movements array
//reduce boil down the array into just give single value
const movements = [1, 200, 450, -400, 3000, -650, -130, 70, 1300];
const max = movements.reduce((acc, mov) => {
  if (acc > mov) {
    return acc;
  } else {
    return mov;
  }
}, movements[0]);
console.log(max);
*/

// =============CHAINING METHOD================
//In previously we work three methods in separately now we're working with sinle variable using three method
//this is called chaining
//NOTE :we can do this only if all the methods return new array if not it's possible
//for example we can't do this is forEach method the reason forEach method doen't return any new array instead it will mutated original array
//Note :when we get bug in chain method it's really hard to find out which method occure error it's really hard to debug the error
// =============CHAINING METHOD DISADVANTAGES================
//We shouldn't overuse Chaining Method,we should try to optimize it
//Because chaining tons of method one after the other can really cause performance issues if we have really huge arrays.
//so if we have a huge chain of methods,one after other we shoud compress all the functionality that's they do into as little method as possible
//And it's bad practice in javascript to chain method that mutate the underlying original array
//Example of that splice method,we should not chain a method like a splice or reverese method,we can do that but it's not good practice
//we never mutate original array  if application is small or demo app it's not a problem if we have a huge scallable data we can't do it,it always good practice to avoid mutating array
//PIPELINE
/*
const movements = [1, 200, 450, -400, 3000, -650, -130, 70, 1300];

const eurToUsd = 1.1;
const totalDepositsUSD = movements
  .filter(mov => mov > 0)
  .map(mov => mov * eurToUsd)
  .reduce((acc, currMov) => acc + currMov, 0);
console.log(totalDepositsUSD);
*/
/*
//intentinaly create error for out code for learning purpose
const eurToUsd = 1.1;
const totalDepositsUSD = movements
  .filter(mov => mov < 0) //propably this codition is lead to negative values
  .map((mov, i, arr) => {
    console.log(arr); //loggin values which valus printed
    return mov * eurToUsd;
  })
  .reduce((acc, currMov) => acc + currMov, 0);
console.log(totalDepositsUSD); //getting negative values we need to debug the code which line lead this error

//=========THE FIND METHOD===========
//we can retrive one element from array based on condition
//find method also accept condition and find method also accept call back function
//Just like filter method, but unlike filter method the find method not return any new array but it will return only first element that statisfy the condition
const movements = [1, 200, 450, -400, 3000, -650, -130, 70, 1300];
//basicaly it will return first withdrawal
const firstWithdrawal = movements.find(mov => mov < 0);
console.log(movements);
console.log(firstWithdrawal);

//Fundamental differences
//Filter -> 1) it will all the array elements that match the condition
//       ->2) it will return new array
//Find -> it will return only one which is match the conditon first
//       ->2) it will not  return new array

//Usauly the goal of find method to find exactly only one element

console.log(accounts);
const account = accounts.find(acc => acc.owner === 'Jessica Davis');
console.log(account);

//for of loop
for (const account of accounts) {
  if (account.owner === 'Jessica Davis') {
    console.log(account);
    break; // Stop iterating once a match is found
  }
}

//MAP
const matchingAccounts = accounts.map(account => {
  if (account.owner === 'Jessica Davis') {
    return account; // Include matching accounts in the new array
  } else {
    return null; // Or any other value to indicate non-matching accounts
  }
});

console.log(matchingAccounts);
*/

//==========SOME AND EVERY METHODS=========
//=====Every Method======
/*
const movements = [1, 200, 450, -400, 3000, -650, -130, 70, 1300];
console.log(movements);
console.log(movements.includes(-130)); //we get true because it's available in our movements array
//we can use includes method to test the certain values if it's avaialble in array
//Again this is essentail for testing equality
//But if what if we want to test for condition instead
//FOR EXAMPLE if we want to know only possitive values is available in array how to check that
const anyDeposit = movements.some(mov => mov > 0); //it return true or false
console.log(anyDeposit); //true because we have so many deposit  values(+ values)
//now if we want to test any deposit above 5000
//Check above 5000 Deposit
const above5000 = movements.some(mov => mov > 5000);
console.log(above5000); //it will return false because we haven't any deposit above 5000
// const anyDeposit1 = movements.some(mov => mov > 1500); //it return true or false
// console.log(anyDeposit1); //we get true because we have deposit more than 1500

//====DIFFERENCE=====
//EQUALITY
console.log(movements.includes(-130));
//we can rewrite this condition same as includes method
const rewrite = movements.some(m => m === -130); //it doesn't make any sense just we can use includes method but just for reference we can create like this also
console.log(rewrite);
//SPECIFY CONDITION
const anyDeposit1 = movements.some(mov => mov > 1500); //it return true or false
console.log(anyDeposit1); //we get true because we have deposit more than 1500

//=======Every Method========
//Every Method is similar to the some method
//but the only difference is every only return true if all of the elements in the array satisfly the conditon
//So in other words, if every element passes the test in our call back function, only then the every method will return true;
//That's why this method called as EVERY
console.log(movements.every(mov => mov > 0)); //it will return false because we have some negative - values in movements it will return only if all the elements meet this condition
//it will return only if all the movements are possitive otherwise return false

//Account 4 all the movements are only positive elements let's check
console.log(account4.movements.every(mov => mov > 0)); //it will return true because account 4 movements all of them positive elements so it's satisfl entire elements

//========================SEPARATER FUNCTION FOR CALL BACK=====================
//We can write function separately and pass to other function this is called as #CALL BACK FUNCTION#
//1.Function Expression
const posElements = function (mov) {
  return mov > 0;
};
//2.Normal Function or Traditinal Function
function posElementsNormal(mov) {
  return mov > 0;
}
//3.Arrow Function(explicit Return type if we use arrow method we don't need to write manually)
//if our logic is contain bunch of line then we need to write return method
const arrFun = mov => mov > 0;
//Function Expression
posElements(account4.movements.every(posElements));
posElementsNormal(account4.movements.every(posElementsNormal));
console.log(account4.movements.every(arrFun));

//Separate Callback
const deposit = mov => mov > 0;
console.log(movements.every(deposit));

//======FLAT AND FLAT MAP=========
//Nested array array's inside another array
const arr = [[1, 2, 3], [4, 5, 6], 7, 8];
//if we want to take all these elements in the separate and put all of them together in just one big array which contains all the numbrs here from one to eight?
//that's pretty simple using new FLAT method
//it doesn't need call back function
//Flat method do only one level of nesting
console.log(arr.flat()); //it's Introduced ES2019 it's recent method
//they're not work in super old browser
//DeeperNested array inside another array inside another array
const arrDeeperNested = [[[1, 2], 3], [4, [5, 6]], 7, 8];
console.log(arrDeeperNested.flat(2)); //in order 2 level deeper nesting we can give arguments for how many levels of deep we want

//storing all the movements arrays into one variable
const accountsMovements = accounts.map(acc => acc.movements);
console.log(accountsMovements);

const allMovements = accountsMovements.flat(); //here won't need any parameter because we need default(1) level of flating the array
console.log(allMovements);
console.log(allMovements.length);
const overallBal = allMovements.reduce((acc, mov) => acc + mov, 0);
console.log(overallBal);

//Method Chaining
const overallBal2 = accounts
  .map(acc => acc.movements)
  .flat()
  .reduce((acc, mov) => acc + mov, 0);
console.log(overallBal2);

//=====FLAT MAP=====
//Flat map essentially combines, a map and flat method into just one method which is better for performance
//map()+flat()=>flatMap()
//HINTS: flatmap recive exactly same paranthese like map method (call back function) and flat map can only one level deeper if we want more than deeper then we have to use flat method
// const overAllBal = accounts.flatMap(mov => mov.movements);
//HINTS :Flat map need call back function flat method doesn't need call back function
const overAllBal = accounts
  .flatMap(mov => mov.movements)
  .reduce((acc, mov) => acc + mov, 0);
console.log(overAllBal);
*/
//===SORT METHOD=========
/*
//sort method mutated the original array
//String
const owners = ['Saravanan', 'Jasmine', 'Allwin', 'Santhosh'];
console.log(owners.sort());
console.log(owners); //it will print soreted array list because we sorted the array so it's mutated the original array
//Numbers
const movements = [1, 200, 450, -400, 3000, -650, -130, 70, 1300];
//sort method in number it doesn't work at all it sort based on string
// console.log(movements.sort()); //it doesn't sorted the array
//the reason sorting based on string so we have to fix this
//return < 0 A,B (Keep Order)
//return > 0,B,A (Switch Order)
//sorting assending order small to large number
//assending order
// movements.sort((a, b) => {
//   if (a < b) {//keep order
//     return 1;
//   }
//   if (b > a) {//change order
//     return -1;
//   }
// });
//example
//arr=[5,64,32,13,69];
//a>b =>true change the order if not keep the order 5>64 no so keep next 64>32 yes so change the order 32,64 64>
// movements.sort((a, b) => {
//   if (a > b) {
//     return 1;
//   }
//   if (a < b) {
//     return -1;
//   }
// });
// console.log(movements);
movements.sort((a, b) => a - b); //same here
console.log(movements);
//decendting order
// movements.sort((a, b) => {
//   if (a > b) {
//     return -1;
//   }
//   if (a < b) {
//     return 1;
//   }
// });
movements.sort((a, b) => b - a); //same here

console.log(movements);

//=======MORE WAYS OF CREATING AND FILLING ARRAYS=======
console.log([1, 2, 3, 4, 5, 6, 7]);
//=====Creating array Programatically======
//before that we need give elements for array now instead of giving manually we can give programatically
//new Array constructor
console.log(new Array(1, 2, 3, 4, 5, 6, 7)); //passing arguments

//Empty array + fill Method
const x = new Array(7); //creating array with 7 elements
console.log(x);
//HINTS: also we can't use this x array for anyting for example map method
//only fillMethod  will work
// x.map(() => 5);
// console.log(x);
//fill()method
// x.fill(1); //mutate the array
//fill() => method is similar like slice method we can give argument where to fill or we can give speicific index to start to fill the array
// x.fill(1, 3); //specifiy where to start to filling 1
x.fill(1, 3, 5); //specify where to start and where to end with fill array
console.log(x);
const arr = [1, 2, 3, 4, 5, 6, 7];
arr.fill(23, 2, 6);
console.log(arr); //and it will mutate the original one
//Create Arrays programatically
//Array.from()
//Array is function this functional object has method,we call it .from() method
//.from({length:}callback function)//this call back function exactly map method
const y = Array.from({ length: 7 }, () => 1); //no argument no current index and nothing all we want to return one and it will put one in each position of the array
//Array.from=>that's introcuded in ES6
console.log(y);

// const z = Array.from({ length: 7 }, (curr, i) => i + 1); //we never use currentelement but we need to access second parameter i(current index) we can give _underscore also
//like
const z = Array.from({ length: 7 }, (_, i) => i + 1);
console.log(z);

//random dice execerise
const randomDice = Array.from(
  { length: 100 },
  () => Math.trunc(Math.random() * 6) + 1
);
console.log(randomDice);
//so-called iterable
//Like Strings,map and sets they're iterables in javascript
//so they can be converted into real arrays using array.from
*/
//element converting into array
// const movementsUI = Array.from(document.querySelectorAll('.movements__value'));
// console.log(movementsUI);

//HINTS: We can attach EventListener to every Object. it doesn't have to be a button
//Array.from()=>converting node list (like array structure but not a array)and 2nd parameter we even included mapping function that we do what exatcly want
//basically converting row elements into text content and replacing euro sign to nothing('')
/*
labelBalance.addEventListener('click', function () {
  const movementsUI = Array.from(
    document.querySelectorAll('.movements__value'),
    el => Number(el.textContent.replace('€', ''))
  );
  console.log(movementsUI);
});
*/
//=========Array Method Practice==========
//we need only sum of all the accounts deposite amounts and we get all the accounnt's movements into single array then we can use flat() method it will get all the values from differentt arrays to single array
// const bankDepositSum = accounts.map(acc => acc.movements).flat();// instead using two method we can use flatmap() method to do the same thing in linear way because flatmap do map as well as flattern the array
//1. Excercise
const bankDepositSum = accounts
  .flatMap(acc => acc.movements)
  .filter(mov => mov > 0)
  .reduce((sum, mov) => sum + mov, 0);

//sum of all the deposite
console.log(`sum of all the deposite  is ${bankDepositSum} 💵`);
//2.Excercise
//if we want to count how many deposite in the bank with at least $1000
//We can do this in two way
//1st Way of doing that
/*
const numDeposits1000 = accounts
  .flatMap(acc => acc.movements)
  .filter(mov => mov >= 1000).length;
console.log(`The count of atleast $1000 in Bank deposit is ${numDeposits1000}`);
*/
//2nd Way of Doing that
const numDeposits1000 = accounts
  .flatMap(acc => acc.movements)
  .reduce((count, currArry) => (currArry >= 1000 ? count + 1 : count), 0); //we can use count++ but it won't work because it return 0 to next iteration it will return  always zero it won't give 1 to 5 but it will work if we give prefix operator it will first calculate then move to next iteration
//====HINTS===========
//but ++count it will add 1 first then return
//but count++ it will return original one later it will add 1 so that's why we get only zero it wil return original values each iteration
console.log(`The count of atleast $1000 in Bank deposit is ${numDeposits1000}`);

//3.Excercise sum of both deposit and withdrawl
//terminaly of reduce method
/*.reuce((accumulator,Currentarray){
--------------------
---function body----
--------------------
},initial values(we can give nay initial values what we need))
//if we pass initial value as object syntax like {something :values ,something:value}
*/
//More advanced cases of reduce method in this case we create object instead of create a number or string
//why not? we can do that things also because reduce boils down the  array into give a just one value
//the given values might very well be an object and it could be even be a new array as well and we could use reduce method in many place many of the other method
//fun example : reduce is swiss knife use of array  method we can use multiple purpose what we need
/*
const sums = accounts
  .flatMap(acc => acc.movements)
  .reduce(
    (sums, curr) => {
      //sums.deposit=sums.deposi+curr===sums.deposit+=curr
      curr > 0 ? (sums.deposit += curr) : (sums.withdrawals += curr);
      //(explicitly manually write return method)
      return sums; //in this case we need to implcity write return method
      //HINTS: if our function is very simple or linear way we don't need to write return method because it's implicity happend
      //if our function has more logic or statement then we need to give return method explicity
    },
    { deposit: 0, withdrawals: 0 } //objects(accumulators)calculated differently and directly put it into object
  );
  */
//now using distruct method
const { deposit, withdrawals } = accounts
  .flatMap(acc => acc.movements)
  .reduce(
    (sums, curr) => {
      // curr > 0 ? (sums.deposit += curr) : (sums.withdrawals += curr);
      //using braketNotation
      sums[curr > 0 ? 'deposit' : 'withdrawals'] += curr;
      return sums;
    },
    { deposit: 0, withdrawals: 0 }
  );
// console.log(sums.deposit, sums.withdrawals);
console.log(deposit, withdrawals);
//4.Create simple function that convery any string to a title case
//title case mean all the words sentence first word are capitalize rest of them small
//Example:this is a nice title->This Is a(exception) Nice
//=====this is best excerice for combining string and array method in all in one function=====

const convertTitleCase = function (title) {
  const exceptions = ['a', 'an', 'but', 'and', 'the', 'or', 'on', 'in', 'with'];

  const titleCase = title
    .toLowerCase()
    .split(' ')
    .map(word =>
      exceptions.includes(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');

  return titleCase;
};
console.log(convertTitleCase('this is a nice title'));
console.log(convertTitleCase('this is a LONG title but not too LONG'));
console.log(convertTitleCase('and here is another  title with an EXAMPLE'));

/*
const convertTitleCase = function (title) {
  //REFactor the code we use capittxalize many times using arrow functin
  const capitzalize = str => str[0].toUpperCase() + str.slice(1);

  const exceptions = ['a', 'an', 'and', 'the', 'but', 'or', 'on', 'in', 'with'];

  const titleCase = title
    .toLowerCase()
    .split(' ')
    .map(word => (exceptions.includes(word) ? word : capitzalize(word)))
    .join(' ');

  return capitzalize(titleCase);
};

console.log(convertTitleCase('this is a nice title'));
console.log(convertTitleCase('this is a LONG title but not too long'));
console.log(convertTitleCase('and here is another title with an EXAMPLE'));
*/
// Coding Challenge #4

/* 
Julia and Kate are still studying dogs, and this time they are studying if dogs are eating too much or too little.
Eating too much means the dog's current food portion is larger than the recommended portion, and eating too little is the opposite.
Eating an okay amount means the dog's current food portion is within a range 10% above and 10% below the recommended portion (see hint).

1. Loop over the array containing dog objects, and for each dog, calculate the recommended food portion and add it to the object as a new property. Do NOT create a new array, simply loop over the array. Forumla: recommendedFood = weight ** 0.75 * 28. (The result is in grams of food, and the weight needs to be in kg)
2. Find Sarah's dog and log to the console whether it's eating too much or too little. HINT: Some dogs have multiple owners, so you first need to find Sarah in the owners array, and so this one is a bit tricky (on purpose) 🤓
3. Create an array containing all owners of dogs who eat too much ('ownersEatTooMuch') and an array with all owners of dogs who eat too little ('ownersEatTooLittle').
4. Log a string to the console for each array created in 3., like this: "Matilda and Alice and Bob's dogs eat too much!" and "Sarah and John and Michael's dogs eat too little!"
5. Log to the console whether there is any dog eating EXACTLY the amount of food that is recommended (just true or false)
6. Log to the console whether there is any dog eating an OKAY amount of food (just true or false)
7. Create an array containing the dogs that are eating an OKAY amount of food (try to reuse the condition used in 6.)
8. Create a shallow copy of the dogs array and sort it by recommended food portion in an ascending order (keep in mind that the portions are inside the array's objects)

HINT 1: Use many different tools to solve these challenges, you can use the summary lecture to choose between them 😉
HINT 2: Being within a range 10% above and below the recommended portion means: current > (recommended * 0.90) && current < (recommended * 1.10). Basically, the current portion should be between 90% and 110% of the recommended portion.

TEST DATA:
const dogs = [
  { weight: 22, curFood: 250, owners: ['Alice', 'Bob'] },
  { weight: 8, curFood: 200, owners: ['Matilda'] },
  { weight: 13, curFood: 275, owners: ['Sarah', 'John'] },
  { weight: 32, curFood: 340, owners: ['Michael'] }
];

GOOD LUCK 😀
*/
//reference for crating new propery for already exists object
/*
const sara = {
  name: 'saravanan',
  age: 25,
};
sara.city = 'Trichy'; //create new propery and values to sara objects
sara.job = 'Softwere Developer ';
sara.location = 'Trichy';

console.log(sara);//{name: 'saravanan', age: 25, city: 'Trichy', job: 'Softwere Developer ', location: 'Trichy'}
*/
/*
1. Loop over the array containing dog objects, and for each dog, calculate the recommended food portion and add it to the object as a new property. Do NOT create a new array, simply loop over the array. Forumla: recommendedFood = weight ** 0.75 * 28. (The result is in grams of food, and the weight needs to be in kg)
*/
const dogs = [
  { weight: 22, curFood: 250, owners: ['Alice', 'Bob'] },
  { weight: 8, curFood: 200, owners: ['Matilda'] },
  { weight: 13, curFood: 275, owners: ['Sarah', 'John'] },
  { weight: 32, curFood: 340, owners: ['Michael'] },
];
//1.Just loop over the array and Add new Recommned food propery to the objects
//adding recommend food propery for existing object dogs
dogs.forEach(dog => (dog.recFood = Math.trunc(dog.weight ** 0.75 * 28))); //dog.weight is equl to Math.pow(dog.weight,0.75) 2 times power of 0.75
console.log(dogs);
//reference
/*
console.log(2 ** 3); //2 * 2 * 2;
 console.log(4 ** 2);
console.log(Math.pow(4, 2));
*/

/*
2. Find Sarah's dog and log to the console whether it's eating too much or too little. HINT: Some dogs have multiple owners, so you first need to find Sarah in the owners array, and so this one is a bit tricky (on purpose) 🤓*/
//HINTS: fin(callback) this method is return true or false value
const dogSarah = dogs.find(dog => dog.owners.includes('Sarah'));
console.log(dogSarah);
//Now finding weather the dog is eating too much or not
console.log(
  `sarah dog is eating ${
    dogSarah.curFood > dogSarah.recFood ? 'Much 😋' : 'too little!🙂'
  }`
);

/*
3. Create an array containing all owners of dogs who eat too much ('ownersEatTooMuch') and an array with all owners of dogs who eat too little ('ownersEatTooLittle').
*/
/*
const ownersEatTooMuch = dogs
  .filter(dog => dog.curFood > dog.recFood)
  .map(dog => dog.owners)
  .flat();
  */
//instead of using separatly we can use flatMap() this method return new array as well as return in single array format flatMap()=map()+flat();
//1.eating too much dog's owner
const ownersEatTooMuch = dogs
  .filter(dog => dog.curFood > dog.recFood)
  .flatMap(dog => dog.owners);
console.log(ownersEatTooMuch);
//2.eating too Little dog's owner
const ownersEatTooLittle = dogs
  .filter(dog => dog.curFood < dog.recFood)
  .flatMap(dog => dog.owners);
console.log(ownersEatTooMuch);

/*
4. Log a string to the console for each array created in 3., like this: "Matilda and Alice and Bob's dogs eat too much!" and "Sarah and John and Michael's dogs eat too little!"
*/
console.log(`${ownersEatTooMuch.join(' and ')}'s dogs eat too much!`);
console.log(`${ownersEatTooLittle.join(' and ')}'s dogs eat too Little!`);

/*
5. Log to the console whether there is any dog eating EXACTLY the amount of food that is recommended (just true or false)
*/
console.log(dogs.some(dog => dog.curFood === dog.recFood)); //false
//there is no dog eat exatcly cur food as recfood
/*
 Log to the console whether there is any dog eating an OKAY amount of food (just true or false)
Hints:
current > (recommended * 0.90) && current < (recommended * 1.10).
*/
const checkEatingOkey = dog =>
  dog.curFood > dog.recFood * 0.9 && dog.curFood < dog.recFood * 1.1;
console.log(dogs.some(checkEatingOkey));

/*
7. Create an array containing the dogs that are eating an OKAY amount of food (try to reuse the condition used in 6.)

*/
console.log(dogs.filter(checkEatingOkey));
/*
8. Create a shallow copy of the dogs array and sort it by recommended food portion in an ascending order (keep in mind that the portions are inside the array's objects)*/
//HINTS: if we want to sort array in accending order then we can give like a and b everyone give and it's very simple to sort for remembering
const dogsSorted = dogs.slice().sort((a, b) => a.recFood - b.recFood);
console.log(dogsSorted);
