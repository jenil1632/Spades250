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



//get seller details
app.get('/sellerprofile/:name', (req, res)=>{

});

app.post('/signup', (req, res)=>{
  let name = req.body.username;
  res.status(200).send({message: "success", username: name});
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
      game.allPlayers.forEach(player => {
          io.to(player.id).emit('cards', {hand: player.hand});
        });
      let starter = Math.floor(Math.random()*room.connections);
        io.to(game.allPlayers[starter].id).emit('bid', {value: 150});
    }
    else {
      io.to(socket.id).emit('toast', {message: 'Waiting for 4 or more players to join'});
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
