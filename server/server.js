const express = require('express');
const bodyparser = require('body-parser');
const mergeJSON  = require ('merge-json') ;
const path = require('path');
const publicPath = path.join(__dirname, '../public');
const socketIO = require('socket.io');
const http = require('http');
const {Game} = require('./game.js');
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

app.post('/getPartner', (req, res)=> {
  let game = ongoingGames.find(g => g.gameRoom === req.body.roomName);
  for(let i=0; i< game.allPlayers.length; i++) {
    let p = game.allPlayers[i];
    let card = p.hand.find(c => c.suite === req.body.suite && c.value === req.body.card);
    if(card) {
      game.teamA.add(p.id);
      break;
    }
  }
  res.status.send(200).send({message: "success"});
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
    if(room && room.connections >= 1) {
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
      ongoingGames.push(game);
        io.to(game.allPlayers[starter].id).emit('bid', {value: 150, name: game.allPlayers[starter].name});
    }
    else {
      io.to(socket.id).emit('toast', {message: 'Waiting for 4 or more players to join'});
    }
  });

  socket.on('newBid', (data, callback)=> {
    let game = ongoingGames.find((g)=> {
      g.gameRoom === data.roomName
    });
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
    let game  = ongoingGames.find((g)=> {
      return g.gameRoom === data.roomName;
    });
    game.noChallenges++;
    if(game.noChallenges === game.allPlayers.length-1){
      io.sockets.in(game.gameRoom).emit('toast', {message: `${game.bidder.name}'s bid of ${game.bid} has been accepted`});
      io.to(game.bidder.id).emit('chooseCards', {no: game.allPlayers.length/2 -1});
      game.teamA.add(game.bidder.id);
    }
    callback({message: "success"});
  });

  socket.on('startPlaying', (data, callback)=>{
    let game  = ongoingGames.find((g)=> {
      return g.gameRoom === data.roomName;
    });
    game.allPlayers.forEach((p) => {
      if(!game.teamA.has(p.id)) {
        game.teamB.add(p.id);
      }
    });
    io.sockets.in(game.gameRoom).emit('toast', {message: `Starting the Game! ${game.bidder.name}'s turn`});
    io.to(game.bidder.id).emit('turn');
  });

  socket.on('trump', (data, callback)=>{
    let game  = ongoingGames.find((g)=> {
      return g.gameRoom === data.roomName;
    });
    game.trump = data.trump;
    socket.broadcast.to(game.gameRoom).emit('toast', {message: `${game.bidder.name} has chosen ${data.trump} as Trump`});
    callback({message: 'Trump set successfully'});
  }

  socket.on('move', (data, callback)=>{
    let game  = ongoingGames.find((g)=> {
      return g.gameRoom === data.roomName;
    });
    io.sockets.in(game.gameRoom).emit('update', {from: data.username, move: data.move});
    game.moveCount++;
    if(game.moveCount === game.allPlayers.length) {
      // reset
    } else {
      if(data.index+1 >== game.allPlayers.length) {
        game.currentTurn = 0;
        io.to(game.allPlayers[game.currentTurn].id).emit('turn');
      } else {
        game.currentTurn++;
        io.to(game.allPlayers[game.currentTurn]).emit('turn');
      }
      io.sockets.in(game.gameRoom).emit('toast', {message: `${game.allPlayers[game.currentTurn].name}'s turn`});  
    }
  });

  socket.on('createMessage', (message, callback)=>{
    socket.broadcast.emit('newMessage', generateMessage(message.from, message.text));
    callback('This is from the server');
  });
});


server.listen(port, ()=>{
  console.log(`Connected on ${port}`);
});
