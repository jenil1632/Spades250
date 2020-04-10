function Game() {
  this.cardArray = [];
  this.removedCardsArray = [];
  this.allPlayers = [];
  this.startgame = startgame;
}
let {Player} = require('./models/player.js');
let cardArray = [];
let removedCardsArray = [];
let allPlayers = [];

async function startgame(players, playerArray){
  return new Promise(function(resolve, reject) {
    await initalizeCardArray();
    await removeCardsBeforeGame(players);
    await createPlayers(players, playerArray);
    await distributeCards(players);
    resolve("Stuff worked!");
});
}

function removeCardsBeforeGame(players) {
  return new Promise(function(resolve, reject) {
    let cardsTobeRemoved = 52 % players;
    while(cardArray.length > 52-cardsTobeRemoved){
      let randomCard = Math.round(Math.random()*52) + 1;
      if(randomCard !== 3){
        if(cardExistsInDeck(randomCard)){
          cardArray = cardArray.filter((elem) => {
            return elem !== randomCard;
          });
          removedCardsArray.push(randomCard);
        }
      }
    }
    resolve("Stuff worked!");
});
}

function initalizeCardArray(){
  return new Promise(function(resolve, reject) {
    for(let i=1; i<=52; i++){
      cardArray.push(i);
    }
    resolve("Stuff worked!");
});
}

function cardExistsInDeck(card){
  for(let i=0; i<cardArray.length; i++){
    if(cardArray[i]==card)
    return true;
  }
  return false;
}

function createPlayers(players, playerArray){
  return new Promise(function(resolve, reject) {
    for(let i=0; i<=players; i++){
      allPlayers.push(new Player(playerArray[i].name, playerArray[i].id, playerArray[i].roomName));
    }
    resolve("Stuff worked!");
});
}

function distributeCards(players){
  return new Promise(function(resolve, reject) {
    let handLength = cardArray.length / players;
    for(let i=1; i<=players; i++){
      let count = 0;
      if(cardArray.length===handLength){
        allPlayers[i].hand = cardArray;
      }
      while(count < handLength){
        let randomCard = Math.round(Math.random()*52) + 1;
        if(cardExistsInDeck(randomCard)){
          cardArray = cardArray.filter((elem) => {
            return elem !== randomCard;
          });
          allPlayers[i].hand.push(randomCard);
          count++;
        }
      }
    }
    resolve("Stuff worked!");
});
}

function startBidding(players) {
  let randomPlayer = Math.round(Math.random()*players);
  promptBid(allPlayers[randomPlayer]);
}

module.exports = {Game};
