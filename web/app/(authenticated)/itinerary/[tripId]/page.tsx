'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { tripsAPI, itineraryAPI } from '@/lib/api';
import { useTripStore } from '@/stores/tripStore';
import type { Trip, ItineraryDay } from '@/types';

export default function ItineraryPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { setActiveTrip, activeDayIndex, setActiveDayIndex } = useTripStore();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTripData = async () => {
      try {
        const tripResponse = await tripsAPI.get(tripId);
        const daysResponse = await itineraryAPI.getDays(tripId);

        setTrip(tripResponse.data);
        setDays(daysResponse.data);
        setActiveTrip(tripResponse.data, daysResponse.data);
      } catch (err: any) {
        setError('Failed to load itinerary');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
  }, [tripId, setActiveTrip]);

  if (loading) {
    return <div className="p-6 text-center">Loading itinerary...</div>;
  }

  if (error || !trip) {
    return <div className="p-6 text-center text-red-600">{error || 'Trip not found'}</div>;
  }

  const currentDay = days[activeDayIndex];

  return (
    <div className="p-6 space-y-6">
      {/* Trip Header */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-3xl font-bold text-gray-900">{trip.destination}</h1>
        <p className="text-gray-600 mt-2">
          {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
        </p>
        <div className="mt-4 flex gap-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {trip.durationDays} days
          </span>
          {trip.tripType && (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium capitalize">
              {trip.tripType}
            </span>
          )}
        </div>
      </div>

      {/* Day Tabs */}
      {days.length > 0 && (
        <div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex overflow-x-auto border-b border-gray-200">
              {days.map((day, index) => {
                const dayDate = new Date(day.date);
                const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = dayDate.getDate();

                return (
                  <button
                    key={day.id}
                    onClick={() => setActiveDayIndex(index)}
                    className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                      activeDayIndex === index
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="text-sm">{dayName}</div>
                    <div className="text-lg font-bold">Day {index + 1}</div>
                  </button>
                );
              })}
            </div>

            {/* Day Details */}
            {currentDay && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {new Date(currentDay.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h2>

                {currentDay.tasks && currentDay.tasks.length > 0 ? (
                  <div className="space-y-4">
                    {currentDay.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900">{task.title}</h3>
                            {task.timeSlot && (
                              <p className="text-sm text-gray-600 mt-1">⏰ {task.timeSlot}</p>
                            )}
                            {task.description && (
                              <p className="text-sm text-gray-700 mt-2">{task.description}</p>
                            )}
                            {task.category && (
                              <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded capitalize">
                                {task.category}
                              </span>
                            )}
                          </div>
                          <input
                            type="checkbox"
                            checked={task.done || false}
                            readOnly
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No activities planned for this day</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Day Button */}
      {days.length > 0 && (
        <div className="text-center">
          <button className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
            + Add Day
          </button>
        </div>
      )}
    </div>
  );
}
