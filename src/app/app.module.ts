import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SignupComponent } from './dashboard/signup/signup.component';

import { SignupService } from './services/signup.service';
import { GameService } from './services/game.service';
import { RoomComponent } from './dashboard/room/room.component';
import { BoardComponent } from './dashboard/board/board.component';

import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {PanelModule} from 'primeng/panel';
import {DropdownModule} from 'primeng/dropdown';

const config: SocketIoConfig = { url: 'http://localhost:3000', options: {} };

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    SignupComponent,
    RoomComponent,
    BoardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    SocketIoModule.forRoot(config),
    ButtonModule,
    InputTextModule,
    PanelModule,
    DropdownModule
  ],
  providers: [SignupService, GameService],
  bootstrap: [AppComponent]
})
export class AppModule { }
