'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { tripsAPI } from '@/lib/api';
import { useTripStore } from '@/stores/tripStore';
import type { Trip } from '@/types';

export default function TripsListPage() {
  const { trips, setTrips } = useTripStore();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await tripsAPI.list({ limit: 100 });
        setTrips(response.data.data);
      } catch (err) {
        console.error('Failed to load trips:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [setTrips]);

  const filteredTrips = trips.filter((t) =>
    filter === 'all' ? true : t.status === filter
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
          <p className="text-gray-600 mt-1">{trips.length} total trips</p>
        </div>
        <Link
          href="/create-trip"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          New Trip
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {(['all', 'active', 'archived'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 font-medium capitalize border-b-2 transition-colors ${
              filter === status
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {status === 'all' ? 'All' : status === 'active' ? 'Active' : 'Archived'}
          </button>
        ))}
      </div>

      {/* Trips Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">Loading trips...</p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg mb-4">No {filter === 'all' ? '' : filter} trips yet</p>
          <Link
            href="/create-trip"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Create First Trip
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{trip.destination}</h3>
                  <p className="text-sm text-gray-600 mt-1">{trip.city && `${trip.city}, `}{trip.countryCode}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  trip.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : trip.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {trip.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p>📅 {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</p>
                <p>⏱️ {trip.durationDays} days</p>
                {trip.budgetAmount && (
                  <p>💰 {trip.budgetCurrency} {trip.budgetAmount.toLocaleString()}</p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-blue-600 font-medium text-sm hover:underline">
                  View Details →
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
