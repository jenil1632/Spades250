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
  allowedBidValues = [];
  myBid: FormControl;
  gameOn = false;

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
        for(let i=res.value; i<=250; i+=5){
          this.allowedBidValues.push(i);
        }
      });
  }

  startGame() {
    this.socket.emit('startgame', {roomName: this.room, username: sessionStorage.getItem('spadesUsername')}, ()=> {
    });
  }

}
