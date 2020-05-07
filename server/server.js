const express = require('express');
const bodyparser = require('body-parser');
const mergeJSON  = require ('merge-json') ;
const path = require('path');
const publicPath = path.join(__dirname, '../public');
const socketIO = require('socket.io');
const http = require('http');
const {Game} = require('./game.js');
const {Card} = require('./models/card.js');
//const {generateMessage} = require('./utils/message.js');


const port = process.env.PORT || '3000';
let app = express();
app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());
app.use(express.static(path.join(__dirname, '..', 'dist/Spades250')));
let server = http.createServer(app);
let io = socketIO(server);
let playerArray = [];
let roomList = [];
let ongoingGames = [];



app.post('/signup', (req, res)=>{
  let name = req.body.username;
  res.status(200).send({message: "success", username: name});
});

app.get('*', (req,res) => {
    res.sendFile(path.join(__dirname, '..', 'dist/Spades250/index.html'));
});


//messaging app event listener
io.on('connection', (socket)=>{

  console.log('new user Connected');

  socket.on('disconnect', ()=>{
    let player = playerArray.find(p => p.id === socket.id);
    playerArray = playerArray.filter(p => p.id !== socket.id);
    let room = roomList.find(r => r.name === player.roomName);
    if(room) {
      room.connections--;
      socket.broadcast.to(room.name).emit('toast', {message: `${player.name} left!`})
      if(room.connections === 0) {
        roomList = roomList.filter(r => r.name !== room.name);
      }
    }
    console.log('user was disconnected');
  });


  socket.on('createRoom', (data, callback)=>{
    socket.join(data.roomName);
    roomList.push({name: data.roomName, connections: 1, gameOn: false});
    playerArray.push({name: data.username, roomName: data.roomName, id: socket.id});
    callback({message: 'success'});
  });

  socket.on('joinRoom', (data, callback)=>{
    let room = roomList.find(room => room.name === data.roomName);
    if(room) {
      if(room.gameOn === true) {
        io.to(socket.id).emit('toast', {message: 'Game already started, try again later!'});
      } else {
        socket.join(data.roomName);
        room.connections++;
        playerArray.push({name: data.username, roomName: data.roomName, id:socket.id});
        socket.broadcast.to(room).emit('toast', {message: `${data.username} joined!`});
        callback({message: 'success'});
      }
    } else {
        callback({message: 'failure'});
    }
  });

  socket.on('startgame', (data, callback)=>{
    let room = roomList.find(room => room.name === data.roomName);
    if(room && room.connections >= 4) {
      room.gameOn = true;
      io.sockets.in(room.name).emit('toast', {message: 'Game Started!'});
      const game = new Game();
      game.startgame(room.connections, playerArray);
      let index = 0;
      game.allPlayers.forEach(player => {
          io.to(player.id).emit('cards', {hand: player.hand, index: index});
          index++;
        });
      let starter = Math.floor(Math.random()*room.connections);
      game.bid = 150;
      game.gameRoom = room.name;
      game.bidder = game.allPlayers[starter].name;
      console.log(game.bidder);
      ongoingGames.push(game);
      io.sockets.in(game.gameRoom).emit('toast', {message: `${game.allPlayers[starter].name}'s opening bid of 150`});
    }
    else {
      io.to(socket.id).emit('toast', {message: 'Waiting for 4 or more players to join'});
    }
  });

  socket.on('newBid', (data, callback)=> {
    let game = ongoingGames.find(g=> g.gameRoom === data.roomName );
    if(data.bid > game.bid) {
      game.bid = data.bid;
      game.bidder = game.allPlayers.find((player)=> {
        return player.name === data.username;
      });
      socket.broadcast.emit('bid', {value: game.bid, name: game.bidder.name});
      callback({message: 'success'});
    }
    else {
      callback({message: 'failure'});
    }
  });

  socket.on('noChallenge', (data, callback)=>{
    let game = ongoingGames.find(g=> g.gameRoom === data.roomName );
    game.noChallenges++;
    if(game.noChallenges === game.allPlayers.length-1){
      io.sockets.in(game.gameRoom).emit('toast', {message: `${game.bidder.name}'s bid of ${game.bid} has been accepted`});
      io.to(game.bidder.id).emit('chooseCards', {no: game.allPlayers.length/2 -1});
      game.teamA.add(game.bidder.id);
    }
    callback({message: "success"});
  });

  socket.on('partnerCard', (data, callback)=>{
    let game = ongoingGames.find(g => g.gameRoom === data.roomName);
    for(let i=0; i< game.allPlayers.length; i++) {
      let p = game.allPlayers[i];
      let card = p.hand.find(c => c.suite === data.data.suite && c.value === data.data.card);
      if(card) {
        game.teamA.add(p.id);
        break;
      }
    }
      socket.broadcast.to(game.gameRoom).emit('toast', {message: `${game.bidder.name} has chosen ${data.data.card} of ${data.data.suite} as Partner`});
    callback({message: "success"});
  });

  socket.on('startPlaying', (data, callback)=>{
    let game = ongoingGames.find(g=> g.gameRoom === data.roomName );
    game.allPlayers.forEach((p) => {
      if(!game.teamA.has(p.id)) {
        game.teamB.add(p.id);
      }
    });
    io.sockets.in(game.gameRoom).emit('toast', {message: `Starting the Game! ${game.bidder.name}'s turn`});
    io.sockets.in(game.gameRoom).emit('startingTurns');
    io.to(game.bidder.id).emit('turn');
  });

  socket.on('trump', (data, callback)=>{
    let game  = ongoingGames.find((g)=> {
      return g.gameRoom === data.roomName;
    });
    game.trump = data.trump;
    socket.broadcast.to(game.gameRoom).emit('toast', {message: `${game.bidder.name} has chosen ${data.trump} as Trump`});
    callback({message: 'Trump set successfully'});
  });

  socket.on('move', (data, callback)=>{
    let game  = ongoingGames.find((g)=> {
      return g.gameRoom === data.roomName;
    });
    io.sockets.in(game.gameRoom).emit('update', {from: data.username, move: data.move});
    game.moveCount++;
    game.mat.push({id: socket.id, card: new Card(data.move.index, data.move.value, data.move.suite)});
    if(game.moveCount === game.allPlayers.length) {
      game.completedTurns++;
      let turnWinner = game.evaluateTurn();
      game.resetAfterTurn();
      io.sockets.in(game.gameRoom).emit('toast', {message: `${turnWinner.name} won this turn`});
      if(game.isGameCompleted()) {
        let winnerDetails = game.evaluateGameWinner();
        let winnerList = '';
        winnerDetails.winner.forEach(p => winnerList += `${p.name}, `);
        io.sockets.in(game.gameRoom).emit('toast', {message: `Winning team is ${winnerList} with ${winnerDetails.points}`});
        //reset game
      } else {
        setTimeout(()=>{
          io.sockets.in(game.gameRoom).emit('resetMat');
          io.to(turnWinner.id).emit('turn');
        }, 5000);
      }
    } else {
      if(data.index+1 >= game.allPlayers.length) {
        game.currentTurn = 0;
        io.to(game.allPlayers[game.currentTurn].id).emit('turn');
      } else {
        game.currentTurn = data.index + 1;
        io.to(game.allPlayers[game.currentTurn]).emit('turn');
      }
      io.sockets.in(game.gameRoom).emit('toast', {message: `${game.allPlayers[game.currentTurn].name}'s turn`});
    }
  });

  socket.on('createMessage', (data, callback)=>{
    socket.broadcast.to(data.roomName).emit('newMessage', data);
    callback({message: 'success'});
  });
});


server.listen(port, ()=>{
  console.log(`Connected on ${port}`);
});
