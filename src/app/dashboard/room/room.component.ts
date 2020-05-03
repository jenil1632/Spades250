import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import {MessageService} from 'primeng/api';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css']
})
export class RoomComponent implements OnInit {

  constructor(private router: Router, private socket: Socket, private messageService: MessageService) { }

  newRoomName: FormControl;
  existingRoomName: FormControl;

  ngOnInit() {
    this.newRoomName = new FormControl(null, Validators.required);
    this.existingRoomName = new FormControl(null, Validators.required);
  }

create(){
  if(this.newRoomName.valid){
    this.socket.emit('createRoom', {roomName: this.newRoomName.value, username: sessionStorage.getItem('spadesUsername')}, (res)=> {
      if(res.message === 'success'){
        this.messageService.add({severity: 'success', summary: 'Room created successfully', life: 3000});
        setTimeout(()=> {
          this.router.navigate(['/board'], {queryParams: {room: this.newRoomName.value}});
        }, 3000);
      }
    });
  }
}

  join(){
    if(this.existingRoomName.valid){
      this.socket.emit('joinRoom', {roomName: this.existingRoomName.value, username: sessionStorage.getItem('spadesUsername')}, (res)=> {
        if(res.message === 'success'){
          this.messageService.add({severity: 'success', summary: `Joined Room ${this.existingRoomName.value}`, life: 3000});
          setTimeout(()=> {
            this.router.navigate(['/board'], {queryParams: {room: this.existingRoomName.value}});
          }, 3000);
        }
        else {
          this.messageService.add({severity: 'error', summary: 'This room does not exist', life: 4000});
          this.existingRoomName.reset();
        }
      });
  }
}

}
