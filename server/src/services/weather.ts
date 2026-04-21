import axios from 'axios';
import { config } from '../config/index.js';
import { redis } from '../plugins/redis.js';
import type { WeatherForecast } from '../types/index.js';

const WEATHER_CACHE_TTL = 3 * 60 * 60; // 3 hours

export async function getWeatherForecast(params: {
  lat: number;
  lng: number;
  startDate: string;
  endDate: string;
}): Promise<WeatherForecast[]> {
  const cacheKey = `weather:${params.lat.toFixed(2)}:${params.lng.toFixed(2)}:${params.startDate}:${params.endDate}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        lat: params.lat,
        lon: params.lng,
        appid: config.openWeatherMap.apiKey,
        units: 'metric',
        cnt: 40, // 5 days × 8 readings
      },
    });

    const forecasts: WeatherForecast[] = [];
    const dateMap = new Map<string, { min: number; max: number; condition: string; icon: string }>();

    for (const item of response.data.list) {
      const date = item.dt_txt.split(' ')[0];
      const temp = item.main.temp;
      const condition = item.weather[0].main;
      const icon = item.weather[0].icon;

      const existing = dateMap.get(date);
      if (existing) {
        existing.min = Math.min(existing.min, temp);
        existing.max = Math.max(existing.max, temp);
      } else {
        dateMap.set(date, { min: temp, max: temp, condition, icon });
      }
    }

    for (const [date, data] of dateMap) {
      if (date >= params.startDate && date <= params.endDate) {
        forecasts.push({
          date,
          temp_min: Math.round(data.min),
          temp_max: Math.round(data.max),
          condition: data.condition,
          icon: `https://openweathermap.org/img/wn/${data.icon}@2x.png`,
        });
      }
    }

    forecasts.sort((a, b) => a.date.localeCompare(b.date));

    await redis.setex(cacheKey, WEATHER_CACHE_TTL, JSON.stringify(forecasts));
    return forecasts;
  } catch {
    // Return empty forecast if API fails — generation continues without weather data
    return [];
  }
}
