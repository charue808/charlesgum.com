import { useState, useEffect } from "preact/hooks";
import { supabase } from "../lib/supabase";

export default function QuoteMachine() {
	const [quote, setQuote] = useState('');
	const [author, setAuthor] = useState('');
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [favorites, setFavorites] = useState([]);
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
			showNotification('Failed to fetch quote', error);
		}
		setLoading(false);
	}

	const saveToFavorites = async () => {

		setSaving(true);

		/// Optimistic UI update with explicit temp flag
    const tempId = `temp-${Date.now()}`;
		const tempQuote = {
			id: tempId,
			quote,
			author,
			created_at: new Date().toISOString(),
			isTemp: true
		}

		setFavorites(prev => [tempQuote, ...prev])

		const { data, error } = await  supabase.from("favorite_quotes").insert([{ quote, author }]).select();

		if (error) {
			console.error('Error saving quote: ', error);
			showNotification('Failed to save quote', error);
			// remove the optimistic update
			setFavorites(prev => [data[0], ...prev.filter(f => f.id !== f.tempQuote.id)]);
		} else {
			showNotification('Quote saved to favorites! 💖', 'success')
      // Replace temp quote with real one
      setFavorites(prev => [
        data[0],
        ...prev.filter(f => f.id !== tempQuote.id)
      ])
		}
		setSaving(false);
	}

	const showNotification = (message, type = 'success') => {
		setNotification({message, type});
		setTimeout(() => setNotification(null), 3000);
	}

	const loadFavorites = async () => {
		const { data, error } = await supabase.from("favorite_quotes").select("*").order('created_at', { ascending: false }).limit(10);

		if (error) {
			console.error('Error loading favorites', error);
		} else {
			setFavorites(data || []);
		}
	}

	useEffect(() => {
		fetchNewQuote();
		loadFavorites();
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
					animation: 'slideIn 0.3s east-out'
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
				<div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
					<button
						onClick={fetchNewQuote}
						disabled={loading}
						style={{
							flex: 1,
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

					<button 
            onClick={saveToFavorites}
            disabled={saving || loading || !quote}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              background: saving ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.25)',
              border: '2px solid rgba(255,255,255,0.4)',
              color: 'white',
              borderRadius: '8px',
              cursor: (saving || loading || !quote) ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.2s',
              opacity: (saving || loading || !quote) ? 0.5 : 1,
              position: 'relative'
            }}
            onMouseEnter={(e) => !saving && !loading && quote && (e.target.style.background = 'rgba(255,255,255,0.35)')}
            onMouseLeave={(e) => !saving && !loading && quote && (e.target.style.background = 'rgba(255,255,255,0.25)')}
          >
            {saving ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <div style={{
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  animation: 'spin 0.8s linear infinite'
                }}></div>
                Saving...
              </span>
            ) : (
              '💖 Save Favorite'
            )}
          </button>
				</div>
			</div>
			{/** favorites list */}
			<div>
				<div style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '1rem'
				}}>
					<h3 style={{ margin: 0 }}>💫 Recent Favorites</h3>
					<span style={{
						fontSize: '0.875rem', 
            color: '#666',
            background: '#f3f4f6',
            padding: '0.25rem 0.75rem',
            borderRadius: '12px'
					}}>
						{favorites.length} saved
					</span>
				</div>
				{favorites.length === 0 ? (
					<div style={{
						textAlign: 'center',
            padding: '3rem 1rem',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '2px dashed #e5e7eb'
					}}>
						<p style={{ fontSize: '2rem', margin: '0 0 0.5rem 0'}}>📚</p>
						<p style={{ color: '#6b7280', margin: 0 }}>No favorites yet. Save your first inspiring quote!</p>
					</div>
				) : (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {favorites.map((fav) => (
              <div 
                key={fav.id} 
                style={{ 
                  background: fav.isTemp ? '#fef3c7' : '#f8f9fa',
                  padding: '1rem 1.25rem', 
                  borderRadius: '8px',
                  borderLeft: '4px solid #667eea',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  animation: 'fadeIn 0.5s ease-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)'
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <p style={{ 
                  margin: '0 0 0.5rem 0', 
                  fontStyle: 'italic',
                  fontSize: '0.95rem',
                  lineHeight: '1.5'
                }}>
                  "{fav.quote}"
                </p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <cite style={{ fontSize: '0.875rem', color: '#667eea', fontWeight: '600' }}>
                    — {fav.author}
                  </cite>
                  {fav.isTemp ? (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: '#92400e',
                      background: '#fde68a',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px'
                    }}>
                      Saving...
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {new Date(fav.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
				)}
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
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
		</div>
	)
}