import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-8 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-white/40 text-sm mb-10">Effective: January 2025</p>

        <div className="space-y-8 text-white/70 leading-relaxed">
          <Section title="1. Acceptance">
            <p>By using SmartFin MW, you agree to these terms. If you disagree, please do not use the app.</p>
          </Section>

          <Section title="2. Service Description">
            <p>
              SmartFin MW is a personal finance tracking application designed for users in Malawi.
              It provides expense logging, budget planning, market price data, and AI-powered financial advice.
            </p>
          </Section>

          <Section title="3. Not Financial Advice">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-amber-300 font-semibold mb-1">⚠️ Important Disclaimer</p>
              <p className="text-white/70">
                SmartFin MW and its AI Advisor provide <strong className="text-white">general financial information only</strong>.
                This is <strong className="text-white">not professional financial advice</strong>.
                Always consult a qualified financial advisor before making significant financial decisions.
                Market price data may be delayed or inaccurate.
              </p>
            </div>
          </Section>

          <Section title="4. User Responsibilities">
            <ul className="list-disc list-inside space-y-1 text-white/60">
              <li>You are responsible for the accuracy of data you enter</li>
              <li>Keep your password secure and do not share your account</li>
              <li>You must be at least 18 years old to use this service</li>
              <li>Do not use the service for fraudulent purposes</li>
            </ul>
          </Section>

          <Section title="5. Intellectual Property">
            <p>
              SmartFin MW and its content are owned by SmartFin MW. You may not copy, distribute,
              or create derivative works without written permission.
            </p>
          </Section>

          <Section title="6. Limitation of Liability">
            <p>
              SmartFin MW is provided "as is" without warranty of any kind.
              We are not liable for financial losses arising from use of the app,
              inaccurate price data, or AI advice.
            </p>
          </Section>

          <Section title="7. Termination">
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms
              or engage in abusive behavior.
            </p>
          </Section>

          <Section title="8. Changes">
            <p>
              We may update these terms. Continued use of the app after changes constitutes acceptance.
            </p>
          </Section>

          <Section title="9. Contact">
            <p>
              Questions?{' '}
              <a href="mailto:legal@smartfin.mw" className="text-purple-400 hover:underline">
                legal@smartfin.mw
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
