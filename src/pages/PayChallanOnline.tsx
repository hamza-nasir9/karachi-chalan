import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Tag,
  User,
  Calendar,
  Smartphone,
  CreditCard,
  Building,
  Banknote,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Shield,
  Info,
  Search,
  FileText,
  Award,
  HelpCircle,
  ArrowRight,
  Wallet,
  Phone,
  Home,
  Globe,
  Printer
} from 'lucide-react';

// ============================================
// COMPONENT
// ============================================

export default function PayChallanOnline() {
  const [activeMethod, setActiveMethod] = useState<string | null>('jazzcash');

  const paymentMethods = [
    { id: 'jazzcash', label: 'JazzCash', icon: Smartphone, color: 'bg-emerald-600' },
    { id: 'easypaisa', label: 'Easypaisa', icon: Phone, color: 'bg-blue-600' },
    { id: 'bankapp', label: 'Bank Mobile Apps', icon: CreditCard, color: 'bg-purple-600' },
    { id: 'atm', label: 'ATM Payment', icon: Building, color: 'bg-amber-600' },
    { id: 'internet', label: 'Internet Banking', icon: Globe, color: 'bg-cyan-600' },
    { id: 'branch', label: 'Bank Branch', icon: Building, color: 'bg-slate-600' },
  ];

  const getMethodContent = (id: string) => {
    const contents: Record<string, any> = {
      jazzcash: {
        title: 'Pay via JazzCash App',
        steps: [
          'Open JazzCash app',
          'Navigate to Bill Payments',
          'Select Traffic Challan',
          'Choose 1Bill/1Link (or Government/Traffic if listed)',
          'Enter the challan reference/PSID number exactly as shown',
          'Fetch bill → verify vehicle/amount → tap Pay',
          'Wait for the success screen and note the transaction ID',
          'Save the digital receipt or take a screenshot'
        ],
        tip: 'If "Traffic Challan" is not visible, use the generic 1Bill/1Link option and then enter your challan PSID.'
      },
      easypaisa: {
        title: 'Pay via Easypaisa App',
        steps: [
          'Open Easypaisa app',
          'Go to Bill Payment',
          'Select 1Bill/1Link or Government → Traffic',
          'Enter the challan reference/PSID and fetch bill',
          'Confirm details and tap Pay',
          'Save the receipt/screenshot',
          'Re-check challan status after a few minutes'
        ],
        tip: 'Make sure you have sufficient balance in your Easypaisa account.'
      },
      bankapp: {
        title: 'Pay via Bank Mobile Apps',
        description: 'Most major Pakistani banks support challan payments via 1Bill/1Link: HBL, UBL, MCB, Meezan, Bank Alfalah, Allied, Faysal, JS, and others.',
        steps: [
          'Open your bank\'s mobile app',
          'Go to Payments/Bills section',
          'Select 1Bill/1Link',
          'Enter the challan reference/PSID',
          'Fetch bill → verify vehicle and payable amount',
          'Tap Pay and confirm',
          'Save the receipt and transaction ID'
        ],
        tip: 'Different banks may have slightly different navigation. Look for "1Bill" or "1Link" options.'
      },
      atm: {
        title: 'Pay via ATM (1Link)',
        steps: [
          'Visit any 1Link-enabled ATM',
          'Insert your debit/credit card',
          'Choose Bill Payment → 1Bill',
          'Enter the challan reference/PSID',
          'Verify challan details on screen',
          'Confirm payment',
          'Collect the printed slip',
          'Keep the slip until your status shows "Paid"'
        ],
        tip: 'Not all ATMs support 1Bill. Look for the 1Link logo on the ATM.'
      },
      internet: {
        title: 'Pay via Internet Banking',
        steps: [
          'Log in to your bank\'s internet banking portal on desktop',
          'Go to Bill Payments section',
          'Select 1Bill/1Link (or Government/Traffic)',
          'Enter the challan reference/PSID',
          'Fetch bill and verify details',
          'Confirm amount and Pay',
          'Note the transaction ID',
          'Re-check your challan status after a few minutes'
        ],
        tip: 'Use a secure network and always log out after completing the transaction.'
      },
      branch: {
        title: 'Pay at Bank Branch (Over-the-Counter)',
        steps: [
          'Visit a participating bank branch',
          'Go to the counter and request 1Bill payment',
          'Provide your challan reference/PSID',
          'Pay the amount in cash or via your account',
          'Receive a stamped slip as proof',
          'Keep the slip until your status shows "Paid"'
        ],
        tip: 'Bring your CNIC and the challan reference/PSID. Working hours apply.'
      }
    };
    return contents[id] || contents.jazzcash;
  };

  const currentContent = getMethodContent(activeMethod || 'jazzcash');

  // Quick Takeaways
  const takeaways = [
    'Keep the challan reference/PSID handy — you\'ll need it for all channels.',
    'Prefer digital payments (JazzCash/Easypaisa/Bank app) for near‑instant confirmation.',
    'Always save the transaction receipt or screenshot.',
    'Re-check your challan status a few minutes after paying.'
  ];

  // Related Articles
  const relatedArticles = [
    { title: 'Challan Check Karachi | Complete E-Challan Guide 2025', date: '6 Nov 2025', readTime: '13 min read', link: '/guides/e-challan-guide' },
    { title: 'E-Challan Camera Locations in Karachi 2025 — Interactive Map', date: '15 Nov 2025', readTime: '17 min read', link: '/locate-cameras' },
    { title: 'TRACS 4 Citizen App Download — Official Faceless E-Ticketing App', date: '9 Nov 2025', readTime: '6 min read', link: '/guides/tracs-app' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* 🔙 Back Button */}
        <Link to="/guides" className="inline-flex items-center gap-1.5 text-[13px] font-[600] text-[#5B6B85] hover:text-[#0C1E3A] transition-colors">
          <ArrowLeft size={14} /> Back to Guides
        </Link>

        {/* 📌 Breadcrumb */}
        <div className="mt-4 flex items-center gap-2 text-[12px] font-[500] text-[#5B6B85]">
          <Link to="/" className="hover:text-[#0C1E3A]">Home</Link>
          <ChevronRight size={14} />
          <Link to="/guides" className="hover:text-[#0C1E3A]">Blog</Link>
          <ChevronRight size={14} />
          <span className="text-[#0C1E3A] font-[600] truncate">How to Pay Traffic Challan Online</span>
        </div>

        {/* 📋 Blog Header */}
        <div className="mt-6">
          <div className="inline-flex items-center gap-2 text-[11px] font-[800] tracking-[0.12em] text-[#0F766E]">
            <span className="w-6 h-px bg-[#0F766E]" /> GUIDE
          </div>
          <h1 className="mt-3 text-[28px] sm:text-[40px] font-[900] tracking-[-0.04em] leading-[1.05]">
            How to Pay Traffic Challan Online in <span className="serif italic font-normal text-[#0F766E]">Pakistan</span>
          </h1>
          <p className="mt-3 text-[15px] leading-7 text-[#4A5A78] max-w-[720px] text-pretty">
            Complete guide to paying traffic challans online in Pakistan using JazzCash, Easypaisa, banks, and ATMs. Step-by-step instructions for quick and easy challan payment.
          </p>

          {/* Meta Info */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px] text-[#5B6B85]">
            <span className="inline-flex items-center gap-1.5">
              <User size={14} className="text-[#0F766E]" /> Challan Dekhao Team
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} className="text-[#0F766E]" /> 3 November 2025
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} className="text-[#0F766E]" /> 6 min read
            </span>
          </div>

          {/* Tags */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {['online payment', 'jazzcash', 'easypaisa', 'challan payment', 'mobile wallets'].map(tag => (
              <span key={tag} className="bg-[#F8FAFC] border border-[#0C1E3A]/5 px-2.5 py-1 rounded-full text-[11px] font-[600] text-[#5B6B85]">
                #{tag}
              </span>
            ))}
          </div>

          <div className="mt-2 text-[12px] text-[#94A3B8]">
            Last updated: November 06, 2025
          </div>
        </div>

        {/* 📖 Quick Takeaways */}
        <div className="mt-6 bg-[#0C1E3A] text-white rounded-[20px] p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-[#0F766E]/20 blur-[50px]" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[12px] font-[700] tracking-[0.08em] text-[#7EE8DC]">
              <CheckCircle2 size={16} /> QUICK TAKEAWAYS
            </div>
            <ul className="mt-3 grid sm:grid-cols-2 gap-2 text-[13.5px] font-[500]">
              {takeaways.map((item, idx) => (
                <li key={idx} className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-white/10 border border-white/15 grid place-items-center shrink-0 mt-0.5 text-[10px] font-[800]">{idx + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 📝 Why Pay Online */}
        <div className="mt-8">
          <h2 className="text-[22px] font-[800] tracking-[-0.02em]">Why Pay Challan Online?</h2>
          <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: Clock, label: 'Save Time', desc: 'Clear dues in minutes — no queues or travel.' },
              { icon: Award, label: 'Avoid Late Fees', desc: 'Faster payments mean fewer delays and penalties.' },
              { icon: FileText, label: 'Keep Records', desc: 'Get digital receipts for your payment history.' },
              { icon: Banknote, label: 'Reduce Friction', desc: 'No cash handling or change issues at counters.' },
              { icon: Globe, label: 'Pay Anywhere', desc: 'Settle dues even when you\'re out of city.' },
              { icon: Shield, label: 'Secure', desc: 'Encrypted transactions through 1Bill/1Link system.' },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-[16px] border border-[#0C1E3A]/5 p-4 shadow-sm hover:shadow-[0_8px_24px_rgba(12,30,58,0.06)] transition">
                <div className="w-9 h-9 rounded-xl bg-[#0C1E3A] text-white grid place-items-center"><item.icon size={16} /></div>
                <div className="mt-2 text-[14px] font-[700]">{item.label}</div>
                <div className="text-[12.5px] leading-5 text-[#4A5A78]">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 📊 Payment Methods Summary Table */}
        <div className="mt-8 bg-white rounded-[20px] border border-[#0C1E3A]/5 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 h-[52px] flex items-center border-b border-[#0C1E3A]/5 bg-[#F8FAFC]">
            <span className="text-[13px] font-[800] flex items-center gap-2">
              <CreditCard size={14} className="text-[#0F766E]" /> Payment Methods Overview
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-[13px]">
              <thead className="bg-white text-[11px] font-[800] tracking-[0.06em] text-[#5B6B85] border-b border-[#0C1E3A]/5">
                <tr>
                  <th className="text-left px-4 sm:px-6 py-3">Channel</th>
                  <th className="text-left px-4 py-3">How It Works</th>
                  <th className="text-left px-4 py-3">Typical Confirmation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0C1E3A]/5">
                {[
                  { channel: 'JazzCash', how: 'Bill Payment → 1Bill/1Link', confirm: 'Minutes' },
                  { channel: 'Easypaisa', how: 'Bill Payment → 1Bill/1Link', confirm: 'Minutes' },
                  { channel: 'Bank Mobile App', how: 'Payments → 1Bill/1Link', confirm: 'Minutes – 1 hour' },
                  { channel: 'ATM (1Link)', how: 'Bill Payment → 1Bill', confirm: 'Minutes – 1 hour' },
                  { channel: 'Internet Banking (Web)', how: 'Bill Payment → 1Bill/1Link', confirm: 'Minutes – 1 hour' },
                  { channel: 'Bank Branch Counter', how: 'Over-the-counter 1Bill', confirm: 'Same day' },
                ].map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#F8FAFC]/70 transition">
                    <td className="px-4 sm:px-6 py-3.5 font-[700] text-[#0C1E3A]">{item.channel}</td>
                    <td className="px-4 py-3.5 font-[500] text-[#2E4160]">{item.how}</td>
                    <td className="px-4 py-3.5 font-[600] text-emerald-600">{item.confirm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 📱 Payment Methods Tabs */}
        <div className="mt-8">
          <h2 className="text-[22px] font-[800] tracking-[-0.02em]">Step-by-Step Payment Guides</h2>
          <p className="mt-1 text-[14px] text-[#5B6B85]">Select your preferred payment method below for detailed instructions.</p>

          {/* Tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {paymentMethods.map(method => {
              const Icon = method.icon;
              const isActive = activeMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => setActiveMethod(method.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[12px] font-[700] transition ${
                    isActive
                      ? `${method.color} text-white shadow-sm`
                      : 'bg-white border border-[#0C1E3A]/10 text-[#5B6B85] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <Icon size={15} />
                  {method.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="mt-4 bg-white rounded-[20px] border border-[#0C1E3A]/5 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-[#0C1E3A]/5 bg-[#F8FAFC]">
              <h3 className="text-[16px] font-[800]">{currentContent.title}</h3>
              {currentContent.description && (
                <p className="mt-1 text-[13px] text-[#5B6B85]">{currentContent.description}</p>
              )}
            </div>
            <div className="p-4 sm:p-6">
              <ol className="space-y-2.5 text-[14px] leading-6 text-[#2E4160]">
                {currentContent.steps.map((step: string, idx: number) => (
                  <li key={idx} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#0C1E3A] text-white grid place-items-center text-[11px] font-[800] shrink-0 mt-0.5">{idx + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              {currentContent.tip && (
                <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex gap-2.5 text-[13px] leading-5 text-blue-800">
                  <Info size={16} className="shrink-0 mt-0.5 text-blue-600" />
                  <span><span className="font-[700]">Tip:</span> {currentContent.tip}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🔧 Troubleshooting */}
        <div className="mt-8 bg-white rounded-[20px] border border-[#0C1E3A]/5 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 h-[52px] flex items-center border-b border-[#0C1E3A]/5 bg-[#F8FAFC]">
            <span className="text-[13px] font-[800] flex items-center gap-2">
              <HelpCircle size={14} className="text-[#0F766E]" /> Troubleshooting Payment Issues
            </span>
          </div>
          <div className="p-4 sm:p-6 grid gap-3">
            {[
              { issue: 'PSID not found', solution: 'Double-check digits and try again; verify the challan hasn\'t expired or been canceled/reissued.' },
              { issue: 'Payment failed but account debited', solution: 'Wait 30–60 minutes. If still unpaid, contact your bank/wallet with your transaction ID to reverse or post the payment.' },
              { issue: 'Duplicate payment attempt', solution: 'If the system already marked the challan paid, the fetch step will fail—verify status before paying again.' },
              { issue: 'Wrong vehicle details', solution: 'Cancel the flow; re-check the plate/PSID; contact support if the fetched bill seems incorrect.' },
              { issue: 'App keeps timing out', solution: 'Try another channel (JazzCash/Easypaisa/your bank), or pay via branch counter.' },
            ].map((item, idx) => (
              <div key={idx} className="rounded-xl border border-[#0C1E3A]/5 p-4 hover:bg-[#F8FAFC]/70 transition">
                <div className="flex items-start gap-3">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[14px] font-[700] text-[#0C1E3A]">{item.issue}</div>
                    <div className="text-[13px] text-[#5B6B85] mt-0.5">{item.solution}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🔗 Offline Payment Alternatives */}
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-[18px] border border-[#0C1E3A]/5 p-5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0C1E3A] text-white grid place-items-center"><Building size={16} /></div>
              <div className="text-[14px] font-[800]">Offline Payment Alternatives</div>
            </div>
            <ul className="mt-3 space-y-2 text-[13px] text-[#4A5A78]">
              <li className="flex gap-2"><CheckCircle2 size={14} className="text-[#0F766E] shrink-0 mt-1" /> Participating bank branches (over-the-counter 1Bill payments)</li>
              <li className="flex gap-2"><CheckCircle2 size={14} className="text-[#0F766E] shrink-0 mt-1" /> Authorized JazzCash/Easypaisa agents who process bill payments</li>
              <li className="flex gap-2"><CheckCircle2 size={14} className="text-[#0F766E] shrink-0 mt-1" /> Traffic facilitation counters, where available</li>
            </ul>
            <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-800">
              Bring your CNIC and the challan reference/PSID. Keep the stamped slip until your status shows "Paid."
            </div>
          </div>

          <div className="bg-white rounded-[18px] border border-[#0C1E3A]/5 p-5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0F766E] text-white grid place-items-center"><Shield size={16} /></div>
              <div className="text-[14px] font-[800]">Payment Confirmation</div>
            </div>
            <ul className="mt-3 space-y-2 text-[13px] text-[#4A5A78]">
              <li className="flex gap-2"><CheckCircle2 size={14} className="text-[#0F766E] shrink-0 mt-1" /> You should see a success message and a transaction ID</li>
              <li className="flex gap-2"><CheckCircle2 size={14} className="text-[#0F766E] shrink-0 mt-1" /> Save the receipt and/or screenshot</li>
              <li className="flex gap-2"><CheckCircle2 size={14} className="text-[#0F766E] shrink-0 mt-1" /> Re-check your challan status on the portal you used</li>
              <li className="flex gap-2"><AlertCircle size={14} className="text-amber-500 shrink-0 mt-1" /> Most payments reflect within minutes; some take up to a few hours</li>
            </ul>
          </div>
        </div>

        {/* 🔗 Related Articles */}
        <div className="mt-8">
          <div className="flex items-center gap-2 text-[12px] font-[800] tracking-[0.08em] text-[#0F766E]">
            <span className="w-6 h-px bg-[#0F766E]" /> RELATED GUIDES
          </div>
          <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedArticles.map((article, idx) => (
              <Link
                key={idx}
                to={article.link}
                className="bg-white rounded-[18px] border border-[#0C1E3A]/5 p-5 hover:shadow-[0_8px_24px_rgba(12,30,58,0.06)] hover:-translate-y-0.5 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] text-[#0C1E3A] grid place-items-center group-hover:bg-[#0C1E3A] group-hover:text-white transition">
                  <BookOpen size={18} />
                </div>
                <h4 className="mt-3 text-[14px] font-[700] text-[#0C1E3A] group-hover:text-[#0F766E] transition line-clamp-2">
                  {article.title}
                </h4>
                <div className="mt-2 flex items-center gap-3 text-[11px] font-[600] text-[#5B6B85]">
                  <span className="inline-flex items-center gap-1"><Clock size={11} /> {article.readTime}</span>
                  <span className="inline-flex items-center gap-1"><Calendar size={11} /> {article.date}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-[#0C1E3A]/5 flex items-center justify-between">
                  <span className="text-[11px] font-[700] text-[#0F766E] inline-flex items-center gap-1">
                    Read <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 📝 Footer Note */}
        <div className="mt-8 text-center text-[12px] leading-5 text-[#5B6B85]">
          <p>📚 <strong>Verified facts & sources (2025):</strong> Official Sindh Excise portals, ePay Sindh, 1LINK 1BILL, Sindh Police/TRACS official pages.</p>
          <p className="mt-1">Always rely on the amount and due date shown on your challan/receipt. Fine bands are actively being updated with the 2025 faceless e-ticketing rollout.</p>
        </div>
      </div>
    </div>
  );
}