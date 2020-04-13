function Game() {
  this.cardArray = [];
  this.removedCardsArray = [];
  this.allPlayers = [];
  this.bid = 0;
  this.bidder = {};
  this.noChallenges = 0;
  this.gameRoom = "";
}
let {Player} = require('./models/player.js');

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
      if(randomCard !== 3){
        if(this.cardExistsInDeck(randomCard)){
          this.cardArray = this.cardArray.filter((elem) => {
            return elem !== randomCard;
          });
          this.removedCardsArray.push(randomCard);
        }
      }
}
}

Game.prototype.initalizeCardArray = function() {
    for(let i=1; i<=52; i++){
      this.cardArray.push(i);
    }
}

Game.prototype.cardExistsInDeck = function (card){
  for(let i=0; i<this.cardArray.length; i++){
    if(this.cardArray[i]==card)
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
          this.cardArray = this.cardArray.filter((elem) => {
            return elem !== randomCard;
          });
          this.allPlayers[i].hand.push(randomCard);
          count++;
        }
      }
    }
}

module.exports = {Game};
