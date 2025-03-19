import React from "react";

const AboutUs = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-8 max-w-3xl bg-gray-200 shadow-lg rounded-lg text-gray-800">
        <h1 className="text-3xl font-bold text-center mb-6">About Us</h1>
        
        <p className="text-center mb-4">
          We are a passionate team dedicated to providing a seamless and secure real-time chat experience.
        </p>
        
        <h2 className="text-xl font-semibold mt-6">Our Mission</h2>
        <p className="mb-4">
          To create a reliable, user-friendly, and engaging chat platform that connects people worldwide.
        </p>

        <h2 className="text-xl font-semibold mt-6">Our Values</h2>
        <ul className="list-disc list-inside mb-4">
          <li><strong>Security:</strong> We prioritize user privacy and data protection.</li>
          <li><strong>Innovation:</strong> Constantly improving our chat features.</li>
          <li><strong>Community:</strong> Building a friendly and inclusive environment.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">Meet Our Team</h2>
        <p className="mb-4">
          Our team consists of skilled developers, designers, and support staff who are committed to delivering the best chat experience.
        </p>

        <h2 className="text-xl font-semibold mt-6">Contact Us</h2>
        <p className="mb-4">
          <strong>Email:</strong> <a href="mailto:support@chatapp.com" className="text-blue-500">support@chatapp.com</a><br />
          <strong>Support Hours:</strong> Mon - Fri, 9 AM - 6 PM (UTC)
        </p>

        <p className="text-center mt-6 text-sm text-gray-600">
          Last updated: March 2025
        </p>
      </div>
    </div>
  );
};

export default AboutUs;
