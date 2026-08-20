import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Filter,
  Car,
  Bike,
  Truck,
  Bus,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  Shield,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  SlidersHorizontal,
  ArrowUpDown,
  Database
} from 'lucide-react';

// ============================================
// DATA - All Violations (2026)
// ============================================

interface Violation {
  id: string;
  violation: string;
  fine: number;
  points: number | '-';
  category: 'moving' | 'document' | 'parking' | 'serious' | 'other';
  vehicleTypes: string[];
}

const ALL_VIOLATIONS: Violation[] = [
  // =====================
  // SERIOUS OFFENSES
  // =====================
  { id: 's1', violation: 'Driving Unregistered Vehicle', fine: 50000, points: 8, category: 'serious', vehicleTypes: ['all'] },
  { id: 's2', violation: 'Drifting Motorbike or Skidding Four Wheel Vehicle', fine: 30000, points: 8, category: 'serious', vehicleTypes: ['motorcycle', 'car'] },
  { id: 's3', violation: 'Juvenile Driving', fine: 30000, points: '-', category: 'serious', vehicleTypes: ['all'] },
  { id: 's4', violation: 'Wrong Way In One Way Street', fine: 30000, points: 8, category: 'serious', vehicleTypes: ['all'] },
  { id: 's5', violation: 'One Way Violation', fine: 30000, points: 8, category: 'serious', vehicleTypes: ['all'] },
  { id: 's6', violation: 'Tinted Glasses', fine: 25000, points: 6, category: 'serious', vehicleTypes: ['car'] },
  { id: 's7', violation: 'Using Pressure Musical Horn/Fancy Lights', fine: 25000, points: '-', category: 'serious', vehicleTypes: ['all'] },
  { id: 's8', violation: 'Driving Without Driving License', fine: 25000, points: 6, category: 'document', vehicleTypes: ['all'] },
  { id: 's9', violation: 'Reckless & Negligent Driving', fine: 15000, points: 8, category: 'serious', vehicleTypes: ['all'] },

  // =====================
  // MOVING VIOLATIONS
  // =====================
  { id: 'm1', violation: 'Jumping Red Light', fine: 10000, points: 4, category: 'moving', vehicleTypes: ['all'] },
  { id: 'm2', violation: 'Overspeed', fine: 10000, points: 8, category: 'moving', vehicleTypes: ['all'] },
  { id: 'm3', violation: 'Following too closely or cutting in too sharply', fine: 10000, points: 8, category: 'moving', vehicleTypes: ['all'] },
  { id: 'm4', violation: 'Driving on Lane Line', fine: 10000, points: 6, category: 'moving', vehicleTypes: ['all'] },
  { id: 'm5', violation: 'Wrong Way', fine: 10000, points: 6, category: 'moving', vehicleTypes: ['all'] },
  { id: 'm6', violation: 'Overtaking where Prohibited', fine: 10000, points: 4, category: 'moving', vehicleTypes: ['all'] },
  { id: 'm7', violation: 'Wrong Lane Usage', fine: 10000, points: 4, category: 'moving', vehicleTypes: ['all'] },
  { id: 'm8', violation: 'Mobile Use', fine: 10000, points: 4, category: 'moving', vehicleTypes: ['all'] },
  { id: 'm9', violation: 'Violation of Traffic Signals (Manual/Electrical)', fine: 10000, points: 4, category: 'moving', vehicleTypes: ['all'] },
  { id: 'm10', violation: 'Improper U-Turn', fine: 10000, points: '-', category: 'moving', vehicleTypes: ['all'] },
  { id: 'm11', violation: 'Fancy Number Plate', fine: 10000, points: 4, category: 'document', vehicleTypes: ['all'] },
  { id: 'm12', violation: 'No Entry', fine: 10000, points: '-', category: 'moving', vehicleTypes: ['all'] },
  { id: 'm13', violation: 'Turning Where Prohibited', fine: 10000, points: '-', category: 'moving', vehicleTypes: ['all'] },
  { id: 'm14', violation: 'Improper Turning', fine: 10000, points: '-', category: 'moving', vehicleTypes: ['all'] },
  { id: 'm15', violation: 'Driving at night without proper lights', fine: 10000, points: '-', category: 'moving', vehicleTypes: ['all'] },
  { id: 'm16', violation: 'Failing to dip Head Lights for other traffic', fine: 10000, points: '-', category: 'moving', vehicleTypes: ['all'] },
  { id: 'm17', violation: 'Following Emergency Vehicle close than safe distance', fine: 10000, points: '-', category: 'moving', vehicleTypes: ['all'] },
  { id: 'm18', violation: 'Obstructing Movement of Emergency Vehicles', fine: 10000, points: '-', category: 'moving', vehicleTypes: ['all'] },
  { id: 'm19', violation: 'Failure to Stop for School Bus', fine: 10000, points: '-', category: 'moving', vehicleTypes: ['all'] },
  { id: 'm20', violation: 'Failure to yield right way to other vehicles', fine: 10000, points: '-', category: 'moving', vehicleTypes: ['all'] },
  { id: 'm21', violation: 'Failure To Yield Right Way To Pedestrians', fine: 10000, points: '-', category: 'moving', vehicleTypes: ['all'] },
  { id: 'm22', violation: 'Failing to Stop When Required By Traffic Police', fine: 10000, points: '-', category: 'moving', vehicleTypes: ['all'] },
  { id: 'm23', violation: 'Refusal to Produce License', fine: 10000, points: '-', category: 'document', vehicleTypes: ['all'] },
  { id: 'm24', violation: 'Driving Vehicle in Violation of Laws', fine: 10000, points: 8, category: 'moving', vehicleTypes: ['all'] },
  { id: 'm25', violation: 'Jumping Traffic Queue', fine: 10000, points: '-', category: 'moving', vehicleTypes: ['all'] },
  { id: 'm26', violation: 'Failing to Observe Low Speed Sign', fine: 10000, points: '-', category: 'moving', vehicleTypes: ['all'] },
  { id: 'm27', violation: 'Failing to Observe Lighting Hours', fine: 10000, points: '-', category: 'moving', vehicleTypes: ['all'] },
  { id: 'm28', violation: 'Using turn indicator other than Prescribed', fine: 10000, points: '-', category: 'moving', vehicleTypes: ['all'] },
  { id: 'm29', violation: 'Opening Door Dangerously', fine: 10000, points: '-', category: 'moving', vehicleTypes: ['all'] },
  { id: 'm30', violation: 'Improper crossing of railway track', fine: 10000, points: '-', category: 'moving', vehicleTypes: ['all'] },
  { id: 'm31', violation: 'Driving Vehicle Without or With Defective Speedometer', fine: 10000, points: '-', category: 'document', vehicleTypes: ['all'] },

  // =====================
  // PARKING VIOLATIONS
  // =====================
  { id: 'p1', violation: 'No Parking', fine: 10000, points: 2, category: 'parking', vehicleTypes: ['all'] },
  { id: 'p2', violation: 'Stop Line Violation', fine: 10000, points: '-', category: 'parking', vehicleTypes: ['all'] },
  { id: 'p3', violation: 'Obstructing Traffic', fine: 10000, points: '-', category: 'parking', vehicleTypes: ['all'] },

  // =====================
  // DOCUMENT VIOLATIONS
  // =====================
  { id: 'd1', violation: 'Seatbelt Unfastened', fine: 10000, points: 2, category: 'document', vehicleTypes: ['car'] },
  { id: 'd2', violation: 'Driving Motorbike Without Insurance Coverage', fine: 10000, points: '-', category: 'document', vehicleTypes: ['motorcycle'] },
  { id: 'd3', violation: 'Smoke Emitting Vehicles', fine: 10000, points: '-', category: 'document', vehicleTypes: ['all'] },
  { id: 'd4', violation: 'Unsafe Vehicle Condition', fine: 10000, points: '-', category: 'document', vehicleTypes: ['all'] },
  { id: 'd5', violation: 'Improper Load', fine: 10000, points: '-', category: 'document', vehicleTypes: ['all'] },
  { id: 'd6', violation: 'Blowing Horn in Silence Zone', fine: 10000, points: '-', category: 'document', vehicleTypes: ['all'] },
  { id: 'd7', violation: 'Repetition of Same Violation', fine: 10000, points: '-', category: 'document', vehicleTypes: ['all'] },
  { id: 'd8', violation: 'Failure to Protect Learner Drivers', fine: 10000, points: '-', category: 'document', vehicleTypes: ['all'] },
];

// ============================================
// VEHICLE TYPES
// ============================================

const VEHICLE_TYPES = [
  { id: 'all', label: 'All Vehicles', icon: Car },
  { id: 'motorcycle', label: 'Motorcycle', icon: Bike },
  { id: 'car', label: 'Car', icon: Car },
  { id: 'van', label: 'Van', icon: Bus },
  { id: 'rickshaw', label: 'Rickshaw', icon: Truck },
  { id: 'light', label: 'Light Commercial', icon: Truck },
  { id: 'heavy', label: 'Heavy Vehicle', icon: Truck },
  { id: 'other', label: 'Other', icon: Car },
];

const CATEGORIES = [
  { value: 'all', label: 'All Violations' },
  { value: 'moving', label: 'Moving Violations' },
  { value: 'document', label: 'Document Violations' },
  { value: 'parking', label: 'Parking Violations' },
  { value: 'serious', label: 'Serious Offenses' },
];

// ============================================
// COMPONENT
// ============================================

export default function ViolationsFines() {
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortField, setSortField] = useState<'violation' | 'fine' | 'points'>('violation');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter and sort violations
  const filteredViolations = useMemo(() => {
    let filtered = ALL_VIOLATIONS.filter(v => {
      // Vehicle filter
      if (selectedVehicle !== 'all' && !v.vehicleTypes.includes(selectedVehicle) && !v.vehicleTypes.includes('all')) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && v.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (search && !v.violation.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      
      if (sortField === 'violation') {
        aVal = a.violation.toLowerCase();
        bVal = b.violation.toLowerCase();
      }
      if (sortField === 'points') {
        aVal = a.points === '-' ? -1 : a.points;
        bVal = b.points === '-' ? -1 : b.points;
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [selectedVehicle, search, selectedCategory, sortField, sortDirection]);

  // Statistics
  const stats = useMemo(() => {
    const fines = filteredViolations.map(v => v.fine);
    const total = filteredViolations.length;
    const avg = total > 0 ? Math.round(fines.reduce((a, b) => a + b, 0) / total) : 0;
    const min = total > 0 ? Math.min(...fines) : 0;
    const max = total > 0 ? Math.max(...fines) : 0;
    return { total, avg, min, max };
  }, [filteredViolations]);

  const handleSort = (field: 'violation' | 'fine' | 'points') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      'moving': 'bg-blue-50 text-blue-700 border-blue-200',
      'document': 'bg-purple-50 text-purple-700 border-purple-200',
      'parking': 'bg-amber-50 text-amber-700 border-amber-200',
      'serious': 'bg-red-50 text-red-700 border-red-200',
      'other': 'bg-slate-50 text-slate-700 border-slate-200',
    };
    return styles[category] || styles.other;
  };

  const getPointsBadge = (points: number | '-') => {
    if (points === '-') {
      return <span className="text-[#94A3B8] text-[11px] font-[600]">—</span>;
    }
    if (points >= 6) {
      return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[11px] font-[800]">{points} pts</span>;
    }
    if (points >= 4) {
      return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[11px] font-[800]">{points} pts</span>;
    }
    return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[11px] font-[800]">{points} pts</span>;
  };

  const getFineColor = (fine: number) => {
    if (fine >= 30000) return 'text-red-600 font-[800]';
    if (fine >= 20000) return 'text-amber-600 font-[700]';
    return 'text-[#0C1E3A]';
  };

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
            <span className="w-6 h-px bg-[#0F766E]" /> VIOLATIONS & FINES
          </div>
          <h1 className="mt-2 text-[30px] sm:text-[40px] font-[900] tracking-[-0.04em] leading-[0.92]">
            Traffic Violation <span className="serif italic font-normal text-[#0F766E]">Fines</span>
          </h1>
          <p className="mt-3 text-[15px] leading-6 text-[#4A5A78] max-w-[640px] text-pretty">
            Find exact fine amounts for traffic violations in Karachi. Select your vehicle type and search for specific violations.
          </p>
        </div>

        {/* ⚠️ Disclaimer */}
        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex gap-3 text-[12px] leading-5 text-amber-900">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
          <div>
            <span className="font-[700]">Disclaimer:</span> While this data is sourced from official records, traffic fine amounts and violations may be updated by authorities. Please verify with the latest official sources.
            <span className="block text-[11px] text-amber-700 mt-0.5">Last updated: August 2026</span>
          </div>
        </div>

        {/* 🚗 Vehicle Type Tabs */}
        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            {VEHICLE_TYPES.map((vt) => {
              const Icon = vt.icon;
              const isActive = selectedVehicle === vt.id;
              return (
                <button
                  key={vt.id}
                  onClick={() => setSelectedVehicle(vt.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-[700] transition ${
                    isActive
                      ? 'bg-[#0C1E3A] text-white shadow-sm'
                      : 'bg-white border border-[#0C1E3A]/10 text-[#5B6B85] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <Icon size={16} />
                  {vt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 🔍 Search & Filter */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search violations..."
              className="w-full h-11 rounded-full border border-[#0C1E3A]/10 bg-white pl-10 pr-4 text-[13px] font-[500] outline-none focus:border-[#0C1E3A] focus:ring-4 focus:ring-[#0C1E3A]/5 placeholder:text-[#94A3B8]"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-11 rounded-full border border-[#0C1E3A]/10 bg-white px-4 pr-8 text-[13px] font-[500] outline-none focus:border-[#0C1E3A]"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            {(selectedCategory !== 'all' || search || selectedVehicle !== 'all') && (
              <button
                onClick={() => { setSearch(''); setSelectedCategory('all'); setSelectedVehicle('all'); }}
                className="h-11 px-4 rounded-full bg-[#F1F5F9] border border-[#0C1E3A]/10 text-[13px] font-[600] inline-flex items-center gap-1.5 hover:bg-[#E2E8F0] transition"
              >
                <XCircle size={14} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* 📊 Statistics Cards */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-[14px] border border-[#0C1E3A]/5 p-4 text-center shadow-sm">
            <div className="text-[20px] font-[900] text-[#0C1E3A]">{stats.total}</div>
            <div className="text-[10px] font-[700] text-[#5B6B85] uppercase tracking-wide">Total Violations</div>
          </div>
          <div className="bg-white rounded-[14px] border border-[#0C1E3A]/5 p-4 text-center shadow-sm">
            <div className="text-[20px] font-[900] text-[#0F766E]">Rs. {stats.avg.toLocaleString()}</div>
            <div className="text-[10px] font-[700] text-[#5B6B85] uppercase tracking-wide">Average Fine</div>
          </div>
          <div className="bg-white rounded-[14px] border border-[#0C1E3A]/5 p-4 text-center shadow-sm">
            <div className="text-[20px] font-[900] text-emerald-600">Rs. {stats.min.toLocaleString()}</div>
            <div className="text-[10px] font-[700] text-[#5B6B85] uppercase tracking-wide">Lowest Fine</div>
          </div>
          <div className="bg-white rounded-[14px] border border-[#0C1E3A]/5 p-4 text-center shadow-sm">
            <div className="text-[20px] font-[900] text-red-600">Rs. {stats.max.toLocaleString()}</div>
            <div className="text-[10px] font-[700] text-[#5B6B85] uppercase tracking-wide">Highest Fine</div>
          </div>
        </div>

        {/* 📋 Violations Table */}
        <div className="mt-6 bg-white rounded-[20px] border border-[#0C1E3A]/5 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 h-[52px] flex items-center justify-between border-b border-[#0C1E3A]/5 bg-[#F8FAFC]">
            <span className="text-[13px] font-[800] flex items-center gap-2">
              <Database size={14} className="text-[#0F766E]" /> 
              {selectedVehicle === 'all' ? 'All Vehicles' : VEHICLE_TYPES.find(v => v.id === selectedVehicle)?.label}
              <span className="text-[11px] font-[600] text-[#5B6B85]">({filteredViolations.length} violations)</span>
            </span>
            <span className="text-[11px] font-[600] text-[#5B6B85] hidden sm:inline">Click column headers to sort</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-[13px]">
              <thead className="bg-white text-[11px] font-[800] tracking-[0.06em] text-[#5B6B85] border-b border-[#0C1E3A]/5">
                <tr>
                  <th 
                    className="text-left px-4 sm:px-6 py-3 cursor-pointer hover:text-[#0C1E3A] transition"
                    onClick={() => handleSort('violation')}
                  >
                    <div className="flex items-center gap-1">
                      Violation
                      {sortField === 'violation' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                    </div>
                  </th>
                  <th 
                    className="text-left px-4 py-3 cursor-pointer hover:text-[#0C1E3A] transition"
                    onClick={() => handleSort('fine')}
                  >
                    <div className="flex items-center gap-1">
                      Fine Amount
                      {sortField === 'fine' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                    </div>
                  </th>
                  <th 
                    className="text-left px-4 py-3 cursor-pointer hover:text-[#0C1E3A] transition"
                    onClick={() => handleSort('points')}
                  >
                    <div className="flex items-center gap-1">
                      Points
                      {sortField === 'points' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0C1E3A]/5">
                {filteredViolations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[14px] text-[#5B6B85]">
                      <div className="flex flex-col items-center gap-2">
                        <Search size={24} className="text-[#94A3B8]" />
                        <span>No violations found matching "<strong>{search}</strong>"</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredViolations.map((v) => (
                    <tr key={v.id} className="hover:bg-[#F8FAFC]/70 transition-colors">
                      <td className="px-4 sm:px-6 py-3.5 font-[600] text-[#0C1E3A]">{v.violation}</td>
                      <td className={`px-4 py-3.5 font-[700] ${getFineColor(v.fine)}`}>Rs. {v.fine.toLocaleString()}</td>
                      <td className="px-4 py-3.5">{getPointsBadge(v.points)}</td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-[700] tracking-wide uppercase ${getCategoryBadge(v.category)}`}>
                          {v.category === 'moving' && 'Moving'}
                          {v.category === 'document' && 'Document'}
                          {v.category === 'parking' && 'Parking'}
                          {v.category === 'serious' && 'Serious'}
                          {v.category === 'other' && 'Other'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 sm:px-6 py-3 bg-[#F8FAFC] border-t border-[#0C1E3A]/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5B6B85]">
            <span className="inline-flex items-center gap-1.5">
              <Info size={12} /> Fines are indicative and subject to change
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Shield size={12} className="text-[#0F766E]" /> Source: Sindh Traffic Police
            </span>
          </div>
        </div>

        {/* 📖 How Points Work */}
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-[18px] border border-[#0C1E3A]/5 p-5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0C1E3A] text-white grid place-items-center"><AlertTriangle size={16} /></div>
              <div className="text-[14px] font-[800]">Understanding Points</div>
            </div>
            <div className="mt-3 text-[13px] leading-6 text-[#4A5A78]">
              <p>Points are added to your driving record when you commit traffic violations. Accumulating too many points can lead to:</p>
              <ul className="mt-2 space-y-1.5 text-[13px]">
                <li className="flex gap-2"><XCircle size={14} className="text-red-500 shrink-0 mt-1" /> License suspension or revocation</li>
                <li className="flex gap-2"><TrendingUp size={14} className="text-amber-500 shrink-0 mt-1" /> Higher insurance premiums</li>
                <li className="flex gap-2"><BookOpen size={14} className="text-blue-500 shrink-0 mt-1" /> Mandatory driver improvement courses</li>
                <li className="flex gap-2"><AlertCircle size={14} className="text-amber-500 shrink-0 mt-1" /> Additional penalties for repeat offenses</li>
              </ul>
              <p className="mt-3 text-[12px] text-[#5B6B85]">Note: Some violations don't have points assigned (shown as "–"). These are typically administrative violations.</p>
            </div>
          </div>

          <div className="bg-white rounded-[18px] border border-[#0C1E3A]/5 p-5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0F766E] text-white grid place-items-center"><Car size={16} /></div>
              <div className="text-[14px] font-[800]">Common Vehicle Categories</div>
            </div>
            <div className="mt-3 text-[13px] leading-6 text-[#4A5A78]">
              <ul className="space-y-1.5">
                <li className="flex gap-2"><Bike size={14} className="text-[#0F766E] shrink-0 mt-1" /> <span className="font-[600]">Motorcycles:</span> Solo, MCR</li>
                <li className="flex gap-2"><Car size={14} className="text-[#0F766E] shrink-0 mt-1" /> <span className="font-[600]">Cars & Jeeps:</span> Saloon, Jeep, E-Saloon, Double Cabin, Taxi</li>
                <li className="flex gap-2"><Truck size={14} className="text-[#0F766E] shrink-0 mt-1" /> <span className="font-[600]">Rickshaws:</span> Auto, Qingqi</li>
                <li className="flex gap-2"><Bus size={14} className="text-[#0F766E] shrink-0 mt-1" /> <span className="font-[600]">Vans & Buses:</span> Private Van, Mini Bus, Bus, Coaster</li>
                <li className="flex gap-2"><Truck size={14} className="text-[#0F766E] shrink-0 mt-1" /> <span className="font-[600]">Light Commercial:</span> Pickup, Loader</li>
                <li className="flex gap-2"><Truck size={14} className="text-[#0F766E] shrink-0 mt-1" /> <span className="font-[600]">Heavy Vehicles:</span> Trucks, Tankers, Cranes, Tractors</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 📝 Footer Note */}
        <div className="mt-6 text-center text-[12px] leading-5 text-[#5B6B85]">
          <p>⚠️ <strong>Disclaimer:</strong> Fines are indicative and subject to change. Always verify with official sources.</p>
          <p className="mt-1">Verified facts & sources (2026) — Official Sindh Police website • Traffic Violations & Fines Table</p>
        </div>
      </div>
    </div>
  );
}