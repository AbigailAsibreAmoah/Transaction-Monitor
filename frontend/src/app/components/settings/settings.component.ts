import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface SettingsConfig {
  notifications: boolean;
  emailAlerts: boolean;
  smsAlerts: boolean;
  budgetWarnings: boolean;
  riskAlerts: boolean;
  transactionLogs: boolean;
  dataExport: boolean;
  apiAccess: boolean;
  twoFactorAuth: boolean;
  biometricAuth: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  @Input() show = false;
  @Output() close = new EventEmitter<void>();
  @Output() settingsChange = new EventEmitter<SettingsConfig>();

  settings: SettingsConfig = {
    notifications: false,
    emailAlerts: false,
    smsAlerts: false,
    budgetWarnings: false,
    riskAlerts: false,
    transactionLogs: false,
    dataExport: false,
    apiAccess: false,
    twoFactorAuth: false,
    biometricAuth: false
  };

  settingsCategories = [
    {
      title: 'Notifications',
      items: [
        { key: 'notifications', label: 'Push Notifications', description: 'Receive push notifications for important events' },
        { key: 'emailAlerts', label: 'Email Alerts', description: 'Get email notifications for transactions' },
        { key: 'smsAlerts', label: 'SMS Alerts', description: 'Receive SMS for high-risk transactions' }
      ]
    },
    {
      title: 'Monitoring',
      items: [
        { key: 'budgetWarnings', label: 'Budget Warnings', description: 'Alert when approaching budget limits' },
        { key: 'riskAlerts', label: 'Risk Alerts', description: 'Notifications for high-risk transactions' },
        { key: 'transactionLogs', label: 'Transaction Logging', description: 'Detailed logging of all transactions' }
      ]
    },
    {
      title: 'Data & Privacy',
      items: [
        { key: 'dataExport', label: 'Data Export', description: 'Allow exporting transaction data' },
        { key: 'apiAccess', label: 'API Access', description: 'Enable third-party API access' }
      ]
    },
    {
      title: 'Security',
      items: [
        { key: 'twoFactorAuth', label: 'Two-Factor Authentication', description: 'Require 2FA for sensitive operations' },
        { key: 'biometricAuth', label: 'Biometric Authentication', description: 'Use fingerprint/face recognition' }
      ]
    }
  ];

  getSetting(key: string): boolean {
    return this.settings[key as keyof SettingsConfig] || false;
  }

  toggleSetting(key: string) {
    const settingKey = key as keyof SettingsConfig;
    this.settings[settingKey] = !this.settings[settingKey];
    this.settingsChange.emit(this.settings);
  }

  closeSettings() {
    this.close.emit();
  }
}