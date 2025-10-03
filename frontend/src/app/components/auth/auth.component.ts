import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FormData {
  username: string;
  password: string;
  email: string;
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent {
  @Output() login = new EventEmitter<{userData: any, authToken: string}>();

  isLogin = true;
  formData: FormData = {
    username: '',
    password: '',
    email: ''
  };
  loading = false;
  error = '';

  handleSocialLogin(provider: string) {
    if (this.isLogin) {
      this.error = 'Please use the login form above';
    } else {
      this.error = 'Please use the signup form above';
    }
  }

  async handleSubmit() {
    this.loading = true;
    this.error = '';

    try {
      const endpoint = this.isLogin ? '/login' : '/signup';
      const body = this.isLogin 
        ? { username: this.formData.username, password: this.formData.password }
        : { username: this.formData.username, password: this.formData.password, email: this.formData.email };

      const response = await fetch(`https://lpf1gn8aia.execute-api.us-east-1.amazonaws.com/dev${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const data = await response.json();
      
      if (this.isLogin) {
        this.login.emit({
          userData: { username: this.formData.username },
          authToken: data.id_token
        });
      } else {
        this.isLogin = true;
        this.error = 'Account created! Please login.';
      }
    } catch (err: any) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }
}