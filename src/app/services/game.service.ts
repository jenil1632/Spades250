import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable()
export class GameService {

  constructor(private socket: Socket) { }

  public getCards(): Observable<any>{
    return this.socket.fromEvent<any>('cards');
  }

  public getToast(): Observable<any>{
    return this.socket.fromEvent<any>('toast');
  }

  public promptBid(): Observable<any>{
    return this.socket.fromEvent<any>('bid');
  }

}
