import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { ActivatedRoute } from '@angular/router';
import { GameService } from './../../services/game.service';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import {MessageService} from 'primeng/api';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css'],
  host: {
    class: 'boardWidth'
  }
})
export class BoardComponent implements OnInit {

  constructor(private socket: Socket, private route: ActivatedRoute, private gameService: GameService, private messageService: MessageService) { }

  @ViewChild('conversation') private conversation: ElementRef;
  @ViewChild('messageList') private messages: ElementRef;
  room;
  myCards;
  minimumBid = 150;
  turnIndex;
  turnSuite = null;
  mat = [];
  myBid: FormControl;
  gameOn = false;
  challenge = true;
  startingTurns = false;
  disableBid = false;
  move: FormControl;
  partnerForm: FormGroup;
  trump: FormControl;
  suiteArray = [{value: 'spade', label: 'spade'}, {value: 'heart', label: 'heart'}, {value: 'club', label: 'club'}, {value: 'diamond', label: 'diamond'}];
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
  message: FormControl;
  listOfMessages = [];
  chosenCards = 0;
  hideTrump = false;
  hideCardForms = false;
  myTurn = false;
  hideAllForms = true;
  numVisible = 4;
  numScroll = 3;
  responsiveOptions = [
            {
                breakpoint: '1024px',
                numVisible: 3,
                numScroll: 3
            },
            {
                breakpoint: '768px',
                numVisible: 2,
                numScroll: 2
            },
            {
                breakpoint: '560px',
                numVisible: 1,
                numScroll: 1
            }
        ];

  ngOnInit() {
    this.route.queryParams
      .subscribe(params => {
        this.room = params.room;
      });

      this.setCarouselParams();

      this.myBid = new FormControl(null);
      this.trump = new FormControl(null, Validators.required);
      this.partnerForm = new FormGroup({
        suite: new FormControl(null, Validators.required),
        card: new FormControl(null, Validators.required)
      });
      this.message = new FormControl(null, [Validators.required, ]);

      this.gameService.getCards().subscribe((res)=>{
        this.myCards = res.hand;
        this.turnIndex = res.index;
        this.gameOn = true;
      });

      this.gameService.getToast().subscribe((res)=>{
        this.messageService.add({severity: 'info', summary: res.message, life: 4000});
      });

      this.gameService.getMesssage().subscribe((res)=>{
        this.listOfMessages.push(res);
      });

      this.gameService.promptBid().subscribe((res)=>{
        if(res.name !== sessionStorage.getItem('spadesUsername')){
          if(this.challenge === true) {
            this.messageService.add({severity: 'info', summary: `${res.name} has bid ${res.value}. Challenge ?`, life: 4000});
            this.disableBid = false;
          } else {
            this.messageService.add({severity: 'info', summary: `${res.name} has bid ${res.value}.`, life: 3000});
          }
        }
        this.minimumBid = res.value;
      });

      this.gameService.chooseCards().subscribe((res)=>{
        this.messageService.add({severity: 'info', summary: 'Choose trump and partner cards', life: 3000});
        this.partners = res.no;
        this.hideAllForms = false;
// something to do ??
});

     this.gameService.myTurn().subscribe(()=>{
       this.hideAllForms = true;
       this.myTurn = true;
     });

     this.gameService.updateMat().subscribe((res)=>{
       this.mat.push(res);
     });

     this.gameService.resetMat().subscribe(()=>{
       this.mat = [];
     });

     this.gameService.startingTurns().subscribe(()=>{
       this.startingTurns = true;
     });

     this.gameService.setTurnSuite().subscribe((res)=> {
       this.turnSuite = res.suite;
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
          this.messageService.add({severity: 'success', summary: 'Bid successfull', life: 3000});
          this.disableBid = true;
          this.myBid.reset();
        } else {
          this.messageService.add({severity: 'error', summary: 'Bid failed', life: 4000});
        }
      });
    }
  }

  noChallenge() {
    this.socket.emit('noChallenge', {roomName: this.room, username: sessionStorage.getItem('spadesUsername')}, (res)=>{
      if(res.message === 'success') {
        this.disableBid = true;
        this.challenge = false;
        this.messageService.add({severity: 'success', summary: 'Passed! Waiting for bidding to finish', life: 2000})
      }
    });
  }

  submitCard() {
    if(this.partnerForm.valid){
      let label = this.cardArray.find(c=> c.value === this.partnerForm.get('card').value).label;
      this.socket.emit('partnerCard', {roomName: this.room, data: this.partnerForm.value, label: label}, (res)=> {
        if(res.message === 'success'){
          this.messageService.add({severity: 'success', summary: 'Partners set', life: 2000});
          this.chosenCards++;
          if(this.chosenCards !== this.partners) {
            this.partnerForm.reset();
            this.messageService.add({severity: 'info', summary: 'Choose next card', life: 3000});
          } else {
            this.hideCardForms = true;
            if(this.hideCardForms && this.hideTrump) {
              this.socket.emit('startPlaying', {roomName: this.room, username: sessionStorage.getItem('spadesUsername')}, (res)=>{
                this.messageService.add({severity: 'success', summary: 'Lets go', life: 2000});
              });
            }
          }
        }
      });
    }
  }

  submitTrump() {
    if(this.trump.valid){
      this.socket.emit('trump', {roomName: this.room, username: sessionStorage.getItem('spadesUsername'), trump: this.trump.value}, (res)=>{
      this.messageService.add({severity: 'success', summary: 'Trump chosen', life: 2000});
      this.hideTrump = true;
      if(this.hideCardForms && this.hideTrump) {
        this.socket.emit('startPlaying', {roomName: this.room, username: sessionStorage.getItem('spadesUsername')}, (res)=>{
          this.messageService.add({severity: 'success', summary: 'Lets go', life: 2000});
        });
      }
    });
    }
  }

  makeMove(card) {
    if(this.validateMove(card)) {
      this.socket.emit('move', {roomName: this.room, username: sessionStorage.getItem('spadesUsername'), move: card, turnIndex: this.turnIndex}, (res)=>{
        this.myCards = this.myCards.filter(c => {
          return !(c.suite === card.suite && c.value === card.value);
        });
        this.myTurn = false;
      });
    }
  }

  validateMove(card) {
      if(this.turnSuite) {
        if(card.suite === this.turnSuite) {
          return true;
        } else {
          for(let i=0; i<this.myCards.length; i++) {
            if(this.myCards[i].suite === this.turnSuite) {
              return false;
            }
          }
          return true;
        }
      } else {
        return true;
      }
  }

  setCarouselParams() {
    if(window.innerWidth < 560) {
      this.numScroll = 1;
      this.numVisible = 1;
    } else if(window.innerWidth < 768) {
      this.numScroll = 2;
      this.numVisible = 2;
    } else {
      this.numScroll = 3;
      this.numVisible = 3;
    }
  }

  validateTextMessage(control: FormControl) {
    if(control.value && control.value.trim() != '') {
      return null;
    } else {
      return {
        error: 'Invalid message'
      }
    }
  }

  postMessage() {
    if(this.message.valid) {
      this.socket.emit('createMessage', {roomName: this.room, username: sessionStorage.getItem('spadesUsername'), message: this.message.value}, (res)=>{
        if(res.message === 'success') {
          this.listOfMessages.push({
            username: sessionStorage.getItem('spadesUsername'),
            message: this.message.value
          });
           this.message.reset();
        }
      });
    }
  }

  scrollToBottom() {
    if(this.listOfMessages.length > 0) {
      this.conversation.nativeElement.scrollTop = this.messages.nativeElement.scrollHeight;
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

}
