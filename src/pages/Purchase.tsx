import { Link } from 'react-router-dom';

const NORMAL_PRICE = 299;
const OFFER_PRICE = 59;

export default function Purchase() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-loam-neutral to-loam-neutral px-4 py-12">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Start your full HomeRun journey</h1>
          <p className="text-gray-600 mb-8">
            Get the full program with AI coaching and the HomeRun framework. Normally $299. Get 80% off for a limited time when you purchase now.
          </p>
          <div className="mb-8 flex items-center justify-center gap-3">
            <span className="text-2xl text-gray-400 line-through">${NORMAL_PRICE}</span>
            <span className="text-4xl font-bold text-loam-brown">${OFFER_PRICE}</span>
          </div>
          <p className="text-sm text-gray-500 mb-8">
            80% off — limited time. Full access to the HomeRun program.
          </p>
          <a
            href={import.meta.env.VITE_PURCHASE_URL || '#'}
            className="block w-full bg-loam-brown text-white py-4 px-6 rounded-loam text-lg font-semibold hover:bg-loam-brown/90 focus:outline-none focus:ring-2 focus:ring-loam-brown focus:ring-offset-2 transition text-center"
          >
            Purchase now — $59
          </a>
          <p className="mt-6 text-sm text-gray-500">
            You&apos;ll need to create an account or log in after purchase to access the full journey.
          </p>
          <Link to="/" className="mt-6 inline-block text-gray-500 hover:text-gray-700 text-sm">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
