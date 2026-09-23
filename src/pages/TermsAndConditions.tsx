import { Link } from 'react-router-dom'
import {
  ShieldCheck, Lock, Mail, ChevronLeft, Shield, FileText, CheckCircle2, Send, Clock3,
  Ban, Scale, RefreshCw, AlertTriangle, AlertCircle,
} from 'lucide-react'

const LAST_UPDATED = 'September 22, 2026'

const SECTIONS = [
  { id: 'acceptance', label: 'Acceptance of Terms' },
  { id: 'description', label: 'Description of Service' },
  { id: 'eligibility', label: 'Eligibility & Acceptable Use' },
  { id: 'submitted-information', label: 'Submitted Information' },
  { id: 'processing-results', label: 'Request Processing & Results' },
  { id: 'email-communication', label: 'Email Communication' },
  { id: 'prohibited-uses', label: 'Prohibited Uses' },
  { id: 'accuracy-liability', label: 'Accuracy & Limitation of Liability' },
  { id: 'intellectual-property', label: 'Intellectual Property' },
  { id: 'changes', label: 'Changes to the Service or Terms' },
  { id: 'suspension', label: 'Suspension of Access' },
  { id: 'governing-law', label: 'Governing Law' },
  { id: 'contact', label: 'Contact Information' },
]

function Section({ id, title, icon: Icon, children }: { id: string; title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 pt-8 first:pt-0">
      <h2 className="flex items-center gap-2.5 text-[19px] sm:text-[21px] font-[800] tracking-[-0.01em] text-[#0C1E3A]">
        <span className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-blue-100 grid place-items-center text-[#0F766E] shrink-0"><Icon size={16} /></span>
        {title}
      </h2>
      <div className="mt-3 text-[14px] sm:text-[14.5px] leading-7 text-[#3D4A63] space-y-3">
        {children}
      </div>
    </section>
  )
}

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-[#FDFDFB] text-[#0C1E3A] selection:bg-[#0C1E3A] selection:text-white antialiased overflow-x-hidden flex flex-col">
      <style>{`
        * { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .serif { font-family: 'Instrument Serif', Georgia, serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        :focus-visible { outline: 2px solid #0C1E3A; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
      `}</style>

      <div className="w-full bg-[#0C1E3A] text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-[36px] flex items-center justify-between text-[12px] leading-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> VERIFICATION BY REQUEST
            </span>
            <span className="hidden sm:inline text-white/80 truncate">Team review • Email result • No instant search</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-white/70 font-medium shrink-0">
            <span className="inline-flex items-center gap-1.5"><Lock size={12} /> Secure & Private</span>
            <span className="w-px h-3 bg-white/15" />
            <a href="mailto:support@karachiechallan.pk" className="hover:text-white inline-flex items-center gap-1.5"><Mail size={12} /> support@karachiechallan.pk</a>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-[#FDFDFB]/85 backdrop-blur-xl border-b border-[#0C1E3A]/[0.06]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-[68px] sm:h-[72px] flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 text-left shrink-0 group">
            <div className="w-[42px] h-[42px] rounded-[12px] bg-[#0C1E3A] flex items-center justify-center text-white shadow-[0_6px_18px_rgba(12,30,58,0.18)] group-hover:shadow-[0_8px_22px_rgba(12,30,58,0.22)] transition-shadow">
              <ShieldCheck size={20} strokeWidth={1.9} />
            </div>
            <div className="leading-tight">
              <div className="text-[16px] sm:text-[17px] font-[900] tracking-[-0.03em] leading-none">Karachi E-Challan</div>
              <div className="text-[10px] sm:text-[11px] font-semibold tracking-[0.12em] text-[#0F766E] uppercase">Verification Service</div>
            </div>
          </Link>
          <div className="hidden lg:flex items-center gap-2 text-[13px] font-medium text-[#5B6B85]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#0C1E3A]/10 px-3 py-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Terms &amp; Conditions
            </span>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 bg-white border border-[#0C1E3A]/10 hover:bg-[#F8FAFC] active:scale-[0.98] rounded-full px-4 sm:px-5 h-[42px] text-[14px] font-[700] text-[#0C1E3A] shadow-sm transition">
            <ChevronLeft size={16} /> <span className="hidden sm:inline">Back to Home</span><span className="sm:hidden">Home</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 bg-[#F8FAFC] border-b border-[#0C1E3A]/5">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-[#5B6B85]">
            <Link to="/" className="hover:text-[#0C1E3A] inline-flex items-center gap-1"><ChevronLeft size={14} /> Home</Link>
            <span className="opacity-40">/</span>
            <span className="text-[#0C1E3A] font-[700]">Terms &amp; Conditions</span>
          </div>

          <div className="mt-6 sm:mt-8 max-w-[760px]">
            <h1 className="text-[30px] sm:text-[40px] font-[900] tracking-[-0.03em] leading-[0.95] text-[#0C1E3A] text-balance">
              Terms &amp; <span className="serif italic font-normal text-[#0F766E]">Conditions</span>
            </h1>
            <p className="mt-3 text-[14px] sm:text-[15px] leading-7 text-[#4A5A78]">
              These Terms &amp; Conditions govern your use of Karachi E-Challan and its verification request services. By submitting a request through this website, you agree to these terms.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white border border-[#0C1E3A]/10 px-3.5 py-2 text-[12px] font-[700] text-[#5B6B85] shadow-sm">
              <Clock3 size={13} className="text-[#0F766E]" /> Last Updated: {LAST_UPDATED}
            </div>
          </div>

          <div className="mt-10 grid lg:grid-cols-[240px_1fr] gap-8 items-start">
            <nav aria-label="Sections" className="hidden lg:block lg:sticky lg:top-[100px] bg-white rounded-2xl border border-[#0C1E3A]/[0.06] shadow-sm p-4">
              <div className="text-[11px] font-[800] tracking-[0.1em] text-[#0C1E3A] px-2">ON THIS PAGE</div>
              <ul className="mt-2 space-y-0.5">
                {SECTIONS.map(s => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="block px-2 py-1.5 rounded-lg text-[13px] font-[500] text-[#4A5A78] hover:text-[#0C1E3A] hover:bg-[#F8FAFC] transition">{s.label}</a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="bg-white rounded-[24px] border border-[#0C1E3A]/[0.06] shadow-[0_16px_48px_rgba(12,30,58,0.06)] p-6 sm:p-10 min-w-0">
              <div className="rounded-xl bg-[#EFF6FF] border border-blue-100 px-4 py-3 flex gap-2.5 text-[12.5px] leading-5 text-[#1E3A5F] mb-8">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>Karachi E-Challan is an independent verification request platform. It is <span className="font-[700]">not a government website</span> and has no official affiliation with any traffic police department or government body.</span>
              </div>

              <Section id="acceptance" title="Acceptance of Terms" icon={CheckCircle2}>
                <p>By accessing this website or submitting a request through any of our service forms, you agree to be bound by these Terms &amp; Conditions and our Privacy Policy. If you do not agree with these terms, please do not use this website.</p>
              </Section>

              <Section id="description" title="Description of Service" icon={FileText}>
                <p>Karachi E-Challan is a verification request platform. You submit a request — Check Challan, Challan Paid / Unpaid / Waived, Check Complaint Status, or Check Blacklist / Block — through the relevant form, our team reviews the available records, and we email you the outcome.</p>
                <p>This is not an instant, automated lookup service, and results are not displayed on the website itself. We do not claim government database access or official affiliation, and we do not process challan payments on this website.</p>
              </Section>

              <Section id="eligibility" title="Eligibility & Acceptable Use" icon={CheckCircle2}>
                <p>You may use this website only for lawful purposes and in accordance with these terms. By submitting a request, you confirm that:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>You are submitting the request for yourself, or for a vehicle or matter you have the right to inquire about;</li>
                  <li>The information you provide is accurate and complete to the best of your knowledge; and</li>
                  <li>You will use the results only for your own personal reference.</li>
                </ul>
              </Section>

              <Section id="submitted-information" title="Submitted Information" icon={FileText}>
                <p>Each service form requests the details necessary to process that specific type of request (for example, CNIC and challan number for a Check Challan request, or a vehicle number for a Blacklist / Block check). Submitting a request means you consent to our team using this information to review and respond to it, as described in our Privacy Policy.</p>
                <p>Providing inaccurate or incomplete information may result in a request that cannot be verified, is delayed, or is marked as requiring more information.</p>
              </Section>

              <Section id="processing-results" title="Request Processing & Results" icon={Send}>
                <p>Submitted requests are reviewed by our team, not resolved automatically. Once a request has been reviewed, we record a result appropriate to the service used (for example, Challan Found / No Challan Found, Paid / Unpaid / Waived, Still Pending / Rejected / Accepted, or a blacklist / block status) and email it to the address you provided.</p>
                <p>Processing times may vary depending on request volume and the information available. Submitting multiple requests for the same matter does not speed up processing and may be treated as a duplicate submission.</p>
              </Section>

              <Section id="email-communication" title="Email Communication" icon={Send}>
                <p>By submitting a request, you agree that we may email you regarding that request, including confirmations, results, and any follow-up needed to complete verification. We do not send unrelated marketing email using the address you provide for a request.</p>
              </Section>

              <Section id="prohibited-uses" title="Prohibited Uses" icon={Ban}>
                <p>You agree not to:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Submit false, misleading, or another person's information without their knowledge or consent;</li>
                  <li>Submit repeated, automated, or bulk requests not made in good faith;</li>
                  <li>Attempt to gain unauthorized access to the admin panel, other users' requests, or any part of the website's underlying systems;</li>
                  <li>Use the website to harass, defraud, or cause harm to any person; or</li>
                  <li>Interfere with or disrupt the operation of this website.</li>
                </ul>
                <p>We reserve the right to decline, delay, or discontinue processing any request we reasonably believe violates these terms.</p>
              </Section>

              <Section id="accuracy-liability" title="Accuracy & Limitation of Liability" icon={AlertTriangle}>
                <p>We take reasonable care when reviewing and reporting a result, but Karachi E-Challan is an independent verification request service and results are provided based on the records available to our team at the time of review. We do not guarantee that a result is complete, current, or free of error, and we recommend confirming any important matter with the relevant official source before relying on it.</p>
                <p>To the fullest extent permitted by law, Karachi E-Challan and its team are not liable for any loss or damage arising from your use of this website or reliance on a result we provide, including delays in processing or in email delivery.</p>
              </Section>

              <Section id="intellectual-property" title="Intellectual Property" icon={Shield}>
                <p>The Karachi E-Challan name, design, layout, and written content on this website are provided for use of this service and may not be copied, reproduced, or used for any other purpose without our permission. This does not affect your own submitted information, which remains yours as described in our Privacy Policy.</p>
              </Section>

              <Section id="changes" title="Changes to the Service or Terms" icon={RefreshCw}>
                <p>We may update these Terms &amp; Conditions, or change, suspend, or discontinue any part of the service, at any time. When we update these terms, we will revise the "Last Updated" date at the top of this page. Continued use of the website after a change means you accept the revised terms.</p>
              </Section>

              <Section id="suspension" title="Suspension of Access" icon={Ban}>
                <p>We may decline to process a request, or restrict access to this website, where we reasonably believe it is being misused or these terms have been violated.</p>
              </Section>

              <Section id="governing-law" title="Governing Law" icon={Scale}>
                <p>These terms are governed by the laws of Pakistan, without regard to conflict-of-law principles.</p>
              </Section>

              <Section id="contact" title="Contact Information" icon={Mail}>
                <p>If you have any questions about these Terms &amp; Conditions, please contact us:</p>
                <a href="mailto:support@karachiechallan.pk" className="inline-flex items-center gap-2 mt-1 rounded-full bg-[#0C1E3A] text-white px-4 py-2 text-[13px] font-[700] hover:bg-[#0A1933] transition">
                  <Mail size={14} /> support@karachiechallan.pk
                </a>
              </Section>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-[#0C1E3A]/5">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] leading-5">
          <span className="text-[#5B6B85] text-center sm:text-left">© 2026 Karachi E-Challan. All rights reserved. Not a government website.</span>
          <span className="inline-flex items-center gap-2 font-[600] text-[#0C1E3A] shrink-0"><Shield size={14} className="text-[#0F766E]" /> Secure • Verified • Transparent</span>
        </div>
      </footer>
    </div>
  )
}
