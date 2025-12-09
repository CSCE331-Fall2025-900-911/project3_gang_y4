import React, { createContext, useContext, useEffect, useState } from 'react';
import { weatherService } from '../services/weatherService';
import TranslateMenu from '../components/TranslateMenu';
import { useTranslation } from './TranslationContext';

const WeatherContext = createContext();

export function WeatherProvider({ children }) {
    const [weatherData, setWeatherData] = useState(null);
    const [weatherType, setWeatherType] = useState('clear');
    const [loading, setLoading] = useState(true);
    const [override, setOverride] = useState(null);
    const {getStringsForPage} = useTranslation();
    
    // Get fresh strings on every render (this updates when language changes)
    const strings = getStringsForPage('weather');

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

    // Helper function to get label for a weather state
    const getLabelForState = (type, isDay, weatherStrings) => {
        if (type === 'clear' && isDay === 1) return weatherStrings.clearDay;
        if (type === 'clear' && isDay === 0) return weatherStrings.clearNight;
        if (type === 'cloudy' && isDay === 1) return weatherStrings.cloudyDay;
        if (type === 'cloudy' && isDay === 0) return weatherStrings.cloudyNight;
        if (type === 'rain') return weatherStrings.rain;
        if (type === 'storm') return weatherStrings.storm;
        if (type === 'snow') return weatherStrings.snow;
        return weatherStrings.liveWeather;
    };

    // Debug: Cycle through weather states
    const debugCycleWeather = () => {
        const currentStrings = getStringsForPage('weather');
        setOverride(prev => {
            const states = [
                { type: 'clear', isDay: 1 },
                { type: 'clear', isDay: 0 },
                { type: 'cloudy', isDay: 1 },
                { type: 'cloudy', isDay: 0 },
                { type: 'rain', isDay: 1 },
                { type: 'storm', isDay: 0 },
                { type: 'snow', isDay: 0 },
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

    const refreshWeather = () => {
        // Force a re-render by updating override to trigger label recalculation
        if (override) {
            setOverride(prev => ({ ...prev }));
        }
    };

    // Derived values based on override - compute label dynamically with current strings
    const effectiveWeatherData = override ? { ...weatherData, is_day: override.isDay } : weatherData;
    const effectiveWeatherType = override ? override.type : weatherType;
    const weatherLabel = override 
        ? getLabelForState(override.type, override.isDay, strings)
        : strings.liveWeather;

    return (
        <WeatherContext.Provider value={{
            weatherData: effectiveWeatherData,
            weatherType: effectiveWeatherType,
            loading,
            debugCycleWeather,
            weatherLabel,
            refreshWeather
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