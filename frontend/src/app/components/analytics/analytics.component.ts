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

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit, OnChanges {
  @Input() transactions: Transaction[] = [];
  
  get spendingInsights() {
    if (this.transactions.length === 0) return [];
    
    const insights = [];
    
    // Day of week analysis
    const daySpending = this.transactions.reduce((acc, t) => {
      const day = new Date(t.timestamp || Date.now()).getDay();
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
      acc[dayName] = (acc[dayName] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const topDay = Object.entries(daySpending).sort(([,a], [,b]) => b - a)[0];
    if (topDay) {
      const isWeekend = topDay[0] === 'Saturday' || topDay[0] === 'Sunday';
      insights.push(`You spend most on ${topDay[0]}s ${isWeekend ? '(weekends)' : '(weekdays)'}`);
    }
    
    // Time of day analysis
    const hourSpending = this.transactions.reduce((acc, t) => {
      const hour = new Date(t.timestamp || Date.now()).getHours();
      let period = 'Morning';
      if (hour >= 12 && hour < 17) period = 'Afternoon';
      else if (hour >= 17 && hour < 21) period = 'Evening';
      else if (hour >= 21 || hour < 6) period = 'Night';
      acc[period] = (acc[period] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const topTime = Object.entries(hourSpending).sort(([,a], [,b]) => b - a)[0];
    if (topTime) {
      insights.push(`Most active during ${topTime[0].toLowerCase()} hours`);
    }
    
    // Risk behavior
    const avgRisk = this.transactions.reduce((sum, t) => sum + (t.risk_score || 0), 0) / this.transactions.length;
    if (avgRisk > 50) {
      insights.push('⚠️ Higher than average risk profile');
    } else if (avgRisk < 20) {
      insights.push('✅ Very conservative spending pattern');
    }
    
    // Merchant diversity
    const uniqueMerchants = new Set(this.transactions.map(t => t.merchant)).size;
    const merchantDiversity = uniqueMerchants / this.transactions.length;
    if (merchantDiversity > 0.7) {
      insights.push('🌟 High merchant diversity - you shop around!');
    } else if (merchantDiversity < 0.3) {
      insights.push('🔄 You tend to stick to familiar merchants');
    }
    
    return insights;
  }
  
  get merchantRiskProfiles() {
    const merchantData = this.transactions.reduce((acc, t) => {
      if (!acc[t.merchant]) {
        acc[t.merchant] = { transactions: [], totalAmount: 0, avgRisk: 0 };
      }
      acc[t.merchant].transactions.push(t);
      acc[t.merchant].totalAmount += t.amount;
      return acc;
    }, {} as Record<string, any>);
    
    return Object.entries(merchantData).map(([merchant, data]) => {
      const avgRisk = data.transactions.reduce((sum: number, t: Transaction) => sum + (t.risk_score || 0), 0) / data.transactions.length;
      return {
        merchant,
        count: data.transactions.length,
        totalAmount: data.totalAmount,
        avgRisk: Math.round(avgRisk),
        riskLevel: avgRisk > 70 ? 'High' : avgRisk > 30 ? 'Medium' : 'Low'
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);
  }

  // Detailed metrics
  detailedMetrics = {
    totalTransactions: 0,
    totalVolume: 0,
    avgRiskScore: 0,
    highRiskCount: 0,
    mediumRiskCount: 0,
    lowRiskCount: 0,
    avgTransactionAmount: 0,
    largestTransaction: 0,
    smallestTransaction: 0,
    flaggedPercentage: 0,
    currencyBreakdown: {} as {[key: string]: {count: number, volume: number}},
    merchantBreakdown: {} as {[key: string]: {count: number, volume: number, avgRisk: number}}
  };

  // Chart configurations
  volumeChartType: ChartType = 'line';
  volumeChartData: ChartData<'line'> = { labels: [], datasets: [] };
  
  riskScoreChartType: ChartType = 'bar';
  riskScoreChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  
  riskDistributionChartType: ChartType = 'doughnut';
  riskDistributionChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };

  currencyChartType: ChartType = 'pie';
  currencyChartData: ChartData<'pie'> = { labels: [], datasets: [] };

  merchantChartType: ChartType = 'bar';
  merchantChartData: ChartData<'bar'> = { labels: [], datasets: [] };

  timeSeriesChartType: ChartType = 'line';
  timeSeriesChartData: ChartData<'line'> = { labels: [], datasets: [] };

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
    this.updateAnalytics();
  }

  ngOnChanges() {
    this.updateAnalytics();
  }

  updateAnalytics() {
    this.calculateDetailedMetrics();
    this.updateAllCharts();
  }

  calculateDetailedMetrics() {
    const total = this.transactions.length;
    const amounts = this.transactions.map(t => t.amount || 0);
    const volume = amounts.reduce((sum, amount) => sum + amount, 0);
    const avgRisk = total > 0 ? this.transactions.reduce((sum, t) => sum + (t.risk_score || 0), 0) / total : 0;
    
    const highRisk = this.transactions.filter(t => (t.risk_score || 0) > 70).length;
    const mediumRisk = this.transactions.filter(t => (t.risk_score || 0) >= 30 && (t.risk_score || 0) <= 70).length;
    const lowRisk = this.transactions.filter(t => (t.risk_score || 0) < 30).length;

    // Currency breakdown
    const currencyBreakdown: {[key: string]: {count: number, volume: number}} = {};
    this.transactions.forEach(t => {
      if (!currencyBreakdown[t.currency]) {
        currencyBreakdown[t.currency] = { count: 0, volume: 0 };
      }
      currencyBreakdown[t.currency].count++;
      currencyBreakdown[t.currency].volume += t.amount || 0;
    });

    // Merchant breakdown
    const merchantBreakdown: {[key: string]: {count: number, volume: number, avgRisk: number}} = {};
    this.transactions.forEach(t => {
      if (!merchantBreakdown[t.merchant]) {
        merchantBreakdown[t.merchant] = { count: 0, volume: 0, avgRisk: 0 };
      }
      merchantBreakdown[t.merchant].count++;
      merchantBreakdown[t.merchant].volume += t.amount || 0;
    });

    // Calculate average risk per merchant
    Object.keys(merchantBreakdown).forEach(merchant => {
      const merchantTransactions = this.transactions.filter(t => t.merchant === merchant);
      const totalRisk = merchantTransactions.reduce((sum, t) => sum + (t.risk_score || 0), 0);
      merchantBreakdown[merchant].avgRisk = merchantTransactions.length > 0 ? totalRisk / merchantTransactions.length : 0;
    });

    this.detailedMetrics = {
      totalTransactions: total,
      totalVolume: volume,
      avgRiskScore: avgRisk,
      highRiskCount: highRisk,
      mediumRiskCount: mediumRisk,
      lowRiskCount: lowRisk,
      avgTransactionAmount: total > 0 ? volume / total : 0,
      largestTransaction: amounts.length > 0 ? Math.max(...amounts) : 0,
      smallestTransaction: amounts.length > 0 ? Math.min(...amounts) : 0,
      flaggedPercentage: total > 0 ? (highRisk / total) * 100 : 0,
      currencyBreakdown,
      merchantBreakdown
    };
  }

  updateAllCharts() {
    // Volume trend chart
    this.volumeChartData = {
      labels: this.transactions.map((t, i) => `T${i + 1}`),
      datasets: [
        {
          label: 'Transaction Amount',
          data: this.transactions.map(t => t.amount || 0),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };

    // Risk score distribution
    this.riskScoreChartData = {
      labels: this.transactions.map((t, i) => `Transaction ${i + 1}`),
      datasets: [
        {
          label: 'Risk Score',
          data: this.transactions.map(t => t.risk_score || 0),
          backgroundColor: this.transactions.map(t => {
            const risk = t.risk_score || 0;
            if (risk > 70) return '#ef4444';
            if (risk > 30) return '#f59e0b';
            return '#10b981';
          }),
          borderWidth: 1
        }
      ]
    };

    // Risk distribution pie
    this.riskDistributionChartData = {
      labels: ['Low Risk (0-30)', 'Medium Risk (31-70)', 'High Risk (71-100)'],
      datasets: [
        {
          data: [
            this.detailedMetrics.lowRiskCount,
            this.detailedMetrics.mediumRiskCount,
            this.detailedMetrics.highRiskCount
          ],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderWidth: 2
        }
      ]
    };

    // Currency distribution
    const currencies = Object.keys(this.detailedMetrics.currencyBreakdown);
    this.currencyChartData = {
      labels: currencies,
      datasets: [
        {
          data: currencies.map(c => this.detailedMetrics.currencyBreakdown[c].volume),
          backgroundColor: [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
            '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
          ],
          borderWidth: 2
        }
      ]
    };

    // Top merchants by volume
    const merchants = Object.keys(this.detailedMetrics.merchantBreakdown)
      .sort((a, b) => this.detailedMetrics.merchantBreakdown[b].volume - this.detailedMetrics.merchantBreakdown[a].volume)
      .slice(0, 10);
    
    this.merchantChartData = {
      labels: merchants,
      datasets: [
        {
          label: 'Transaction Volume',
          data: merchants.map(m => this.detailedMetrics.merchantBreakdown[m].volume),
          backgroundColor: '#3b82f6',
          borderColor: '#1e40af',
          borderWidth: 1
        }
      ]
    };

    // Time series (if timestamps available)
    const timeData = this.transactions
      .filter(t => t.timestamp)
      .sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime())
      .map(t => ({
        time: new Date(t.timestamp!).toLocaleTimeString(),
        amount: t.amount || 0,
        risk: t.risk_score || 0
      }));

    this.timeSeriesChartData = {
      labels: timeData.map(d => d.time),
      datasets: [
        {
          label: 'Transaction Amount',
          data: timeData.map(d => d.amount),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          yAxisID: 'y'
        },
        {
          label: 'Risk Score',
          data: timeData.map(d => d.risk),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          yAxisID: 'y1'
        }
      ]
    };
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return formatCurrency(amount, currency);
  }

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }
}