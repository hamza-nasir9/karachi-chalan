import { Link } from 'react-router-dom'
import {
  ShieldCheck, Lock, Mail, ChevronLeft, Shield, Database, Users, Send, Clock3,
  Cookie, Eye, FileText, AlertCircle,
} from 'lucide-react'

const LAST_UPDATED = 'September 22, 2026'

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'information-we-collect', label: 'Information We Collect' },
  { id: 'how-we-use-it', label: 'How We Use Your Information' },
  { id: 'where-its-stored', label: 'Where Your Information Is Stored' },
  { id: 'email-communication', label: 'Email Communication' },
  { id: 'sharing', label: 'Sharing of Information' },
  { id: 'security', label: 'Security Measures' },
  { id: 'retention', label: 'Data Retention' },
  { id: 'cookies', label: 'Cookies & Local Storage' },
  { id: 'your-rights', label: 'Your Rights & Choices' },
  { id: 'children', label: "Children's Privacy" },
  { id: 'changes', label: 'Changes to This Policy' },
  { id: 'contact', label: 'Contact Us' },
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

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#FDFDFB] text-[#0C1E3A] selection:bg-[#0C1E3A] selection:text-white antialiased overflow-x-hidden flex flex-col">
      <style>{`
        * { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .serif { font-family: 'Instrument Serif', Georgia, serif; }
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
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Privacy Policy
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
            <span className="text-[#0C1E3A] font-[700]">Privacy Policy</span>
          </div>

          <div className="mt-6 sm:mt-8 max-w-[760px]">
            <h1 className="text-[30px] sm:text-[40px] font-[900] tracking-[-0.03em] leading-[0.95] text-[#0C1E3A] text-balance">
              Privacy <span className="serif italic font-normal text-[#0F766E]">Policy</span>
            </h1>
            <p className="mt-3 text-[14px] sm:text-[15px] leading-7 text-[#4A5A78]">
              This Privacy Policy explains what information Karachi E-Challan collects through its verification request forms, how that information is used and stored, and the choices available to you. It applies to karachiechallan.pk and the verification services described on this website.
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

              <Section id="overview" title="Overview" icon={FileText}>
                <p>Karachi E-Challan lets you submit a request — Check Challan, Challan Paid / Unpaid / Waived, Check Complaint Status, or Check Blacklist / Block — and our team reviews the relevant records before emailing you the result. We do not display results instantly on the website.</p>
                <p>This policy covers the information collected when you submit a request through one of these forms, and how it is handled afterward.</p>
              </Section>

              <Section id="information-we-collect" title="Information We Collect" icon={Database}>
                <p>We only collect what a given request needs to be processed. Depending on which service you use, this may include:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><span className="font-[700] text-[#0C1E3A]">Full Name</span> — to identify your request.</li>
                  <li><span className="font-[700] text-[#0C1E3A]">CNIC</span> — used for Check Challan and Challan Status requests, to help locate the correct record.</li>
                  <li><span className="font-[700] text-[#0C1E3A]">Phone Number</span> — for our team's reference; we primarily contact you by email.</li>
                  <li><span className="font-[700] text-[#0C1E3A]">Email Address</span> — required for every request, since results are delivered by email.</li>
                  <li><span className="font-[700] text-[#0C1E3A]">Challan Number</span> — used for Check Challan, Challan Status, and Complaint Status requests.</li>
                  <li><span className="font-[700] text-[#0C1E3A]">Complaint Number</span> — used only for Check Complaint Status requests.</li>
                  <li><span className="font-[700] text-[#0C1E3A]">Vehicle Number</span> — used only for Check Blacklist / Block requests.</li>
                </ul>
                <p>We do not ask for payment details, passwords, or account credentials anywhere on this website, and we do not process payments on your behalf — any challan payment is completed directly through your bank or the relevant official channel.</p>
              </Section>

              <Section id="how-we-use-it" title="How We Use Your Information" icon={Eye}>
                <p>The information you submit is used solely to:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Identify and review the correct record for your request;</li>
                  <li>Communicate with you about that request, including sending the result by email;</li>
                  <li>Detect and prevent duplicate or abusive submissions; and</li>
                  <li>Maintain a record of requests and the results provided, for reference and support purposes.</li>
                </ul>
                <p>We do not use your information for advertising, and we do not sell or rent it to any third party.</p>
              </Section>

              <Section id="where-its-stored" title="Where Your Information Is Stored" icon={Database}>
                <p>Submitted requests are stored in our database and are accessible only through a password-protected admin panel used by our verification team. Each request is assigned a unique Request ID (for example, <span className="mono font-[600]">ECV-2026-000123</span>) so it can be tracked and referenced.</p>
                <p>Sensitive fields such as CNIC and phone number are masked by default in the admin interface and only revealed when an admin explicitly chooses to view them while handling your request.</p>
              </Section>

              <Section id="email-communication" title="Email Communication" icon={Send}>
                <p>After your request is reviewed, we send the result to the email address you provided. The email content is generated based on the service you used and the outcome of the review, and may be edited by our team before sending for clarity.</p>
                <p>Internal notes our team adds while reviewing a request are for internal reference only and are never included in emails sent to you.</p>
                <p>We may also send a confirmation email when a request is first submitted, and, if a request cannot be sent successfully, our team may retry sending it. We do not send marketing or promotional emails.</p>
              </Section>

              <Section id="sharing" title="Sharing of Information" icon={Users}>
                <p>We do not share, sell, or rent your information to advertisers or unrelated third parties. Your submitted information is only accessible to authorized members of our verification team for the purpose of processing your request.</p>
                <p>We may disclose information where required to do so by law, or to protect the security and integrity of our service against misuse, fraud, or abuse.</p>
              </Section>

              <Section id="security" title="Security Measures" icon={Shield}>
                <p>We apply reasonable technical and organizational measures to protect the information you submit, including:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Encrypted transmission (SSL/TLS) between your browser and our servers;</li>
                  <li>Password-protected admin access using secure, HttpOnly session cookies — admin credentials are never stored in the browser;</li>
                  <li>Masked display of sensitive fields (CNIC, phone number) in the admin interface by default;</li>
                  <li>Server-side email delivery, so email provider credentials are never exposed in the browser.</li>
                </ul>
                <p>No method of transmission or storage is completely secure, and while we work to protect your information, we cannot guarantee absolute security.</p>
              </Section>

              <Section id="retention" title="Data Retention" icon={Clock3}>
                <p>We retain request records, including the information you submitted and the result provided, for as long as reasonably necessary to handle your request, respond to related follow-ups, and maintain accurate service records. If you would like us to delete your submitted information, you may contact us using the details below.</p>
              </Section>

              <Section id="cookies" title="Cookies & Local Storage" icon={Cookie}>
                <p>The public request forms on this website do not use tracking or advertising cookies. Our admin panel uses a single authentication cookie, marked HttpOnly, to keep an administrator signed in — this cookie is not used for tracking and is not accessible to page scripts.</p>
                <p>Some parts of the website use your browser's local storage — for example, to save an in-progress form draft on your own device so you don't lose your progress, or to remember basic display preferences. This information stays on your device, is not transmitted to our servers as tracking data, and can be cleared at any time from your browser settings.</p>
              </Section>

              <Section id="your-rights" title="Your Rights & Choices" icon={Users}>
                <p>You may:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Ask us what information we hold about a request you submitted;</li>
                  <li>Ask us to correct inaccurate information tied to a pending request;</li>
                  <li>Ask us to delete your submitted information, subject to any records we reasonably need to keep; and</li>
                  <li>Contact us with any privacy question or concern.</li>
                </ul>
                <p>To exercise any of these choices, please email us with your Request ID at the address below.</p>
              </Section>

              <Section id="children" title="Children's Privacy" icon={ShieldCheck}>
                <p>Our services are intended for individuals who are able to submit their own accurate vehicle, CNIC, and contact details, and are not directed at children. We do not knowingly collect information from children through this website.</p>
              </Section>

              <Section id="changes" title="Changes to This Policy" icon={FileText}>
                <p>We may update this Privacy Policy from time to time to reflect changes in our services or practices. When we do, we will update the "Last Updated" date at the top of this page. Continued use of the website after an update means you accept the revised policy.</p>
              </Section>

              <Section id="contact" title="Contact Us" icon={Mail}>
                <p>If you have any questions about this Privacy Policy or how your information is handled, please contact us:</p>
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
