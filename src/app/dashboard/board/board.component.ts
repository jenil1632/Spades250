import { Component, OnInit } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent implements OnInit {

  constructor(private socket: Socket, private route: ActivatedRoute) { }

  room;

  ngOnInit() {
    this.route.queryParams
      .subscribe(params => {
        this.room = params.room;
      });
  }

  startGame() {
    this.socket.emit('startgame', {roomName: this.room, username: sessionStorage.getItem('spadesUsername')}, ()=> {
    });
  }

}
