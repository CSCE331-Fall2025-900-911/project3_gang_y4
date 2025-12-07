import React, { useEffect, useState } from 'react';
import { useWeather } from '../context/WeatherContext';
import '../styles/WeatherAnimations.css';

const WeatherBackground = ({ children }) => {
    const { weatherData, weatherType, loading } = useWeather();
    const [drops, setDrops] = useState([]);

    // Determine if it's day (1) or night (0). Default to day if specific data missing.
    // weatherData.is_day comes from OpenMeteo (1 = Day, 0 = Night)
    const isDay = weatherData?.is_day === 0 ? false : true;

    // Re-generate particles when weather type changes
    useEffect(() => {
        if (weatherType === 'rain' || weatherType === 'storm' || weatherType === 'snow') {
            const dropCount = weatherType === 'snow' ? 50 : 100; // fewer flakes than rain
            const newDrops = Array.from({ length: dropCount }).map((_, i) => ({
                id: i,
                left: Math.random() * 100, // 0-100%
                delay: Math.random() * 2, // 0-2s delay
                duration: Math.random() * 0.5 + 0.5, // 0.5-1s duration for rain
            }));
            setDrops(newDrops);
        } else {
            setDrops([]);
        }
    }, [weatherType]);

    const getContainerClass = () => {
        const time = isDay ? 'day' : 'night';
        return `weather-bg-container ${time}-${weatherType === 'clear' ? 'clear' : 'cloudy'}`;
    };

    return (
        <div className={getContainerClass()} style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>

            {/* --- ANIMATION LAYERS --- */}

            {/* 1. STARS (Clear Night) */}
            {!isDay && weatherType === 'clear' && (
                <div className="stars">
                    {Array.from({ length: 50 }).map((_, i) => (
                        <div
                            key={i}
                            className="star"
                            style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                width: `${Math.random() * 3 + 1}px`,
                                height: `${Math.random() * 3 + 1}px`,
                                animationDelay: `${Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* 2. RAIN / STORM */}
            {(weatherType === 'rain' || weatherType === 'storm') && (
                <div className="rain">
                    {drops.map((drop) => (
                        <div
                            key={drop.id}
                            className="drop"
                            style={{
                                left: `${drop.left}%`,
                                animationDelay: `${drop.delay}s`,
                                animationDuration: `0.7s`
                            }}
                        >
                            <div className="stem" style={{ animationDelay: `${drop.delay}s`, animationDuration: `0.7s` }} />
                            <div className="splat" style={{ animationDelay: `${drop.delay}s`, animationDuration: `0.7s` }} />
                        </div>
                    ))}
                </div>
            )}

            {/* 3. LIGHTNING (Storm only) */}
            {weatherType === 'storm' && <div className="flash" />}

            {/* 4. SNOW */}
            {weatherType === 'snow' && (
                <div className="snow">
                    {drops.map((drop) => (
                        <div
                            key={drop.id}
                            className="flake"
                            style={{
                                left: `${drop.left}%`,
                                width: `${Math.random() * 5 + 5}px`,
                                height: `${Math.random() * 5 + 5}px`,
                                animationDelay: `${drop.delay}s`,
                                animationDuration: `${Math.random() * 5 + 5}s` // Slower for snow
                            }}
                        />
                    ))}
                </div>
            )}

            {/* 5. CLOUDS (Cloudy / Rain / Storm / Snow) */}
            {weatherType !== 'clear' && (
                <div className="clouds">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="cloud"
                            style={{
                                top: `${Math.random() * 60 + 10}%`, // Avoid blocking too much
                                width: `${Math.random() * 200 + 100}px`,
                                height: `${Math.random() * 100 + 50}px`,
                                opacity: 0.3,
                                animationDuration: `${Math.random() * 20 + 20}s`,
                                animationDelay: `-${Math.random() * 20}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Content sits on top */}
            <div className="weather-content" style={{ position: 'relative', zIndex: 10 }}>
                {children}
            </div>
        </div>
    );
};

export default WeatherBackground;
