import { useState } from "preact/hooks";
import { supabase } from "../lib/supabase";

export default function ContactForm() {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		subject: '',
		message: '',
		type: 'general' // general, project, collaboration, etc.
	});

	const [status, setStatus] = useState('idle'); // idle, submitting, success, error
	const [statusMessage, setStatusMessage] = useState('');

	const handleSubmit = async (e) => {
		e.preventDefault();
		setStatus('submitting');
		setStatusMessage('');

		// basic form validation
		if (!formData.name || !formData.email || !formData.message) {
			setStatus('error');
			setStatusMessage('Please fill in all required fields');
			return;
		}

		try {
			const { error } = await supabase.from('contact_messages').insert([
				{
					name: formData.name.trim(),
					email: formData.email.trim(),
					subject: formData.subject.trim() || 'No Subject',
					message: formData.message.trim(),
					type: formData.type,
					created_at: new Date().toISOString(),
					status: 'new',
					ip_address: null,
					user_agent: navigator.userAgent.substring(0,200)
				}
			]);

			if (error) {
				throw error;
			}

			setStatus('success');
			setStatusMessage("Thanks for the message! I'll get back to you within 24-48 hours.");
			setFormData({
				name: '',
				email: '',
				subject: '',
				message: '',
				type: 'general'
			});

		} catch (error) {
			console.error('Contact form error: ', error);
			setStatus('error');
			setStatusMessage('Sorry there was an error sending the message. Please try emailing me directly at hell@charlesgum.com');
		}
	};

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		});
	};
	
	return (
		<form onSubmit={handleSubmit} className="contact-form">
			<div className="form-group">
				<label htmlFor="name">Name *</label>
				<input 
					type="text"
					id="name"
					name="name"
					value={formData.name}
					onChange={handleChange}
					required
					disabled={status === 'submitting'}
				/>
			</div>

			<div className="form-group">
				<label htmlFor="email">Email *</label>
				<input 
					type="email"
					id="email"
					name="email"
					value={formData.email}
					onChange={handleChange}
					required
					disabled={status === 'submitting'}
				/>
			</div>

			<div className="form-group">
				<label htmlFor="type">What's this about?</label>
				<select
					id="type"
					name="type"
					value={formData.type}
					onChange={handleChange}
					disabled={status === 'submitting'}
				>
					<option value="general">General inquiry</option>
          <option value="project">Project collaboration</option>
          <option value="consulting">Consulting/freelance</option>
          <option value="coffee">Coffee chat</option>
          <option value="feedback">Feedback on site/projects</option>
          <option value="other">Other</option>
				</select>
			</div>

			<div className="form-group">
				<label htmlFor="subject">Subject</label>
				<input
					type="text"
					id="subject"
					name="subject"
					value={formData.subject}
					onChange={handleChange}
					required
					disabled={status === 'submitting'} 
				/>
			</div>

			<div className="form-group">
				<label htmlFor="message">Message *</label>
				<textarea 
					id="message"
					name="message"
					value={formData.message}
					rows={6}
					placeholder="Tell me about your project, questions, or just say hello!"
					onChange={handleChange}
					required
					disabled={status === 'submitting'}
				/>
			</div>

			<button
				type="submit"
				disabled={status === 'submitting'}
				className={`submit-btn ${status}`}
			>
				{status === 'submitting' ? 'Sending...' : 'Send Message' }
			</button>

			{statusMessage && (
				<div className={`status-message ${status}`}>
					{status === 'success' ? '✅' : '❌'} {statusMessage}
				</div>
			)}

			<div className="privacy-note">
				<small>
					📝 By sending this message, you agree to our <a href="/privacy">privacy policy</a>. 
          Your information will only be used to respond to your inquiry.
				</small>
			</div>

			<style jsx>{`
        .contact-form {
          background: #ffffff;
          padding: 2rem;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-group input:disabled,
        .form-group select:disabled,
        .form-group textarea:disabled {
          background-color: #f3f4f6;
          color: #6b7280;
          cursor: not-allowed;
        }

        .submit-btn {
          width: 100%;
          padding: 0.875rem 1.5rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .submit-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .submit-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .submit-btn.submitting {
          background: #6b7280;
        }

        .status-message {
          margin-top: 1rem;
          padding: 0.75rem;
          border-radius: 0.375rem;
          font-weight: 500;
        }

        .status-message.success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .status-message.error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .privacy-note {
          margin-top: 1rem;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 0.375rem;
          text-align: center;
        }

        .privacy-note a {
          color: #2563eb;
          text-decoration: underline;
        }
      `}</style>
		</form>
	)

}