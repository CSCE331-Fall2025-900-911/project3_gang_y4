const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

// College Station, TX coordinates
const DEFAULT_LAT = 30.6280;
const DEFAULT_LON = -96.3344;

export const weatherService = {
    async getCurrentWeather(lat = DEFAULT_LAT, lon = DEFAULT_LON) {
        try {
            const response = await fetch(
                `${BASE_URL}?latitude=${lat}&longitude=${lon}&current_weather=true`
            );

            if (!response.ok) {
                throw new Error('Weather data fetch failed');
            }

            const data = await response.json();
            // Return full object including is_day (0 or 1)
            return data.current_weather;
        } catch (error) {
            console.error('Error fetching weather:', error);
            // Return a default clear weather state on error
            return { weathercode: 0, temperature: 25, is_day: 1 };
        }
    },

    // Helper to map WMO codes to our simplified types
    getWeatherType(code) {
        // 0: Clear sky
        // 1-3: Cloudy
        // 45-48: Fog
        // 51-67, 80-82: Drizzle/Rain
        // 71-77, 85-86: Snow
        // 95-99: Thunderstorm

        if (code === 0 || code === 1) return 'clear';
        if (code >= 2 && code <= 48) return 'cloudy';
        if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
        if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'snow';
        if (code >= 95 && code <= 99) return 'storm';

        return 'clear'; // default
    }
};
