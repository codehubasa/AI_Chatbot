import React, { useState } from 'react';
import { X, Mail, Phone, User, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LeadCaptureModal({ isOpen, onClose, businessName, onLeadSubmitted }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() && !phone.trim()) {
      setError('Please provide at least an email address or phone number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'Visitor',
          email: email.trim(),
          phone: phone.trim(),
          message: message.trim() || 'Contact requested via website modal',
          businessName: businessName || 'Business',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        // Trigger confetti
        try {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch (cErr) {}

        if (onLeadSubmitted) {
          onLeadSubmitted(data.lead);
        }

        setTimeout(() => {
          setSuccess(false);
          setName('');
          setEmail('');
          setPhone('');
          setMessage('');
          onClose();
        }, 2200);
      } else {
        setError(data.error || 'Failed to submit contact information.');
      }
    } catch (err) {
      setError('Network connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden transition-all animate-slide-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="py-8 text-center space-y-3 animate-fade-in">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Thank You!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
              Your message has been delivered to <strong>{businessName}</strong>. Our specialists will contact you shortly!
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 mb-2 border border-indigo-100 dark:border-indigo-900/50">
                <Mail className="w-3.5 h-3.5" />
                Direct Inquiry
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Contact {businessName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Leave your details below and a human representative will get back to you promptly.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Your Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  How can we help you?
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="I'm interested in pricing, custom setup, or scheduling a demo..."
                  className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-black dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Submitting inquiry...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Information</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
