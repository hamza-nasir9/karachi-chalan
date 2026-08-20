import React from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    BookOpen,
    ExternalLink,
    Clock,
    Tag,
    Search,
    FileText,
    Smartphone,
    CreditCard,
    AlertCircle,
    Shield,
    ArrowRight,
    ChevronRight,
    MapPin,
    Car,
    Info,
    Eye
} from 'lucide-react';

// ============================================
// DATA - 9 Guides/Links
// ============================================

interface Guide {
    id: string;
    title: string;
    description: string;
    date: string;
    readTime: string;
    tags: string[];
    icon: React.ReactNode;
    link: string;
    featured?: boolean;
}

const GUIDES: Guide[] = [
    {
        id: '1',
        title: 'Sindh Excise & Taxation E-Challan System - Complete Guide',
        description: 'Learn about Sindh Excise department\'s e-challan system, how to reprint challans, check vehicle registration status, and pay excise-related fines.',
        date: '2 Nov 2025',
        readTime: '4 min read',
        tags: ['sindh excise', 'vehicle registration', 'challan reprint'],
        icon: <FileText size={18} />,
        link: '/guides/sindh-excise-e-challan',
        featured: true
    },
    {
        id: '2',
        title: '10 Most Common Traffic Violations in Karachi and How to Avoid Them',
        description: 'Discover the top 10 traffic violations in Karachi that lead to e-challans. Learn practical tips to avoid fines and stay compliant with traffic laws.',
        date: '1 Nov 2025',
        readTime: '5 min read',
        tags: ['traffic violations', 'driving tips', 'safety'],
        icon: <AlertCircle size={18} />,
        link: '/guides/traffic-violations-karachi',
        featured: true
    },
    {
        id: '3',
        title: 'Complete Guide to E-Challan in Karachi',
        description: 'Everything you need to know about the e-challan system in Karachi. How it works, what to do when you get a challan, and how to check your status.',
        date: '28 Oct 2025',
        readTime: '6 min read',
        tags: ['e-challan', 'guide', 'karachi'],
        icon: <BookOpen size={18} />,
        link: '/guides/e-challan-guide',
    },
    {
        id: '4',
        title: 'TRACS App — Download & Install Guide',
        description: 'Step-by-step guide to download and install the official TRACS app for checking challans and traffic updates in Sindh.',
        date: '25 Oct 2025',
        readTime: '3 min read',
        tags: ['TRACS', 'app', 'android'],
        icon: <Smartphone size={18} />,
        link: '/guides/tracs-app',
    },
    {
        id: '5',
        title: 'How to Pay Traffic Challan Online',
        description: 'Complete guide to paying your traffic challan online in Karachi. Step-by-step instructions for all payment methods.',
        date: '20 Oct 2025',
        readTime: '4 min read',
        tags: ['payment', 'online', 'guide'],
        icon: <CreditCard size={18} />,
        link: '/guides/pay-challan-online',
    },
    {
        id: '6',
        title: 'Karachi Speed Limits 2025',
        description: 'Updated speed limits for Karachi roads in 2025. Know the limits to avoid speeding fines and stay safe on the road.',
        date: '15 Oct 2025',
        readTime: '3 min read',
        tags: ['speed limits', 'karachi', '2025'],
        icon: <Clock size={18} />,
        link: '/guides/speed-limits-karachi',
    },
    {
        id: '7',
        title: 'How to Locate Traffic Cameras in Karachi',
        description: 'Find traffic cameras and speed cameras in Karachi. Know where they are to stay alert and avoid violations.',
        date: '10 Oct 2025',
        readTime: '4 min read',
        tags: ['cameras', 'location', 'karachi'],
        icon: <MapPin size={18} />,
        link: '/guides/locate-cameras',
    },
    {
        id: '8',
        title: 'Complete Traffic Violations & Fines Table',
        description: 'Detailed table of all traffic violations in Karachi with fines for cars and motorcycles. Updated for 2025.',
        date: '5 Oct 2025',
        readTime: '6 min read',
        tags: ['fines', 'violations', 'table'],
        icon: <FileText size={18} />,
        link: '/fines',
    },
    {
        id: '9',
        title: 'Karachi Challan Payment Methods',
        description: 'Various methods to pay your challan in Karachi — online banking, ATMs, and in-person payment options explained.',
        date: '1 Oct 2025',
        readTime: '4 min read',
        tags: ['payment', 'methods', 'guide'],
        icon: <CreditCard size={18} />,
        link: '/guides/payment-methods',
    }
];

// ============================================
// COMPONENT
// ============================================

export default function Guides() {
    const featuredGuides = GUIDES.filter(g => g.featured);
    const otherGuides = GUIDES.filter(g => !g.featured);

    return (
        <div className="min-h-screen bg-[#FDFDFB]">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10">

                {/* 🔙 Back Button */}
                <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] font-[600] text-[#5B6B85] hover:text-[#0C1E3A] transition-colors">
                    <ArrowLeft size={14} /> Back to Home
                </Link>

                {/* 📌 Page Header */}
                <div className="mt-6">
                    <div className="inline-flex items-center gap-2 text-[11px] font-[800] tracking-[0.12em] text-[#0F766E]">
                        <span className="w-6 h-px bg-[#0F766E]" /> GUIDES & RESOURCES
                    </div>
                    <h1 className="mt-2 text-[30px] sm:text-[40px] font-[900] tracking-[-0.04em] leading-[0.92]">
                        Traffic Challan <span className="serif italic font-normal text-[#0F766E]">Guides</span>
                    </h1>
                    <p className="mt-3 text-[15px] leading-6 text-[#4A5A78] max-w-[640px] text-pretty">
                        Comprehensive guides on Karachi traffic challans, fines, payment methods, and road safety tips.
                    </p>
                </div>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Check Challan', icon: <Search size={16} />, link: '/' },
                        { label: 'Locate Cameras', icon: <Eye size={16} />, link: '/locate-cameras' },
                        { label: 'Violations & Fines', icon: <FileText size={16} />, link: '/fines' },
                        { label: 'Payment Guide', icon: <CreditCard size={16} />, link: '/guides/pay-challan-online' },
                        // { label: 'Guides', icon: <BookOpen size={16} />, link: '/guides' },
                    ].map(item => (
                        <Link
                            key={item.label}
                            to={item.link}
                            className="bg-white rounded-[16px] border border-[#0C1E3A]/5 p-4 text-center hover:border-[#0C1E3A]/15 hover:shadow-[0_8px_24px_rgba(12,30,58,0.06)] transition group"
                        >
                            <div className="w-10 h-10 mx-auto rounded-xl bg-[#0C1E3A] text-white grid place-items-center group-hover:scale-105 transition">
                                {item.icon}
                            </div>
                            <div className="mt-2 text-[13px] font-[700] text-[#0C1E3A]">{item.label}</div>
                        </Link>
                    ))}
                </div>

                {/* ⭐ Featured Guides */}
                {featuredGuides.length > 0 && (
                    <div className="mt-8">
                        <div className="flex items-center gap-2 text-[12px] font-[800] tracking-[0.08em] text-[#0F766E]">
                            <span className="w-6 h-px bg-[#0F766E]" /> FEATURED GUIDES
                        </div>
                        <div className="mt-3 grid lg:grid-cols-2 gap-4">
                            {featuredGuides.map(guide => (
                                <Link
                                    key={guide.id}
                                    to={guide.link}
                                    className="bg-white rounded-[20px] border border-[#0C1E3A]/5 p-6 hover:shadow-[0_8px_32px_rgba(12,30,58,0.08)] hover:-translate-y-0.5 transition-all group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-[#0C1E3A] text-white grid place-items-center shrink-0 group-hover:scale-105 transition">
                                            {guide.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-[15px] font-[800] text-[#0C1E3A] group-hover:text-[#0F766E] transition line-clamp-2">
                                                {guide.title}
                                            </h3>
                                            <p className="mt-1.5 text-[13px] leading-6 text-[#4A5A78] line-clamp-2">
                                                {guide.description}
                                            </p>
                                            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-[600] text-[#5B6B85]">
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock size={12} /> {guide.readTime}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Tag size={12} /> {guide.date}
                                                </span>
                                                <span className="ml-auto inline-flex items-center gap-1 text-[#0F766E] font-[700]">
                                                    Read More <ArrowRight size={12} />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* 📚 All Guides Grid */}
                <div className="mt-8">
                    <div className="flex items-center gap-2 text-[12px] font-[800] tracking-[0.08em] text-[#0F766E]">
                        <span className="w-6 h-px bg-[#0F766E]" /> ALL GUIDES
                    </div>
                    <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {otherGuides.map(guide => (
                            <Link
                                key={guide.id}
                                to={guide.link}
                                className="bg-white rounded-[18px] border border-[#0C1E3A]/5 p-5 hover:shadow-[0_8px_24px_rgba(12,30,58,0.06)] hover:-translate-y-0.5 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] text-[#0C1E3A] grid place-items-center group-hover:bg-[#0C1E3A] group-hover:text-white transition">
                                    {guide.icon}
                                </div>
                                <h3 className="mt-3 text-[14px] font-[700] text-[#0C1E3A] group-hover:text-[#0F766E] transition line-clamp-2">
                                    {guide.title}
                                </h3>
                                <p className="mt-1.5 text-[12.5px] leading-6 text-[#4A5A78] line-clamp-2">
                                    {guide.description}
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-[600] text-[#5B6B85]">
                                    <span className="inline-flex items-center gap-1">
                                        <Clock size={10} /> {guide.readTime}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <Tag size={10} /> {guide.date}
                                    </span>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {guide.tags.slice(0, 2).map(tag => (
                                        <span key={tag} className="bg-[#F8FAFC] border border-[#0C1E3A]/5 px-2 py-0.5 rounded-full text-[10px] font-[600] text-[#5B6B85]">
                                            #{tag}
                                        </span>
                                    ))}
                                    {guide.tags.length > 2 && (
                                        <span className="text-[10px] font-[600] text-[#94A3B8]">+{guide.tags.length - 2}</span>
                                    )}
                                </div>
                                <div className="mt-3 pt-3 border-t border-[#0C1E3A]/5 flex items-center justify-between">
                                    <span className="text-[11px] font-[700] text-[#0F766E] inline-flex items-center gap-1">
                                        Read <ChevronRight size={14} />
                                    </span>
                                    <span className="text-[10px] font-[600] text-[#5B6B85]">Free</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* 📝 Footer Note */}
                <div className="mt-10 text-center text-[12px] leading-5 text-[#5B6B85]">
                    <p>📚 All guides are for informational purposes only. Always verify with official sources.</p>
                    <p className="mt-1">For official challan checking, visit the <a href="#" className="text-[#0F766E] font-[600] hover:underline">Sindh Traffic Police website</a>.</p>
                </div>
            </div>
        </div>
    );
}