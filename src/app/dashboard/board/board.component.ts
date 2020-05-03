import { Component, OnInit } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { ActivatedRoute } from '@angular/router';
import { GameService } from './../../services/game.service';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { SignupService } from './../../services/signup.service';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css'],
  host: {
    class: 'boardWidth'
  }
})
export class BoardComponent implements OnInit {

  constructor(private socket: Socket, private route: ActivatedRoute, private gameService: GameService, private signupService: SignupService) { }

  room;
  myCards;
  minimumBid;
  turnIndex;
  turnSuite = null;
  //mat = [];
  mat  = [
  {
    from: 'jenil',
    move: {
      index: 2
    }
  },
  {
    from: 'qwerty',
    move: {
      index: 22
    }
  },
  {
    from: 'pranji',
    move: {
      index: 18
    }
  },
  {
    from: 'mango',
    move: {
      index: 47
    }
  },
  {
    from: 'batman',
    move: {
      index: 16
    }
  },
  {
    from: 'dolly',
    move: {
      index: 36
    }
  },
  {
    from: 'ashu',
    move: {
      index: 30
    }
  }
];
  myBid: FormControl;
  gameOn = false;
  challenge = true;
  stopBid = false;
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
            this.hideCardForms = true;
            if(this.hideCardForms && this.hideTrump) {
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
      if(this.hideCardForms && this.hideTrump) {
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
    if (control.value) {
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
    }
    return null;
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

}
