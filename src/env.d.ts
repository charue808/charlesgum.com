interface ImportMetaEnv {
	readonly PUBLIC_GA_MEASUREMENT_ID: string
	readonly PUBLIC_SUPABASE_URL: string
	readonly PUBLIC_SUPABASE_ANON_KEY: string
	readonly PUBLIC_PIRATE_WEATHER_API_KEY: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}