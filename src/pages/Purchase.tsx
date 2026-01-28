import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useConversation } from '@/hooks/useConversation';
import { preAssessments } from '@/lib/supabase';
import { JourneyType } from '@/types/conversation';

const NORMAL_PRICE = 299;
const OFFER_PRICE = 59;

export default function Purchase() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { startNewConversation, conversation } = useConversation(user?.id);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Billing information
  const [billingName, setBillingName] = useState('');
  const [billingEmail, setBillingEmail] = useState(user?.email || '');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [billingCountry, setBillingCountry] = useState('United States');

  // Payment information
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19);
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!billingName.trim()) newErrors.billingName = 'Name is required';
    if (!billingEmail.trim()) newErrors.billingEmail = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) newErrors.billingEmail = 'Invalid email format';
    if (!billingAddress.trim()) newErrors.billingAddress = 'Address is required';
    if (!billingCity.trim()) newErrors.billingCity = 'City is required';
    if (!billingState.trim()) newErrors.billingState = 'State is required';
    if (!billingZip.trim()) newErrors.billingZip = 'ZIP code is required';
    if (!billingCountry.trim()) newErrors.billingCountry = 'Country is required';

    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    if (!cleanedCardNumber) newErrors.cardNumber = 'Card number is required';
    else if (cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19) newErrors.cardNumber = 'Invalid card number';
    
    if (!cardExpiry) newErrors.cardExpiry = 'Expiry date is required';
    else if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) newErrors.cardExpiry = 'Format: MM/YY';
    
    if (!cardCvv) newErrors.cardCvv = 'CVV is required';
    else if (cardCvv.length < 3 || cardCvv.length > 4) newErrors.cardCvv = 'Invalid CVV';
    
    if (!cardholderName.trim()) newErrors.cardholderName = 'Cardholder name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Check if user is authenticated
    if (!user) {
      navigate('/login', { state: { from: '/purchase' } });
      return;
    }

    setLoading(true);

    // TODO: Replace with Stripe payment processing
    // 1. Initialize Stripe with publishable key: const stripe = await loadStripe(VITE_STRIPE_PUBLISHABLE_KEY);
    // 2. Create payment intent via backend API: const { clientSecret } = await createPaymentIntent({ amount: 5900, currency: 'usd' });
    // 3. Confirm payment with Stripe Elements: await stripe.confirmCardPayment(clientSecret, { payment_method: { card: cardElement } });
    // 4. Handle success/error and redirect to success page or show error

    // For now: simulate processing delay
    setTimeout(async () => {
      const formData = {
        billing: {
          name: billingName,
          email: billingEmail,
          address: billingAddress,
          city: billingCity,
          state: billingState,
          zip: billingZip,
          country: billingCountry,
        },
        payment: {
          cardNumber: cardNumber.replace(/\s/g, ''),
          expiry: cardExpiry,
          cvv: cardCvv,
          cardholderName,
        },
      };
      
      console.log('Form data (ready for Stripe):', formData);

      try {
        // Fetch pre-assessment to get journey type
        const { data: preAssessment } = await preAssessments.getPreAssessment(user.id);
        
        // Determine journey type from pre-assessment or default to 'personal'
        const journeyType: JourneyType = (preAssessment?.recommended_path as JourneyType) || 'personal';

        // Ensure conversation exists (create if needed)
        if (!conversation) {
          const { error: convError } = await startNewConversation(journeyType);
          if (convError) {
            console.error('Failed to create conversation:', convError);
            // Still redirect - AtBat will handle missing conversation gracefully
          }
        }

        // Redirect to AtBat to begin coaching journey
        navigate('/at-bat');
      } catch (error) {
        console.error('Error setting up conversation:', error);
        // Still redirect - AtBat will handle errors gracefully
        navigate('/at-bat');
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  // Show loading state while processing
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-loam-neutral to-loam-neutral px-4 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-loam-brown mb-4"></div>
          <p className="text-gray-600">Processing your purchase...</p>
        </div>
      </div>
    );
  }

  // Check authentication (show loading while checking)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-loam-neutral to-loam-neutral px-4 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-loam-brown mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-loam-neutral to-loam-neutral px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8 pb-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete your purchase</h1>
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="text-xl text-gray-400 line-through">${NORMAL_PRICE}</span>
              <span className="text-3xl font-bold text-loam-brown">${OFFER_PRICE}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Billing Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing Information</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="billing-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      id="billing-name"
                      type="text"
                      value={billingName}
                      onChange={(e) => setBillingName(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-loam focus:ring-2 focus:ring-loam-brown focus:border-transparent transition ${
                        errors.billingName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="John Doe"
                      required
                    />
                    {errors.billingName && <p className="mt-1 text-sm text-red-600">{errors.billingName}</p>}
                  </div>

                  <div>
                    <label htmlFor="billing-email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      id="billing-email"
                      type="email"
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-loam focus:ring-2 focus:ring-loam-brown focus:border-transparent transition ${
                        errors.billingEmail ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="you@example.com"
                      required
                    />
                    {errors.billingEmail && <p className="mt-1 text-sm text-red-600">{errors.billingEmail}</p>}
                  </div>

                  <div>
                    <label htmlFor="billing-address" className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address *
                    </label>
                    <input
                      id="billing-address"
                      type="text"
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-loam focus:ring-2 focus:ring-loam-brown focus:border-transparent transition ${
                        errors.billingAddress ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="123 Main St"
                      required
                    />
                    {errors.billingAddress && <p className="mt-1 text-sm text-red-600">{errors.billingAddress}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="billing-city" className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        id="billing-city"
                        type="text"
                        value={billingCity}
                        onChange={(e) => setBillingCity(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-loam focus:ring-2 focus:ring-loam-brown focus:border-transparent transition ${
                          errors.billingCity ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="City"
                        required
                      />
                      {errors.billingCity && <p className="mt-1 text-sm text-red-600">{errors.billingCity}</p>}
                    </div>

                    <div>
                      <label htmlFor="billing-state" className="block text-sm font-medium text-gray-700 mb-1">
                        State *
                      </label>
                      <input
                        id="billing-state"
                        type="text"
                        value={billingState}
                        onChange={(e) => setBillingState(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-loam focus:ring-2 focus:ring-loam-brown focus:border-transparent transition ${
                          errors.billingState ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="State"
                        required
                      />
                      {errors.billingState && <p className="mt-1 text-sm text-red-600">{errors.billingState}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="billing-zip" className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code *
                      </label>
                      <input
                        id="billing-zip"
                        type="text"
                        value={billingZip}
                        onChange={(e) => setBillingZip(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-loam focus:ring-2 focus:ring-loam-brown focus:border-transparent transition ${
                          errors.billingZip ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="12345"
                        required
                      />
                      {errors.billingZip && <p className="mt-1 text-sm text-red-600">{errors.billingZip}</p>}
                    </div>

                    <div>
                      <label htmlFor="billing-country" className="block text-sm font-medium text-gray-700 mb-1">
                        Country *
                      </label>
                      <input
                        id="billing-country"
                        type="text"
                        value={billingCountry}
                        onChange={(e) => setBillingCountry(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-loam focus:ring-2 focus:ring-loam-brown focus:border-transparent transition ${
                          errors.billingCountry ? 'border-red-300' : 'border-gray-300'
                        }`}
                        required
                      />
                      {errors.billingCountry && <p className="mt-1 text-sm text-red-600">{errors.billingCountry}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Information</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="card-number" className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number *
                    </label>
                    <input
                      id="card-number"
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      className={`w-full px-4 py-3 border rounded-loam focus:ring-2 focus:ring-loam-brown focus:border-transparent transition ${
                        errors.cardNumber ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                    />
                    {errors.cardNumber && <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="card-expiry" className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date *
                      </label>
                      <input
                        id="card-expiry"
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        className={`w-full px-4 py-3 border rounded-loam focus:ring-2 focus:ring-loam-brown focus:border-transparent transition ${
                          errors.cardExpiry ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                      />
                      {errors.cardExpiry && <p className="mt-1 text-sm text-red-600">{errors.cardExpiry}</p>}
                    </div>

                    <div>
                      <label htmlFor="card-cvv" className="block text-sm font-medium text-gray-700 mb-1">
                        CVV *
                      </label>
                      <input
                        id="card-cvv"
                        type="text"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className={`w-full px-4 py-3 border rounded-loam focus:ring-2 focus:ring-loam-brown focus:border-transparent transition ${
                          errors.cardCvv ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="123"
                        maxLength={4}
                        required
                      />
                      {errors.cardCvv && <p className="mt-1 text-sm text-red-600">{errors.cardCvv}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="cardholder-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Cardholder Name *
                    </label>
                    <input
                      id="cardholder-name"
                      type="text"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-loam focus:ring-2 focus:ring-loam-brown focus:border-transparent transition ${
                        errors.cardholderName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Name on card"
                      required
                    />
                    {errors.cardholderName && <p className="mt-1 text-sm text-red-600">{errors.cardholderName}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg text-gray-600">Total</span>
                <div className="flex items-center gap-3">
                  <span className="text-xl text-gray-400 line-through">${NORMAL_PRICE}</span>
                  <span className="text-3xl font-bold text-loam-brown">${OFFER_PRICE}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-loam-brown text-white py-4 px-6 rounded-loam text-lg font-semibold hover:bg-loam-brown/90 focus:outline-none focus:ring-2 focus:ring-loam-brown focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : `Complete purchase — $${OFFER_PRICE}`}
              </button>

              <Link to="/" className="mt-4 block text-center text-gray-500 hover:text-gray-700 text-sm">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
