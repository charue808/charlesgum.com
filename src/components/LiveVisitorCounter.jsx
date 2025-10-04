import { useState, useEffect } from "preact/hooks";
import { supabase } from "../lib/supabase";

export default function LiveVisitorCounter() {
	const [visitorCount, setVisitorCount] = useState(0);
	const [error, setError] = useState(false);
	const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9));

	useEffect(() => {
		console.log('Component mounted with sessionID...', sessionId)
		// register the visitor
		const registerVisitor = async () => {
			console.log('attempting to register user...')
			try {
        const { data, error } = await supabase
          .from('visitors')
          .upsert({ 
            session_id: sessionId, 
            last_seen: new Date().toISOString() 
          })
        
        if (error) {
          console.error('Error registering visitor:', error)
          setError(error.message)
        } else {
          console.log('Visitor registered successfully:', data)
        }
      } catch (err) {
        console.error('Exception during registration:', err)
        setError(err.message)
      }
		};

		
		// get current visitor count
		
		const getVisitorCount = async () => {
			console.log('Fetching visitor count...')
			try {
        const { data, error } = await supabase
          .from('visitors')
          .select('session_id')
          .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        
        if (error) {
          console.error('Error fetching visitor count:', error)
          setError(error.message)
        } else {
          console.log('Visitor count data:', data)
          setVisitorCount(data?.length || 0)
        }
      } catch (err) {
        console.error('Exception during count fetch:', err)
        setError(err.message)
      }
		}

		registerVisitor();
		getVisitorCount();

		// subscribe to real-time updates
		const subscription = supabase
      .channel('visitor-updates')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'visitors' },
          () => {
            console.log('Realtime update received')
            getVisitorCount()
          }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

		// update every 30 secconds
		const interval = setInterval(registerVisitor, 30000);

		return () => {
			subscription.unsubscribe();
			clearInterval(interval)
		}
	}, [sessionId])

	if (error) {
    return (
      <div style={{ padding: '1rem', background: '#fee', borderRadius: '8px' }}>
        <h3>❌ Error</h3>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    )
  }

	return (
		<div style={{
			padding: '1rem',
			background: '#ffffff',
			borderRadius: '8px',
			textAlign: 'center'
		}}>
			<h3>👥 Live Visitors</h3>
			<p style={{ fontSize: '2rem', color: '#22c55e'}}>{visitorCount}</p>
			<small>People viewing this site right now.</small>
		</div>
	)
}