import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class SignupService {

  constructor(private http: HttpClient) { }

  public signUpUser(username): any{
    return this.http.post('signup', {username: username});
  }

  public submitCard(room, data): any{
    return this.http.post('getPartner', {roomName: room, data: data});
  }

}
