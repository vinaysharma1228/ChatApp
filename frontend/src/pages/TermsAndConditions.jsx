import React from "react";

const TermsAndConditions = () => {
  return (
    <div className="flex items-center justify-center min-h-screen link-primary mt-2">
      <div className="p-8 max-w-3xl bg-gray-300 shadow-lg rounded-lg text-gray-800">
        <h1 className="text-3xl font-bold text-center mb-6">Terms and Conditions</h1>
        
        <p className="mb-4 text-center">
          Welcome to our Real-Time Chat App. By accessing or using our service, you agree to be bound by these Terms and Conditions.
        </p>
        
        <h2 className="text-xl font-semibold mt-6">1. Usage Policy</h2>
        <p className="mb-4">
          Users must communicate respectfully. Harassment, hate speech, or inappropriate behavior will result in an immediate ban.
        </p>

        <h2 className="text-xl font-semibold mt-6">2. Data Privacy</h2>
        <p className="mb-4">
          We value your privacy and do not share your personal data with third parties. Any information collected is used only to improve your experience.
        </p>

        <h2 className="text-xl font-semibold mt-6">3. User Responsibilities</h2>
        <p className="mb-4">
          - You are responsible for keeping your login credentials secure.<br />
          - You agree not to use our platform for illegal or unauthorized purposes.<br />
          - Any violation of our rules may result in suspension or account termination.
        </p>

        <h2 className="text-xl font-semibold mt-6">4. Prohibited Activities</h2>
        <p className="mb-4">
          Users must not:
          <ul className="list-disc ml-5 mt-2">
            <li>Impersonate other users or entities.</li>
            <li>Share or distribute harmful content (malware, viruses, etc.).</li>
            <li>Use automated bots or scripts to access the platform.</li>
            <li>Engage in fraudulent activities.</li>
          </ul>
        </p>

       

        <h2 className="text-xl font-semibold mt-6">6. Updates to Terms</h2>
        <p className="mb-4">
          These terms may be updated periodically. Users will be notified of any major changes.
        </p>

       
      </div>
    </div>
  );
};

export default TermsAndConditions;
