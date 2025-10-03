import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getCurrencySymbol } from '../../utils/currency';

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
  selector: 'app-transaction-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-history.component.html',
  styleUrls: ['./transaction-history.component.css']
})
export class TransactionHistoryComponent {
  @Input() transactions: Transaction[] = [];
  @Output() delete = new EventEmitter<string>();

  get flaggedCount(): number {
    return this.transactions.filter(t => (t.risk_score || 0) > 70).length;
  }

  exportToCSV() {
    const flaggedTransactions = this.transactions.filter(t => (t.risk_score || 0) > 70);
    if (flaggedTransactions.length === 0) {
      alert('No flagged transactions to export');
      return;
    }
    
    const headers = ['Transaction ID', 'Date', 'Time', 'Amount', 'Currency', 'Merchant', 'Risk Score', 'Status'];
    const csvContent = [
      headers.join(','),
      ...flaggedTransactions.map(t => {
        const date = t.timestamp ? new Date(t.timestamp) : null;
        return [
          t.transaction_id,
          date ? date.toLocaleDateString() : 'N/A',
          date ? date.toLocaleTimeString() : 'N/A',
          t.amount,
          t.currency,
          `"${t.merchant}"`,
          t.risk_score,
          t.status
        ].join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flagged-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  exportToPDF() {
    const flaggedTransactions = this.transactions.filter(t => (t.risk_score || 0) > 70);
    if (flaggedTransactions.length === 0) {
      alert('No flagged transactions to export');
      return;
    }
    
    const content = `
      <html>
        <head>
          <title>Flagged Transactions Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #d32f2f; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .high-risk { background-color: #ffebee; }
          </style>
        </head>
        <body>
          <h1>🚨 Flagged Transactions Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Total Flagged Transactions: ${flaggedTransactions.length}</p>
          <table>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Merchant</th>
                <th>Risk Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${flaggedTransactions.map(t => `
                <tr class="high-risk">
                  <td>${t.transaction_id}</td>
                  <td>${t.timestamp ? new Date(t.timestamp).toLocaleString() : 'N/A'}</td>
                  <td>${t.amount}</td>
                  <td>${t.currency}</td>
                  <td>${t.merchant}</td>
                  <td>${t.risk_score}</td>
                  <td>${t.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
    }
  }

  getCurrencySymbol(currency: string): string {
    return getCurrencySymbol(currency);
  }

  onDelete(transactionId: string) {
    this.delete.emit(transactionId);
  }

  getRiskClass(riskScore: number): string {
    if (riskScore > 70) return 'risk-high';
    if (riskScore > 30) return 'risk-medium';
    return 'risk-low';
  }
}