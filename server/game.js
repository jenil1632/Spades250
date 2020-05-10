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
  this.mat = [];
  this.completedTurns = 0;
}
let {Player} = require('./models/player.js');
let {Card} = require('./models/card.js');
const valueCards10 = [9, 10, 11, 12, 13, 22, 23, 24, 25, 26, 35, 36, 37, 38, 39, 48, 49, 50, 51, 52];
const valueCards5 = [4, 17, 30, 43];

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
        if(valueCards10.includes(i)){
          this.cardArray.push(new Card(i, i, "spade", 10));
        } else if(valueCards5.includes(i)){
          this.cardArray.push(new Card(i, i, "spade", 5));
        } else {
          this.cardArray.push(new Card(i, i, "spade", 0));
        }
      } else if(i>=14 && i<=26) {
        if(valueCards10.includes(i)) {
          this.cardArray.push(new Card(i, i-13, "heart", 10));
        } else if(valueCards5.includes(i)) {
          this.cardArray.push(new Card(i, i-13, "heart", 5));
        } else {
          this.cardArray.push(new Card(i, i-13, "heart", 0));
        }
      } else if(i>=27 && i<=39) {
        if(valueCards10.includes(i)) {
          this.cardArray.push(new Card(i, i-26, "club", 10));
        } else if(valueCards5.includes(i)) {
          this.cardArray.push(new Card(i, i-26, "club", 5));
        } else {
          this.cardArray.push(new Card(i, i-26, "club", 0));
        }
      } else {
        if(valueCards10.includes(i)){
          this.cardArray.push(new Card(i, i-39, "diamond", 10));
        } else if(valueCards5.includes(i)) {
          this.cardArray.push(new Card(i, i-39, "diamond", 5));
        } else {
          this.cardArray.push(new Card(i, i-39, "diamond", 0));
        }
      }
    }
    this.cardArray[1].points = 30;
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
    let handLength = Math.trunc(this.cardArray.length / players);
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

Game.prototype.evaluateTurn = function() {
  let biggestCard = this.mat[0];
  let total = 0;
  for(let i=1; i<this.mat.length; i++) {
    total += this.mat[i].card.points;
    if (biggestCard.card.suite === this.mat[i].card.suite) {
      biggestCard = this.mat[i].card.value > biggestCard.card.value? this.mat[i] : biggestCard;
    } else if(this.mat[i].card.suite === this.trump) {
      biggestCard = this.mat[i];
    }
  }
  let winner = this.allPlayers.find(p => p.id === biggestCard.id);
  winner.score += total;
  return winner;
}

Game.prototype.resetAfterTurn = function() {
  this.moveCount = 0;
  this.currentTurn = 0;
  this.mat = [];
}

Game.prototype.isGameCompleted = function() {
  return this.completedTurns === Math.trunc(52 / this.allPlayers.length);
}

Game.prototype.evaluateGameWinner = function() {
  let bidderScore = 0;
  let detailedTeamA = [];
  let detailedTeamB = [];
  this.teamA.forEach((id) => {
    let player = this.allPlayers.find(p => p.id === id);
    detailedTeamA.push(player);
  });
  this.teamB.forEach((id) => {
    let player = this.allPlayers.find(p => p.id === id);
    detailedTeamB.push(player);
  });
  detailedTeamA.forEach(p => {
    bidderScore += p.score;
  });
  if(bidderScore >= this.bid) {
    return {
      winner: detailedTeamA,
      points: bidderScore
    };
  } else {
    return {
      winner: detailedTeamB,
      points: 250 - bidderScore
    };
  }
}

module.exports = {Game};
