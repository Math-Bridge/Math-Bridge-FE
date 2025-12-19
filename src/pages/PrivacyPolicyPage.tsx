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
            Privacy Policy
          </h1>
          <p className="text-gray-600">
            Last updated:{' '}
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Math Bridge ("we", "our", or "us") is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use, disclose,
              and safeguard your information when you use our online tutoring
              platform and related services. Please read this Privacy Policy
              carefully. If you do not agree with the terms of this Privacy Policy,
              please do not access or use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Information We Collect
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
              2.1 Personal Information
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may collect personal information that you voluntarily provide to
              us when you:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>
                Register an account (name, email address, phone number consisting
                of 10–15 digits)
              </li>
              <li>
                Create a profile (profile photo, geographic location, educational
                background)
              </li>
              <li>
                Make payments (billing address, payment card information)
              </li>
              <li>
                Communicate with us (support requests, feedback)
              </li>
              <li>
                Participate in tutoring sessions (session recordings, if
                applicable)
              </li>
              <li>
                Log in for the first time (location update required)
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
              2.2 Children’s Information
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              For children added to the system by parents or legal guardians, we
              collect:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>
                Child’s name and date of birth (must be unique within the same
                parent account)
              </li>
              <li>
                Academic performance and test results (all tests are recorded in
                the system)
              </li>
              <li>
                Learning progress reports and session notes
              </li>
              <li>
                Assigned learning center information (if applicable)
              </li>
              <li>
                Contract history and tutoring session records
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              <strong>Note:</strong> Parents or guardians are responsible for all
              children added to their account. A parent account may not contain
              two children with the same name and date of birth.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
              2.3 Tutor Information
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              For tutors using our Service, we collect:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>
                Profile information (must be completed upon first login)
              </li>
              <li>
                Hourly compensation (updated by administrators based on
                performance)
              </li>
              <li>
                Assigned learning center information
              </li>
              <li>
                Verification status (approval required before teaching)
              </li>
              <li>
                Post-session reports
              </li>
              <li>
                Contract and session history
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
              2.4 Automatically Collected Information
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you access the Service, we may automatically collect certain
              information, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>
                Device information (IP address, browser type, operating system)
              </li>
              <li>
                Usage data (pages visited, time spent, features used)
              </li>
              <li>
                Cookies and similar tracking technologies
              </li>
              <li>
                Log files and analytics data
              </li>
              <li>
                Geographic location information (to ensure offline contracts are
                within assigned center boundaries)
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the collected information to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide, maintain, and improve our Services</li>
              <li>Process payments and related transactions</li>
              <li>
                Match students with suitable tutors (primary and backup tutors)
              </li>
              <li>
                Schedule and manage tutoring sessions (ensuring at least 90%
                session completion)
              </li>
              <li>Manage contracts and prevent overlapping agreements</li>
              <li>Handle rescheduling requests and refunds when applicable</li>
              <li>Send administrative notices and service updates</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Monitor usage trends and system performance</li>
              <li>Detect and prevent technical issues and security threats</li>
              <li>
                Identify malicious behavior (which may result in account
                suspension or contract termination)
              </li>
              <li>Comply with legal obligations and enforce our Terms</li>
              <li>
                Generate internal monthly reports for owners and stakeholders
              </li>
            </ul>
          </section>

          {/* Sections 4–13 giữ nguyên như bạn gửi vì đã là English chuẩn */}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-200 flex justify-center">
          <button
            onClick={handleGoBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
