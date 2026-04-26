'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { tripsAPI, itineraryAPI } from '@/lib/api';
import type { CreateTripPayload, TripType, TravelPace } from '@/types';

export default function CreateTripPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    budgetAmount: '',
    budgetCurrency: 'USD',
    tripType: 'solo' as TripType,
    travelPace: 'balanced' as TravelPace,
    interests: [] as string[],
    dietary: [] as string[],
  });

  const interestOptions = ['Culture', 'Nature', 'Food', 'Adventure', 'Beach', 'History', 'Art', 'Shopping'];
  const dietaryOptions = ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-free', 'Nut-free'];
  const tripTypes = ['solo', 'couple', 'family', 'group', 'business'] as const;
  const travelPaces = ['relaxed', 'balanced', 'packed'] as const;

  const updateFormData = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayValue = (key: 'interests' | 'dietary', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const payload: CreateTripPayload = {
        destination: formData.destination,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budgetAmount: parseFloat(formData.budgetAmount) || 0,
        budgetCurrency: formData.budgetCurrency,
        tripType: formData.tripType,
        travelPace: formData.travelPace,
        interests: formData.interests,
        dietary: formData.dietary,
      };

      const response = await tripsAPI.create(payload);
      const trip = response.data;

      // Optionally trigger itinerary generation
      await itineraryAPI.generateItinerary(trip.id);

      router.push(`/itinerary/${trip.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Plan Your Trip</h1>
        <p className="text-gray-600 mt-2">Step {step} of 3</p>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Step 1: Destination & Dates */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination
            </label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => updateFormData('destination', e.target.value)}
              placeholder="e.g., Tokyo, Japan"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => updateFormData('startDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => updateFormData('endDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!formData.destination || !formData.startDate || !formData.endDate}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Next: Budget & Preferences
          </button>
        </div>
      )}

      {/* Step 2: Budget & Type */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Amount
              </label>
              <input
                type="number"
                value={formData.budgetAmount}
                onChange={(e) => updateFormData('budgetAmount', e.target.value)}
                placeholder="5000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={formData.budgetCurrency}
                onChange={(e) => updateFormData('budgetCurrency', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>JPY</option>
                <option>INR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trip Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {tripTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => updateFormData('tripType', type)}
                  className={`p-2 rounded-lg capitalize font-medium transition-colors ${
                    formData.tripType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Travel Pace
            </label>
            <div className="grid grid-cols-3 gap-2">
              {travelPaces.map((pace) => (
                <button
                  key={pace}
                  onClick={() => updateFormData('travelPace', pace)}
                  className={`p-2 rounded-lg capitalize font-medium transition-colors ${
                    formData.travelPace === pace
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {pace}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 border border-gray-300 py-2 rounded-lg font-medium hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Next: Interests
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Interests & Dietary */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Interests (Select all that apply)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleArrayValue('interests', interest)}
                  className={`p-3 rounded-lg font-medium transition-colors ${
                    formData.interests.includes(interest)
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-600'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Dietary Preferences
            </label>
            <div className="grid grid-cols-2 gap-2">
              {dietaryOptions.map((dietary) => (
                <button
                  key={dietary}
                  onClick={() => toggleArrayValue('dietary', dietary)}
                  className={`p-3 rounded-lg font-medium transition-colors ${
                    formData.dietary.includes(dietary)
                      ? 'bg-green-100 text-green-700 border-2 border-green-600'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {dietary}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 border border-gray-300 py-2 rounded-lg font-medium hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating Trip...' : 'Create Trip & Generate Itinerary'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
