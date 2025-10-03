import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Tab {
  id: string;
  label: string;
}

@Component({
  selector: 'app-tab-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-navigation.component.html',
  styleUrls: ['./tab-navigation.component.css']
})
export class TabNavigationComponent {
  @Input() activeTab: string = 'dashboard';
  @Output() tabChange = new EventEmitter<string>();

  tabs: Tab[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'transactions', label: 'Submit Transaction' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'history', label: 'Transaction History' }
  ];

  onTabClick(tabId: string) {
    this.tabChange.emit(tabId);
  }
}