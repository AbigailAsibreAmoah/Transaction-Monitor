import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonitoringDashboardComponent } from '../monitoring-dashboard/monitoring-dashboard.component';
import { TabNavigationComponent } from '../tab-navigation/tab-navigation.component';
import { TransactionHistoryComponent } from '../transaction-history/transaction-history.component';
import { AnalyticsComponent } from '../analytics/analytics.component';

interface Transaction {
  transaction_id: string;
  amount: number;
  merchant: string;
  currency: string;
  risk_score: number;
  status: string;
  timestamp?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MonitoringDashboardComponent, TabNavigationComponent, TransactionHistoryComponent, AnalyticsComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @Input() token: string | null = null;
  @Output() logout = new EventEmitter<void>();

  transaction = { amount: '', merchant: '', currency: 'USD' };
  result: any = null;
  loading = false;
  transactions: Transaction[] = [];
  activeTab = 'dashboard';
  loadingTransactions = false;

  ngOnInit() {
    this.fetchTransactions();
  }

  deleteTransaction(transactionId: string) {
    this.transactions = this.transactions.filter(t => t.transaction_id !== transactionId);
  }

  async fetchTransactions() {
    if (!this.token) return;
    
    this.loadingTransactions = true;
    try {
      const response = await fetch('https://lpf1gn8aia.execute-api.us-east-1.amazonaws.com/dev/transactions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.transactions = data.transactions || [];
      } else {
        console.error('Failed to fetch transactions:', response.status);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      this.loadingTransactions = false;
    }
  }

  async handleSubmit() {
    this.loading = true;
    
    try {
      if (!this.token) {
        throw new Error('No authentication token');
      }
      
      const response = await fetch('https://lpf1gn8aia.execute-api.us-east-1.amazonaws.com/dev/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(this.transaction)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.result = data;
      
      if (data.transaction_id) {
        await this.fetchTransactions();
      }
    } catch (error: any) {
      console.error('Transaction error:', error);
      this.result = { error: 'Failed to process transaction' };
    } finally {
      this.loading = false;
    }
  }

  onTabChange(tab: string) {
    this.activeTab = tab;
  }

  onLogout() {
    this.logout.emit();
  }
}