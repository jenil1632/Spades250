import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { SignupService } from './../../services/signup.service';
import { Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css']
})
export class RoomComponent implements OnInit {

  constructor(private router: Router, private socket: Socket) { }

  createRoom = false;
  joinRoom = false;
  newRoomName: FormControl;
  existingRoomName: FormControl;

  ngOnInit() {
    this.newRoomName = new FormControl(null, Validators.required);
    this.existingRoomName = new FormControl(null, Validators.required);
  }

showCreateRoomInput(){
  this.createRoom = true;
}

showJoinRoomInput(){
  this.joinRoom = true;
}

create(){
  if(this.newRoomName.valid){
    this.socket.emit('createRoom', {roomName: this.newRoomName.value, username: sessionStorage.getItem('spadesUsername')}, (res)=> {
      console.log(res);
      if(res.message === 'success'){
        alert('Room created successfully');
        this.router.navigate(['/board'], {queryParams: {room: this.newRoomName.value}});
      }
    });
  }
}

  join(){
    if(this.existingRoomName.valid){
      this.socket.emit('joinRoom', {roomName: this.existingRoomName.value, username: sessionStorage.getItem('spadesUsername')}, (res)=> {
        if(res.message === 'success'){
          alert(`Joined Room ${this.existingRoomName.value}`);
          this.router.navigate(['/board'], {queryParams: {room: this.existingRoomName.value}});
        }
        else {
          alert('This room does not exist');
          this.existingRoomName.reset();
        }
      });
  }
}

}
