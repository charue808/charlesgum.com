import { useState, useEffect } from "preact/hooks";

export default function QuoteMachine() {
	const [quote, setQuote] = useState('');
	const [author, setAuthor] = useState('');
	const [loading, setLoading] = useState(false);
	const [notification, setNotification] = useState(null);

	const fetchNewQuote = async () => {
		setLoading(true);

		try {
			const response = await fetch('https://florinbobis-quotes-net.hf.space/quotes/random');
			const data = await response.json();
			setQuote(data.quoteText);
			setAuthor(data.author);
		} catch (error) {
			console.error('Failed to fetch quote: ', error);
			showNotification('Failed to fetch quote', 'error');
		}
		setLoading(false);
	}

	const showNotification = (message, type = 'success') => {
		setNotification({message, type});
		setTimeout(() => setNotification(null), 3000);
	}

	useEffect(() => {
		fetchNewQuote();
	},[])

	return (
		<div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
			{/** Toast Notification */}
			{notification && (
				<div style={{
					position: 'fixed',
					top: '20px',
					right: '20px',
					padding: '1rem 1.5rem',
					background: notification.type === 'success' ? '#10b981' : '#ef4444',
					color: 'white',
					borderRadius: '8px',
					boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
					zIndex: 1000,
					animation: 'slideIn 0.3s ease-out'
				}}>
					{notification.message}
				</div>
			)}

			{/** Quote Display */}
			<div style={{
				background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
			}}>
				{loading ? (
					<div style={{ textAlign: 'center', padding: '2rem' }}>
						<div style={{
							border: '3px solid rgba(255,255,255,0.3)',
              borderTop: '3px solid white',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
						}}></div>
						<p style={{ marginTop: '1rem' }}>Loading wisdom...</p>
					</div>
				) : (
					<>
					<blockquote style={{
						fontSize: '1.25rem',
            fontStyle: 'italic',
            marginBottom: '1rem',
            lineHeight: '1.6'
					}}>
						"{quote}"
					</blockquote>
					<cite style={{ fontSize: '1rem', opacity: 0.9 }}>
						- {author}
					</cite>
					</>
				)}
				<div style={{ marginTop: '1rem' }}>
					<button
						onClick={fetchNewQuote}
						disabled={loading}
						style={{
							width: '100%',
              padding: '0.75rem 1.5rem',
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.3)',
              color: 'white',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.2s',
              opacity: loading ? 0.5 : 1
						}}
						onMouseEnter={(e) => !loading && (e.target.style.background = 'rgba(255,255,255,0.3)')}
            onMouseLeave={(e) => !loading && (e.target.style.background = 'rgba(255,255,255,0.2)')}
					>
						{ loading ? '...' : '🔄 New Quote' }
					</button>
				</div>
			</div>

			{/* Animations */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
		</div>
	)
}
