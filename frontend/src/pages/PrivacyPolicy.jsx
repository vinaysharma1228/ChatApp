import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="flex items-center justify-center min-h-screen mt-6">
      <div className="p-8 max-w-3xl bg-gray-200 shadow-lg rounded-lg text-gray-800">
        <h1 className="text-3xl font-bold text-center mb-6">Privacy Policy</h1>
        
        <p className="mb-4 text-center">
          Your privacy is important to us. This policy explains how we collect, use, and protect your personal data.
        </p>
        
        <h2 className="text-xl font-semibold mt-6">1. Data Collection</h2>
        <p className="mb-4">
          We collect only necessary information, such as your name, email, and login credentials for account creation and communication.
        </p>

        <h2 className="text-xl font-semibold mt-6">2. How We Use Your Data</h2>
        <p className="mb-4">
          Your data is used to provide and improve our services, personalize your experience, and communicate important updates.
        </p>

        <h2 className="text-xl font-semibold mt-6">3. Data Security</h2>
        <p className="mb-4">
          - We implement strict security measures to prevent unauthorized access to your data.<br />
          - Your passwords are securely stored using encryption.<br />
          - We do not sell or share your data with third parties without consent.
        </p>

        <h2 className="text-xl font-semibold mt-6">4. Cookies and Tracking</h2>
        <p className="mb-4">
          We may use cookies to enhance your experience, but you can disable them in your browser settings.
        </p>

        <h2 className="text-xl font-semibold mt-6">5. Your Rights</h2>
        <p className="mb-4">
          - You can request access, correction, or deletion of your data.<br />
          - You have the right to withdraw consent for data collection at any time.<br />
          - Contact us if you have concerns about your privacy.
        </p>

        <h2 className="text-xl font-semibold mt-6">6. Policy Updates</h2>
        <p className="mb-4">
          This policy may be updated periodically. We will notify you of any major changes.
        </p>

       
      </div>
    </div>
  );
};

export default PrivacyPolicy;
