import React, { useState, useEffect } from 'react';

interface Payment {
  transactionId: string;
  amount: number;
  paymentMethod: string;
  customer: string;
  email: string;
  status: string;
  timestamp: string;
  items: any[];
  cardLast4: string;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export const AdminPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
    const interval = setInterval(loadPayments, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadPayments = () => {
    try {
      const savedPayments = JSON.parse(localStorage.getItem('payments') || '[]');
      setPayments(savedPayments);
      setLoading(false);
    } catch (error) {
      console.error('Error loading payments:', error);
      setPayments([]);
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, React.CSSProperties> = {
      completed: { background: '#d1fae5', color: '#065f46' },
      pending: { background: '#fef3c7', color: '#92400e' },
      failed: { background: '#fee2e2', color: '#991b1b' }
    };
    return colors[status] || { background: '#f3f4f6', color: '#374151' };
  };

  const filteredPayments = filter === 'all' ? payments : payments.filter(p => p.status === filter);
  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading payments...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>💳 Payment Transactions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ background: '#d1fae5', padding: '8px 16px', borderRadius: '8px', fontSize: '14px' }}>
            💰 Total: ${totalRevenue.toFixed(2)}
          </span>
          <span style={{ background: '#dbeafe', padding: '8px 16px', borderRadius: '8px', fontSize: '14px' }}>
            📊 {payments.length} transactions
          </span>
        </div>
      </div>

      {/* Filter Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['all', 'completed', 'pending', 'failed'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            style={{
              padding: '8px 16px',
              background: filter === status ? '#2563eb' : '#e5e7eb',
              color: filter === status ? 'white' : '#374151',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        {filteredPayments.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            <p>No payments found</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              Payments will appear here when customers complete transactions.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Transaction ID
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Customer
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Amount
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Method
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Status
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500' }}>
                      {payment.transactionId || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                      <div>{payment.customer || 'Guest'}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{payment.email || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 'bold', color: '#2563eb' }}>
                      ${(payment.amount || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                      {payment.paymentMethod === 'credit_card' ? '💳 Credit Card' : '💰 PayPal'}
                      {payment.cardLast4 && payment.cardLast4 !== 'N/A' && (
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>•••• {payment.cardLast4}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        display: 'inline-block',
                        ...getStatusBadge(payment.status || 'pending')
                      }}>
                        {payment.status || 'pending'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                      {payment.timestamp ? new Date(payment.timestamp).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Real-time Status Indicator */}
      <div style={{ 
        marginTop: '20px', 
        padding: '16px', 
        background: 'white', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap'
      }}>
        <span style={{ 
          display: 'inline-block', 
          width: '10px', 
          height: '10px', 
          background: '#10b981', 
          borderRadius: '50%',
          animation: 'pulse 2s infinite'
        }}></span>
        <span style={{ fontSize: '14px', color: '#374151' }}>
          Real-time updates: {payments.length} total transactions
        </span>
        <span style={{ fontSize: '14px', color: '#6b7280' }}>
          Last updated: {new Date().toLocaleTimeString()}
        </span>
        <button
          onClick={loadPayments}
          style={{
            marginLeft: 'auto',
            padding: '4px 12px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Refresh
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default AdminPayments;