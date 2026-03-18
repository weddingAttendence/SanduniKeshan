import React, { useEffect, useMemo, useState } from 'react';
import { AttendanceSubmission } from '../types/attendance';
import { saveSubmission, generateId } from '../utils/storage';
import { sendEmailNotification } from '../utils/email';

interface AttendanceFormProps {
  onSuccess: () => void;
}

export const AttendanceForm: React.FC<AttendanceFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    participating: true as boolean,
    attendeeCount: 1,
    note: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isMobile, setIsMobile] = useState(false);

  const membersMin = useMemo(() => (formData.participating ? 1 : 0), [formData.participating]);

  useEffect(() => {
    setFormData((prev) => {
      if (prev.attendeeCount < membersMin) {
        return { ...prev, attendeeCount: membersMin };
      }
      return prev;
    });
  }, [membersMin]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 480px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.attendeeCount < membersMin) {
      newErrors.attendeeCount = `Total people must be at least ${membersMin}`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const submission: AttendanceSubmission = {
        id: generateId(),
        name: formData.name.trim(),
        participating: formData.participating,
        attendeeCount: formData.participating ? formData.attendeeCount : 0,
        nonAttendeeCount: formData.participating ? 0 : formData.attendeeCount,
        note: formData.note.trim(),
        submittedAt: new Date().toISOString()
      };
      
      await saveSubmission(submission);
      await sendEmailNotification(submission);
      
      onSuccess();
    } catch (error) {
      console.error('Submission failed:', error);
      setErrors({ submit: 'Failed to submit. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          background: linear-gradient(145deg, #fce9e9 0%, #fbdede 100%);
          background-attachment: fixed;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.2rem;
          position: relative;
          overflow-x: hidden;
        }

        .floating-heart {
          position: absolute;
          font-size: 2rem;
          opacity: 0.2;
          color: #d68e8e;
          pointer-events: none;
          z-index: 0;
          animation: float 12s infinite ease-in-out;
        }

        .heart1 { top: 5%; left: 3%; animation-delay: 0s; }
        .heart2 { bottom: 8%; right: 2%; animation-delay: -4s; font-size: 2.8rem; }
        .heart3 { top: 15%; right: 10%; animation-delay: -2s; opacity: 0.15; }
        .ring {
          position: absolute;
          font-size: 2.2rem;
          opacity: 0.15;
          color: #b5947c;
          border: none;
          outline: none;
          box-shadow: none;
          background: transparent;
          transform: rotate(15deg);
          animation: slowSpin 20s linear infinite;
        }
        .ring1 { bottom: 20%; left: 5%; }
        .ring2 { top: 25%; right: 5%; animation-direction: reverse; }

        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes slowSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .rsvp-card {
          max-width: 650px;
          width: 100%;
          background: rgba(255, 250, 250, 0.7);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          border-radius: 48px;
          box-shadow: 0 30px 60px -20px rgba(140, 80, 80, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.6) inset;
          padding: 2.2rem 2rem 2.5rem;
          border: 1px solid rgba(255, 230, 230, 0.6);
          animation: cardGlide 0.8s cubic-bezier(0.15, 0.85, 0.25, 1) forwards;
          transform-origin: center;
          position: relative;
          z-index: 10;
        }

        @keyframes cardGlide {
          0% { opacity: 0; transform: translateY(40px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        .couple-names {
          font-family: 'Playfair Display', serif;
          font-size: 3rem;
          font-weight: 500;
          line-height: 1.1;
          color: #4b2e2e;
          text-align: center;
          margin-bottom: 0.3rem;
          letter-spacing: -0.5px;
          word-break: break-word;
        }
        .wedding-details {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 0.6rem 1.2rem;
          background: rgba(255, 235, 235, 0.6);
          border-radius: 80px;
          padding: 0.7rem 1.8rem;
          margin: 1rem 0 2rem 0;
          border: 1px solid #ffe1e1;
          color: #5a4040;
          font-weight: 400;
          font-size: 1.05rem;
          backdrop-filter: blur(4px);
        }
        .wedding-details i {
          color: #c67373;
          width: 1.4rem;
          text-align: center;
        }
        .detail-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .divider {
          color: #e2b9b9;
          font-weight: 300;
        }

        .form-group {
          margin-bottom: 2rem;
          animation: fadeUp 0.5s ease backwards;
        }
        .form-group:nth-of-type(1) { animation-delay: 0.1s; }
        .form-group:nth-of-type(2) { animation-delay: 0.2s; }
        .form-group:nth-of-type(3) { animation-delay: 0.3s; }
        .form-group:nth-of-type(4) { animation-delay: 0.4s; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        label {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-weight: 500;
          font-size: 1rem;
          color: #593e3e;
          margin-bottom: 0.6rem;
          letter-spacing: -0.2px;
        }
        label i {
          color: #d47e7e;
          font-size: 1.2rem;
          width: 1.6rem;
        }

        input, textarea {
          width: 100%;
          padding: 1rem 1.4rem;
          font-size: 1.05rem;
          font-family: 'Inter', sans-serif;
          background: rgba(255, 250, 250, 0.9);
          border: 2px solid #f5d0d0;
          border-radius: 34px;
          outline: none;
          transition: all 0.25s ease;
          color: #2f2626;
        }
        input:focus, textarea:focus {
          border-color: #e2a2a2;
          background: white;
          box-shadow: 0 0 0 6px rgba(240, 170, 170, 0.2);
          transform: scale(1.01);
        }
        input::placeholder, textarea::placeholder {
          color: #c7a8a8;
          font-weight: 300;
        }

        .attendance-cards {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-top: 0.5rem;
        }
        .attend-option {
          flex: 1 1 120px;
          background: rgba(255, 245, 245, 0.7);
          border: 2px solid #f5dbdb;
          border-radius: 60px;
          padding: 0.9rem 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          font-weight: 600;
          font-size: 1.2rem;
          color: #684a4a;
          transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1);
          cursor: pointer;
          box-shadow: 0 6px 14px rgba(190, 130, 130, 0.08);
          backdrop-filter: blur(4px);
        }
        .attend-option i {
          font-size: 1.4rem;
          color: #b27a7a;
          transition: inherit;
        }
        .attend-option.selected {
          background: #f5d2d2;
          border-color: #d88a8a;
          color: #482e2e;
          transform: scale(1.02);
          box-shadow: 0 12px 20px -10px #cf9f9f;
        }
        .attend-option.selected i {
          color: #b15757;
        }
        .attend-option input[type="radio"] {
          display: none;
        }

        #members {
          transition: 0.2s;
        }

        textarea {
          border-radius: 32px;
          min-height: 110px;
        }

        .submit-btn {
          background: linear-gradient(125deg, #e6b6b6, #d99090);
          border: none;
          color: white;
          font-weight: 600;
          font-size: 1.4rem;
          padding: 1.2rem 1.5rem;
          border-radius: 60px;
          width: 100%;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 18px 28px -12px #b67373;
          border: 1px solid rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
          margin-top: 1rem;
          animation: gentlePulse 3s infinite ease-in-out;
        }
        .submit-btn:hover {
          background: linear-gradient(125deg, #daa0a0, #cc7e7e);
          transform: scale(1.02);
          box-shadow: 0 22px 34px -12px #ac6c6c;
        }
        .submit-btn:active {
          transform: scale(0.98);
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: linear-gradient(125deg, #d4a0a0, #c07070);
          box-shadow: 0 18px 28px -12px #9a5a5a;
          transform: scale(1);
        }
        .submit-btn:disabled:hover {
          transform: scale(1);
          background: linear-gradient(125deg, #d4a0a0, #c07070);
          box-shadow: 0 18px 28px -12px #9a5a5a;
        }
        @keyframes gentlePulse {
          0% { box-shadow: 0 18px 28px -12px #b67373; }
          50% { box-shadow: 0 18px 36px -6px #c98686; }
          100% { box-shadow: 0 18px 28px -12px #b67373; }
        }
        .submit-btn:disabled {
          animation: none;
        }

        .footer-grace {
          text-align: center;
          margin-top: 2rem;
          font-size: 0.9rem;
          color: #a27a7a;
          font-style: italic;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        @media (max-width: 480px) {
          .rsvp-card { padding: 1.8rem 1.2rem; }
          .couple-names { font-size: 2.5rem; }
          .wedding-details { flex-direction: column; align-items: flex-start; border-radius: 40px; padding: 0.8rem 1.5rem; }
          .attendance-cards { flex-direction: column; }
          .attend-option { justify-content: flex-start; padding-left: 1.5rem; }
        }
      `}</style>

      <i className="fas fa-heart floating-heart heart1"></i>
      <i className="fas fa-heart floating-heart heart2"></i>
      <i className="fas fa-heart floating-heart heart3"></i>
      <i className="fas fa-ring ring ring1"></i>
      <i className="fas fa-ring ring ring2"></i>

      <div className="rsvp-card">
        <div className="couple-names">Keshan ✦ Sanduni</div>

        <div className="wedding-details">
          <span className="detail-item"><i className="far fa-calendar-alt"></i> 20.03.2026</span>
          <span className="divider">|</span>
          <span className="detail-item"><i className="fas fa-map-marker-alt"></i> Aradhana hotel, Richman Hill Rd, Galle</span>
        </div>

        <form id="rsvpForm" action="#" method="post" onSubmit={handleSubmit}>
          <div className="form-group">
            <label><i className="far fa-user"></i> your name (or family name)</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="e.g. Chamari Perera"
              autoComplete="name"
              required
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
            {errors.name && (
              <small style={{ display: 'block', marginTop: '0.4rem', paddingLeft: '1rem', color: '#b18585', fontSize: '0.8rem' }}>
                {errors.name}
              </small>
            )}
          </div>

          <div className="form-group">
            <label><i className="fas fa-question-circle"></i> will you attend?</label>
            <div className="attendance-cards">
              <label
                className={`attend-option ${formData.participating ? 'selected' : ''}`}
                id="optionAttend"
                style={
                  isMobile
                    ? {
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.95rem',
                        borderRadius: '34px',
                        flex: '0 0 auto',
                        width: 'auto'
                      }
                    : undefined
                }
                onClick={(e) => {
                  e.preventDefault();
                  setFormData((prev) => ({ ...prev, participating: true }));
                }}
              >
                <i className="fas fa-check-circle" style={isMobile ? { fontSize: '1.05rem' } : undefined}></i>
                <span>Yes</span>
                <input
                  type="radio"
                  name="participation"
                  value="attending"
                  checked={formData.participating}
                  onChange={() => setFormData((prev) => ({ ...prev, participating: true }))}
                />
              </label>
              <label
                className={`attend-option ${!formData.participating ? 'selected' : ''}`}
                id="optionDecline"
                style={
                  isMobile
                    ? {
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.95rem',
                        borderRadius: '34px',
                        flex: '0 0 auto',
                        width: 'auto'
                      }
                    : undefined
                }
                onClick={(e) => {
                  e.preventDefault();
                  setFormData((prev) => ({ ...prev, participating: false }));
                }}
              >
                <i className="fas fa-times-circle" style={isMobile ? { fontSize: '1.05rem' } : undefined}></i>
                <span>No</span>
                <input
                  type="radio"
                  name="participation"
                  value="not-attending"
                  checked={!formData.participating}
                  onChange={() => setFormData((prev) => ({ ...prev, participating: false }))}
                />
              </label>
            </div>
          </div>

          <div className="form-group">
            <label><i className="fas fa-users"></i> total people (including you)</label>
            <input
              type="number"
              id="members"
              name="members"
              min={membersMin}
              value={formData.attendeeCount}
              step={1}
              inputMode="numeric"
              required
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setFormData((prev) => ({ ...prev, attendeeCount: Number.isNaN(val) ? membersMin : val }));
              }}
              onBlur={() => {
                setFormData((prev) => ({
                  ...prev,
                  attendeeCount: prev.attendeeCount < membersMin ? membersMin : prev.attendeeCount
                }));
              }}
            />
            <small style={{ display: 'block', marginTop: '0.4rem', paddingLeft: '1rem', color: '#b18585', fontSize: '0.8rem' }}>
              <i className="far fa-smile-wink"></i> if 'No', you can still tell us how many are unable to attend
            </small>
            {errors.attendeeCount && (
              <small style={{ display: 'block', marginTop: '0.4rem', paddingLeft: '1rem', color: '#b18585', fontSize: '0.8rem' }}>
                {errors.attendeeCount}
              </small>
            )}
          </div>

          <div className="form-group">
            <label><i className="far fa-sticky-note"></i> a note for the couple</label>
            <textarea
              id="note"
              name="note"
              placeholder="dietary, allergies, or a sweet message …"
              value={formData.note}
              onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
            />
          </div>

          {errors.submit && (
            <small style={{ display: 'block', marginTop: '0.4rem', paddingLeft: '1rem', color: '#b18585', fontSize: '0.8rem' }}>
              {errors.submit}
            </small>
          )}

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            <i className="fas fa-paper-plane"></i> confirm response
          </button>
        </form>

        <div className="footer-grace">
          <i className="fas fa-crown"></i> can’t wait to see you <i className="fas fa-crown"></i>
        </div>
      </div>
    </>
  );
};