'use strict'; //always use it
/*
console.log(document.querySelector('.message').textContent);

//change the text content
document.querySelector('.message').textContent = '🎉 Correct Number!';

document.querySelector('.number').textContent = 13;
document.querySelector('.score').textContent = 15;

//also set the value
document.querySelector('.guess').value = 12;
console.log(document.querySelector('.guess').value); //get actual values mow this is empty
*/

//implementing Secret Number to compare guessing number
let SecretNumber = Math.trunc(Math.random() * 20) + 1;
//random number generate 0 to 1 like 0.0002 1.2999 ,Math.truc()to get round values and if we multiply by 20 it will generate  1 to 19
//in order to include 20 as well, we need to add 1 to the method example 19.9999999 + 1 => 20

//state variable this variable so called part of application state
// document.querySelector('.number').textContent = SecretNumber;  just for showing our secret number

let score = 20; //score will change,that's why we use let variable

let highScore = 0;

//again we use dry principle whenever we get lot of duplicate code juse use dry principle
const displayMessage = function (message) {
  document.querySelector('.message').textContent = message;
};

document.querySelector('.check').addEventListener('click', function () {
  // console.log(document.querySelector('.guess').value);
  //whenever we get input from user interface or from input field usually it always string we need to convert string to number
  const guess = Number(document.querySelector('.guess').value);
  // console.log(guess, typeof guess);

  //--------When there is not input---------------
  if (!guess) {
    //if there's no guess we print this method again we need to true the guess because it will execute only once ,once it's false then it will stop again it won't come to check if statement
    // document.querySelector('.message').textContent = '⛔ No Number!';
    displayMessage('⛔ No Number!');

    //=============When Player is correct===========
  } else if (guess === SecretNumber) {
    // document.querySelector('.message').textContent = '🎉 Correct Answer!';
    displayMessage('🎉 Correct Answer!');

    document.querySelector('.number').textContent = SecretNumber;
    document.querySelector('body').style.backgroundColor = '#60b347'; //when answer is correct bg will be green color
    document.querySelector('.number').style.width = '30rem';

    //HigerScore
    if (score > highScore) {
      highScore = score;
      //display HigherScore
      document.querySelector('.highscore').textContent = highScore;
    }
  }
  //DRY Principle
  //Refactoring our Code-> it's mean Re-Structure our code the reason for refactor to improve our code and remove duplicate code

  //===========when guess is wrong============
  else if (guess !== SecretNumber) {
    if (score > 1) {
      // document.querySelector('.message').textContent =
      //   guess > SecretNumber ? '📈 Too High!' : '📉 Too Low!';
      displayMessage(guess > SecretNumber ? '📈 Too High!' : '📉 Too Low!');
      score--;
      document.querySelector('.score').textContent = score;
    } else {
      // document.querySelector('.message').textContent = '😭 You Lost The Game!';
      displayMessage('😭 You Lost The Game!');
      document.querySelector('.score').textContent = score = 0;
    }
  }
});

//--------When guess is too High!---------------
/*
  else if (guess > SecretNumber) {
    //only work if score greater than zero if less than zero it will give some message like you lost the game
    //implement that
    if (score > 1) {
      document.querySelector('.message').textContent = '📈 Too High!';
      score--;
      document.querySelector('.score').textContent = score;
    } else {
      document.querySelector('.message').textContent = '😭 You Lost The Game!';
      document.querySelector('.score').textContent = score = 0;
    }
    //--------When guess is too Low!---------------
  } else if (guess < SecretNumber) {
    if (score > 1) {
      document.querySelector('.message').textContent = '📉 Too Low!';
      score--;
      document.querySelector('.score').textContent = score;
    } else {
      document.querySelector('.message').textContent = '😭 You Lost The Game!';
      document.querySelector('.score').textContent = score = 0;
    }
  }*/

//my approach
//---------Reset Button(Again)--------
//challange#1
/*
document.querySelector('.again').addEventListener('click', function () {
  //also we can say that this function is annoymous function because it doesn't have any name
  document.querySelector('.number').textContent = 20; //the mistake i did i put 20 instead of ?(orignal state)
  document.querySelector('.message').textContent = 'Start Guessing...';//correct
  document.querySelector('body').style.backgroundColor = ' #222';//correct
  document.querySelector('.number').style.width = '15rem';//correct
  Number((document.querySelector('.guess').value = ''));//correct
});
*/

//instructor approach
//---------Reset Button(Again)--------
document.querySelector('.again').addEventListener('click', function () {
  score = 20; //reset the score again 20
  //secrate number again would be generated
  SecretNumber = Math.trunc(Math.random() * 20) + 1;
  // document.querySelector('.message').textContent = 'Start guessing...';
  displayMessage('Start guessing...');
  document.querySelector('.score').textContent = score;
  document.querySelector('.number').textContent = '?';
  document.querySelector('.guess').value = ''; //convert string into number
  document.querySelector('body').style.backgroundColor = '#222';
  document.querySelector('.number').style.width = '15rem';
});
