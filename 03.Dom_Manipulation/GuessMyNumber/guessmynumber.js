'use strict';
//=====Implementing our main logic for the game Secret Number=======
let SecretNumber = Math.trunc(Math.random() * 20) + 1;
let score = 20;
let highScore = 0;

//====DRY PRINCIPLE FOR MORE READABLE CODE=====
//uses for dry code principle
//get rid of dublicate code and more readable
const displayMessage = function (message) {
  document.querySelector('.message').textContent = message;
};

//======Even handling for check button=======
document.querySelector('.check').addEventListener('click', function () {
  const guess = Number(document.querySelector('.guess').value); //input values by default it would be in string we need to convert string into number

  //when there's no input
  if (!guess) {
    displayMessage('⛔ No Number!');
  }
  //when guess is correct
  else if (guess === SecretNumber) {
    displayMessage('🎉 Correct Answer!');
    document.querySelector('.number').textContent = SecretNumber;
    document.querySelector('body').style.backgroundColor = '#60b347';
    document.querySelector('.number').style.width = '30rem';

    //High Score
    if (score > highScore) {
      highScore = score;
      document.querySelector('.highscore').textContent = highScore;
    }
  }

  //when guess is Wrong
  else if (guess !== SecretNumber) {
    if (score > 1) {
      displayMessage(guess > SecretNumber ? '📈 Too High!' : '📉 Too Low!');
      score--;
      document.querySelector('.score').textContent = score;
    } else {
      displayMessage('😔 You Lost The Game!');
      document.querySelector('.score').textContent = score = 0;
      document.querySelector('body').style.backgroundColor = '#ff0808';
    }
  }
});

//==========Reset The Game (Again)=========
document.querySelector('.again').addEventListener('click', function () {
  score = 20;
  SecretNumber = Math.trunc(Math.random() * 20) + 1;

  displayMessage('Start Guessing!');
  document.querySelector('.score').textContent = score;
  document.querySelector('.number').textContent = '?';
  document.querySelector('.guess').value = '';
  document.querySelector('body').style.backgroundColor = '#222';
  document.querySelector('.number').style.width = '15rem';
});
