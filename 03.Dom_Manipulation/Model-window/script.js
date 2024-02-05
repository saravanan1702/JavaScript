'use strict';
//HINTS:
//storing every class element into separate variable, it's easy way to style instead writing
//ducument.query everytime
const modal = document.querySelector('.modal');
const overlay = document.querySelector('.overlay');
const btnCloseModal = document.querySelector('.close-modal');
// const btnsOpenModal = document.querySelector('.show-modal');//whenever we select class element it will show first of the element from html if we want to select multiple elements
//then we can use querySelectorAll() but all the class name must be same name then only it will work
const btnsOpenModal = document.querySelectorAll('.show-modal'); //selecting multiple  queries which is same class name
// console.log(btnsOpenModal); //it show in array format but it's not a array (node list)

//open model for opening
const openModal = function () {
  modal.classList.remove('hidden');
  overlay.classList.remove('hidden');
};

for (let i = 0; i < btnsOpenModal.length; i++) {
  btnsOpenModal[i].addEventListener('click', openModal);
}
//instead of writing every btn handling we can do this is for loop
/*
i comment it for reference
for (let i = 0; i < btnsOpenModal.length; i++) {
  btnsOpenModal[i].addEventListener('click', function () {
    //classList=it containns list of classes that related to the model class
    //.class element.classList.methodtype()..remove,add etc whatever we want
    console.log('Button Clicked');
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
  });
}
*/

//create function for same code Or repeated code
//we do this for close and overlay instead of wrting separately we can wrap that into function
//and call this fucntion simple method don't need to write code again and again

//function Expression
const closeModal = function () {
  modal.classList.add('hidden');
  overlay.classList.add('hidden');
};

//close the button
/*
we comments this code reference whenever we get douts about how it work 
btnCloseModal.addEventListener('click', function () {
  modal.classList.add('hidden');
  overlay.classList.add('hidden');
});

//if user click outside the overlay it would be closed so write that queries also
overlay.addEventListener('click', function () {
  modal.classList.add('hidden');
  overlay.classList.add('hidden');
});
*/
//handling button as well as passing variable which hold that values it will execute whenever we click that button
btnCloseModal.addEventListener('click', closeModal);
overlay.addEventListener('click', closeModal);

// closing model by clicking outside the modal

//how to respond to keyboard events
//keyboards events also called global event -> they don't happen for specific elements
document.addEventListener('keydown', function (e) {
  // console.log(e.key); //which key we pressed
  //if you confuse with !Operator actually it will reverse the result
  //clear logic -> if(e.key==='Escape' && !modal.classList.contain('hidden'))
  if (e.key === 'Escape') {
    if (!modal.classList.contains('hidden')) {
      closeModal(); //calling closeModal function that function contain close eventListerner
    }
  }
});
