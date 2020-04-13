import { Component, OnInit } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { ActivatedRoute } from '@angular/router';
import { GameService } from './../../services/game.service';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent implements OnInit {

  constructor(private socket: Socket, private route: ActivatedRoute, private gameService: GameService) { }

  room;
  myCards;
  minimumBid;
  myBid: FormControl;
  gameOn = false;
  challenge = true;
  stopBid = false;

  ngOnInit() {
    this.route.queryParams
      .subscribe(params => {
        this.room = params.room;
      });

      this.myBid = new FormControl(null);

      this.gameService.getCards().subscribe((res)=>{
        console.log(res);
        this.myCards = res.hand;
        this.gameOn = true;
      });

      this.gameService.getToast().subscribe((res)=>{
        console.log(res);
      });

      this.gameService.promptBid().subscribe((res)=>{
        if(res.name !== sessionStorage.getItem('spadesUsername')){
          if(this.challenge === true) {
            console.log(`${res.name} has bid ${res.value}. Challenge ?`);
          } else {
            console.log(`${res.name} has bid ${res.value}.`);
          }
        }
        this.minimumBid = res.value;
      });
  }

  startGame() {
    this.socket.emit('startgame', {roomName: this.room, username: sessionStorage.getItem('spadesUsername')}, ()=> {
    });
  }

  submitBid() {
    if(this.myBid.value <=250 && this.myBid.value > this.minimumBid && this.myBid.value%5===0) {
      this.socket.emit('newBid', {roomName: this.room, username: sessionStorage.getItem('spadesUsername'), bid: this.myBid.value}, (res)=> {
        if(res.message === 'success'){
          this.minimumBid = this.myBid.value;
          this.myBid.reset();
        } else {
          alert('Bid failed');
        }
      });
    }
  }

  noChallenge() {
    this.socket.emit('noChallenge', {roomName: this.room, username: sessionStorage.getItem('spadesUsername')}, (res)=>{
      if(res.message === 'success') {
        this.stopBid = true;
      }
    });
  }

}
