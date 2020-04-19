function Game() {
  this.cardArray = [];
  this.removedCardsArray = [];
  this.allPlayers = [];
  this.bid = 0;
  this.bidder = {};
  this.noChallenges = 0;
  this.gameRoom = "";
  this.teamA = new Set();
  this.teamB = new Set();
  this.trump = "";
  this.currentTurn = 0;
  this.moveCount = 0;
}
let {Player} = require('./models/player.js');
let {Card} = require('./models/card.js');

Game.prototype.startgame = function(players, playerArray) {
    this.initalizeCardArray();
    this.removeCardsBeforeGame(players);
    this.createPlayers(players, playerArray);
    this.distributeCards(players);
}

Game.prototype.removeCardsBeforeGame = function(players) {
    let cardsTobeRemoved = 52 % players;
    while(this.cardArray.length > 52-cardsTobeRemoved){
      let randomCard = Math.floor(Math.random()*52) + 1;
      if(randomCard !== 2){
        if(this.cardExistsInDeck(randomCard)){
          this.cardArray = this.cardArray.filter((elem) => {
            return elem.index !== randomCard;
          });
          this.removedCardsArray.push(randomCard);
        }
      }
}
}

Game.prototype.initalizeCardArray = function() {
    for(let i=1; i<=52; i++){
      if(i>=1 && i<=13){
        this.cardArray.push(new Card(i, i, "spade"));
      } else if(i>=14 && i<=26) {
        this.cardArray.push(new Card(i, i-13, "heart"));
      } else if(i>=27 && i<=39) {
        this.cardArray.push(new Card(i, i-26, "club"));
      } else {
        this.cardArray.push(new Card(i, i-39, "diamond"));
      }
    }
}

Game.prototype.cardExistsInDeck = function (card){
  for(let i=0; i<this.cardArray.length; i++){
    if(this.cardArray[i].index==card)
    return true;
  }
  return false;
}

Game.prototype.createPlayers = function(players, playerArray){
    for(let i=0; i<players; i++){
      this.allPlayers.push(new Player(playerArray[i].name, playerArray[i].id, playerArray[i].roomName));
    }
}

Game.prototype.distributeCards = function(players){
    let handLength = this.cardArray.length / players;
    for(let i=0; i<players; i++){
      let count = 0;
      if(this.cardArray.length===handLength){
        this.allPlayers[i].hand = this.cardArray;
        this.cardArray = [];
        return;
      }
      while(count < handLength){
        let randomCard = Math.floor(Math.random()*52) + 1;
        if(this.cardExistsInDeck(randomCard)){
          let rc = this.cardArray.find((elem)=> elem.index === randomCard);
          this.cardArray = this.cardArray.filter((elem) => {
            return elem.index !== randomCard;
          });
          this.allPlayers[i].hand.push(rc);
          count++;
        }
      }
    }
}

module.exports = {Game};
