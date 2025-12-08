import React, { createContext, useContext, useEffect, useState } from 'react';
import { weatherService } from '../services/weatherService';

const WeatherContext = createContext();

export function WeatherProvider({ children }) {
    const [weatherData, setWeatherData] = useState(null);
    const [weatherType, setWeatherType] = useState('clear');
    const [loading, setLoading] = useState(true);
    const [override, setOverride] = useState(null);

    useEffect(() => {
        // Fetch weather immediately
        fetchWeather();

        // Refresh every 30 minutes
        const interval = setInterval(fetchWeather, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchWeather = async () => {
        try {
            setLoading(true);
            const data = await weatherService.getCurrentWeather();
            setWeatherData(data);
            setWeatherType(weatherService.getWeatherType(data.weathercode));
        } catch (error) {
            console.error('Failed to fetch weather in context:', error);
        } finally {
            setLoading(false);
        }
    };

    // Debug: Cycle through weather states
    const debugCycleWeather = () => {
        setOverride(prev => {
            const states = [
                { type: 'clear', isDay: 1, label: 'Clear (Day)' },
                { type: 'clear', isDay: 0, label: 'Clear (Night)' },
                { type: 'cloudy', isDay: 1, label: 'Cloudy (Day)' },
                { type: 'cloudy', isDay: 0, label: 'Cloudy (Night)' },
                { type: 'rain', isDay: 1, label: 'Rain' },
                { type: 'storm', isDay: 0, label: 'Storm' },
                { type: 'snow', isDay: 0, label: 'Snow' },
                null // Back to real
            ];

            // Find current index
            let currentIndex = -1;
            if (prev) {
                currentIndex = states.findIndex(s => s && s.type === prev.type && s.isDay === prev.isDay);
            }

            const nextIndex = (currentIndex + 1) % states.length;
            return states[nextIndex];
        });
    };

    // Derived values based on override
    const effectiveWeatherData = override ? { ...weatherData, is_day: override.isDay } : weatherData;
    const effectiveWeatherType = override ? override.type : weatherType;
    const weatherLabel = override ? override.label : 'Live Weather';

    return (
        <WeatherContext.Provider value={{
            weatherData: effectiveWeatherData,
            weatherType: effectiveWeatherType,
            loading,
            debugCycleWeather,
            weatherLabel
        }}>
            {children}
        </WeatherContext.Provider>
    );
}

export function useWeather() {
    const context = useContext(WeatherContext);
    if (!context) {
        throw new Error('useWeather must be used within a WeatherProvider');
    }
    return context;
}
