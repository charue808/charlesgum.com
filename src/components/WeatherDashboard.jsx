import { useState, useEffect } from 'preact/hooks';
import { supabase } from '../lib/supabase.js';


export default function WeatherDashboard() {
	const [weather, setWeather] = useState(null);
	const [city, setCity] = useState('Pearl City, Hawaii');
	const [historicalData, setHistoricalData] = useState([]);
	const [insights, setInsights] = useState(null);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState('current');

	// Geocode city name to coordinates
	const geocodeCity = async (cityName) => {
		try {
			// Using OpenStreetMaps's Nominatin
			const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`);

			const data = await response.json();
			if (data && data.length > 0) {
				return {
					lat: parseFloat(data[0].lat),
					lon: parseFloat(data[0].lon),
					displayName: data[0].display_name
				}
			}
			return null;
		} catch(error) {
			console.error('Geocoding failed', error)
			return null;
		} 
	}

	const fetchWeather = async (location) => {
		setLoading(true);
		try {
			// First geocode the city
			const coords = await geocodeCity(location);
			if (!coords) {
				throw new Error('Location not found');
			}
			//Then fetch the weather data using the city coordinates
			const apikey = import.meta.env.PUBLIC_PIRATE_WEATHER_API_KEY;
			const response = await fetch(`https://api.pirateweather.net/forecast/${apikey}/${coords.lat},${coords.lon}?units=si`);
			
			const data = await response.json();
			// transform to match our display format
			const weatherData = {
				name: location,
				displayName: coords.displayName,
				lat: coords.lat,
				lon: coords.lon,
				currently: {
					temperature: data.currently.temperature,
					apparentTemperature: data.currently.apparentTemperature,
					humidity: data.currently.humidity * 100,
					summary: data.currently.summary,
					icon: data.currently.icon,
					windSpeed: data.currently.windSpeed,
					pressure: data.currently.pressure,
					timestamp: new Date(data.currently.time * 1000).toISOString()
				}
			};

			setWeather(weatherData);

			// After fetching current weather, log it and load historical data
			await logWeatherData(weatherData);
			await loadHistoricalData(location);

		} catch(error) {
			console.error('Failed to fetch weather', error)
			// Fallback to mock weather data
			const mockData = {
				name: location,
        displayName: location,
        lat: 21.3894,
        lon: -157.9751,
        currently: {
          temperature: 26,
          apparentTemperature: 28,
          humidity: 65,
          summary: 'Clear',
          icon: 'clear-day',
          windSpeed: 3.1,
					pressure: 1013,
					timestamp: new Date().toISOString()
        }
			};
			
			setWeather(mockData);
			await logWeatherData(mockData);
			await loadHistoricalData(location);

		}
		setLoading(false);

	}

	const logWeatherData = async (weatherData) => {
		const { error } = await supabase.from('weather_logs').insert([{
			city: weatherData.name,
			lat: weatherData.lat,
			lon: weatherData.lon,
			temperature: weatherData.currently.temperature,
			feels_like: weatherData.currently.apparentTemperature,
			humidity: weatherData.currently.humidity,
			summary: weatherData.currently.summary,
			wind_speed: weatherData.currently.windSpeed,
			pressure: weatherData.currently.pressure,
			timestamp: weatherData.currently.timestamp
		}])

		if (error) {
			console.error('Error logging weather data', error);
		}
	}

	const loadHistoricalData = async (location) => {
		const { data, error } = await supabase.from('weather_logs').select('*').eq('city', location).order('timestamp', { ascending: false }).limit(50);

		if (error) {
			console.error('Failed to load historical data', error)
			setHistoricalData([]);
			setInsights(null);
			return;
		}

		setHistoricalData(data || []);
		calculateInsights(data || []);
	}

	const calculateInsights = (data) => {
		if (data.length < 2) {
			setInsights(null);
			return;
		}

		const temps = data.map(d => d.temperature);
		const avgTemp = temps.reduce((a, b) => a + b , 0) / temps.length;
		const maxTemp = Math.max(...temps);
		const minTemp = Math.min(...temps);
		const currentTemp = temps[0];
		const tempChange = data.length > 1 ? currentTemp - data[1].temperature : 0;

		// Calculate trend over last 24 hours or available data
    const recent = data.slice(0, Math.min(24, data.length));
    const recentAvg = recent.reduce((a, b) => a + b.temperature, 0) / recent.length;
    const older = data.slice(Math.min(24, data.length));
    const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b.temperature, 0) / older.length : recentAvg;
    const trend = recentAvg > olderAvg ? 'warming' : recentAvg < olderAvg ? 'cooling' : 'stable';

		setInsights({
			avgTemp: avgTemp.toFixed(1),
			maxTemp: maxTemp.toFixed(1),
			minTemp: minTemp.toFixed(1),
			tempChange: tempChange.toFixed(1),
			trend,
			dataPoints: data.length,
			timeSpan: getTimeSpan(data)
		})
	}

	const getTimeSpan = (data) => {
		if (data.length < 2) return 'Just started';
    const oldest = new Date(data[data.length - 1].timestamp);
    const newest = new Date(data[0].timestamp);
    const hours = Math.floor((newest - oldest) / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return 'Less than an hour';
	}

	const formatTimestamp = (timestamp) => {
		const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
	}

	useEffect(() => {
		fetchWeather(city)
	}, [])

	return (
		<div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif'}}>
			<h1 style={{ marginBottom: '2rem' }}>Weather Dashboard</h1>

			<div style={{ marginBottom: '2rem' }}>
				<input 
					type="text"
					value={city}
					onChange={(e) => setCity(e.target.value)}
					onKeyPress={(e) => e.key === 'Enter' && fetchWeather(city)}
					placeholder="Enter city name"
					style={{
						padding: '0.75rem',
						marginRight: '1rem',
						width: '300px',
						border: '2px solid #e0e0e0',
						borderRadius: '8px',
						fontSize: '1rem'
					}}
				/>
				<button
					onClick={() => fetchWeather(city)}
					style={{
						padding: '0.75rem 1.5rem',
						background: '#0984e3',
						color: 'white',
						border: 'none',
						borderRadius: '8px',
						fontSize: '1rem',
						cursor: 'pointer'
					}}
				>
					Get Weather
				</button>

				{loading && <p style={{ color: '#666' }}>Loading weather...</p>}

				{weather && !loading && (
					<>
						<div style={{
							background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
							color: 'white',
							padding: '2rem',
							borderRadius: '12px',
							marginBottom: '2rem',
							boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
						}}>
							<h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem'}}>{weather.name}</h2>
							<p style={{ margin: '0 0 1rem 0', opacity: 0.9, fontSize: '0.9rem' }}>{weather.displayName}</p>
							<div style={{ fontSize: '4rem', fontWeight: 'bold', margin: '1rem 0'}}>{Math.round(weather.currently.temperature)}°C</div>
							<p style={{ fontSize: '1.2rem', margin: '0.5rem 0', textTransform: 'capitalize' }}>{weather.currently.summary}</p>
							<div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
								<span>Feels like: {Math.round(weather.currently.apparentTemperature)}°C</span>
								<span>Humidity: {Math.round(weather.currently.humidity)}%</span>
								<span>Wind: {weather.currently.windSpeed.toFixed(1)} m/s</span>
								<span>Pressure: {Math.round(weather.currently.pressure)} mb</span>
							</div>
						</div>
						{insights && (
							<div style={{
								background: '#f8f9fa',
								padding: '1.5rem',
								borderRadius: '12px',
								marginBottom: '2rem',
								border: '2px solid #e0e0e0'
							}}>
								<h3 style={{ margin: '0 0 1rem 0', color: '#2d3436'}}>📊 Insights</h3>
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem'}}>
									<div>
										<div style={{ fontSize: '0.875rem', color: '#636e72', marginBottom: '0.25rem' }}>Data Points</div>
										<div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0984e3', marginBottom: '0.25rem'}}>{insights.dataPoints}</div>
										<div style={{ fontSize: '0.75rem', color: '#636e72' }}>over {insights.timeSpan}</div>
									</div>
									<div>
										<div style={{ fontSize: '0.875rem', color: '#636e72', marginBottom: '0.25rem'}}>Average Temp</div>
										<div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0984e3' }}>{insights.avgTemp}</div>
									</div>
									<div>
										<div style={{ fontSize: '0.875rem', color: '#636e72', marginBottom: '0.25rem'}}>Range</div>
										<div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0984e3' }}>{insights.minTemp}° - {insights.maxTemp}°</div>
									</div>
									<div>
										<div style={{ fontSize: '0.875rem', color: '#636e72', marginBottom: '0.25rem'}}>Recent Change</div>
											<div style={{ 
												fontSize: '1.5rem',
												fontWeight: 'bold', 
												color: parseFloat(insights.tempChange) > 0 ? '#e17055' : parseFloat(insights.tempChange) < 0 ? '#74b9ff' : '#636e72' 
											}}>
													{ parseFloat(insights.tempChange) > 0 ? '+' : '' }{ insights.tempChange }°C
											</div>
										</div>
									<div>
										<div style={{ fontSize: '0.875rem', color: '#636e72', marginBottom: '0.25rem'}}>Trend</div>
										<div style={{
											fontSize: '1.5rem',
											fontWeight: 'bold',
											color: insights.trend === 'warming' ? '#e17055' : insights.trend === 'cooling' ? '#74b9ff' : '#636e72',
											textTransform: 'capitalize'
										}}>
											{ insights.trend === 'warming' ? '🔥' : insights.trend === 'cooling' ? '❄️' : '➡️' } { insights.trend }
										</div>
									</div>
								</div>
							</div>
						)}
						<div style={{ marginBottom: '2rem' }}>
							<div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '2px solid #e0e0e0' }}>
								<button
									onClick={() => setActiveTab('current')}
									style={{
										padding: '0.75rem 1.5rem',
										background: activeTab === 'current' ? '#0984e3' : 'transparent',
										color: activeTab === 'current' ? 'white' : '#636e72',
										border: 'none',
										borderBottom: activeTab === 'current' ? '3px solid #0984e3' : 'none',
										cursor: 'pointer',
										fontSize: '1rem',
										fontWeight: activeTab === 'current' ? 'bold' : 'normal'
									}}
								>
									Current
								</button>
								<button
									onClick={() => setActiveTab('history')}
									style={{
										padding: '0.75rem 1.5rem',
										background: activeTab === 'history' ? '#0984e3' : 'transparent',
										color: activeTab === 'history' ? 'white' : '#636e72',
										border: 'none',
										borderBottom: activeTab === 'history' ? '3px solid #0984e3' : 'none',
										cursor: 'pointer',
										fontSize: '1rem',
										fontWeight: activeTab === 'history' ? 'bold' : 'normal'
									}}
								>
									History ({historicalData.length})
								</button>
							</div>
							{activeTab === 'history' && (
								<div>
									{historicalData.length === 0 ? (
										<p style={{ color: '#636e72', textAlign: 'center', padding: '2rem'}}>
											No historical data yet. Check back after a few weather updates!
										</p>
									) : (
										<div style={{ maxHeight: '500px', overflowY: 'auto' }}>
											{historicalData.map((log, index) => (
												<div
													key={index}
													style={{
														background: index === 0 ? '#e3f2fd' : 'white',
														padding: '1rem',
														marginBottom: '0.5rem',
														borderRadius: '8px',
														border: '1px solid #e0e0e0',
														display: 'flex',
														justifyContent: 'space-between',
														alignItems: 'center'
													}}
												>
													<div style={{ flex: 1 }}>
														<div style={{ fontWeight: 'bold', color: '#2d3436', marginBottom: '0.25rem' }}>
															{Math.round(log.temperature)}°C
															<span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: '#636e72', marginLeft: '0.5rem' }}>
																(feels like {Math.round(log.feels_like)}°C)
															</span>
														</div>
														<div style={{ fontSize: '0.875rem', color: '#636e72', textTransform: 'capitalize' }}>
															{log.summary}
														</div>
													</div>
													<div style={{ textAlign: 'right' }}>
														<div style={{ fontSize: '0.875rem', color: '#636e72' }}>
															{formatTimestamp(log.timestamp)}
														</div>
														<div style={{ fontSize: '0.75rem', color: '#b2bec2' }}>
															{Math.round(log.humidity)}% humidity • {log.wind_speed.toFixed(1)} m/s wind
														</div>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	)
}