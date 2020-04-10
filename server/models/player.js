function Player(name, id, room) {
  this.name = name;
  this.hand = [];
  this.score = 0;
  this.id = id;
  this.room = room;
}

module.exports = {Player};
