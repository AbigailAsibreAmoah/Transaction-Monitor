import React, { useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

function Dashboard() {
  const [transaction, setTransaction] = useState({ amount: '', merchant: '', currency: 'USD' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      const response = await fetch('https://lpf1gn8aia.execute-api.us-east-1.amazonaws.com/dev/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(transaction)
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Transaction error:', error);
      setResult({ error: 'Failed to process transaction' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <h2>📊 Transaction Monitor</h2>
      
      <form onSubmit={handleSubmit} className="transaction-form">
        <div className="form-group">
          <label>Amount:</label>
          <input
            type="number"
            step="0.01"
            value={transaction.amount}
            onChange={(e) => setTransaction({...transaction, amount: e.target.value})}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Merchant:</label>
          <input
            type="text"
            value={transaction.merchant}
            onChange={(e) => setTransaction({...transaction, merchant: e.target.value})}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Currency:</label>
          <select
            value={transaction.currency}
            onChange={(e) => setTransaction({...transaction, currency: e.target.value})}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Submit Transaction'}
        </button>
      </form>
      
      {result && (
        <div className={`result ${result.error ? 'error' : 'success'}`}>
          {result.error ? (
            <p>❌ Error: {result.error}</p>
          ) : (
            <div>
              <p>✅ Transaction ID: {result.transaction_id}</p>
              <p>🎯 Risk Score: {result.risk_score}</p>
              <p>📊 Status: {result.status}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;