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
  liveRiskScore = 0;
  liveRiskStatus = 'approved';
  
  // Advanced features
  showBulkEntry = false;
  showRiskSimulator = false;
  showAdvancedTools = false;
  bulkTransactions: any[] = [{ amount: '', merchant: '', currency: 'USD' }];
  simulatorAmount = '';
  simulatorMerchant = '';
  simulatorCurrency = 'USD';
  simulatorRisk = 0;
  simulatorStatus = 'approved';
  
  // Smart defaults
  userPreferences = {
    defaultCurrency: 'USD',
    commonMerchants: [] as string[],
    recentAmounts: [] as number[]
  };
  
  // Risk Profile & Budget Management
  showRiskSettings = false;
  userRiskProfile = {
    monthlyBudget: 5000,
    dailyLimit: 500,
    riskTolerance: 'medium', // low, medium, high
    trustedMerchants: [] as string[],
    blockedMerchants: [] as string[],
    customRiskThreshold: 70,
    budgetAlerts: true
  };
  
  currentMonthSpending = 0;
  currentDaySpending = 0;
  transactions: Transaction[] = [];
  activeTab = 'dashboard';
  loadingTransactions = false;
  selectedCurrency = 'USD';
  showCurrencyTip = false;
  
  currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'GHS', symbol: '₵', name: 'Ghana Cedi' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' }
  ];
  
  exchangeRates = {
    'USD': 1.0, 'EUR': 0.92, 'GBP': 0.79, 'GHS': 12.05,
    'JPY': 149.50, 'INR': 83.25, 'NGN': 775.00, 'ZAR': 18.75,
    'KES': 129.50, 'CAD': 1.36
  };

  ngOnInit() {
    this.loadUserPreferences();
    this.loadUserRiskProfile();
    this.fetchTransactions();
    // Show currency tip for first-time users
    const hasSeenTip = localStorage.getItem('currencyTipSeen');
    if (!hasSeenTip) {
      this.showCurrencyTip = true;
    }
    
    // Keyboard shortcuts and settings listener
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    document.addEventListener('openSettings', this.handleOpenSettings.bind(this));
  }
  
  private handleOpenSettings() {
    this.activeTab = 'transactions';
    this.showRiskSettings = true;
  }

  deleteTransaction(transactionId: string) {
    this.transactions = this.transactions.filter(t => t.transaction_id !== transactionId);
  }

  async fetchTransactions() {
    // Load from localStorage first
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      this.transactions = JSON.parse(savedTransactions);
    }
    
    if (!this.token) {
      console.log('No token available for fetching transactions');
      return;
    }
    
    console.log('Fetching transactions from database...');
    this.loadingTransactions = true;
    
    try {
      const response = await fetch('https://lpf1gn8aia.execute-api.us-east-1.amazonaws.com/dev/transactions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const responseText = await response.text();
      console.log('Fetch response status:', response.status);
      console.log('Fetch response text:', responseText);
      
      if (response.ok) {
        const data = JSON.parse(responseText);
        const fetchedTransactions = data.transactions || [];
        console.log('Fetched', fetchedTransactions.length, 'transactions from database');
        
        if (fetchedTransactions.length > 0) {
          this.transactions = [...fetchedTransactions];
          localStorage.setItem('transactions', JSON.stringify(this.transactions));
          console.log('Updated transactions array. Current count:', this.transactions.length);
        }
      } else {
        console.error('Failed to fetch transactions:', response.status, response.statusText);
        console.error('Error response:', responseText);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      this.loadingTransactions = false;
    }
  }

  async handleSubmit() {
    this.loading = true;
    this.result = null;
    
    try {
      if (!this.token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Validate form data
      if (!this.transaction.amount || !this.transaction.merchant) {
        throw new Error('Please fill in all required fields');
      }
      
      const amount = parseFloat(this.transaction.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      
      console.log('Submitting transaction:', this.transaction);
      
      const response = await fetch('https://lpf1gn8aia.execute-api.us-east-1.amazonaws.com/dev/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          amount: amount,
          merchant: this.transaction.merchant.trim(),
          currency: this.transaction.currency
        })
      });
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      if (!response.ok) {
        let errorMessage = `Server error (${response.status})`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Use default error message
        }
        throw new Error(errorMessage);
      }
      
      const data = JSON.parse(responseText);
      console.log('Transaction submitted successfully:', data);
      
      if (data.transaction_id) {
        // Add transaction immediately to array for instant UI update
        const newTransaction = {
          transaction_id: data.transaction_id,
          amount: amount,
          merchant: this.transaction.merchant.trim(),
          currency: this.transaction.currency,
          risk_score: data.risk_score || 0,
          status: data.status || 'approved',
          timestamp: new Date().toISOString()
        };
        
        // Add to beginning of array
        this.transactions = [newTransaction, ...this.transactions];
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
        console.log('Transaction added to array. Total transactions:', this.transactions.length);
        
        // Update preferences
        this.updatePreferences(this.transaction);
        
        // Show success message
        this.result = {
          success: true,
          message: `Transaction processed successfully! Risk Score: ${data.risk_score}, Status: ${data.status}`,
          transaction_id: data.transaction_id,
          risk_score: data.risk_score,
          status: data.status
        };
        
        // Clear form
        this.transaction = { amount: '', merchant: '', currency: this.userPreferences.defaultCurrency };
        this.liveRiskScore = 0;
        this.liveRiskStatus = 'approved';
        
        // Sync with database after a short delay
        setTimeout(() => {
          this.fetchTransactions();
        }, 1000);
        
      } else {
        throw new Error('Invalid response from server');
      }
      
    } catch (error: any) {
      console.error('Transaction submission error:', error);
      this.result = { 
        error: error.message || 'Failed to process transaction. Please try again.',
        success: false
      };
    } finally {
      this.loading = false;
    }
  }

  onTabChange(tab: string) {
    this.activeTab = tab;
    console.log('Switching to tab:', tab, 'Current transactions:', this.transactions.length);
    
    // Clear any previous results when switching tabs
    if (tab !== 'transactions') {
      this.result = null;
    }
  }

  onLogout() {
    this.logout.emit();
  }
  
  onCurrencyDoubleClick() {
    this.showCurrencyTip = false;
    localStorage.setItem('currencyTipSeen', 'true');
  }
  
  onCurrencyChange(currency: string) {
    this.selectedCurrency = currency;
    this.showCurrencyTip = false;
    localStorage.setItem('currencyTipSeen', 'true');
  }
  
  convertToSelectedCurrency(amount: number, fromCurrency: string): number {
    const fromRate = this.exchangeRates[fromCurrency as keyof typeof this.exchangeRates] || 1;
    const toRate = this.exchangeRates[this.selectedCurrency as keyof typeof this.exchangeRates] || 1;
    return (amount / fromRate) * toRate;
  }
  
  getTotalVolumeInSelectedCurrency(): number {
    return this.transactions.reduce((total, t) => {
      return total + this.convertToSelectedCurrency(t.amount, t.currency);
    }, 0);
  }
  
  getSelectedCurrencySymbol(): string {
    return this.currencies.find(c => c.code === this.selectedCurrency)?.symbol || '$';
  }
  
  // Risk Profile Management
  calculateCurrentSpending() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = now.toDateString();
    
    this.currentMonthSpending = this.transactions
      .filter(t => {
        const transactionDate = new Date(t.timestamp || Date.now());
        return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    this.currentDaySpending = this.transactions
      .filter(t => new Date(t.timestamp || Date.now()).toDateString() === today)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }
  
  async updateRiskProfile() {
    await this.saveUserRiskProfile();
    this.calculateLiveRiskScore();
  }
  
  async loadUserRiskProfile() {
    if (!this.token) return;
    
    try {
      const response = await fetch('https://lpf1gn8aia.execute-api.us-east-1.amazonaws.com/dev/user-profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          this.userRiskProfile = { ...this.userRiskProfile, ...data.profile };
        }
      }
    } catch (error) {
      console.error('Failed to load user risk profile:', error);
    }
  }
  
  async saveUserRiskProfile() {
    if (!this.token) return;
    
    try {
      const response = await fetch('https://lpf1gn8aia.execute-api.us-east-1.amazonaws.com/dev/user-profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profile: this.userRiskProfile })
      });
      
      if (!response.ok) {
        console.error('Failed to save user risk profile');
      }
    } catch (error) {
      console.error('Error saving user risk profile:', error);
    }
  }
  
  addTrustedMerchant() {
    const merchant = prompt('Enter trusted merchant name:');
    if (merchant && !this.userRiskProfile.trustedMerchants.includes(merchant)) {
      this.userRiskProfile.trustedMerchants.push(merchant);
      this.updateRiskProfile();
    }
  }
  
  removeTrustedMerchant(merchant: string) {
    this.userRiskProfile.trustedMerchants = this.userRiskProfile.trustedMerchants.filter(m => m !== merchant);
    this.updateRiskProfile();
  }
  
  addBlockedMerchant() {
    const merchant = prompt('Enter merchant to block:');
    if (merchant && !this.userRiskProfile.blockedMerchants.includes(merchant)) {
      this.userRiskProfile.blockedMerchants.push(merchant);
      this.updateRiskProfile();
    }
  }
  
  removeBlockedMerchant(merchant: string) {
    this.userRiskProfile.blockedMerchants = this.userRiskProfile.blockedMerchants.filter(m => m !== merchant);
    this.updateRiskProfile();
  }
  
  getBudgetStatus() {
    const monthlyUsed = (this.currentMonthSpending / this.userRiskProfile.monthlyBudget) * 100;
    const dailyUsed = (this.currentDaySpending / this.userRiskProfile.dailyLimit) * 100;
    
    return {
      monthlyUsed: Math.min(monthlyUsed, 100),
      dailyUsed: Math.min(dailyUsed, 100),
      monthlyRemaining: Math.max(0, this.userRiskProfile.monthlyBudget - this.currentMonthSpending),
      dailyRemaining: Math.max(0, this.userRiskProfile.dailyLimit - this.currentDaySpending)
    };
  }
  
  calculateLiveRiskScore() {
    const amount = parseFloat(this.transaction.amount) || 0;
    const merchant = this.transaction.merchant.toLowerCase();
    const currency = this.transaction.currency;
    
    // Convert to USD for consistent risk assessment
    const rate = this.exchangeRates[currency as keyof typeof this.exchangeRates] || 1;
    const usdAmount = amount / rate;
    
    let riskScore = 0;
    let riskReasons = [];
    
    // Budget-based risk assessment
    const remainingMonthlyBudget = this.userRiskProfile.monthlyBudget - this.currentMonthSpending;
    const remainingDailyLimit = this.userRiskProfile.dailyLimit - this.currentDaySpending;
    
    if (usdAmount > remainingMonthlyBudget) {
      riskScore += 60;
      riskReasons.push('Exceeds monthly budget');
    } else if (usdAmount > remainingMonthlyBudget * 0.8) {
      riskScore += 30;
      riskReasons.push('Near monthly budget limit');
    }
    
    if (usdAmount > remainingDailyLimit) {
      riskScore += 40;
      riskReasons.push('Exceeds daily limit');
    }
    
    // Merchant-based risk
    if (this.userRiskProfile.trustedMerchants.some(trusted => merchant.includes(trusted.toLowerCase()))) {
      riskScore -= 20; // Reduce risk for trusted merchants
      riskReasons.push('Trusted merchant');
    }
    
    if (this.userRiskProfile.blockedMerchants.some(blocked => merchant.includes(blocked.toLowerCase()))) {
      riskScore += 80;
      riskReasons.push('Blocked merchant');
    }
    
    // High-risk merchant categories
    const highRiskMerchants = ['casino', 'crypto', 'gambling', 'betting'];
    if (highRiskMerchants.some(risk => merchant.includes(risk))) {
      riskScore += 50;
      riskReasons.push('High-risk merchant category');
    }
    
    // Amount-based risk (relative to user's budget)
    const budgetPercentage = (usdAmount / this.userRiskProfile.monthlyBudget) * 100;
    if (budgetPercentage > 50) {
      riskScore += 40;
      riskReasons.push('Large transaction (>50% of budget)');
    } else if (budgetPercentage > 25) {
      riskScore += 20;
      riskReasons.push('Significant transaction (>25% of budget)');
    }
    
    // Risk tolerance adjustment
    if (this.userRiskProfile.riskTolerance === 'low') {
      riskScore += 10;
    } else if (this.userRiskProfile.riskTolerance === 'high') {
      riskScore -= 10;
    }
    
    this.liveRiskScore = Math.max(0, Math.min(riskScore, 100));
    this.liveRiskStatus = this.liveRiskScore > this.userRiskProfile.customRiskThreshold ? 'flagged' : 'approved';
  }
  
  onTransactionChange() {
    this.calculateLiveRiskScore();
  }
  
  // Smart Defaults
  loadUserPreferences() {
    const saved = localStorage.getItem('userPreferences');
    if (saved) {
      this.userPreferences = { ...this.userPreferences, ...JSON.parse(saved) };
      this.transaction.currency = this.userPreferences.defaultCurrency;
    }
    
    // Load risk profile
    const savedRiskProfile = localStorage.getItem('userRiskProfile');
    if (savedRiskProfile) {
      this.userRiskProfile = { ...this.userRiskProfile, ...JSON.parse(savedRiskProfile) };
    }
    
    // Calculate current spending
    this.calculateCurrentSpending();
  }
  
  saveUserPreferences() {
    localStorage.setItem('userPreferences', JSON.stringify(this.userPreferences));
    localStorage.setItem('userRiskProfile', JSON.stringify(this.userRiskProfile));
  }
  
  updatePreferences(transaction: any) {
    // Update default currency
    this.userPreferences.defaultCurrency = transaction.currency;
    
    // Add to common merchants
    if (transaction.merchant && !this.userPreferences.commonMerchants.includes(transaction.merchant)) {
      this.userPreferences.commonMerchants.unshift(transaction.merchant);
      this.userPreferences.commonMerchants = this.userPreferences.commonMerchants.slice(0, 5);
    }
    
    // Add to recent amounts
    const amount = parseFloat(transaction.amount);
    if (amount && !this.userPreferences.recentAmounts.includes(amount)) {
      this.userPreferences.recentAmounts.unshift(amount);
      this.userPreferences.recentAmounts = this.userPreferences.recentAmounts.slice(0, 5);
    }
    
    this.saveUserPreferences();
  }
  
  // Risk Simulator
  simulateRisk() {
    const amount = parseFloat(this.simulatorAmount) || 0;
    const merchant = this.simulatorMerchant.toLowerCase();
    const currency = this.simulatorCurrency;
    
    const rate = this.exchangeRates[currency as keyof typeof this.exchangeRates] || 1;
    const usdAmount = amount / rate;
    
    let riskScore = 0;
    if (usdAmount > 10000) riskScore += 50;
    else if (usdAmount > 5000) riskScore += 30;
    else if (usdAmount > 1000) riskScore += 10;
    
    const highRiskMerchants = ['casino', 'crypto', 'gambling'];
    if (highRiskMerchants.some(risk => merchant.includes(risk))) {
      riskScore += 40;
    }
    
    this.simulatorRisk = Math.min(riskScore, 100);
    this.simulatorStatus = this.simulatorRisk > 70 ? 'flagged' : 'approved';
  }
  
  // Bulk Transaction Entry
  addBulkTransaction() {
    this.bulkTransactions.push({ amount: '', merchant: '', currency: this.userPreferences.defaultCurrency });
  }
  
  removeBulkTransaction(index: number) {
    if (this.bulkTransactions.length > 1) {
      this.bulkTransactions.splice(index, 1);
    }
  }
  
  async submitBulkTransactions() {
    this.loading = true;
    const results = [];
    
    for (const transaction of this.bulkTransactions) {
      if (transaction.amount && transaction.merchant) {
        try {
          const response = await fetch('https://lpf1gn8aia.execute-api.us-east-1.amazonaws.com/dev/transaction', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(transaction)
          });
          
          if (response.ok) {
            const data = await response.json();
            results.push(data);
            
            // Add to transactions array immediately
            const newTransaction = {
              transaction_id: data.transaction_id,
              amount: parseFloat(transaction.amount),
              merchant: transaction.merchant,
              currency: transaction.currency,
              risk_score: data.risk_score,
              status: data.status,
              timestamp: new Date().toISOString()
            };
            this.transactions = [newTransaction, ...this.transactions];
            this.updatePreferences(transaction);
          }
        } catch (error) {
          console.error('Bulk transaction error:', error);
        }
      }
    }
    
    this.loading = false;
    this.showBulkEntry = false;
    this.bulkTransactions = [{ amount: '', merchant: '', currency: this.userPreferences.defaultCurrency }];
    this.result = { message: `${results.length} transactions processed successfully` };
  }
  
  // Transaction Cloning
  cloneTransaction(transaction: any) {
    this.transaction = {
      amount: transaction.amount.toString(),
      merchant: transaction.merchant,
      currency: transaction.currency
    };
    this.activeTab = 'transactions';
    this.calculateLiveRiskScore();
  }
  
  // CSV Import
  onFileDropped(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleCSVFile(files[0]);
    }
  }
  
  onDragOver(event: DragEvent) {
    event.preventDefault();
  }
  
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleCSVFile(file);
    }
  }
  
  handleCSVFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      this.parseCSV(csv);
    };
    reader.readAsText(file);
  }
  
  parseCSV(csv: string) {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      alert('CSV must have at least a header and one data row');
      return;
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const amountIndex = headers.findIndex(h => h.includes('amount'));
    const merchantIndex = headers.findIndex(h => h.includes('merchant'));
    const currencyIndex = headers.findIndex(h => h.includes('currency'));
    
    if (amountIndex === -1 || merchantIndex === -1) {
      alert('CSV must contain "amount" and "merchant" columns');
      return;
    }
    
    const transactions = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const transaction = {
        amount: values[amountIndex] || '',
        merchant: values[merchantIndex] || '',
        currency: currencyIndex !== -1 ? values[currencyIndex] || 'USD' : 'USD'
      };
      
      if (transaction.amount && transaction.merchant) {
        transactions.push(transaction);
      }
    }
    
    if (transactions.length > 0) {
      this.bulkTransactions = transactions;
      this.showBulkEntry = true;
      alert(`Loaded ${transactions.length} transactions from CSV`);
    } else {
      alert('No valid transactions found in CSV');
    }
  }
  
  private handleKeyboardShortcuts(event: KeyboardEvent) {
    if (event.ctrlKey) {
      switch(event.key) {
        case 't':
          event.preventDefault();
          this.activeTab = 'transactions';
          break;
        case 'd':
          event.preventDefault();
          this.activeTab = 'dashboard';
          break;
        case 'h':
          event.preventDefault();
          this.activeTab = 'history';
          break;
        case 'a':
          event.preventDefault();
          this.activeTab = 'analytics';
          break;
      }
    }
  }
}