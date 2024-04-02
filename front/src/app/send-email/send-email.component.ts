import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-send-email',
  templateUrl: './send-email.component.html',
  styleUrls: ['./send-email.component.css']
})
export class SendEmailComponent {
  email? = '';
  subject? = '';
  text? = '';

  constructor(private http: HttpClient) {}

  onSubmit() {
    const emailData = { to: this.email, subject: this.subject, text: this.text };
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
