import React, { useState } from 'react';

interface CheckoutPageProps {
  cartTotal: number;
  cartItems: any[];
  onPaymentComplete: (paymentData: any) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ 
  cartTotal, 
  cartItems, 
  onPaymentComplete 
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'paypal'>('credit_card');
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePayment = async () => {
    setError('');
    setProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const paymentData = {
        transactionId,
        amount: cartTotal,
        paymentMethod: paymentMethod,
        customer: formData.fullName || 'Guest',
        email: formData.email || 'guest@example.com',
        items: cartItems || [],
        status: 'completed',
        timestamp: new Date().toISOString(),
        shippingAddress: {
          address: formData.address || 'N/A',
          city: formData.city || 'N/A',
          state: formData.state || 'N/A',
          zipCode: formData.zipCode || 'N/A',
          country: formData.country || 'US'
        },
        cardLast4: paymentMethod === 'credit_card' && formData.cardNumber ? formData.cardNumber.slice(-4) : 'N/A'
      };

      // Save to localStorage
      const existingPayments = JSON.parse(localStorage.getItem('payments') || '[]');
      localStorage.setItem('payments', JSON.stringify([paymentData, ...existingPayments]));

      // Create order
      const orderData = {
        id: `ORD-${Date.now()}`,
        userId: formData.email || 'guest@example.com',
        items: cartItems || [],
        total: cartTotal || 0,
        status: 'paid',
        createdAt: new Date().toISOString(),
        paymentMethod: paymentMethod,
        transactionId: transactionId,
        shippingAddress: formData.address || 'N/A'
      };

      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      localStorage.setItem('orders', JSON.stringify([orderData, ...existingOrders]));

      onPaymentComplete(paymentData);
      setPaymentSuccess(true);
      setProcessing(false);

      setTimeout(() => {
        window.location.href = '/';
      }, 3000);

    } catch (err) {
      console.error('Payment error:', err);
      setError('Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  // If payment is successful, show success message
  if (paymentSuccess) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f3f4f6',
        padding: '20px'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '40px', 
          borderRadius: '8px', 
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>✅</div>
          <h2 style={{ marginBottom: '10px' }}>Payment Successful!</h2>
          <p style={{ color: '#6b7280' }}>Thank you for your order.</p>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '10px' }}>
            Redirecting to home...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f3f4f6', 
      padding: '40px 20px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <div style={{ 
        maxWidth: '900px', 
        width: '100%', 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr',
        gap: '30px'
      }}>
        {/* Left Column - Checkout Form */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '20px' }}>Checkout</h2>
          
          {/* Customer Information */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#374151' }}>Customer Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                name="fullName"
                placeholder="Full Name *"
                value={formData.fullName}
                onChange={handleInputChange}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email *"
                value={formData.email}
                onChange={handleInputChange}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              />
              <input
                type="text"
                name="address"
                placeholder="Shipping Address *"
                value={formData.address}
                onChange={handleInputChange}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input
                  type="text"
                  name="city"
                  placeholder="City *"
                  value={formData.city}
                  onChange={handleInputChange}
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  required
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State *"
                  value={formData.state}
                  onChange={handleInputChange}
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input
                  type="text"
                  name="zipCode"
                  placeholder="Zip Code *"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  required
                />
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#374151' }}>Payment Method</h3>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={() => setPaymentMethod('credit_card')}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: `2px solid ${paymentMethod === 'credit_card' ? '#2563eb' : '#ddd'}`,
                  borderRadius: '8px',
                  background: paymentMethod === 'credit_card' ? '#eff6ff' : 'white',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '24px' }}>💳</div>
                <div style={{ fontSize: '14px', marginTop: '5px' }}>Credit Card</div>
              </button>
              <button
                onClick={() => setPaymentMethod('paypal')}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: `2px solid ${paymentMethod === 'paypal' ? '#2563eb' : '#ddd'}`,
                  borderRadius: '8px',
                  background: paymentMethod === 'paypal' ? '#eff6ff' : 'white',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '24px' }}>💰</div>
                <div style={{ fontSize: '14px', marginTop: '5px' }}>PayPal</div>
              </button>
            </div>
          </div>

          {/* Credit Card Details */}
          {paymentMethod === 'credit_card' && (
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#374151' }}>Card Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  name="cardNumber"
                  placeholder="Card Number *"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  maxLength={16}
                  required
                />
                <input
                  type="text"
                  name="cardName"
                  placeholder="Cardholder Name *"
                  value={formData.cardName}
                  onChange={handleInputChange}
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  required
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input
                    type="text"
                    name="expiryDate"
                    placeholder="MM/YY *"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                    maxLength={5}
                    required
                  />
                  <input
                    type="password"
                    name="cvv"
                    placeholder="CVV *"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                    maxLength={4}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* PayPal Info */}
          {paymentMethod === 'paypal' && (
            <div style={{ 
              background: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '8px',
              textAlign: 'center',
              marginBottom: '25px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>💰</div>
              <p style={{ color: '#6b7280' }}>You will be redirected to PayPal to complete your payment.</p>
            </div>
          )}

          {error && (
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
              {error}
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={processing || !formData.fullName || !formData.email}
            style={{
              width: '100%',
              padding: '14px',
              background: processing ? '#9ca3af' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: processing ? 'not-allowed' : 'pointer'
            }}
          >
            {processing ? 'Processing...' : `Pay $${cartTotal.toFixed(2)}`}
          </button>
        </div>

        {/* Right Column - Order Summary */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', height: 'fit-content' }}>
          <h3 style={{ marginBottom: '20px' }}>Order Summary</h3>
          
          <div style={{ marginBottom: '20px' }}>
            {cartItems && cartItems.length > 0 ? (
              cartItems.map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '10px 0',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <div>
                    <span style={{ fontWeight: '500' }}>{item.product?.name || 'Product'}</span>
                    <span style={{ color: '#6b7280', fontSize: '14px', marginLeft: '10px' }}>× {item.quantity}</span>
                  </div>
                  <span>${((item.product?.wholesalePrice || 0) * item.quantity).toFixed(2)}</span>
                </div>
              ))
            ) : (
              <p style={{ color: '#6b7280' }}>No items in cart</p>
            )}
          </div>

          <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Subtotal</span>
              <span>${(cartTotal || 0).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#6b7280' }}>
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>
              <span>Total</span>
              <span>${(cartTotal || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;