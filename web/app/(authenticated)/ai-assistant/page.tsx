'use client';

import React from 'react';
import { useUserStore } from '@/stores/userStore';

export default function AIAssistantPage() {
  const { user } = useUserStore();

  const isProMember = user?.tier === 'nomad_pro';

  if (!isProMember) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-lg border-2 border-blue-200 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🤖 Pro Feature</h2>
          <p className="text-gray-600 mb-6">
            AI Assistant is available for Nomad Pro members. Unlock personalized travel recommendations, real-time disruption alerts, and smart itinerary optimization.
          </p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700">
            Upgrade to Nomad Pro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">AI Travel Assistant</h1>
      <p className="text-gray-600">Get intelligent recommendations and real-time support</p>

      <div className="bg-white p-8 rounded-lg shadow text-center">
        <p className="text-gray-600">AI Assistant coming soon...</p>
      </div>
    </div>
  );
}
