import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getCurrentLocation } from '../utils/geolocation';
import {
	Container,
	WeatherInfo,
	Recommendation,
} from './SeasonalMaintenance.styles';

const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

const seasonalTips = {
	spring: [
		'Inspect your roof and gutters for damage after winter.',
		'Plant new flowers and fertilize your lawn.',
		'Check your windows and doors for drafts.',
	],
	summer: [
		'Check your air conditioning system.',
		'Inspect and clean your outdoor grill.',
		'Ensure your sprinklers are working properly.',
	],
	fall: [
		'Clean gutters to prepare for heavy rain.',
		'Rake leaves and aerate your lawn.',
		'Inspect your heating system before winter.',
	],
	winter: [
		'Insulate pipes to prevent freezing.',
		'Check your roof for ice dams.',
		'Stock up on winter supplies like salt and shovels.',
	],
};

interface SeasonalMaintenanceProps {
	tempUnit: 'C' | 'F';
	location?: { latitude: number; longitude: number } | null;
}

export const SeasonalMaintenance = ({
	tempUnit,
	location,
}: SeasonalMaintenanceProps) => {
	const [currentTip, setCurrentTip] = useState<string>('');
	const [tips, setTips] = useState<string[]>([]);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [usedTips, setUsedTips] = useState<Set<number>>(new Set());

	const [weatherData, setWeatherData] = useState<any>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const getFromLocalStorage = (key: string) => {
		const itemStr = localStorage.getItem(key);
		if (!itemStr) return null;
		const item = JSON.parse(itemStr);
		const now = new Date();
		if (now.getTime() > item.expiry) {
			localStorage.removeItem(key);
			return null;
		}
		return item.value;
	};

	const saveToLocalStorage = (key: string, value: any, ttl: number) => {
		const now = new Date();
		const item = {
			value: value,
			expiry: now.getTime() + ttl,
		};
		localStorage.setItem(key, JSON.stringify(item));
	};

	const getUserLocation = () => {
		return getCurrentLocation();
	};

	const fetchWeatherData = async (latitude: number, longitude: number) => {
		try {
			const response = await axios.get(BASE_URL, {
				params: {
					lat: latitude,
					lon: longitude,
					appid: API_KEY,
					units: 'metric',
				},
			});
			return response.data;
		} catch (error) {
			throw new Error('Error fetching weather data');
		}
	};

	const getSeasonalRecommendations = (weather: any) => {
		const currentMonth = new Date().getMonth();
		let season;

		if (currentMonth >= 2 && currentMonth <= 4) {
			season = 'spring';
		} else if (currentMonth >= 5 && currentMonth <= 7) {
			season = 'summer';
		} else if (currentMonth >= 8 && currentMonth <= 10) {
			season = 'fall';
		} else {
			season = 'winter';
		}

		const tips = seasonalTips[season];

		if (weather) {
			if (weather.weather[0].main.toLowerCase().includes('rain')) {
				tips.push(
					'Ensure your gutters and downspouts are clear to handle rainwater.',
				);
				tips.push(
					'Check for leaks around windows and doors to prevent water damage.',
				);
			} else if (weather.weather[0].main.toLowerCase().includes('snow')) {
				tips.push(
					'Keep walkways and driveways clear of snow to prevent accidents.',
				);
				tips.push(
					'Inspect your roof for heavy snow accumulation and remove it if necessary.',
				);
			} else if (weather.weather[0].main.toLowerCase().includes('clear')) {
				tips.push(
					'Take advantage of clear weather to inspect your home exterior for damage.',
				);
				tips.push('Clean and organize your garage or outdoor storage areas.');
			} else if (weather.weather[0].main.toLowerCase().includes('wind')) {
				tips.push(
					'Secure outdoor furniture and decorations to prevent wind damage.',
				);
				tips.push(
					'Inspect trees around your property for weak branches that could fall.',
				);
			}
		}

		return tips;
	};

	useEffect(() => {
		const fetchAndSetRecommendations = async () => {
			try {
				setLoading(true);
				const cachedWeather = getFromLocalStorage('weatherData');
				if (cachedWeather) {
					setWeatherData(cachedWeather);
					setLoading(false);
					return;
				}

				// Use passed location or request it
				let locationData = location;
				if (!locationData) {
					locationData = await getUserLocation();
				}

				const weather = await fetchWeatherData(
					locationData.latitude,
					locationData.longitude,
				);
				setWeatherData(weather);
				saveToLocalStorage('weatherData', weather, 3600000); // Cache for 1 hour
			} catch (err: any) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchAndSetRecommendations();
	}, [location]);

	const convertTemp = (temp: number) => {
		return tempUnitState === 'F' ? (temp * 9) / 5 + 32 : temp;
	};

	const [tempUnitState, setTempUnitState] = useState<'C' | 'F'>('F');
	console.info('Temp Unit in SeasonalMaintenance:', tempUnit);
	useEffect(() => {
		setTempUnitState(tempUnit);
	}, [tempUnit]);

	useEffect(() => {
		if (weatherData) {
			const generatedTips = getSeasonalRecommendations(weatherData);
			setTips(generatedTips);
			setCurrentTip(generatedTips[0]);
			setUsedTips(new Set([0]));
		}
	}, [weatherData]);

	useEffect(() => {
		const interval = setInterval(() => {
			if (tips.length > 0) {
				setUsedTips((prevUsedTips) => {
					let nextIndex;
					do {
						nextIndex = Math.floor(Math.random() * tips.length);
					} while (
						prevUsedTips.has(nextIndex) &&
						prevUsedTips.size < tips.length
					);

					const newUsedTips = new Set(prevUsedTips);
					newUsedTips.add(nextIndex);
					if (newUsedTips.size === tips.length) {
						newUsedTips.clear(); // Reset when all tips have been used
					}

					setCurrentTip(tips[nextIndex]);
					return newUsedTips;
				});
			}
		}, 5000); // Change tip every 5 seconds

		return () => clearInterval(interval);
	}, [tips]);

	return (
		<Container>
			{loading && <p>Loading...</p>}
			{error && <p>Error: {error}</p>}
			{weatherData && (
				<>
					<div style={{ display: 'flex' }}>
						<img
							src={`http://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`}
							alt='Weather Icon'
						/>
						<WeatherInfo>
							<h3>Current Weather</h3>
							<p>
								Temperature: {convertTemp(weatherData.main.temp).toFixed(1)}°
								{tempUnitState}
							</p>
							<p>Condition: {weatherData.weather[0].description}</p>
						</WeatherInfo>
					</div>
				</>
			)}
			<Recommendation>Recommendation:</Recommendation>
			{currentTip && <p className='animated-tip'>{currentTip}</p>}
		</Container>
	);
};
