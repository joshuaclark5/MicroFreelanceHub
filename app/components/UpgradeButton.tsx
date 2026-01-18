'use client';

export default function UpgradeButton() {
  const handleUpgrade = () => {
    // Your specific Stripe Link
    window.location.href = 'https://buy.stripe.com/test_7sY5kx4OPbmw2Yi5RY'; 
  };

  return (
    <button 
      onClick={handleUpgrade}
      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-all flex items-center gap-2"
    >
      <span>⚡ Upgrade to Pro ($19)</span>
    </button>
  );
}