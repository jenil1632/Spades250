import { Component, OnInit } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { ActivatedRoute } from '@angular/router';
import { GameService } from './../../services/game.service';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { SignupService } from './../../services/signup.service';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent implements OnInit {

  constructor(private socket: Socket, private route: ActivatedRoute, private gameService: GameService, private signupService: SignupService) { }

  room;
  myCards;
  minimumBid;
  turnIndex;
  turnSuite = null;
  mat = [];
  myBid: FormControl;
  gameOn = false;
  challenge = true;
  stopBid = false;
  move: FormControl;
  partnerForm: FormGroup;
  trump: FormControl;
  suiteArray = ['spade', 'heart', 'club', 'diamond'];
  cardArray = [
    {value: 1, label:'Two'},
    {value: 2, label:'Three'},
    {value: 3, label: 'Four'},
    {value: 4, label: 'Five'},
    {value: 5, label: 'Six'},
    {value: 6, label: 'Seven'},
    {value: 7, label: 'Eight'},
    {value: 8, label: 'Nine'},
    {value: 9, label: 'Ten'},
    {value: 10, label: 'Jack'},
    {value: 11, label: 'Queen'},
    {value: 12, label: 'King'},
    {value: 13, label: 'Ace'}
  ];
  partners;
  chosenCards;
  hideTrump = false;
  hideForms = false;
  myTurn = false;

  ngOnInit() {
    this.route.queryParams
      .subscribe(params => {
        this.room = params.room;
      });

      this.myBid = new FormControl(null);
      this.trump = new FormControl(null, Validators.required);
      this.move = new FormControl(null, [Validators.required, this.validateMove]);
      this.partnerForm = new FormGroup({
        suite: new FormControl(null, Validators.required),
        card: new FormControl(null, Validators.required)
      });

      this.gameService.getCards().subscribe((res)=>{
        console.log(res);
        this.myCards = res.hand;
        this.turnIndex = res.index;
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

      this.gameService.chooseCards().subscribe((res)=>{
        console.log('Choose Trump');
        this.partners = res.no;
// something to do ??
});

     this.gameService.myTurn().subscribe(()=>{
       this.myTurn = true;
     });

     this.gameService.updateMat().subscribe((res)=>{
       this.mat.push(res);
     });

     this.gameService.resetMat().subscribe(()=>{
       this.mat = [];
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

  submitCard() {
    if(this.partnerForm.valid){
      this.signupService.submitCard(this.room, this.partnerForm.value).subscribe((res)=>{
        if(res.message === 'success'){
          this.chosenCards++;
          if(this.chosenCards !== this.partners) {
            this.partnerForm.reset();
            console.log('Choose next card');
          } else {
            this.hideForms = true;
            if(this.hideForms && this.hideTrump) {
              this.socket.emit('startPlaying', {roomName: this.room, username: sessionStorage.getItem('spadesUsername')}, (res)=>{
                console.log('Lets go');
              });
            }
          }
          this.socket.emit('myPartner', {roomName: this.room, username: sessionStorage.getItem('spadesUsername'), data: this.partnerForm.value}, (res)=> {
            console.log('success');
          });
        }
      });
    }
  }

  submitTrump() {
    if(this.trump.valid){
      this.socket.emit('trump', {roomName: this.room, username: sessionStorage.getItem('spadesUsername'), trump: this.trump.value}, (res)=>{
      console.log('trump chosen');
      this.hideTrump = true;
      if(this.hideForms && this.hideTrump) {
        this.socket.emit('startPlaying', {roomName: this.room, username: sessionStorage.getItem('spadesUsername')}, (res)=>{
          console.log('Lets go');
        });
      }
    });
    }
  }

  makeMove() {
    if(this.move.valid) {
      this.socket.emit('move', {roomName: this.room, username: sessionStorage.getItem('spadesUsername'), move: this.move.value, turnIndex: this.turnIndex}, (res)=>{
        this.myCards = this.myCards.filter(c => {
          return !(c.suite === this.move.value.suite && c.value === this.move.value.value);
        });
      });
    }
  }

  validateMove(control: FormControl) {
    if(control.value.suite === this.turnSuite) {
      return null;
    } else {
      for(let i=0; i<this.myCards.length; i++) {
        if(this.myCards[i].suite === this.turnSuite) {
          return {
            error: 'Not a valid move'
          };
        }
      }
    }
    return null;
  }

}
