'use strict';

///////////////////////////////////////
// Modal window

const modal = document.querySelector('.modal');
const overlay = document.querySelector('.overlay');
const btnCloseModal = document.querySelector('.btn--close-modal');
const btnsOpenModal = document.querySelectorAll('.btn--show-modal');
const btnScrollTo = document.querySelector('.btn--scroll-to');
const section1 = document.querySelector('#section--1');
const nav = document.querySelector('.nav');
const tabs = document.querySelectorAll('.operations__tab');
const tabsContainer = document.querySelector('.operations__tab-container'); //common element(parent)
const tabsContent = document.querySelectorAll('.operations__content');

const openModal = function () {
  modal.classList.remove('hidden');
  overlay.classList.remove('hidden');
};

const closeModal = function () {
  modal.classList.add('hidden');
  overlay.classList.add('hidden');
};

for (let i = 0; i < btnsOpenModal.length; i++)
  btnsOpenModal[i].addEventListener('click', openModal);

btnCloseModal.addEventListener('click', closeModal);
overlay.addEventListener('click', closeModal);

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
    closeModal();
  }
});

//========Smooth Scrolling==========
//HINTS: all the explanation about the smooth scroll in below the page ,it's just final version of the snipet
/////////////////////////////////////////////////////////////////////
//-----button scroll-----
btnScrollTo.addEventListener('click', function (e) {
  ///////////////////////////////////////////
  //1st way of doing that old school method
  // const s1coords = section1.getBoundingClientRect();
  // console.log(s1coords);
  // console.log(e.target.getBoundingClientRect());
  // console.log('curren Scroll(x/y)', window.pageXOffset, window.pageYOffset);
  // console.log(
  //   'Heigt/Width Viewport',
  //   document.documentElement.clientHeight,
  //   document.documentElement.clientWidth
  // );
  //////////////////////////////////////////
  //2nd way and it work only in modern browser
  section1.scrollIntoView({ behavior: 'smooth' });
});

////////////////////////////////////////////////////////////////////

//=======Event Deligation:Implementing page Navigation=========
//==========page navigation===========
// document.querySelectorAll('.nav__link'); //so this will return a node list, now we can use forEach loop  in order to attach an event handler each of the elements that are in the node list
/*
document.querySelectorAll('.nav__link').forEach(function (el) {
  //el:element to access current element from node list
  //now we have callback function inside another callback function that's not a problem at all
  el.addEventListener('click', function (e) {
    //e:event
    e.preventDefault(); //avoid reload
    // console.log('LINK');
    const id = this.getAttribute('href'); //this is relative url which given href in html document
    console.log(id); //#secxtion--1  #section--3 based on click in nav bar
    document.querySelector(id).scrollIntoView({ behavior: 'smooth' }); //work fine but it's not efficient.
    //HINTS: this solution perfect not a problem because we have only 3 elements suppose we have 1000 or 10,000 element it will effectivily creating 10000 copies  of this same function  so it will certainly impact performance and it's clearly not a good solution,the better solution without doubts, in order to avoid that we can use events deligation
  });
});
*/
//--------implementing events deligation-------------
//HINTS:Event Deligation need two steps
//we need to add the event listeners to common parent element of all the elements that we're interested in
//-->(1)Add event listeners to common Parent Element
//-->(2)Determaine what element originated the event
document.querySelector('.nav__links').addEventListener('click', function (e) {
  e.preventDefault();
  // console.log(e.target); //figure out where actually  evdnt happended
  //Matching strategy
  if (e.target.classList.contains('nav__link')) {
    // const id = this.getAttribute('href'); //now href attributes not in this but it is no the element that was clicked
    const id = e.target.getAttribute('href');
    // console.log(id);
    document.querySelector(id).scrollIntoView({ behavior: 'smooth' });
  }
});
//=======Building Tabbed Component=====

//t->stands fo tab
//this is bad practice if tabs have 200 tabs then we would have 200 copies of this exact call back function and it would slow down the page
// tabs.forEach(t =>
//   t.addEventListener('click', () => {
//     console.log('TAB');
//   })
// );
//attach event handler to common element which is parent element for common all the elements
tabsContainer.addEventListener('click', function (e) {
  // const clicked = e.target.parentElement; //the reason for using parent element when we click span tag it will click only span so span parent is button element but now problem when we click button button parent is container so it will clicked entire container so we use closer() method to avoid that conflict
  const clicked = e.target.closest('.operations__tab'); //now we click either span or button it will work fine
  // console.log(clicked);
  //fix that null exception (ignore that error)
  //basically click other areas which is not a closest parents
  //Guard clause
  if (!clicked) {
    return;
  }
  //Remove active classes both taps and content areas
  tabs.forEach(t => t.classList.remove('operations__tab--active')); //al of them removed this class
  clicked.classList.add('operations__tab--active');
  //
  //nodelist(queryselctorAll)
  tabsContent.forEach(t => t.classList.remove('operations__content--active'));

  //Active Tab
  //Activate Content Area
  // console.log(clicked.dataset.tab);
  document
    .querySelector(`.operations__content--${clicked.dataset.tab}`)
    .classList.add('operations__content--active');
});
//menu Fade Animation
//Refactoring our code we use this logic again and again we againt of DRY Principle
const handleOver = function (e) {
  //(e,opacity)
  // console.log(this, e.target);
  if (e.target.classList.contains('nav__link')) {
    const link = e.target;
    const sibling = link.closest('.nav').querySelectorAll('.nav__link');
    const logo = link.closest('.nav').querySelector('img');
    sibling.forEach(el => {
      if (el !== link) {
        el.style.opacity = this; //opacity
      }
    });
    logo.style.opacity = this; //opacity
  }
};
//passing "Argument(this is not a arugment)" into handler
nav.addEventListener('mouseover', handleOver.bind(0.5));
nav.addEventListener('mouseout', handleOver.bind(1)); //bind return a new function

//=========Sticky Navigation============
//working with scroll event
/*
const intialCoords = section1.getBoundingClientRect();
console.log(intialCoords); //getting current values of top (which mean getting exact position of section 1  where starts)
window.addEventListener('scroll', function () {
  console.log(window.scrollY); //this is window object not an event object
  if (window.scrollY > intialCoords.top) nav.classList.add('sticky');
  else nav.classList.remove('sticky');
});
*/

//======Sticky Navigation :Intersection Observer API========
//why we use it ,how it will help us?
//ans is : This API Allows us to code to basically observe changes to the way that a certain target element intersects another elemet, or other it intersects the viewport
/*
const obsCallback = function (entires, observer) {
  entires.forEach(entires => {
    console.log(entires);
  });
};
const obsOption = {
  root: null,
  threshold: [0, 0.2],
}; //object
const observer = new IntersectionObserver(obsCallback, obsOption); //this need callback function and options(object ) actually we can pass callback and options object both them paramter but it will bit confusing so i wrote it separately
observer.observe(section1); //we need to pass target element which is section 1
*/

const header = document.querySelector('.header');
// 90px height calculate dynamicaly because we can't say that always happen in 90px suppose we are developing in responsive site it will differ so in order to calculate manualy we give that work to viewport no matter how large or how small viewport is it will calculate automatically(dynamically)
const navHeight = nav.getBoundingClientRect().height;
// console.log(navHeight);
const stickyNav = function (entires) {
  const [entry] = entires;
  // console.log(entry);
  //isIntersecting propery avaible in IntersectionObserver objects
  if (!entry.isIntersecting) {
    nav.classList.add('sticky');
  } else {
    nav.classList.remove('sticky');
  }
};
const headerObserver = new IntersectionObserver(stickyNav, {
  root: null,
  threshold: 0,
  //90 is height of navigation
  //HINTs:pecentage and rem won't work in rootMargin we have to given in String
  // rootMargin: '-90px', //example is a box of 90 px that will be applied outside of our target element
  rootMargin: `-${navHeight}px`,
});
headerObserver.observe(header);

//========Revealing Elements on Scroll==========
const allSection = document.querySelectorAll('.section');
//callback for interSection
const revealSection = function (entries, observer) {
  //logic
  const [entry] = entries;
  // console.log(entry);
  // if (entry.isIntersecting) {
  //   entry.target.classList.remove('section--hidden');
  // }
  if (!entry.isIntersecting) return;
  entry.target.classList.remove('section--hidden');
  //we need to stop obser which is alread we did that work so again it won't observer
  //simple when we finish our work(observer) it won't observe again so we need to tell them don't observe again
  observer.unobserve(entry.target);
};
const sectionObserver = new IntersectionObserver(revealSection, {
  root: null,
  threshold: 0.15, //starting point ,0.15->15% section is revealed when it's 15%
}); //call back and options
//loop over nodelist(allSection)
allSection.forEach(function (section) {
  sectionObserver.observe(section);
  // section.classList.add('section--hidden');
});

//========lazy loading Images========
const imgTarget = document.querySelectorAll('img[data-src]'); //selecting img tags which has this data attribute
// console.log(imgTarget);

//call back function
const loadImg = function (entries, observer) {
  //we have only one threshold
  const [entry] = entries;
  // console.log(entry);

  if (!entry.isIntersecting) return;
  //replace src with data-src
  entry.target.src = entry.target.dataset.src;
  //remove lazy-img
  // entry.target.classList.remove('lazy-img');//it's best only remove if page loaded so we give it to load event handling
  //load event
  entry.target.addEventListener('load', function () {
    entry.target.classList.remove('lazy-img');
  });
  //we need to stop observer once already it did
  observer.unobserve(entry.target);
};
const imgObserver = new IntersectionObserver(loadImg, {
  root: null, //set root to entire view port
  threshold: 0, //threshold starting point is zero
  rootMargin: '200px',
});
imgTarget.forEach(img => imgObserver.observe(img));
// ===========Building a Slider Component===========
//slides is now nodelist (in node list we can do some actions like array )
const slider = function () {
  const slides = document.querySelectorAll('.slide');
  //selecting two slider buttons
  const btnLeft = document.querySelector('.slider__btn--left');
  const btnRight = document.querySelector('.slider__btn--right');
  const dotContainer = document.querySelector('.dots');

  //current slide
  let curSlide = 0;
  //Javscript doesn't know how many slides we have it will calculate continiously we need to tell total length of the slide
  let maxSlide = slides.length - 1; //4 ->0,1,2,3 we need max lenth is 3 not 4 in order to get last size we minus from total length
  //just scale the slider for view for easy manipulation(temparray) because images slide is big
  const slider = document.querySelector('.slider');
  //---this scale or translateX these reference purpose it's not actual manipulation---
  // slider.style.transform = 'scale(0.4) translateX(-800px)';
  // //show all the slider visilbe we need to enable slider overflow
  // slider.style.overflow = 'visible';

  //s->slides
  //i->index

  // slides.forEach((s, i) => {
  //   s.style.transform = `translateX(${100 * i}%)`; //mutiply by currend index
  //   //first slide should be in 0%,2nd 100% ,3rd 200% and 3rd 300%,
  // });

  //------working for dots(slider)--------
  //Functions //we put it altogether in single functions

  const createDots = function () {
    //_ (variable)this is conventional which is that variable we don't need that in our logic so we just give _
    //i-> current index
    slides.forEach(function (_, i) {
      dotContainer.insertAdjacentHTML(
        'beforeend',
        `<button class="dots__dot" data-slide="${i}"></button>`
      );
    });
  };
  // createDots(); //call this function

  //-----create active slide dot--------
  //slide->current slide
  const activateDot = function (slide) {
    document.querySelectorAll('.dots__dot').forEach(dot => {
      dot.classList.remove('dots__dot--active');
    });
    //how do we select that active one? ans is again we're going to use data attribute because we do that based on data attribute
    document
      .querySelector(`.dots__dot[data-slide="${slide}"]`)
      .classList.add('dots__dot--active');
  };

  //Default we set activate slide as 0th index (zero)
  // activateDot(0);
  //--refactor(we do refactor when something we do again and again it's easy to understand and optimize our code and our program will perforame more)----
  const goToSlide = function (slide) {
    slides.forEach((s, i) => {
      s.style.transform = `translateX(${100 * (i - slide)}%)`;
    });
  };
  // goToSlide(0); //once it's finish his last length again it will move to zero
  //-----next slide-------
  const nextSlide = function () {
    if (curSlide === maxSlide) {
      //if max slide is attain it's maxlength then we need to update zero to curslide if not then increase by one
      curSlide = 0;
    } else {
      curSlide++;
    }
    goToSlide(curSlide);
    activateDot(curSlide);
  };
  const prevSlide = function () {
    if (curSlide == 0) {
      curSlide = maxSlide;
    } else {
      curSlide--;
    }
    goToSlide(curSlide);
    activateDot(curSlide);
  };
  //now we're going to put all the function that we create previously we put it in single function and we set that function name is init(initialization)
  const init = function () {
    goToSlide(0);
    createDots();
    activateDot(0);
  };

  init();

  //-----------Event Handlers-----------
  btnRight.addEventListener('click', nextSlide);
  btnLeft.addEventListener('click', prevSlide);

  //-----Add event handler to keyboard events------
  //we can move slides using keyboard arrows left, right
  document.addEventListener('keydown', function (e) {
    // console.log(e);
    //traditional conditional statement
    if (e.key === 'ArrowLeft') prevSlide();
    //this one is shortcircuting (it will work only it's true same as traditional if else statement)
    e.key === 'ArrowRight' && nextSlide();
  });
  //---Event Handler or Event listener for dots---

  //-----Working with dots------
  //now we're going to use event deligation instead of handling event all the children we 're going to handle to common parent
  dotContainer.addEventListener('click', function (e) {
    //this target mean -> it will work when we click dot if we click otherside it won't work
    if (e.target.classList.contains('dots__dot')) {
      // const slide = e.target.dataset.slide;
      //destructuring
      const { slide } = e.target.dataset; //dataset contain all the custome dataset attribute values(data-slide=0,data-slide=1 so on... in HTML)
      goToSlide(slide);
      activateDot(slide);
    }
  });
};
slider(); //call the function
//----whole block has been refactured by me-----
// btnRight.addEventListener(
//   'click',
// function () {
//--again we refactor this code(we create separate function)----
// if (curSlide === maxSlide) {
//   //if max slide is attain it's maxlength then we need to update zero to curslide if not then increase by one
//   curSlide = 0;
// } else {
//   curSlide++;
// }
//---comment it out we did this in (refactor)---
// slides.forEach((s, i) => {
//   s.style.transform = `translateX(${100 * (i - curSlide)}%)`;
// });
//Example 1st index is 0 so 0 - (-1) => -1*100=>-100
//2nd index is 1 so 1-1 =>0 *100=>0 so on...

// goToSlide(curSlide);
// }
// );

//curslide =>1 :-100%, 0%, 100%, 200%
//////////////////////////////////////////////////////
// nav.addEventListener('mouseover', function (e) {
//   handleOver(e, 0.5);
// });
// nav.addEventListener('mouseout', function (e) {
//   handleOver(e, 1);
// });
// nav.addEventListener('mouseover', function (e) {
//=====Before Refactor=====
// if (e.target.classList.contains('nav__link')) {
//   const link = e.target;
//   const sibling = link.closest('.nav').querySelectorAll('.nav__link');
//   const logo = link.closest('.nav').querySelector('img');
//   sibling.forEach(el => {
//     if (el !== link) {
//       el.style.opacity = 0.5;
//     }
//   });
//   logo.style.opacity = 0.5;
// }
// });

//oppostie of mouseover is mouseout(undo)
// nav.addEventListener('mouseout', function (e) {
// if (e.target.classList.contains('nav__link')) {
//   const link = e.target;
//   const sibling = link.closest('.nav').querySelectorAll('.nav__link');
//   const logo = link.closest('.nav').querySelector('img');
//   sibling.forEach(el => {
//     if (el !== link) {
//       el.style.opacity = 1;
//     }
//   });
//   logo.style.opacity = 1;
// }
// });

//===========ADVANCE DOM==============
//-------Selecting,creating and deleting elements Programatically-------
/*

//!Selecting Elements
//document is not a real dom element,for example to if we want to style entire page we need to select documentelement
console.log(document.documentElement); //entire html
console.log(document.head); //head
console.log(document.body); //body also entire visible document
//HINTS: these special elements we don't need to write any selectors otherwise we need to specify selector(query selector so on)
const header = document.querySelector('.header'); //specifiy element but if we want to select multiple elements we can use  querySelectorAll
const allSelection = document.querySelectorAll('.section'); //in our HTML we have mulitple elements with section class
console.log(allSelection); //Node list if we delete one node it won't be update automatically ,because this variable was created by the time that this section still existed and it didn't update itself
//HINTS:These querySelectors not only avaiable in document these are also available in child elements
document.getElementById('section--1');
const allButtons = document.getElementsByTagName('button'); //HTML Collection if we delete any button it will automatically update
console.log(allButtons);
console.log(document.getElementsByClassName('btn')); //just like byId and this is also life html collection it will update automaticaly when we delete from dom

//!Creating and Inserting Elements
//we can create HTML elements using the insert adjacent HTML function
// .insertAdjecentHTML; this is easy way of creating and inserting elements
// document.classList.add now message.classList.add()
const message = document.createElement('div'); //it will return dom element so we need to store that into variable
// HINTS: now message(varible) also represent dom object like document.querySelector now we use message.querySelector
message.classList.add('cookie-message'); //add class for our div(message)
//add text to the element
// message.textContent = 'we use cookied for improve functinality and analytics.'; //this is simple add text to our element
//but ofcourse,we can  insert a html
message.innerHTML =
  'we use cookied for improve functinality and analytics. <button class="btn btn--close-cookie">Got it!<button>';
// HINTS:textConeten and innerHTML we use both of these properites  to read and set content
//inset this element to header
header.prepend(message);
//HINTS:prepent() ->prepending basically adds element as first child of this(header) element and we can also add child as last that's called append()
// header.append(message); //now it's become last child
//HINTS: this (message) element only insert at once,because this element here indeed a life element living in the dom so it can't be multiple places at same time
//we can use prepand and append method not only to insert element but also move them and again dom element is unique so it can always exist only one place at a time
//WAHT IF ,IF we want to insert multiple copies of same element?
//in this case we first would have copy the first element
//Example
// header.append(message.cloneNode(true)); //true mean all the child elements will also be copied
header.append(message);
//and two more method available called before and after
//---before and after------
// header.before(message); //before the header element
header.after(message); //after the header element

//!Deleting the Elements
//remove the elements from dom
document
  .querySelector('.btn--close-cookie')
  .addEventListener('click', function () {
    // document.querySelector('.cookie-message').remove(); it will work also but we store this message (cookie-message)
    //we can use message variable it also in memory but we can use fully both are work same but we already store in message(variable)
    // message.remove(); //this is recent feature in javascript,back then we had to select parent element first and remove child element from there
    //Example
    message.parentElement.removeChild(message); //removeChild(name of the element that we want to delete)
  });

//-------Styles,Attributs and classes-------
//=====Styles====
//HINTS: These styles are inline style it happen in html style attribute
// document.querySelector('.cookie-message').style.backgroundColor = 'red';
message.style.backgroundColor = '#37383d';
message.style.width = '120%';

//Read styles
//we can read style only if we do it manualy if we didn't or define values  we can't read that propery values
//Example
console.log(message.style.width); //120%
console.log(message.style.height); //not showing anything in console
console.log(message.style.backgroundColor); //we can read the style because background we set it manualy
//we can get all the styles that apply our project and we can get specific style also
console.log(getComputedStyle(message)); //it gives give property and values that apply our project and we can get specific
console.log(getComputedStyle(message).color); //getting color propery and values only
console.log(getComputedStyle(message).height); //getting height propery it give values even if not applied in css
//just expreimental just increase the height
//HINTS: All the styles object and properties are String type if we want to add or style something we need to type cast number then only we get expected result

message.style.height =
  Number.parseFloat(getComputedStyle(message).height, 10) + 30 + 'px';
//"base 10" because it uses ten symbols to represent numbers: 0, 1, 2, 3, 4, 5, 6, 7, 8, and 9.
console.log(getComputedStyle(message).height);

//------CSS Custome Properties------
//Work with css custom properties which mean called css variables
//root object(document)
document.documentElement.style.setProperty('--color-primary', 'orangered'); //the reason for we use this we can't always style all the properties so we need to use sometimes
//HINTS:for the custom properties we can do it in this way
//the way for not possible message.style.color="orangered" just for example
//but we can do it for custome variable -> document.documentElement.style.setProperty('--color-primary', 'orangered');
// document.documentElement.style.setProperty()//we can do all the properties whatever we want to change

//=====Attribute====
//In HTML All of them are attributes example id,class,src,widht,height,href,name,value,border,color,etc....
//In javascript we can ofcourse we can change the different attributes also
const logo = document.querySelector('.nav__logo');
console.log(logo.alt);
console.log(logo.className);
console.log(logo.src);
//setAttribute values ->we can set attributes values also
logo.alt = 'Mimalist log'; //this is also changed in html
console.log(logo.alt); //now it will print Mimalist log

//we can't access non-standard proeprties which is not avaiable for the attributes
// console.log(logo.desinger); //non-standard property but it's possible to read non-standard attributes
// console.log(logo.getAttribute('designer')); //saravanan now i remove that it will give output as null
//we can setAttibutes also which is not standard attributes in html
console.log(logo.setAttribute('company', 'bankist')); //new attributes crated in html

//Absolute URL and Relative URL
//---Absolute URL-----
//besically it comes from browser it shows browser url
//like -> http://127.0.0.1:5500/09.Advance_DOM_Bankist/img/logo.png
//---Relative URL-----
//besically it comes from Folder.
//example ->img/logo.png" it relative to the folder in which the index.html file is located

//usualy we get Absolute url when we use message.src(absolute url)from browser
//but we want to exactly relative url then we can use getpropery
//HINTS:sometimes we need relative one so we use this method(property) and also we can get reltive link
console.log(logo.getAttribute('src')); //"img/logo.png"
const link = document.querySelector('.twitter-link');
console.log(link.href); //absolute url->https://twitter.com/jonasschmedtman
console.log(link.getAttribute('href')); //relative url->https://twitter.com/jonasschmedtman
//HINTS: in this case both of them are absoute url because (http) mean browser but sometimems we use manual link set for html like #id in this suitvation it might very usefull

const link1 = document.querySelector('.nav__link--btn');
console.log(link1.href); //absolute url->http://127.0.0.1:5500/09.Advance_DOM_Bankist/index.html#
console.log(link1.getAttribute('href')); //relative url -># as we wrote in html file

//----Date Attibute----
//Date Attribute is special kind of attributes that start with words data
console.log(logo.dataset.versionNumber); //3.0
//these special type of attributes always they are stored in dateset object
//HINTS:
//usually we use actually data attributes quite a lot when we work with UI and especially when we need to store data in our user interface,

//----classes-----
//we can add multipe classes by passing multiple values
//these are fake class name in order avoid error in console because we need to pass something to the classlist
logo.classList.add('c', 'j');
logo.classList.remove('c', 'j');
logo.classList.toggle('c');
logo.classList.contains('c');

//?don't use this method to add class attribute values
//we can do this but recommended don't use this this is worst way
//!because it will override all the existing classes and also it will put only one class on any element
*/
//========Smooth Scrolling==========
//we can do this in 2 way
//way-1 (old school way)
//1st one is old school method
/*
const btnScrollTo = document.querySelector('.btn--scroll-to');
const section1 = document.querySelector('#section--1');
btnScrollTo.addEventListener('click', function (e) {
  //1st way that we're gonna to do,we need to first get coordinates of the element that we want to scroll to
  //these are coordinate we need to tell javascript to scroll where we want
  const s1coords = section1.getBoundingClientRect(); //getting co-ordinates between our target position x and y
  console.log(s1coords);
  console.log(e.target.getBoundingClientRect()); //e is denoting btnScroolTo object
  console.log('curren Scroll(x/y)', window.pageXOffset, window.pageYOffset);
  console.log(
    'Heigt/Width Viewport',
    document.documentElement.clientHeight,
    document.documentElement.clientWidth
  );
  //scrolling
  //scrollTo is global function that's available for windows objects
  //current positin to Current Scroll
  // window.scrollTo(
  //   s1coords.left + window.pageXOffset,
  //   s1coords.top + window.pageYOffset
  // ); //passing left and top position because we need scroll for vertical

  //----to making animation----
  //instead of passing one  argument we can pass an object and also called behaviour propery
  // window.scrollTo({
  //   left: s1coords.left + window.pageXOffset,
  //   top: s1coords.top + window.pageYOffset,
  //   behavior: 'smooth',
  // });

  //way-2 (modern way of smooth scrolling)
  //Modern
  //HINTS: it's only work on modern browser if we want to achive this smooth scrolling then we need to manual calculated method  that we wrote previously
  section1.scrollIntoView({ behavior: 'smooth' });
});
*/
//======Types of Event and Event Handlers==========
//An Event is basically signal that is generated by a certain dom node and the signal mean something has happended
//Example a user clicking somewhere or the moving mouse or user triggering the full screen mode and really importance anything that happended in our web page generats an event

//---Mouse Enter Event----
//---------1st way----------

//mouse Enter Event is little bit like hover effect in css
// const h1 = document.querySelector('h1');
// h1.addEventListener('mouseenter', function (e) {
//   alert('addEventListener:Great! your are reading heading 😅');
// });

//-------2dn way-------------

//onevent property->these are old school method
//however this way of listening to events is bit old school
//every event have onEvents like onClick,onMouseEnter so on
//it's used to be done in old days example below it work as addEventListener()

// h1.onmouseenter = function (e) {
//   alert('addEventListener:Great! your are reading heading 😅');
// };

//HINTS:why addEventListener is better
//It allows us to add multiple event listener to same event
//And we can remove Event Handler incase we don't need it anymore
//we can add multiple event listeners to event
// const h1 = document.querySelector('h1');

// h1.addEventListener('mouseenter', function (e) {
//   alert('addEventListener:Great! your are reading heading 😅');
// });

// h1.addEventListener('mouseenter', function () {
//   h1.style.color = 'green';
// });

//if we want to remove event listerner to event we need to export the function to a named function because we can't just write a same function to expect to work
// const h1 = document.querySelector('h1');
// h1.addEventListener('mouseenter', function (e) {
//   alert('addEventListener:Great! your are reading heading 😅');
// });

//---create as named function----
/*
const alertH1 = function (e) {
  alert('addEventListener:Great! your are reading heading 😅');
};
h1.addEventListener('mouseenter', alertH1);

//once it happened(after listened for the event) we need to remove that event listerner
// h1.removeEventListener('mouseenter', alertH1); //once it listened it won't again listen to the event(alert pop up menu won't show)

//whenever we want listen only once then we can use this function and we can give certain time to diable the event
setTimeout(() => h1.removeEventListener('mouseenter', alertH1), 3000); //it won't work after 3 seconds

//---3rd way of handling event-----

//thired way of handling events,which is by using an html attribute.
//We simply define it directly in HTML
//but this not to be used but sake for the curiosity
// already see that in many website tutorial like example below
//<p onmouseover="mouseoverevent()"> Keep cursor over me</p>
//<input type="button" onclick="clickevent()" value="Who's this?"/>
//HINTS: this is also old school of handling event in javascript early days
<h1 onclick="alert('IN HTML')"></h1> 

//==========Event Propagation:Bubbling and Capturing===========
//Javascript Event have very important property
//They have a so-called capturing phase and bubbling phase
//What does that mean?

*/
//===Bubbling phase=====
//rgb(255,255,255)
/*
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1) + min);
const randomColor = () =>
  `rgb(${randomInt(0, 255)},${randomInt(0, 255)},${randomInt(0, 255)})`;
console.log(randomColor(0, 255));

document.querySelector('.nav__link').addEventListener('click', function (e) {
  // this=>always point which event handler is attached
  this.style.backgroundColor = randomColor(); //
  console.log('LINKS', e.target, e.currentTarget);
  console.log(e.currentTarget === this); //true (this denoting current object .nav_link)
  //e.target->it's not current element targeted instead it will show that document page(	Element that originally triggered the event)
  //e.currentTarget->it's current element which is event handled(Element with the event listener attached)
  //HINTS: we can stop Event Propagation(spread)
  //Stop Propagation

  // e.stopPropagation();

  //now their parent elements don't change their background color
  //which means that event never arived at those element so this event never reach their parent element
  //HINTS:Stopping Propagation not a good practice but if we want sometimes we can use it but never do this always do only if you need
  //Reason to stop propagation sometimes fix problemns in some complex applications with many handlers for the same events but general is not a good idea to stop propagation of events
});
//if you don't understand then look at this below
// const childLink = document.querySelector('.nav__link');
// childLink.addEventListener('click', function (e) {
//   childLink.style.backgroundColor = randomColor(); //this how we did it in previously using(this) keyword now we store in separate variable that variable also attaced with .nav__link we use directly this keyword to denote .nav_links thats all
// });

document.querySelector('.nav__links').addEventListener('click', function (e) {
  this.style.backgroundColor = randomColor();
  console.log('CONTAINER', e.target, e.currentTarget);
});
// document.querySelector('.nav').addEventListener('click', function (e) {
//   this.style.backgroundColor = randomColor();
//   console.log('NAV', e.target, e.currentTarget);
// });

//HINTS:
// =====Capture Phase======
//as we learn events are caputured when they come down from the document route all the way to target but our event handlers are not picking up these events during the capture phase
//addEventLister its only listening for events in bubbling phase but not in capturing phase. so that's default behaviour of addEventListenr method and reason for that the capturing phase is usually irrelevent for us
//it's just not useful in other hand bubbling phase is really usefull for something called event deligation
//However if we really want to catch events during the capturing phase we can define thired parameter in addEventListner function
//eXample
document.querySelector('.nav').addEventListener(
  'click',
  function (e) {
    this.style.backgroundColor = randomColor();
    console.log('NAV', e.target, e.currentTarget);
  },
  true //and default is set to false
); //now the event handler no longer to listen bubbling events but istead capturing events

//HINTS:
//Capture phase ->dom traverse top to bottom
//Bubble phase->traverse bottom to top
//but both are working with same event but they're simply doing it different phases of event propagations
//and onemore thing caputuring used rarely in nowadays
*/
//=======DOM Traversing=========

/*
const h1 = document.querySelector('h1');

//------Going downwards:child element------
//HINS:querySelector also work on elements
console.log(h1.querySelectorAll('.highlight')); //selecting all the elements with the highlight class that are children of the h1 element.
//sometimes all we need are actually direct children
console.log(h1.childNodes); //it shows all the nodes in the h1
console.log(h1.children); //it gives html collection we get only elements (span,div or br) that are inside the h1 element(parent) and this is only work for direct children
//HINTS: we can get first and last child from parent and it names says all
h1.firstElementChild.style.color = 'white'; //changing color for first child
h1.lastElementChild.style.color = 'orangered'; //changing color for last child

//------Going upwards:Parents element------
console.log(h1.parentNode); //this h1 is inside of parent of header_title class
console.log(h1.parentElement);

//closet method
//closet method recives a query string just like a querySelector or querySelectorAll
//this closet method we use of the time when we use event deligation
h1.closest('.header').style.background = 'var(--gradient-secondary)';
h1.closest('h1').style.background = 'var(--gradient-primary)'; //now h1 closet element h1(itself)
//HINTS:closet is basically opposite of querySelector so both recives a query String as an input
//! querySelector ->finds the children no matter how deep in the dom tree
//! while, the closet method finds the parents and also no matter how far in the dom tree

//------Going sideways:Siblings element------
console.log(h1.previousElementSibling); //previous is only parent element so it will give null
console.log(h1.nextElementSibling); //h4

//Node
console.log(h1.previousSibling);
console.log(h1.nextSibling);

//if we want all the sibling not previor or next

// console.log(h1.parentElement); //direct parent element so we get all the childrens
// console.log(h1.parentElement.children); //and it will give html collection not an array
// //html collection list but it's not an array but it can iterable that we can spread into an array
// [...h1.parentElement.children].forEach(function (el) {
//   //change some style to all the sibiling except the element itself
//   //h1 is original element we want to change style all the siblings except the h1
//   if (el !== h1) {
//     el.style.transform = 'scale(0.5)'; // 0.5=>50% smaller 1 ->100%
//   }
// });

//HINTS:We need DOM Traversal many times esspcialy we 're working with event deligations

*/

//============Life Cycle DOM Events=========
/*
document.addEventListener('DOMContentLoaded', function (e) {
  console.log('HTML Parsed and DOM tree buil!', e);
});
//load event
//load event fired by the window as soon as not only the html is parsed,but also all the images and resources and external resorces like css also files are loaded
//when basicaly complete event loaded this event get fired
window.addEventListener('load', function (e) {
  console.log('Page fully loaded', e);
});
*/

//unload event
//unload event also gired on window
//this event here is immidiately before a user is about the leave the page
//for example user want to close the page we need to ask them to 100% sure to close the tap

//HINTS: nowadays no one use this event many of them complaints and we can't chage messge it always show default browser message
// also it annoying users if we often asking to pop up they'll annoying
// window.addEventListener('beforeunload', function (e) {
//   e.preventDefault(); //HINTS: in chrome is not neccsessary,but some browser require it
//   console.log(e);
//   //return value
//   e.returnValue = ''; //we get popup windows if we want to close this page
// });

//HINS: we aks only if user writing blog or filling form in this case data might have been lost  by accident we can ask this suitvation
//otherwise don't abuse the users

//========Efficient Script Loading:deeper and async======
