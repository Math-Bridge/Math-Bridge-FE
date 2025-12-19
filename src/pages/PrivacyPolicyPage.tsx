import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Privacy Policy for Parents
          </h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p className="text-sm text-gray-500 mt-2 italic">
            This Privacy Policy applies specifically to parents using the Math Bridge platform.
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Math Bridge ("we", "our", or "us") is committed to protecting your privacy and the privacy of your children. This Privacy Policy for Parents explains how we collect, use, disclose, and safeguard your information and your children's information when you use our online and offline tutoring platform. As a parent, you are responsible for all children you add to the system. Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.1 Your Personal Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              As a parent, we collect personal information that you provide when you:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Register for an account (name, email address, phone number from 10-15 digits)</li>
              <li>Create your profile (profile picture, geographic location)</li>
              <li>Make payments (billing address, payment information for direct payment or wallet payment methods)</li>
              <li>Communicate with us (support requests, feedback, tutor reports)</li>
              <li>Login for the first time (you must update your location after first login)</li>
              <li>Create contracts for your children</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              <strong>Account Information:</strong> All new registrations (regular and Google) default to Parent role (RoleId = 3). You must verify your email before being able to create an account and login. New users are initialized with WalletBalance = 0.00 and Status = "active".
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.2 Your Children's Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Important:</strong> You must take responsibility for all children you add to the system. Children are associated with your parent user account. For each child you add, we collect:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Child's name and date of birth (<strong>You cannot have 2 children with the same name and birthday</strong>)</li>
              <li>Academic performance and test scores (<strong>All tests taken by children must be recorded in the system</strong>)</li>
              <li>Progress reports and session notes from tutors</li>
              <li>Assigned center information (if applicable for offline contracts)</li>
              <li>Contract history and session records</li>
              <li>Reschedule requests and refund information</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
              <strong>Parent Responsibility:</strong> You must collaborate with the system and supervise your children to ensure the quality of tutoring services. You are responsible for all information and actions related to children you add to your account.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.3 Automatically Collected Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you access the Service, we may automatically collect certain information, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Device information (IP address, browser type, operating system)</li>
              <li>Usage data (pages visited, time spent, features used)</li>
              <li>Cookies and similar tracking technologies</li>
              <li>Log files and analytics data</li>
              <li>Geographic location information (to ensure offline contracts are within center range)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the information collected from you and your children to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide, maintain, and improve our tutoring services (1-on-1 offline and online)</li>
              <li>Process payment transactions using direct payment or wallet payment methods</li>
              <li>Match your children with appropriate tutors (main tutor and substitute tutors)</li>
              <li>Schedule and manage tutoring sessions (system ensures 90% of sessions will be conducted)</li>
              <li>Manage contracts and ensure no overlapping contracts for your children</li>
              <li>Process reschedule requests (reschedule requests must be within the limit of the contract)</li>
              <li>Process refunds when necessary (refund at the price of a single session to your wallet if no tutors available for rescheduling)</li>
              <li>Send administrative information and updates about contracts and sessions</li>
              <li>Respond to your requests and provide customer support</li>
              <li>Handle tutor reports (when you report a tutor, you must attach evidence for the best outcome)</li>
              <li>Monitor for malicious activities (contracts may be terminated if malicious activity is detected)</li>
              <li>Comply with legal obligations and enforce our Terms of Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.1 Service Providers</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may share information with third-party service providers who perform services on our behalf, such as:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Payment processing (supporting both direct payment and wallet payment methods)</li>
              <li>Video conferencing services (Zoom or Google Meet for online sessions)</li>
              <li>Cloud storage and hosting</li>
              <li>Analytics and data analysis</li>
              <li>Email and communication services</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.2 Tutors and Staff</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              To facilitate tutoring services, we may share relevant information with:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Tutors assigned to your children for session coordination and teaching</li>
              <li>Progress reports and educational assessments (all test results are recorded in the system)</li>
              <li>Communication necessary for service delivery</li>
              <li>Session reports (tutors must report after each and every session)</li>
              <li>Staff members who handle reschedule requests, contract management, and support</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.3 Legal Requirements</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may disclose your information if required to do so by law or in response to valid requests by public authorities.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.4 Business Transfers</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication and access controls (role-based access: Admin, Staff, Tutor, Parent)</li>
              <li>Regular security assessments and updates</li>
              <li>Employee training on data protection</li>
              <li>Incident response procedures</li>
              <li>Monitoring for malicious activities (contracts may be terminated if malicious activity is detected)</li>
              <li>Account status management (users with "banned" status cannot login)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your information, we will securely delete or anonymize it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights and Choices</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request transfer of your data to another service</li>
              <li><strong>Objection:</strong> Object to processing of your personal information</li>
              <li><strong>Restriction:</strong> Request restriction of processing</li>
              <li><strong>Withdrawal of Consent:</strong> Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Your Children's Privacy and Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our Service is designed for use by students under your supervision. We collect information about your children only with your consent and in accordance with applicable laws. As a parent, you have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Review your child's personal information and academic records</li>
              <li>Request deletion of your child's information</li>
              <li>Refuse further collection or use of your child's information</li>
              <li>Report tutors with concrete evidence for malicious activities (you must attach evidence for the best outcome)</li>
              <li>View all test results and progress reports for your children</li>
              <li>Manage contracts for your children (ensuring no overlapping contracts)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
              <strong>Your Responsibilities:</strong> 
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mt-2">
              <li>You must take responsibility for all children you add to the system</li>
              <li>You cannot have 2 children with the same name and birthday in your account</li>
              <li>All test results for your children are recorded in the system</li>
              <li>You must collaborate with the system and supervise your children to ensure quality</li>
              <li>You are responsible for ensuring your children attend scheduled sessions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to track activity on our Service and hold certain information. Cookies are files with a small amount of data that may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              We also use cookies to maintain your session, remember your preferences, and ensure secure authentication. Email verification codes and password reset codes expire after 15 minutes for security purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Third-Party Links</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our Service may contain links to third-party websites or services that are not owned or controlled by Math Bridge. We are not responsible for the privacy practices of these third parties. We encourage you to review the privacy policies of any third-party sites you visit.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. By using our Service, you consent to the transfer of your information to these facilities.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Payment, Wallet, and Refund Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our Service supports two payment methods for parents: <strong>direct payment</strong> and <strong>wallet payment</strong>. Important information regarding payments and refunds:
            </p>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">13.1 Payment Methods</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Payment amounts must be greater than 0</li>
              <li>New payment requests create wallet transactions with "Pending" status</li>
              <li>Payment status "Completed" maps to "Paid" for external queries</li>
              <li>Payment status "Pending" maps to "Unpaid" for external queries</li>
              <li>New parent accounts are initialized with WalletBalance = 0.00</li>
              <li><strong>System will not convert wallet currency to real money</strong></li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">13.2 Refund Policy</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Important Refund Restrictions:</strong>
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>No refund if the contract is cancelled by the parent</strong></li>
              <li><strong>No refund if the parent transferred money incorrectly to the QR code system provided</strong></li>
              <li>Refund at the price of a single session to your wallet if there are no tutors available for rescheduling (reschedule requests must be within the limit of the contract)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4 bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
              <strong>Please Note:</strong> You are responsible for ensuring correct payment transfers. We cannot provide refunds for incorrect transfers or parent-initiated contract cancellations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contract and Service Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Important information regarding contracts and services for your children:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>As a parent (RoleId = 3), you can create contracts for your children</li>
              <li>Your child must exist and have status not equal to "deleted" before contract creation</li>
              <li>New contracts are created with Status = "pending"</li>
              <li>Your child can have many contracts if they are not overlapping each other</li>
              <li>System ensures 90% of sessions will be conducted</li>
              <li>If the main tutor can't teach anymore, the system will push the substitute tutor to become the main tutor</li>
              <li>Offline contracts must be in range of any centers, else that contract must be online</li>
              <li><strong>The contract will be terminated at any time if staff/system/admin detects any malicious activity</strong></li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              <strong>Service Scope:</strong> System only teaches International Math Programs for High School students (No SAT). All math programs are based on curriculum of linked international schools. Programs apply for 3 days of a week. Time slots are 16:00-22:00 only, with 90 min duration and 90 min spacing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Reporting and Support</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Reporting Tutors:</strong> If you need to report a tutor for malicious activities, you must attach concrete evidence for the best outcome. Reports will be reviewed by staff and admin, and tutors can be terminated if evidence is substantiated.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Support Requests:</strong> Staff will check and handle any requests as early as possible. Staff can only reject requests with valid reasons. Reschedule requests will be approved or denied by staff after consideration.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Account Issues:</strong> If you have any questions about this Privacy Policy, wish to exercise your rights regarding your personal information or your children's information, or need assistance with your account, please contact us through the contact information provided on our platform.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4 bg-gray-50 p-4 rounded-lg">
              <strong>Important:</strong> Any users (including parents) with malicious behavior, accidents, or breach of policy must be banned immediately. Your account status can be "active" or "banned". Users with "banned" status cannot login.
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

export default PrivacyPolicyPage;

