import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthComponent } from './components/auth/auth.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SettingsComponent } from './components/settings/settings.component';

interface User {
  username: string;
  role?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AuthComponent, DashboardComponent, SettingsComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit {
  user: User | null = null;
  token: string | null = null;
  isDarkMode = false;
  showUserMenu = false;
  showSettingsSubmenu = false;
  showSettings = false;

  ngOnInit() {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      this.user = JSON.parse(savedUser);
      this.token = savedToken;
    }
    
    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
    this.applyTheme();
    
    // Listen for keyboard shortcuts and clicks
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    document.addEventListener('click', this.handleDocumentClick.bind(this));
  }

  onLogin(userData: User, authToken: string) {
    // Extract role from JWT token
    try {
      const payload = authToken.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      userData.role = decoded['custom:role'] || 'user';
    } catch (e) {
      userData.role = 'user';
    }
    
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
  
  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
    this.showUserMenu = false;
  }
  
  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }
  
  closeUserMenu() {
    this.showUserMenu = false;
  }
  
  toggleSettingsSubmenu() {
    this.showSettingsSubmenu = !this.showSettingsSubmenu;
  }
  
  openRiskProfileSettings() {
    const event = new CustomEvent('openSettings');
    document.dispatchEvent(event);
    this.showUserMenu = false;
    this.showSettingsSubmenu = false;
  }
  
  openGeneralSettings() {
    this.showSettings = true;
    this.showUserMenu = false;
    this.showSettingsSubmenu = false;
  }
  
  closeSettings() {
    this.showSettings = false;
  }
  
  openAdminPanel() {
    alert('Admin Panel: View all users, system metrics, and manage alerts');
    this.showUserMenu = false;
    this.showSettingsSubmenu = false;
  }
  
  private handleDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const userMenuContainer = target.closest('.user-menu-container');
    
    if (!userMenuContainer && this.showUserMenu) {
      this.showUserMenu = false;
    }
  }
  
  private applyTheme() {
    document.body.classList.toggle('dark-theme', this.isDarkMode);
  }
  
  private handleKeyboardShortcuts(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 't') {
      event.preventDefault();
      // Will be handled by dashboard component
    }
    
    // Close user menu on escape
    if (event.key === 'Escape') {
      this.showUserMenu = false;
    }
  }
}