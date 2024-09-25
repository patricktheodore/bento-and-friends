import React from 'react';

const RollingBanner: React.FC = () => {
  const bundleInfo = [
    "Order 2 meals, get 5% off!",
    "Order 3-4 meals, get 10% off!",
    "Order 5+ meals, get 20% off!",
    "Bundle and save on your Bento orders today!"
  ];

  return (
    <div className="rolling-banner bg-brand-dark-green text-brand-cream py-2 overflow-hidden">
      <div className="banner-content text-xs">
        {bundleInfo.map((info, index) => (
          <span key={index} className="mx-8">{info}</span>
        ))}
        {bundleInfo.map((info, index) => (
          <span key={index + bundleInfo.length} className="mx-8">{info}</span>
        ))}
      </div>
    </div>
  );
};

export default RollingBanner;