import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SignupComponent } from './dashboard/signup/signup.component';
import { RoomComponent } from './dashboard/room/room.component';

const routes: Routes = [{path: 'signup', component: SignupComponent}, {path: 'room', component: RoomComponent}, {path: '**', component: SignupComponent}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
