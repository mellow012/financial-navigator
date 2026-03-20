import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-8 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: January 2025</p>

        <div className="space-y-8 text-white/70 leading-relaxed">
          <Section title="1. Data We Collect">
            <p>SmartFin MW collects the following data to provide the service:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-white/60">
              <li>Account info: email address and display name</li>
              <li>Financial data: transactions you log (amounts, categories, descriptions)</li>
              <li>Budget settings and savings goals you create</li>
              <li>Price alert preferences</li>
            </ul>
            <p className="mt-3">We do <strong className="text-white">not</strong> collect bank account details, card numbers, or mobile money PINs.</p>
          </Section>

          <Section title="2. How We Use Your Data">
            <p>Your data is used exclusively to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-white/60">
              <li>Display your financial dashboard and transaction history</li>
              <li>Generate AI-powered financial advice via Claude (Anthropic)</li>
              <li>Send price alerts you configure</li>
              <li>Calculate budget progress and savings rates</li>
            </ul>
          </Section>

          <Section title="3. AI Processing (Claude)">
            <p>
              When you use the AI Advisor feature, anonymised summaries of your transaction data (categories and amounts, not personal details)
              are sent to Anthropic's Claude API to generate financial advice.
              This data is processed under Anthropic's{' '}
              <a href="https://www.anthropic.com/privacy" className="text-purple-400 hover:underline" target="_blank" rel="noreferrer">
                Privacy Policy
              </a>. Anthropic does not use your data to train models by default.
            </p>
          </Section>

          <Section title="4. Data Storage">
            <p>
              Your data is stored securely in Google Firebase (Firestore), hosted in Google's cloud infrastructure.
              Data is protected by Firebase Security Rules ensuring only you can access your own records.
            </p>
          </Section>

          <Section title="5. Data Sharing">
            <p>We do <strong className="text-white">not</strong> sell, rent, or share your personal data with third parties except:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-white/60">
              <li>Google Firebase — for storage and authentication</li>
              <li>Anthropic — for AI advice generation (anonymised transaction summaries only)</li>
            </ul>
          </Section>

          <Section title="6. Your Rights">
            <p>You have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-white/60">
              <li>Access all your data via the app</li>
              <li>Delete individual transactions at any time</li>
              <li>Request complete account deletion by emailing us</li>
            </ul>
          </Section>

          <Section title="7. Contact">
            <p>
              For privacy concerns, contact us at{' '}
              <a href="mailto:privacy@smartfin.mw" className="text-purple-400 hover:underline">
                privacy@smartfin.mw
              </a>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}