import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthComponent } from './components/auth/auth.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

interface User {
  username: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AuthComponent, DashboardComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit {
  user: User | null = null;
  token: string | null = null;

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      this.user = JSON.parse(savedUser);
      this.token = savedToken;
    }
  }

  onLogin(userData: User, authToken: string) {
    this.user = userData;
    this.token = authToken;
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
  }

  onLogout() {
    this.user = null;
    this.token = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
}