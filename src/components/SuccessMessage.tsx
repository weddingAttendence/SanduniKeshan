import React from 'react';
import { CheckCircle, Heart } from 'lucide-react';

interface SuccessMessageProps {
  onBackToForm: () => void;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ onBackToForm }) => {
  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Your response has been successfully submitted and we've sent a confirmation email to our admin team.
      </p>
      
      <div className="flex items-center justify-center text-rose-500 mb-6">
        <Heart className="w-5 h-5 mr-2" />
        <span className="text-sm font-medium">We can't wait to celebrate with you!</span>
        <Heart className="w-5 h-5 ml-2" />
      </div>
      
      <button
        onClick={onBackToForm}
        className="bg-gradient-to-r from-gray-500 to-gray-600 text-white py-2 px-6 rounded-lg font-medium hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
      >
        Submit Another Response
      </button>
    </div>
  );
};