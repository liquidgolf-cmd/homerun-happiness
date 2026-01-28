import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useDictation } from '@/hooks/useDictation';
import { generatePreAssessmentSnapshot } from '@/lib/anthropic';
import { preAssessments } from '@/lib/supabase';
import { CONVERSION_COPY, HOMERUN_PRE_ASSESSMENT_KEY } from '@/utils/constants';
import { getRedirectPath } from '@/utils/routing';

type Step = 1 | 2 | 'summary' | 'snapshot' | 'snapshot-sent';

export default function Assessment() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [happinessScore, setHappinessScore] = useState(5);
  const [clarityScore, setClarityScore] = useState(5);
  const [readinessScore, setReadinessScore] = useState(5);
  const [biggestChallenge, setBiggestChallenge] = useState('');
  const [whyMatters, setWhyMatters] = useState('');
  const [whatWouldChange, setWhatWouldChange] = useState('');
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotEmail, setSnapshotEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingProgress, setCheckingProgress] = useState(true);
  const [aiSnapshotText, setAiSnapshotText] = useState<string | null>(null);
  const [generatingSnapshot, setGeneratingSnapshot] = useState(false);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);

  const appendChallenge = useCallback((text: string) => {
    setBiggestChallenge((prev) => (prev ? `${prev} ${text}` : text));
  }, []);
  const appendWhyMatters = useCallback((text: string) => {
    setWhyMatters((prev) => (prev ? `${prev} ${text}` : text));
  }, []);
  const appendWhatWouldChange = useCallback((text: string) => {
    setWhatWouldChange((prev) => (prev ? `${prev} ${text}` : text));
  }, []);

  const { isListening: listeningChallenge, speechSupported, toggleMic: toggleMicChallenge } = useDictation(appendChallenge);
  const { isListening: listeningWhy, toggleMic: toggleMicWhy } = useDictation(appendWhyMatters);
  const { isListening: listeningWhat, toggleMic: toggleMicWhat } = useDictation(appendWhatWouldChange);

  const recommendedPath = happinessScore + clarityScore + readinessScore < 15 ? 'business' : 'personal';

  useEffect(() => {
    const checkProgress = async () => {
      if (authLoading || !user?.id) {
        setCheckingProgress(false);
        return;
      }
      try {
        const redirectPath = await getRedirectPath(user.id);
        if (redirectPath !== '/assessment') {
          navigate(redirectPath, { replace: true });
          return;
        }
      } catch (err) {
        console.error('Error checking progress:', err);
      } finally {
        setCheckingProgress(false);
      }
    };
    checkProgress();
  }, [user?.id, authLoading, navigate]);

  useEffect(() => {
    if (step !== 'summary' || aiSnapshotText !== null || generatingSnapshot) return;
    setGeneratingSnapshot(true);
    setSnapshotError(null);
    generatePreAssessmentSnapshot({
      happinessScore,
      clarityScore,
      readinessScore,
      biggestChallenge,
      whyMatters,
      whatWouldChange,
      recommendedPath,
    })
      .then((text) => {
        setAiSnapshotText(text);
        setSnapshotError(null);
      })
      .catch(() => {
        setSnapshotError('We couldn\'t generate an AI summary. Showing your answers instead.');
      })
      .finally(() => {
        setGeneratingSnapshot(false);
      });
  }, [step, aiSnapshotText, generatingSnapshot, happinessScore, clarityScore, readinessScore, biggestChallenge, whyMatters, whatWouldChange, recommendedPath]);

  const handlePage1Submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!biggestChallenge.trim()) {
      setError('Please describe your biggest challenge');
      return;
    }
    setStep(2);
  };

  const handlePage2Submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!whyMatters.trim()) {
      setError('Please share why addressing this challenge matters to you');
      return;
    }
    setLoading(true);
    setAiSnapshotText(null);
    setSnapshotError(null);
    
    // Store assessment in sessionStorage (for B2: create on signup/login)
    const assessmentPayload = {
      happinessScore,
      clarityScore,
      readinessScore,
      biggestChallenge,
      whyMatters,
      whatWouldChange,
      recommendedPath,
    };
    try {
      sessionStorage.setItem(HOMERUN_PRE_ASSESSMENT_KEY, JSON.stringify(assessmentPayload));
    } catch (storageErr) {
      console.warn('Failed to save assessment to sessionStorage:', storageErr);
    }
    
    try {
      if (user?.id) {
        await preAssessments.createPreAssessment({
          user_id: user.id,
          email: user.email || '',
          happiness_score: happinessScore,
          clarity_score: clarityScore,
          readiness_score: readinessScore,
          biggest_challenge: biggestChallenge,
          recommended_path: recommendedPath,
        });
        // Clear sessionStorage since we've saved to DB
        try {
          sessionStorage.removeItem(HOMERUN_PRE_ASSESSMENT_KEY);
        } catch (storageErr) {
          // ignore
        }
      }
      setStep('summary');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSnapshotSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!snapshotName.trim() || !snapshotEmail.trim()) {
      setError('Please enter your name and email');
      return;
    }
    setLoading(true);
    try {
      // TODO: send HomeRun Snapshot email via your backend (e.g. Resend, SendGrid, Supabase Edge Function)
      // await sendSnapshotEmail({ name: snapshotName, email: snapshotEmail, summary: aiSnapshotText ?? buildSummaryText() });
      setStep('snapshot-sent');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const buildSummaryText = () => {
    const pathLabel = recommendedPath === 'business' ? 'Business Journey' : 'Personal Life Journey';
    return [
      `You're at ${happinessScore}/10 for happiness, ${clarityScore}/10 for clarity, and ${readinessScore}/10 for readiness.`,
      `Your biggest challenge right now is: ${biggestChallenge}`,
      whyMatters && `It matters to you because: ${whyMatters}`,
      whatWouldChange && `If you could overcome it, you imagine: ${whatWouldChange}`,
      `Based on your answers, we recommend the ${pathLabel}.`,
    ]
      .filter(Boolean)
      .join(' ');
  };

  if (checkingProgress || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-loam-brown"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-loam-neutral to-loam-neutral px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Stepper */}
        {(step === 1 || step === 2) && (
          <div className="mb-6 text-center text-sm text-gray-500">
            Step {step} of 2
          </div>
        )}

        {/* Step 1: Sliders + biggest challenge */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Pre-Assessment</h1>
              <p className="text-gray-600">Help us understand where you&apos;re at so we can guide your journey</p>
            </div>
            <form onSubmit={handlePage1Submit} className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-lg font-semibold text-gray-900">On a scale of 1–10, how happy are you right now?</label>
                  <span className="text-2xl font-bold text-loam-brown">{happinessScore}</span>
                </div>
                <input type="range" min="1" max="10" value={happinessScore} onChange={(e) => setHappinessScore(parseInt(e.target.value))} className="w-full h-3 bg-gray-200 rounded-loam appearance-none cursor-pointer accent-loam-brown" />
                <div className="flex justify-between text-xs text-gray-500 mt-1"><span>Not happy</span><span>Very happy</span></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-lg font-semibold text-gray-900">How clear are you on your goals?</label>
                  <span className="text-2xl font-bold text-loam-brown">{clarityScore}</span>
                </div>
                <input type="range" min="1" max="10" value={clarityScore} onChange={(e) => setClarityScore(parseInt(e.target.value))} className="w-full h-3 bg-gray-200 rounded-loam appearance-none cursor-pointer accent-loam-brown" />
                <div className="flex justify-between text-xs text-gray-500 mt-1"><span>Unclear</span><span>Very clear</span></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-lg font-semibold text-gray-900">How ready are you to make changes?</label>
                  <span className="text-2xl font-bold text-loam-brown">{readinessScore}</span>
                </div>
                <input type="range" min="1" max="10" value={readinessScore} onChange={(e) => setReadinessScore(parseInt(e.target.value))} className="w-full h-3 bg-gray-200 rounded-loam appearance-none cursor-pointer accent-loam-brown" />
                <div className="flex justify-between text-xs text-gray-500 mt-1"><span>Not ready</span><span>Very ready</span></div>
              </div>
              <div>
                <label htmlFor="challenge" className="block text-lg font-semibold text-gray-900 mb-3">What&apos;s your biggest challenge right now?</label>
                <div className="flex gap-2 items-end">
                  <textarea id="challenge" value={biggestChallenge} onChange={(e) => setBiggestChallenge(e.target.value)} className="flex-1 min-h-[100px] px-4 py-3 border border-gray-300 rounded-loam focus:ring-2 focus:ring-loam-brown focus:border-transparent resize-none" rows={4} placeholder="Tell us what's holding you back or what you're struggling with most... Type or use the mic to dictate." required />
                  <button
                    type="button"
                    onClick={toggleMicChallenge}
                    disabled={!speechSupported}
                    aria-label={!speechSupported ? 'Dictation not supported' : listeningChallenge ? 'Stop dictation' : 'Start dictation'}
                    title={!speechSupported ? 'Dictation not supported' : listeningChallenge ? 'Stop dictation' : 'Dictate'}
                    className={`flex-shrink-0 flex items-center justify-center gap-1.5 min-w-[4rem] h-12 px-3 rounded-loam font-medium transition ${
                      listeningChallenge
                        ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-400 focus:ring-offset-2'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-loam-brown focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {listeningChallenge ? <StopIcon className="w-5 h-5 shrink-0" aria-hidden /> : <MicrophoneIcon className="w-5 h-5 shrink-0" aria-hidden />}
                    <span className="text-xs font-semibold whitespace-nowrap">{listeningChallenge ? 'Stop' : 'Mic'}</span>
                  </button>
                </div>
                {listeningChallenge && <p className="mt-1 text-xs text-red-600 font-medium" role="status">Listening… speak now. Click the mic again to stop.</p>}
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-loam text-sm">{error}</div>}
              <button type="submit" className="w-full bg-loam-brown text-white py-4 px-6 rounded-loam text-lg font-semibold hover:bg-loam-brown/90 focus:outline-none focus:ring-2 focus:ring-loam-brown focus:ring-offset-2 transition">Continue</button>
            </form>
          </div>
        )}

        {/* Step 2: Why questions */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">A little more about why this matters</h1>
              <p className="text-gray-600">Go a bit deeper so we can tailor your snapshot</p>
            </div>
            <form onSubmit={handlePage2Submit} className="space-y-6">
              <div>
                <label htmlFor="why-matters" className="block text-lg font-semibold text-gray-900 mb-2">Why does addressing this challenge matter to you?</label>
                <div className="flex gap-2 items-end">
                  <textarea id="why-matters" value={whyMatters} onChange={(e) => setWhyMatters(e.target.value)} className="flex-1 min-h-[100px] px-4 py-3 border border-gray-300 rounded-loam focus:ring-2 focus:ring-loam-brown focus:border-transparent resize-none" rows={4} placeholder="What's at stake for you? Type or use the mic to dictate." required />
                  <button
                    type="button"
                    onClick={toggleMicWhy}
                    disabled={!speechSupported}
                    aria-label={!speechSupported ? 'Dictation not supported' : listeningWhy ? 'Stop dictation' : 'Start dictation'}
                    title={!speechSupported ? 'Dictation not supported' : listeningWhy ? 'Stop dictation' : 'Dictate'}
                    className={`flex-shrink-0 flex items-center justify-center gap-1.5 min-w-[4rem] h-12 px-3 rounded-loam font-medium transition ${
                      listeningWhy
                        ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-400 focus:ring-offset-2'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-loam-brown focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {listeningWhy ? <StopIcon className="w-5 h-5 shrink-0" aria-hidden /> : <MicrophoneIcon className="w-5 h-5 shrink-0" aria-hidden />}
                    <span className="text-xs font-semibold whitespace-nowrap">{listeningWhy ? 'Stop' : 'Mic'}</span>
                  </button>
                </div>
                {listeningWhy && <p className="mt-1 text-xs text-red-600 font-medium" role="status">Listening… speak now. Click the mic again to stop.</p>}
              </div>
              <div>
                <label htmlFor="what-would-change" className="block text-lg font-semibold text-gray-900 mb-2">What would be different in your life if you could overcome it?</label>
                <div className="flex gap-2 items-end">
                  <textarea id="what-would-change" value={whatWouldChange} onChange={(e) => setWhatWouldChange(e.target.value)} className="flex-1 min-h-[100px] px-4 py-3 border border-gray-300 rounded-loam focus:ring-2 focus:ring-loam-brown focus:border-transparent resize-none" rows={4} placeholder="Imagine the impact... Type or use the mic to dictate." />
                  <button
                    type="button"
                    onClick={toggleMicWhat}
                    disabled={!speechSupported}
                    aria-label={!speechSupported ? 'Dictation not supported' : listeningWhat ? 'Stop dictation' : 'Start dictation'}
                    title={!speechSupported ? 'Dictation not supported' : listeningWhat ? 'Stop dictation' : 'Dictate'}
                    className={`flex-shrink-0 flex items-center justify-center gap-1.5 min-w-[4rem] h-12 px-3 rounded-loam font-medium transition ${
                      listeningWhat
                        ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-400 focus:ring-offset-2'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-loam-brown focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {listeningWhat ? <StopIcon className="w-5 h-5 shrink-0" aria-hidden /> : <MicrophoneIcon className="w-5 h-5 shrink-0" aria-hidden />}
                    <span className="text-xs font-semibold whitespace-nowrap">{listeningWhat ? 'Stop' : 'Mic'}</span>
                  </button>
                </div>
                {listeningWhat && <p className="mt-1 text-xs text-red-600 font-medium" role="status">Listening… speak now. Click the mic again to stop.</p>}
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-loam text-sm">{error}</div>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} disabled={loading} className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-loam font-semibold hover:bg-gray-50 transition disabled:opacity-50">Back</button>
                <button type="submit" disabled={loading} className="flex-1 bg-loam-brown text-white py-4 px-6 rounded-loam text-lg font-semibold hover:bg-loam-brown/90 focus:outline-none focus:ring-2 focus:ring-loam-brown focus:ring-offset-2 transition disabled:opacity-50">{loading ? 'Saving...' : 'See my summary'}</button>
              </div>
            </form>
          </div>
        )}

        {/* Summary */}
        {step === 'summary' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6 pb-4 border-b border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Your HomeRun Snapshot</h1>
              <p className="text-gray-600">Your first step toward clarity—here&apos;s what we see.</p>
            </div>
            <div className="mb-6 p-6 bg-loam-neutral rounded-loam border border-loam-clay/20 text-gray-700 leading-relaxed whitespace-pre-wrap">
              {generatingSnapshot ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-600">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-loam-brown mb-4" />
                  <p>Generating your snapshot…</p>
                </div>
              ) : snapshotError && !aiSnapshotText ? (
                <>
                  {snapshotError && <p className="text-sm text-amber-700 mb-3">{snapshotError}</p>}
                  {buildSummaryText()}
                </>
              ) : (
                aiSnapshotText ?? buildSummaryText()
              )}
            </div>
            <div className="mb-8 p-6 bg-loam-neutral rounded-loam border-2 border-loam-brown/30 text-left">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Your snapshot is just the start. Here&apos;s what the full program adds.</h2>
              <p className="text-gray-700 mb-3">The full HomeRun program builds on this with AI coaching through every base.</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li><strong>Deeper WHY discovery</strong> — Unpack what really drives you (At Bat).</li>
                <li><strong>WHO you really are</strong> — Get beyond roles to your core identity (First Base).</li>
                <li><strong>WHAT you want & what&apos;s in the way</strong> — Clarify desires and name fears or obstacles (Second Base).</li>
                <li><strong>HOW you&apos;ll move forward</strong> — A concrete action plan and ways to stay on track (Third Base).</li>
                <li><strong>Why it MATTERS</strong> — Legacy, sustainability, and the ripple effect of your journey (Home Plate).</li>
                <li><strong>Your full journey report</strong> — A personalized summary and breakthroughs you can keep.</li>
              </ul>
              <div className="pt-6 border-t border-loam-brown/20">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-xl text-gray-400 line-through">$299</span>
                  <span className="text-3xl font-bold text-loam-brown">$59</span>
                </div>
                <p className="text-center text-sm text-gray-500 mb-2">{CONVERSION_COPY.SCARCITY_LINE}</p>
                <p className="text-center text-sm text-gray-600 mb-4">{CONVERSION_COPY.TRUST_LINE}</p>
                <Link to="/purchase" className="block w-full text-center bg-loam-brown text-white py-4 px-6 rounded-loam text-lg font-semibold hover:bg-loam-brown/90 focus:outline-none focus:ring-2 focus:ring-loam-brown focus:ring-offset-2 transition">
                  Start my full journey — $59
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              <button type="button" onClick={() => setStep('snapshot')} disabled={generatingSnapshot} className="w-full bg-loam-brown text-white py-4 px-6 rounded-loam text-lg font-semibold hover:bg-loam-brown/90 focus:outline-none focus:ring-2 focus:ring-loam-brown focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed">
                Get my snapshot by email
              </button>
              <button type="button" onClick={() => navigate('/path-selection', { state: { happinessScore, clarityScore, readinessScore, biggestChallenge, whyMatters, whatWouldChange, recommendedPath } })} className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm font-medium">
                Skip for now and see my recommended path
              </button>
            </div>
          </div>
        )}

        {/* Snapshot: name + email */}
        {step === 'snapshot' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Get your HomeRun Snapshot by email</h1>
              <p className="text-gray-600">We&apos;ll send your snapshot to your inbox</p>
            </div>
            <form onSubmit={handleSnapshotSubmit} className="space-y-4">
              <div>
                <label htmlFor="snapshot-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input id="snapshot-name" type="text" value={snapshotName} onChange={(e) => setSnapshotName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-loam focus:ring-2 focus:ring-loam-brown focus:border-transparent" placeholder="Your name" required />
              </div>
              <div>
                <label htmlFor="snapshot-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input id="snapshot-email" type="email" value={snapshotEmail} onChange={(e) => setSnapshotEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-loam focus:ring-2 focus:ring-loam-brown focus:border-transparent" placeholder="you@example.com" required />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-loam text-sm">{error}</div>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep('summary')} className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-loam font-semibold hover:bg-gray-50 transition">Back</button>
                <button type="submit" disabled={loading} className="flex-1 bg-loam-brown text-white py-4 px-6 rounded-loam text-lg font-semibold hover:bg-loam-brown/90 focus:outline-none focus:ring-2 focus:ring-loam-brown focus:ring-offset-2 disabled:opacity-50 transition">
                  {loading ? 'Sending...' : 'Send my Snapshot'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Snapshot sent + Purchase CTA */}
        {step === 'snapshot-sent' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-8">
              <div className="w-16 h-16 bg-loam-green rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">✓</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h1>
              <p className="text-gray-600">Your HomeRun Snapshot has been sent to <strong>{snapshotEmail}</strong>.</p>
            </div>
            <div className="p-6 bg-loam-neutral rounded-loam border-2 border-loam-brown/30 mb-6 text-left">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Ready to run the full path?</h2>
              <p className="text-gray-700 mb-3">{CONVERSION_COPY.WHAT_YOU_GET_LINE}</p>
              <p className="text-sm text-gray-600 mb-4">{CONVERSION_COPY.SCARCITY_LINE}</p>
              <p className="text-sm text-gray-600 mb-4">{CONVERSION_COPY.TRUST_LINE}</p>
              <Link to="/purchase" className="block w-full text-center bg-loam-brown text-white py-4 px-6 rounded-loam text-lg font-semibold hover:bg-loam-brown/90 focus:outline-none focus:ring-2 focus:ring-loam-brown focus:ring-offset-2 transition">
                Start my full journey — $59
              </Link>
            </div>
            <button type="button" onClick={() => navigate('/path-selection', { state: { happinessScore, clarityScore, readinessScore, biggestChallenge, whyMatters, whatWouldChange, recommendedPath } })} className="text-gray-500 hover:text-gray-700 text-sm">
              Just show my recommended path for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
