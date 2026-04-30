'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { tripsAPI } from '@/lib/api';
import { useTripStore } from '@/stores/tripStore';
import { useUserStore } from '@/stores/userStore';
import type { Trip } from '@/types';

export default function HomePage() {
  const { user } = useUserStore();
  const { trips, setTrips } = useTripStore();
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await tripsAPI.list({ limit: 10 });
        const tripsData = response.data.data;
        setTrips(tripsData);

        // Find active trip
        const active = tripsData.find((t) => t.status === 'active');
        setActiveTrip(active || null);
      } catch (err: any) {
        setError('Failed to load trips');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [setTrips]);

  const stats = {
    totalTrips: user?.totalTrips || 0,
    totalDays: user?.totalDays || 0,
    countriesVisited: user?.countriesVisited?.length || 0,
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.displayName?.split(' ')[0] || 'Traveler'}! 👋
        </h1>
        <p className="text-gray-600 mt-2">Plan your next adventure or continue exploring</p>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm font-medium">Total Trips</p>
          <p className="text-4xl font-bold text-blue-600 mt-2">{stats.totalTrips}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm font-medium">Days Traveled</p>
          <p className="text-4xl font-bold text-green-600 mt-2">{stats.totalDays}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm font-medium">Countries Visited</p>
          <p className="text-4xl font-bold text-purple-600 mt-2">{stats.countriesVisited}</p>
        </div>
      </div>

      {/* Active Trip */}
      {activeTrip ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Active Trip</h2>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{activeTrip.destination}</h3>
              <p className="text-gray-600 mt-1">
                {new Date(activeTrip.startDate).toLocaleDateString()} - {new Date(activeTrip.endDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {activeTrip.durationDays} days • {activeTrip.tripType || 'Trip'}
              </p>
            </div>
            <Link
              href={`/itinerary/${activeTrip.id}`}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              View Itinerary →
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-lg border-2 border-dashed border-blue-200 text-center">
          <p className="text-gray-600 text-lg mb-4">No active trips yet</p>
          <Link
            href="/create-trip"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Plan Your First Trip ✈️
          </Link>
        </div>
      )}

      {/* Recent Trips */}
      {!loading && trips.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Trips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.slice(0, 6).map((trip) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
              >
                <h3 className="font-bold text-gray-900">{trip.destination}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                </p>
                <div className="mt-3 flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    trip.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {trip.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      {trips.length > 0 && (
        <div className="text-center">
          <Link href="/trips" className="text-blue-600 font-medium hover:underline">
            View all trips →
          </Link>
        </div>
      )}
    </div>
  );
}
