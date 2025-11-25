import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsOfServicePage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <svg
              className="w-10 h-10 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Terms of Service
          </h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              By accessing and using the Math Bridge platform ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Math Bridge is an online tutoring platform that connects students with qualified tutors for mathematics education. The Service includes but is not limited to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Online tutoring sessions via video conferencing</li>
              <li>Curriculum management and lesson planning</li>
              <li>Progress tracking and reporting</li>
              <li>Payment processing for tutoring services</li>
              <li>Communication tools between parents, tutors, and students</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To use certain features of the Service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password and identification</li>
              <li>Accept all responsibility for activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. User Responsibilities</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              As a user of the Service, you agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Use the Service only for lawful purposes and in accordance with these Terms</li>
              <li>Not engage in any activity that interferes with or disrupts the Service</li>
              <li>Not attempt to gain unauthorized access to any portion of the Service</li>
              <li>Respect the intellectual property rights of others</li>
              <li>Maintain appropriate conduct during tutoring sessions</li>
              <li>Provide accurate information about students and their educational needs</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Tutor Responsibilities</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Tutors using the Service agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide accurate qualifications and credentials</li>
              <li>Maintain professional conduct during all sessions</li>
              <li>Prepare appropriate lesson materials and follow the curriculum</li>
              <li>Submit timely reports and feedback as required</li>
              <li>Respect student privacy and confidentiality</li>
              <li>Adhere to scheduled session times or provide adequate notice for cancellations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Payment Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Payment for tutoring services is processed through the platform's payment system. You agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Pay all fees associated with your use of the Service</li>
              <li>Provide accurate payment information</li>
              <li>Authorize us to charge your payment method for services rendered</li>
              <li>Understand that all fees are non-refundable except as required by law or as specified in our refund policy</li>
              <li>Accept that prices may change with reasonable notice</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cancellation and Refund Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Cancellation and refund requests are subject to the following terms:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Cancellations must be made at least 24 hours before a scheduled session</li>
              <li>Refunds may be issued for cancelled sessions in accordance with our refund policy</li>
              <li>No-shows may result in forfeiture of session fees</li>
              <li>Package purchases may be subject to specific refund terms as outlined at the time of purchase</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The Service and its original content, features, and functionality are owned by Math Bridge and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Reproduce, distribute, or create derivative works from the Service</li>
              <li>Use our trademarks or logos without written permission</li>
              <li>Remove any copyright or proprietary notices from materials</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Privacy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your use of the Service is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices regarding the collection and use of your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Prohibited Uses</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You may not use the Service:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>In any way that violates any applicable law or regulation</li>
              <li>To transmit any malicious code or harmful software</li>
              <li>To impersonate or attempt to impersonate another user or entity</li>
              <li>To engage in any form of harassment, abuse, or inappropriate conduct</li>
              <li>To collect or store personal data about other users without permission</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. Upon termination, your right to use the Service will cease immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Disclaimer of Warranties</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The Service is provided "as is" and "as available" without any warranties of any kind, either express or implied. We do not guarantee that the Service will be uninterrupted, secure, or error-free, or that defects will be corrected.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To the maximum extent permitted by law, Math Bridge shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Math Bridge operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us through the contact information provided on our platform.
            </p>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-8 border-t border-gray-200 flex justify-center">
          <button
            onClick={handleGoBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;

