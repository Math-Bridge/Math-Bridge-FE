import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import CustomerSupportChat from './CustomerSupportChat';

const CustomerSupportButton: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 z-40 group"
          title="Customer Support"
        >
          <MessageCircle size={28} />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            AI
          </span>
          {/* Tooltip */}
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            Need help? Chat with our AI assistant
          </span>
        </button>
      )}

      {/* Chat Component */}
      <CustomerSupportChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};

export default CustomerSupportButton;

