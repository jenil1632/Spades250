import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { SignupService } from './../../services/signup.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {

  constructor(private signupService: SignupService, private router: Router) { }

  username;

  ngOnInit() {
    this.username = new FormControl(null, Validators.required);
  }

  onSubmit(){
    if(this.username.valid){
      this.signupService.signUpUser(this.username.value).subscribe((res)=>{
        sessionStorage.setItem('spadesUsername', this.username.value);
        this.router.navigate(['/room']);
      });
    }

  }

}
