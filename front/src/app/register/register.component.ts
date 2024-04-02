import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})

export class RegisterComponent {
  username? = '';
  password?= '';
  email? = '';

  constructor(private http: HttpClient) {}

  onSubmit() {
   const user = { username: this.username, password: this.password, email: this.email };

    this.http.post('http://localhost:3000/register', user).subscribe(
      (response) => {
        console.log('Успешная регистрация:', response);
        this.sendEmail();
      },
      (error) => {
        console.error('Ошибка при регистрации:', error);
      }
    );
  }

  sendEmail() {
   const emailData = { to: this.email, subject: 'Регистрация', text: 'Вы успешно зарегистрировались' };
   this.http.post('http://localhost:3000/send-email', emailData).subscribe(
      (response) => {
        console.log('Электронная почта успешно отправлена:', response);
      },
      (error) => {
        console.error('Ошибка при отправке электронной почты:', error);
      }
    );
  }
}

