import { useState, useEffect } from 'preact/hooks';

export default function WeatherDashboard() {
	const [weather, setWeather] = useState(null);
	const [city, setCity] = useState('Pearl City, Hawaii');
	const [loading, setLoading] = useState(false);

	// Geocode city name to coordinates
	const geocodeCity = async (cityName) => {
		try {
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
			const coords = await geocodeCity(location);
			if (!coords) {
				throw new Error('Location not found');
			}
			const apikey = import.meta.env.PUBLIC_PIRATE_WEATHER_API_KEY;
			const response = await fetch(`https://api.pirateweather.net/forecast/${apikey}/${coords.lat},${coords.lon}?units=si`);

			const data = await response.json();
			const weatherData = {
				name: location,
				displayName: coords.displayName,
				currently: {
					temperature: data.currently.temperature,
					apparentTemperature: data.currently.apparentTemperature,
					humidity: data.currently.humidity * 100,
					summary: data.currently.summary,
					icon: data.currently.icon,
					windSpeed: data.currently.windSpeed,
					pressure: data.currently.pressure
				}
			};

			setWeather(weatherData);
		} catch(error) {
			console.error('Failed to fetch weather', error)
			const mockData = {
				name: location,
        displayName: location,
        currently: {
          temperature: 26,
          apparentTemperature: 28,
          humidity: 65,
          summary: 'Clear',
          icon: 'clear-day',
          windSpeed: 3.1,
					pressure: 1013
        }
			};

			setWeather(mockData);
		}
		setLoading(false);
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
					<div style={{
						background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
						color: 'white',
						padding: '2rem',
						borderRadius: '12px',
						marginTop: '1rem',
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
				)}
			</div>
		</div>
	)
}
