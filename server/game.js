let {Player} = require('./models/player.js');
let cardArray = [];
let removedCardsArray = [];
let allPlayers = [];
const server = require('./server.js');

function startgame(players, playerNames){
  initalizeCardArray();
  removeCardsBeforeGame(players);
  createPlayers(players, playerNames);
  distributeCards(players);
  startBidding(players);
}

function removeCardsBeforeGame(players) {
  let cardsTobeRemoved = 52 % players;
  while(cardArray.length >= 52-cardsTobeRemoved){
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
}

function initalizeCardArray(){
  for(let i=1; i<=52; i++){
    cardArray.push(i);
  }
}

function cardExistsInDeck(card){
  for(let i=0; i<cardArray.length; i++){
    if(cardArray[i]==card)
    return true;
  }
  return false;
}

function createPlayers(players, playerNames){
  for(let i=0; i<=players; i++){
    allPlayers.push(new Player(playerNames[i]));
  }
}

function istributeCards(players){
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
}

function startBidding(players) {
  let randomPlayer = Math.round(Math.random()*players);

}

module.exports = {
  startgame: startgame
}
