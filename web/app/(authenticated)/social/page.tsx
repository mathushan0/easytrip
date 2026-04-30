'use client';

import React from 'react';
import { useUserStore } from '@/stores/userStore';

export default function SocialPage() {
  const { user } = useUserStore();

  const isVoyagerPlus = user?.tier === 'voyager' || user?.tier === 'nomad_pro';

  if (!isVoyagerPlus) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-lg border-2 border-purple-200 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">✨ Premium Feature</h2>
          <p className="text-gray-600 mb-6">
            Social Intelligence is available for Voyager+ members. Upgrade your account to unlock community insights, trending destinations, and curated travel tips.
          </p>
          <button className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700">
            Upgrade to Voyager+
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Social Feed</h1>
      <p className="text-gray-600">Explore trending destinations and community insights</p>

      <div className="bg-white p-8 rounded-lg shadow text-center">
        <p className="text-gray-600">Social feed content coming soon...</p>
      </div>
    </div>
  );
}
