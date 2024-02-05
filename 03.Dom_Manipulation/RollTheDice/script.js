'use strict';
/*
HINTS:
And One moreThing using getElementById is faster than normal querySelector
Another Way of Writing queries for ID
const score = document.getElementById('score--0');
same as class and html and elements also
document.getElementsByClassName(); //for class
document.getElementsByName(); //normal html element nae=me
document.getElementsByTagName()//tagname
*/

//selecting Elements
//these are global variables
const player0El = document.querySelector('.player--0');
const player1El = document.querySelector('.player--1');
const score0El = document.querySelector('#score--0');
const score1El = document.querySelector('#score--1');
const diceEl = document.querySelector('.dice');
const btnNew = document.querySelector('.btn--new');
const btnRoll = document.querySelector('.btn--roll');
const btnHold = document.querySelector('.btn--hold');
const current0El = document.getElementById('current--0');
const current1El = document.getElementById('current--1');

/*
//Starting Condition
//set Score as 0 to Both Players
//HINTS: now we are assign number but javascript automatically covert string to page whatever we write
score0El.textContent = 0;
score1El.textContent = 0;
//hints: using classList object and it's method we never use . at starting point of class selector
//most of the beginners do this mistake
diceEl.classList.add('hidden'); //make dice as invisible

//Current Score
const scores = [0, 0];
let currentScore = 0; //let variable we are using bcas we keep updating
let activePlayer = 0;
let playing = true;
*/

let currentScore, scores, activePlayer, playing; //assinging in outside declare in scope

//initilazation
const init = function () {
  scores = [0, 0];
  currentScore = 0;
  activePlayer = 0;
  playing = true;

  current0El.textContent = 0;
  current1El.textContent = 0;
  score0El.textContent = 0;
  score1El.textContent = 0;

  diceEl.classList.add('hidden');
  player0El.classList.remove('player--winner');
  player1El.classList.remove('player--winner');
  player0El.classList.add('player--active');
  player1El.classList.remove('player--active');
};

init();

//DRY Priciple
//we using switch player in many places so instead of writing many times we can simply put it into function then call the function
const switchPlayer = function () {
  document.getElementById(`current--${activePlayer}`).textContent = 0;
  currentScore = 0;
  activePlayer = activePlayer === 0 ? 1 : 0;
  player0El.classList.toggle('player--active');
  player1El.classList.toggle('player--active');
};

//===========ROLL DICE BUTTON===================
//Rolling Dice Functionality
//Event handling when we click roll Button
btnRoll.addEventListener('click', function () {
  if (playing) {
    //boolen is true
    //1.Generating Random Dice Roll
    const dice = Math.trunc(Math.random() * 6) + 1;
    //just showing random number in console for reference
    // console.log(dice);

    //2.Display The Dice
    diceEl.classList.remove('hidden');
    //showing dice img . inside the dice is local variable dice it will show dice pic in random number manner
    diceEl.src = `dice-${dice}.png`; //it will show dice img based on dice elements random number

    //3.Check for Rolled 1:if it's true switch to next player
    if (dice !== 1) {
      //Add to current score
      currentScore += dice; //ex 0+2(dice)=>2 2 +4=>6 so on
      //dynamically changed which is active player
      document.getElementById(`current--${activePlayer}`).textContent =
        currentScore;
      // current0El.textContent = currentScore; //Change later because we set current score only for activeplayer
    } else {
      //switch to the Next player

      //calling Switch player Function
      switchPlayer();
      /*
    //current score set to zero befor player switch because program execute line by line
    //if that's player1 then reset player1 score to 0
    document.getElementById(`current--${activePlayer}`).textContent = 0;
    currentScore = 0;
    //re-assigning active player if player is zero then activeplayerbacome 1 if not then active player is zero
    activePlayer = activePlayer === 0 ? 1 : 0; //change player to 1 then move to if statement part again if false then player 1 to player 0

    //switching background
    //toggle is super method in previously we did  that in manualy using contain()method add and remove but toggle it will automaticaly do this
    //for us if remove it will add if add it will remove
    player0El.classList.toggle('player--active');
    player1El.classList.toggle('player--active');
    */
    }
  }
});

//===========HOLD BUTTON===================
//Add EventListener to Button Hold
btnHold.addEventListener('click', function () {
  if (playing) {
    //1.add current score to active player's score
    scores[activePlayer] += currentScore;
    //scors[1]=scores[1]+currentScore;
    document.getElementById(`score--${activePlayer}`).textContent =
      scores[activePlayer];
    //2.check if player score's score is >=100
    if (scores[activePlayer] >= 100) {
      playing = false;
      diceEl.classList.add('hidden');
      btnRoll.classList.add('hidden');
      btnHold.classList.add('hidden');
      btnNew.style.top = '25rem'; //new game button become center with animation .new--btn :transtion :1s ease all
      //Finish The Game
      document
        .querySelector(`.player--${activePlayer}`)
        .classList.add('player--winner');
      document
        .querySelector(`.player--${activePlayer}`)
        .classList.remove('player--active');
    } else {
      //3.Switch to the Next player
      switchPlayer();
    }
  }
});

//==========RESET THE GAME=============
btnNew.addEventListener('click', function () {
  //calling init function
  init();
  btnRoll.classList.remove('hidden');
  btnHold.classList.remove('hidden');
  btnNew.style.top = '4rem'; //back to normal position (new game btn)
  /*
  //we have a lot of code so we put it into function
  current0El.textContent = 0;
  current1El.textContent = 0;
  score0El.textContent = 0;
  score1El.textContent = 0;

  //we don't know which one is winner so i'd better remove both class
  player0El.classList.remove('player--winner');
  player1El.classList.remove('player--winner');
  //if reset player 1 is active player
  player0El.classList.add('player--active');
  //though we set player 1 is active player but still we remove it it's better to keep that it won't give any error
  player1El.classList.remove('player--active');
  */
});
