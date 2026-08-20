import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  MapPin,
  Camera,
  Eye,
  Shield,
  AlertCircle,
  Info,
  ChevronRight,
  ExternalLink,
  Car,
  Clock,
  Filter,
  X,
  Database,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

// ============================================
// COMPLETE DATA - Karachi Cameras 2026
// ============================================

interface CameraLocation {
  id: string;
  area: string;
  location: string;
  type: 'ANPR' | 'Safe City' | 'TRACS' | 'Speed Camera' | 'Traffic Monitoring';
  status: 'Active' | 'Upcoming' | 'Planned' | 'Installed';
  count?: number;
  description?: string;
}

const CAMERA_LOCATIONS: CameraLocation[] = [
  // =====================
  // TRACS SYSTEM (1,700+ cameras)
  // =====================
  {
    id: 't1',
    area: 'TRACS System',
    location: 'TRACS Network - 40% of Karachi',
    type: 'TRACS',
    status: 'Active',
    count: 1700,
    description: 'Operational in 40% of Karachi'
  },
  {
    id: 't2',
    area: 'TRACS System',
    location: 'E-Challan Camera Network',
    type: 'TRACS',
    status: 'Active',
    count: 150,
    description: 'E-challan enforcement cameras'
  },

  // =====================
  // SAFE CITY PHASE-I (891 cameras)
  // =====================
  {
    id: 's1',
    area: 'Safe City Phase-I',
    location: 'Karachi Safe City Network',
    type: 'Safe City',
    status: 'Active',
    count: 891,
    description: 'Surveillance cameras across Karachi'
  },
  {
    id: 's2',
    area: 'Safe City Phase-I',
    location: 'Clifton Area Surveillance',
    type: 'Safe City',
    status: 'Active',
    count: 120,
    description: 'Clifton, Boat Basin, Do Talwar'
  },
  {
    id: 's3',
    area: 'Safe City Phase-I',
    location: 'Saddar Area Surveillance',
    type: 'Safe City',
    status: 'Active',
    count: 85,
    description: 'Saddar, Empress Market, Regal Chowk'
  },
  {
    id: 's4',
    area: 'Safe City Phase-I',
    location: 'Gulshan-e-Iqbal Surveillance',
    type: 'Safe City',
    status: 'Active',
    count: 60,
    description: 'Gulshan, Johar, NIPA'
  },

  // =====================
  // SAFE CITY PHASE-II (2,314 cameras - Approved April 2026)
  // =====================
  {
    id: 's5',
    area: 'Safe City Phase-II',
    location: 'District South - 322 Cameras',
    type: 'Safe City',
    status: 'Upcoming',
    count: 322,
    description: 'Clifton, Saddar, Keamari, Lyari, Malir Cantonment'
  },
  {
    id: 's6',
    area: 'Safe City Phase-II',
    location: 'District East - 278 Cameras',
    type: 'Safe City',
    status: 'Upcoming',
    count: 278,
    description: 'Gulshan, Jamshed, F.B. Area, Shah Faisal'
  },
  {
    id: 's7',
    area: 'Safe City Phase-II',
    location: 'District Malir - 206 Cameras',
    type: 'Safe City',
    status: 'Upcoming',
    count: 206,
    description: 'Malir, Landhi, Shah Latif, Bin Qasim'
  },
  {
    id: 's8',
    area: 'Safe City Phase-II',
    location: 'District West - 188 Cameras',
    type: 'Safe City',
    status: 'Upcoming',
    count: 188,
    description: 'SITE, Orangi, Baldia, Manghopir'
  },
  {
    id: 's9',
    area: 'Safe City Phase-II',
    location: 'District Korangi - 190 Cameras',
    type: 'Safe City',
    status: 'Upcoming',
    count: 190,
    description: 'Korangi, Landhi, Shah Latif'
  },
  {
    id: 's10',
    area: 'Safe City Phase-II',
    location: 'District Central - 167 Cameras',
    type: 'Safe City',
    status: 'Upcoming',
    count: 167,
    description: 'North Nazimabad, New Karachi, Nazimabad'
  },
  {
    id: 's11',
    area: 'Safe City Phase-II',
    location: 'District Kemari - 15 Cameras',
    type: 'Safe City',
    status: 'Upcoming',
    count: 15,
    description: 'Kemari, Dockyard, Port Area'
  },

  // =====================
  // ANPR CAMERAS - Shahrah-e-Faisal Pilot (20 cameras)
  // =====================
  { id: 'a1', area: 'Shahrah-e-Faisal', location: 'Nursery Bus Stop', type: 'ANPR', status: 'Active' },
  { id: 'a2', area: 'Shahrah-e-Faisal', location: 'FTC Flyover', type: 'ANPR', status: 'Active' },
  { id: 'a3', area: 'Shahrah-e-Faisal', location: 'Regent Plaza', type: 'ANPR', status: 'Active' },
  { id: 'a4', area: 'Shahrah-e-Faisal', location: 'Metropole', type: 'ANPR', status: 'Active' },
  { id: 'a5', area: 'Shahrah-e-Faisal', location: 'Drigh Road', type: 'ANPR', status: 'Active' },
  { id: 'a6', area: 'Shahrah-e-Faisal', location: 'Baloch Colony', type: 'ANPR', status: 'Active' },
  { id: 'a7', area: 'Shahrah-e-Faisal', location: 'PAF Base Karsaz', type: 'ANPR', status: 'Active' },

  // =====================
  // UPCOMING ANPR EXPANSION (By August 2026)
  // =====================
  { id: 'a8', area: 'Airport Road', location: 'Jinnah Terminal', type: 'ANPR', status: 'Upcoming' },
  { id: 'a9', area: 'Airport Road', location: 'Star Gate', type: 'ANPR', status: 'Upcoming' },
  { id: 'a10', area: 'Clifton', location: 'Do Talwar', type: 'ANPR', status: 'Upcoming' },
  { id: 'a11', area: 'Clifton', location: 'Teen Talwar', type: 'ANPR', status: 'Upcoming' },

  // =====================
  // SPEED CAMERAS
  // =====================
  { id: 'sp1', area: 'Shahrah-e-Faisal', location: 'Speed Camera - Nursery', type: 'Speed Camera', status: 'Active' },
  { id: 'sp2', area: 'Shahrah-e-Faisal', location: 'Speed Camera - Karsaz', type: 'Speed Camera', status: 'Active' },
  { id: 'sp3', area: 'University Road', location: 'Speed Camera - NIPA', type: 'Speed Camera', status: 'Active' },
  { id: 'sp4', area: 'University Road', location: 'Speed Camera - Samama', type: 'Speed Camera', status: 'Active' },

  // =====================
  // TRAFFIC MONITORING CAMERAS (Other Areas)
  // =====================
  { id: 'm1', area: 'Clifton', location: 'Sea View', type: 'Traffic Monitoring', status: 'Active' },
  { id: 'm2', area: 'Clifton', location: 'Dolmen Mall', type: 'Traffic Monitoring', status: 'Active' },
  { id: 'm3', area: 'Saddar', location: 'Empress Market', type: 'Traffic Monitoring', status: 'Active' },
  { id: 'm4', area: 'Saddar', location: 'MA Jinnah Road', type: 'Traffic Monitoring', status: 'Active' },
  { id: 'm5', area: 'University Road', location: 'Mosamiyat', type: 'Traffic Monitoring', status: 'Active' },
  { id: 'm6', area: 'University Road', location: 'Safari Park', type: 'Traffic Monitoring', status: 'Active' },
  { id: 'm7', area: 'North Nazimabad', location: 'Five Star', type: 'Traffic Monitoring', status: 'Active' },
  { id: 'm8', area: 'North Nazimabad', location: 'Hyderi', type: 'Traffic Monitoring', status: 'Active' },
  { id: 'm9', area: 'Gulshan', location: 'Water Pump', type: 'Traffic Monitoring', status: 'Active' },
  { id: 'm10', area: 'Gulshan', location: 'Johar Mor', type: 'Traffic Monitoring', status: 'Active' },
  { id: 'm11', area: 'Korangi', location: 'Korangi Crossing', type: 'Traffic Monitoring', status: 'Active' },
  { id: 'm12', area: 'Korangi', location: 'Chamra Chowrangi', type: 'Traffic Monitoring', status: 'Active' },
  { id: 'm13', area: 'Landhi', location: 'Landhi No. 3', type: 'Traffic Monitoring', status: 'Active' },
  { id: 'm14', area: 'DHA', location: 'Khayaban-e-Ittehad', type: 'Traffic Monitoring', status: 'Active' },
  { id: 'm15', area: 'DHA', location: 'Khayaban-e-Shamsheer', type: 'Traffic Monitoring', status: 'Active' },
];

const AREAS = [
  'All Areas',
  'TRACS System',
  'Safe City Phase-I',
  'Safe City Phase-II',
  'Shahrah-e-Faisal',
  'Airport Road',
  'Clifton',
  'Saddar',
  'University Road',
  'North Nazimabad',
  'Gulshan',
  'Korangi',
  'Landhi',
  'DHA'
];

const TYPES = ['All Types', 'ANPR', 'Safe City', 'TRACS', 'Speed Camera', 'Traffic Monitoring'];

// ============================================
// COMPONENT
// ============================================

export default function LocateCameras() {
  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const [selectedType, setSelectedType] = useState('All Types');

  const filteredCameras = CAMERA_LOCATIONS.filter(cam => {
    const matchSearch = cam.location.toLowerCase().includes(search.toLowerCase()) ||
                        cam.area.toLowerCase().includes(search.toLowerCase());
    const matchArea = selectedArea === 'All Areas' || cam.area === selectedArea;
    const matchType = selectedType === 'All Types' || cam.type === selectedType;
    return matchSearch && matchArea && matchType;
  });

  // Calculate totals
  const totalActive = CAMERA_LOCATIONS.filter(c => c.status === 'Active').reduce((sum, c) => sum + (c.count || 1), 0);
  const totalUpcoming = CAMERA_LOCATIONS.filter(c => c.status === 'Upcoming').reduce((sum, c) => sum + (c.count || 1), 0);
  const totalCameras = CAMERA_LOCATIONS.reduce((sum, c) => sum + (c.count || 1), 0);

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      'ANPR': 'bg-blue-100 text-blue-700 border-blue-200',
      'Safe City': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'TRACS': 'bg-purple-100 text-purple-700 border-purple-200',
      'Speed Camera': 'bg-red-100 text-red-700 border-red-200',
      'Traffic Monitoring': 'bg-amber-100 text-amber-700 border-amber-200',
    };
    return styles[type] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'Active': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Upcoming': 'bg-amber-100 text-amber-700 border-amber-200',
      'Planned': 'bg-blue-100 text-blue-700 border-blue-200',
      'Installed': 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getTypeIcon = (type: string) => {
    if (type === 'ANPR') return <Camera size={14} />;
    if (type === 'Safe City') return <Shield size={14} />;
    if (type === 'TRACS') return <Database size={14} />;
    if (type === 'Speed Camera') return <Clock size={14} />;
    return <Eye size={14} />;
  };

  const groupedCameras = filteredCameras.reduce((acc, cam) => {
    if (!acc[cam.area]) acc[cam.area] = [];
    acc[cam.area].push(cam);
    return acc;
  }, {} as Record<string, CameraLocation[]>);

  return (
    <div className="min-h-screen bg-[#FDFDFB]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] font-[600] text-[#5B6B85] hover:text-[#0C1E3A] transition-colors">
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="mt-6">
          <div className="inline-flex items-center gap-2 text-[11px] font-[800] tracking-[0.12em] text-[#0F766E]">
            <span className="w-6 h-px bg-[#0F766E]" /> LOCATE CAMERAS
          </div>
          <h1 className="mt-2 text-[30px] sm:text-[40px] font-[900] tracking-[-0.04em] leading-[0.92]">
            Traffic Camera <span className="serif italic font-normal text-[#0F766E]">Locations</span>
          </h1>
          <p className="mt-3 text-[15px] leading-6 text-[#4A5A78] max-w-[640px] text-pretty">
            Complete list of ANPR, Safe City, TRACS, and traffic monitoring cameras across Karachi. Updated for 2026.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-[14px] border border-[#0C1E3A]/5 p-4 text-center shadow-sm">
            <div className="text-[24px] font-[900] text-[#0C1E3A]">{totalCameras.toLocaleString()}</div>
            <div className="text-[11px] font-[700] text-[#5B6B85]">Total Cameras</div>
          </div>
          <div className="bg-white rounded-[14px] border border-[#0C1E3A]/5 p-4 text-center shadow-sm">
            <div className="text-[24px] font-[900] text-emerald-600">{totalActive.toLocaleString()}</div>
            <div className="text-[11px] font-[700] text-[#5B6B85]">Active Cameras</div>
          </div>
          <div className="bg-white rounded-[14px] border border-[#0C1E3A]/5 p-4 text-center shadow-sm">
            <div className="text-[24px] font-[900] text-amber-600">{totalUpcoming.toLocaleString()}</div>
            <div className="text-[11px] font-[700] text-[#5B6B85]">Upcoming / Planned</div>
          </div>
          <div className="bg-white rounded-[14px] border border-[#0C1E3A]/5 p-4 text-center shadow-sm">
            <div className="text-[24px] font-[900] text-blue-600">10,000+</div>
            <div className="text-[11px] font-[700] text-[#5B6B85]">Future Expansion</div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search camera locations or areas..."
              className="w-full h-11 rounded-full border border-[#0C1E3A]/10 bg-white pl-10 pr-4 text-[13px] font-[500] outline-none focus:border-[#0C1E3A] focus:ring-4 focus:ring-[#0C1E3A]/5 placeholder:text-[#94A3B8]"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="h-11 rounded-full border border-[#0C1E3A]/10 bg-white px-4 pr-8 text-[13px] font-[500] outline-none focus:border-[#0C1E3A]"
            >
              {AREAS.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-11 rounded-full border border-[#0C1E3A]/10 bg-white px-4 pr-8 text-[13px] font-[500] outline-none focus:border-[#0C1E3A]"
            >
              {TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {(selectedArea !== 'All Areas' || selectedType !== 'All Types' || search) && (
              <button
                onClick={() => { setSearch(''); setSelectedArea('All Areas'); setSelectedType('All Types'); }}
                className="h-11 px-4 rounded-full bg-[#F1F5F9] border border-[#0C1E3A]/10 text-[13px] font-[600] inline-flex items-center gap-1.5 hover:bg-[#E2E8F0] transition"
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="mt-6 bg-white rounded-[20px] border border-[#0C1E3A]/5 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 h-[52px] flex items-center justify-between border-b border-[#0C1E3A]/5 bg-[#F8FAFC]">
            <span className="text-[13px] font-[800] flex items-center gap-2">
              <MapPin size={14} className="text-[#0F766E]" /> Camera Map
            </span>
            <span className="text-[11px] font-[600] text-[#5B6B85]">{filteredCameras.length} locations shown</span>
          </div>
          <div className="relative w-full h-[320px] sm:h-[400px] bg-[#EFF6FF]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d57834.93854373446!2d67.03905844924038!3d24.92366046381722!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1skarachi%20traffic%20cameras!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Karachi Traffic Cameras Map"
            ></iframe>
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 text-[11px] font-[600] text-[#5B6B85] shadow-sm border border-[#0C1E3A]/5 flex items-center gap-2">
              <Info size={12} className="text-[#0F766E]" /> Locations are approximate
            </div>
          </div>
          <div className="px-4 sm:px-6 py-3 bg-[#F8FAFC] border-t border-[#0C1E3A]/5 text-[11px] text-[#5B6B85] flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5">
              <AlertCircle size={12} /> Data as of 2026 • Subject to change
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Shield size={12} className="text-[#0F766E]" /> Sources: Sindh Police, TRACS, Safe City
            </span>
          </div>
        </div>

        {/* Camera List */}
        <div className="mt-6 bg-white rounded-[20px] border border-[#0C1E3A]/5 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 h-[52px] flex items-center justify-between border-b border-[#0C1E3A]/5 bg-[#F8FAFC]">
            <span className="text-[13px] font-[800] flex items-center gap-2">
              <Camera size={14} className="text-[#0F766E]" /> Camera Locations
              <span className="text-[11px] font-[600] text-[#5B6B85]">({filteredCameras.length})</span>
            </span>
            <span className="text-[11px] font-[600] text-[#5B6B85] hidden sm:inline">TRACS • Safe City • ANPR</span>
          </div>

          <div className="divide-y divide-[#0C1E3A]/5">
            {filteredCameras.length === 0 ? (
              <div className="px-6 py-12 text-center text-[14px] text-[#5B6B85]">
                <div className="flex flex-col items-center gap-2">
                  <Search size={24} className="text-[#94A3B8]" />
                  <span>No cameras found matching "<strong>{search}</strong>"</span>
                </div>
              </div>
            ) : (
              Object.entries(groupedCameras).map(([area, cameras]) => {
                const areaTotal = cameras.reduce((sum, c) => sum + (c.count || 1), 0);
                return (
                  <div key={area}>
                    <div className="px-4 sm:px-6 py-2.5 bg-[#F8FAFC] text-[13px] font-[700] text-[#0C1E3A] border-b border-[#0C1E3A]/5 flex items-center justify-between">
                      <span>{area}</span>
                      <span className="text-[11px] font-[600] text-[#5B6B85]">{areaTotal} cameras</span>
                    </div>
                    {cameras.map(cam => (
                      <div key={cam.id} className="px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-2 hover:bg-[#F8FAFC]/70 transition">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[#F1F5F9] grid place-items-center shrink-0">
                            {getTypeIcon(cam.type)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-[600] text-[#0C1E3A]">
                              {cam.location}
                              {cam.count && cam.count > 1 && (
                                <span className="ml-1.5 text-[11px] font-[700] text-[#0F766E]">({cam.count})</span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#5B6B85] flex items-center gap-2">
                              <MapPin size={10} /> {cam.area}
                              {cam.description && (
                                <span className="text-[10px] text-[#94A3B8]">• {cam.description}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-[700] tracking-wide ${getTypeBadge(cam.type)}`}>
                            {cam.type}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-[700] tracking-wide ${getStatusBadge(cam.status)}`}>
                            {cam.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>

          <div className="px-4 sm:px-6 py-3 bg-[#F8FAFC] border-t border-[#0C1E3A]/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5B6B85]">
            <span className="inline-flex items-center gap-1.5">
              <Camera size={12} className="text-[#0F766E]" /> {filteredCameras.length} locations displayed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Info size={12} /> Data from Sindh Police, TRACS & Safe City
            </span>
          </div>
        </div>

        <div className="mt-6 text-center text-[12px] leading-5 text-[#5B6B85]">
          <p> Camera locations are for informational purposes only. Always follow traffic rules and signals.</p>
          <p className="mt-1">For official updates, visit <a href="#" className="text-[#0F766E] font-[600] hover:underline">Sindh Traffic Police</a>.</p>
        </div>
      </div>
    </div>
  );
}