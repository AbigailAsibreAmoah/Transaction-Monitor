import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import { formatCurrency } from '../../utils/currency';

Chart.register(...registerables);

interface Transaction {
  transaction_id: string;
  amount: number;
  merchant: string;
  currency: string;
  risk_score: number;
  status: string;
  timestamp?: string;
}

interface Metrics {
  totalTransactions: number;
  totalVolume: number;
  avgRiskScore: number;
  highRiskCount: number;
}

@Component({
  selector: 'app-monitoring-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './monitoring-dashboard.component.html',
  styleUrls: ['./monitoring-dashboard.component.css']
})
export class MonitoringDashboardComponent implements OnInit, OnChanges {
  @Input() transactions: Transaction[] = [];

  metrics: Metrics = {
    totalTransactions: 0,
    totalVolume: 0,
    avgRiskScore: 0,
    highRiskCount: 0
  };

  // Chart configurations
  volumeChartType: ChartType = 'line';
  volumeChartData: ChartData<'line'> = { labels: [], datasets: [] };
  
  riskScoreChartType: ChartType = 'bar';
  riskScoreChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  
  riskDistributionChartType: ChartType = 'doughnut';
  riskDistributionChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  ngOnInit() {
    this.updateMetrics();
    this.updateCharts();
  }

  ngOnChanges() {
    this.updateMetrics();
    this.updateCharts();
  }

  updateMetrics() {
    const total = this.transactions.length;
    const volume = this.transactions.reduce((sum, t) => sum + parseFloat(t.amount?.toString() || '0'), 0);
    const avgRisk = this.transactions.length > 0 
      ? this.transactions.reduce((sum, t) => sum + (t.risk_score || 0), 0) / this.transactions.length 
      : 0;
    const highRisk = this.transactions.filter(t => (t.risk_score || 0) > 70).length;

    this.metrics = {
      totalTransactions: total,
      totalVolume: volume,
      avgRiskScore: avgRisk,
      highRiskCount: highRisk
    };
  }

  updateCharts() {
    // Volume chart
    this.volumeChartData = {
      labels: this.transactions.map((t, i) => `Transaction ${i + 1}`),
      datasets: [
        {
          label: 'Transaction Amount',
          data: this.transactions.map(t => parseFloat(t.amount?.toString() || '0')),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4
        }
      ]
    };

    // Risk score chart
    this.riskScoreChartData = {
      labels: this.transactions.map((t, i) => `Transaction ${i + 1}`),
      datasets: [
        {
          label: 'Risk Score',
          data: this.transactions.map(t => t.risk_score || 0),
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    };

    // Risk distribution chart
    this.riskDistributionChartData = {
      labels: ['Low Risk', 'Medium Risk', 'High Risk'],
      datasets: [
        {
          data: [
            this.transactions.filter(t => (t.risk_score || 0) < 30).length,
            this.transactions.filter(t => (t.risk_score || 0) >= 30 && (t.risk_score || 0) <= 70).length,
            this.transactions.filter(t => (t.risk_score || 0) > 70).length
          ],
          backgroundColor: ['#4CAF50', '#FF9800', '#F44336'],
          borderWidth: 2
        }
      ]
    };
  }

  formatCurrency(amount: number, currency: string): string {
    return formatCurrency(amount, currency);
  }
}