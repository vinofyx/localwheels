import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';

// ── Leaflet fleet map data ─────────────────────────────────────────────────
const GEO_CITIES = [
  {name:'Delhi',       lat:28.6139, lng:77.2090}, // 0
  {name:'Mumbai',      lat:19.0760, lng:72.8777}, // 1
  {name:'Chennai',     lat:13.0827, lng:80.2707}, // 2
  {name:'Kolkata',     lat:22.5726, lng:88.3639}, // 3
  {name:'Bangalore',   lat:12.9716, lng:77.5946}, // 4
  {name:'Hyderabad',   lat:17.3850, lng:78.4867}, // 5
  {name:'Pune',        lat:18.5204, lng:73.8567}, // 6
  {name:'Ahmedabad',   lat:23.0225, lng:72.5714}, // 7
  {name:'Jaipur',      lat:26.9124, lng:75.7873}, // 8
  {name:'Nagpur',      lat:21.1458, lng:79.0882}, // 9
  {name:'Surat',       lat:21.1702, lng:72.8311}, // 10
  {name:'Bhubaneswar', lat:20.2961, lng:85.8245}, // 11
];
const GEO_ROUTES = [
  {from:5, to:4,  label:'Hyderabad → Bangalore'},
  {from:5, to:2,  label:'Hyderabad → Chennai'},
  {from:1, to:6,  label:'Mumbai → Pune'},
  {from:0, to:8,  label:'Delhi → Jaipur'},
  {from:7, to:10, label:'Ahmedabad → Surat'},
  {from:3, to:11, label:'Kolkata → Bhubaneswar'},
  {from:0, to:1,  label:'Delhi → Mumbai'},
];
const WAREHOUSES_GEO = [
  {name:'Delhi Hub',     lat:28.60, lng:77.15, stock:'High',   queue:8},
  {name:'Mumbai Hub',    lat:19.04, lng:72.84, stock:'Medium', queue:5},
  {name:'Hyderabad Hub', lat:17.42, lng:78.52, stock:'High',   queue:12},
  {name:'Kolkata Hub',   lat:22.52, lng:88.32, stock:'Low',    queue:3},
  {name:'Bangalore Hub', lat:12.93, lng:77.55, stock:'Medium', queue:6},
];
const CUSTOMERS_GEO = [
  {name:'Jaipur Delivery',  lat:26.85, lng:75.83, status:'Scheduled', eta:'14:30'},
  {name:'Pune Delivery',    lat:18.56, lng:73.91, status:'En Route',  eta:'16:45'},
  {name:'Chennai Delivery', lat:13.03, lng:80.22, status:'Delivered', eta:'Done'},
  {name:'Bhubaneswar Del.', lat:20.25, lng:85.80, status:'En Route',  eta:'18:20'},
  {name:'Surat Delivery',   lat:21.22, lng:72.89, status:'Scheduled', eta:'15:00'},
  {name:'Nagpur Delivery',  lat:21.18, lng:79.03, status:'En Route',  eta:'17:30'},
];
const DEMO_FLEET = [
  // Route 0: Hyderabad→Bangalore (5 Moving)
  {id:'TS-09-GA-1001',driver:'Ramesh Kumar',  ri:0,p:0.12,st:'Moving',    spd:62,fuel:67,load:'14T Cement',    hlth:'Good'},
  {id:'KA-04-AB-2002',driver:'Suresh Patil',  ri:0,p:0.35,st:'Moving',    spd:58,fuel:45,load:'8T Steel',      hlth:'Good'},
  {id:'AP-09-CD-3003',driver:'Mohan Lal',     ri:0,p:0.55,st:'Moving',    spd:71,fuel:82,load:'12T Textiles',  hlth:'Good'},
  {id:'MH-12-EF-4004',driver:'Ravi Mehta',    ri:0,p:0.72,st:'Moving',    spd:49,fuel:34,load:'6T Electronics',hlth:'Fair'},
  {id:'KA-53-GH-5005',driver:'Anil Sharma',   ri:0,p:0.88,st:'Moving',    spd:64,fuel:91,load:'18T Pharma',    hlth:'Good'},
  // Route 1: Hyderabad→Chennai (4 Moving + 1 Breakdown)
  {id:'TN-22-IJ-6006',driver:'Vijay Reddy',   ri:1,p:0.20,st:'Moving',    spd:67,fuel:55,load:'10T FMCG',      hlth:'Good'},
  {id:'AP-28-KL-7007',driver:'Pradeep Tiwari',ri:1,p:0.42,st:'Moving',    spd:73,fuel:73,load:'5T Auto Parts', hlth:'Good'},
  {id:'TN-09-MN-8008',driver:'Kumar Verma',   ri:1,p:0.65,st:'Moving',    spd:61,fuel:28,load:'9T Rice',       hlth:'Fair'},
  {id:'KA-01-OP-9009',driver:'Sanjay Bhat',   ri:1,p:0.80,st:'Moving',    spd:58,fuel:88,load:'7T Cotton',     hlth:'Good'},
  {id:'AP-11-QR-1010',driver:'Girish Yadav',  ri:1,p:0.50,st:'Breakdown', spd:0, fuel:22,load:'11T Fertilizer',hlth:'Critical'},
  // Route 2: Mumbai→Pune (4 Moving)
  {id:'MH-14-ST-1011',driver:'Dinesh Chauhan',ri:2,p:0.18,st:'Moving',    spd:55,fuel:62,load:'3T Vegetables', hlth:'Good'},
  {id:'MH-43-UV-1012',driver:'Ganesh Nair',   ri:2,p:0.45,st:'Moving',    spd:48,fuel:47,load:'15T Machinery', hlth:'Fair'},
  {id:'MH-20-WX-1013',driver:'Harish Pillai', ri:2,p:0.70,st:'Moving',    spd:66,fuel:79,load:'8T Chemicals',  hlth:'Good'},
  {id:'GJ-05-YZ-1014',driver:'Mahesh Desai',  ri:2,p:0.90,st:'Moving',    spd:72,fuel:56,load:'4T Pharma',     hlth:'Good'},
  // Route 3: Delhi→Jaipur (4 Moving)
  {id:'RJ-14-AB-1015',driver:'Naresh Gupta',  ri:3,p:0.25,st:'Moving',    spd:77,fuel:41,load:'20T Grain',     hlth:'Good'},
  {id:'DL-01-CD-1016',driver:'Nilesh Khanna', ri:3,p:0.50,st:'Moving',    spd:64,fuel:93,load:'6T Dairy',      hlth:'Good'},
  {id:'UP-80-EF-1017',driver:'Rakesh Joshi',  ri:3,p:0.68,st:'Moving',    spd:59,fuel:37,load:'12T Sand',      hlth:'Fair'},
  {id:'HR-26-GH-1018',driver:'Ramdev Singh',  ri:3,p:0.85,st:'Moving',    spd:53,fuel:84,load:'9T Spices',     hlth:'Good'},
  // Route 4: Ahmedabad→Surat (4 Moving)
  {id:'GJ-18-IJ-1019',driver:'Suresh Modi',   ri:4,p:0.15,st:'Moving',    spd:69,fuel:71,load:'16T Textiles',  hlth:'Good'},
  {id:'GJ-22-KL-1020',driver:'Arjun Trivedi', ri:4,p:0.38,st:'Moving',    spd:63,fuel:53,load:'7T Diamonds',   hlth:'Good'},
  {id:'GJ-01-MN-1021',driver:'Deepak Rajan',  ri:4,p:0.58,st:'Moving',    spd:57,fuel:39,load:'11T Plastics',  hlth:'Fair'},
  {id:'MH-02-OP-1022',driver:'Karim Hassan',  ri:4,p:0.78,st:'Moving',    spd:71,fuel:76,load:'5T Salt',       hlth:'Good'},
  // Route 5: Kolkata→Bhubaneswar (4 Moving)
  {id:'WB-06-QR-1023',driver:'Laxman Paul',   ri:5,p:0.22,st:'Moving',    spd:54,fuel:29,load:'8T Jute',       hlth:'Fair'},
  {id:'WB-02-ST-1024',driver:'Mohan Jana',    ri:5,p:0.44,st:'Moving',    spd:61,fuel:85,load:'14T Coal',      hlth:'Good'},
  {id:'OD-02-UV-1025',driver:'Narayan Das',   ri:5,p:0.67,st:'Moving',    spd:47,fuel:64,load:'6T Fish',       hlth:'Good'},
  {id:'WB-04-WX-1026',driver:'Pavan Saha',    ri:5,p:0.88,st:'Moving',    spd:68,fuel:68,load:'10T Cement',    hlth:'Good'},
  // Route 6: Delhi→Mumbai (3 Moving + 1 Breakdown)
  {id:'MH-01-YZ-1027',driver:'Ramesh Vyas',   ri:6,p:0.30,st:'Moving',    spd:76,fuel:55,load:'25T Goods',     hlth:'Good'},
  {id:'UP-32-AB-1028',driver:'Suresh Kumar',  ri:6,p:0.55,st:'Moving',    spd:69,fuel:43,load:'18T Auto',      hlth:'Good'},
  {id:'MH-48-CD-1029',driver:'Vijay Malhotra',ri:6,p:0.75,st:'Moving',    spd:62,fuel:77,load:'12T Pharma',    hlth:'Good'},
  {id:'UP-16-EF-1030',driver:'Kumar Thakur',  ri:6,p:0.40,st:'Breakdown', spd:0, fuel:15,load:'8T FMCG',      hlth:'Critical'},
  // Idle (6)
  {id:'DL-03-GH-1031',driver:'Anil Dubey',    ri:0,p:0.0,st:'Idle',       spd:0, fuel:71,load:'Empty',        hlth:'Good'},
  {id:'DL-07-IJ-1032',driver:'Mohan Prasad',  ri:3,p:0.0,st:'Idle',       spd:0, fuel:53,load:'Empty',        hlth:'Good'},
  {id:'MH-11-KL-1033',driver:'Ganesh Rao',    ri:2,p:1.0,st:'Idle',       spd:0, fuel:39,load:'Empty',        hlth:'Good'},
  {id:'TS-01-MN-1034',driver:'Harish Murthy', ri:1,p:0.0,st:'Idle',       spd:0, fuel:76,load:'Empty',        hlth:'Good'},
  {id:'WB-22-OP-1035',driver:'Nilesh Sen',    ri:5,p:1.0,st:'Idle',       spd:0, fuel:29,load:'Empty',        hlth:'Good'},
  {id:'KA-11-QR-1036',driver:'Deepak Shetty', ri:0,p:1.0,st:'Idle',       spd:0, fuel:85,load:'Empty',        hlth:'Good'},
  // Maintenance (3)
  {id:'GJ-14-ST-1037',driver:'Rakesh Mehta',  ri:4,p:0.0,st:'Maintenance',spd:0, fuel:90,load:'In Service',   hlth:'Repair'},
  {id:'RJ-09-UV-1038',driver:'Pradeep Verma', ri:3,p:1.0,st:'Maintenance',spd:0, fuel:65,load:'In Service',   hlth:'Repair'},
  {id:'UP-23-WX-1039',driver:'Kumar Garg',    ri:6,p:0.0,st:'Maintenance',spd:0, fuel:80,load:'In Service',   hlth:'Repair'},
];
const ST_CLR = {Moving:'#22c55e', Idle:'#facc15', Breakdown:'#ef4444', Maintenance:'#8b5cf6'};

function createVehIcon(st, selected) {
  const c = ST_CLR[st] || '#64748b';
  const sz = selected ? 24 : 18;
  const ico = st === 'Maintenance' ? '🔧' : st === 'Breakdown' ? '⚠️' : '🚛';
  return L.divIcon({
    html: `<div style="width:${sz}px;height:${sz}px;background:${c};border:${selected?3:2}px solid #fff;border-radius:${st==='Maintenance'?'50%':'4px'};display:flex;align-items:center;justify-content:center;box-shadow:${selected?`0 0 0 4px ${c}55,`:''}0 2px 8px rgba(0,0,0,0.5);font-size:${Math.round(sz*0.55)}px">${ico}</div>`,
    className:'', iconSize:[sz,sz], iconAnchor:[sz/2,sz/2],
  });
}
const WH_ICON = () => L.divIcon({html:`<div style="width:24px;height:24px;background:#1d4ed8;border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.5);font-size:12px">🏭</div>`,className:'',iconSize:[24,24],iconAnchor:[12,12]});
const CU_ICON = () => L.divIcon({html:`<div style="width:20px;height:20px;background:#f97316;border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.5);font-size:10px">📍</div>`,className:'',iconSize:[20,20],iconAnchor:[10,10]});

const TILES = {
  dark:      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  streets:   'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

function FleetMap({ activeCount, nots = [] }) {
  const navigate   = useNavigate();
  const progRef    = useRef(DEMO_FLEET.map(v => v.p));
  const markerRefs = useRef([]);
  const [selIdx,   setSelIdx]   = useState(null);
  const [mapLayer, setMapLayer] = useState('dark');
  const safeNots = Array.isArray(nots) ? nots : [];

  // Animate moving vehicles directly via Leaflet marker refs (no React re-renders)
  useEffect(() => {
    const t = setInterval(() => {
      DEMO_FLEET.forEach((v, i) => {
        if (v.st !== 'Moving') return;
        progRef.current[i] = (progRef.current[i] + 0.0004) % 1;
        const m = markerRefs.current[i];
        if (m) {
          const rt = GEO_ROUTES[v.ri];
          const f  = GEO_CITIES[rt.from], to = GEO_CITIES[rt.to], p = progRef.current[i];
          m.setLatLng([f.lat + (to.lat - f.lat) * p, f.lng + (to.lng - f.lng) * p]);
        }
      });
    }, 300);
    return () => clearInterval(t);
  }, []);

  // Update icon appearance when selection changes
  useEffect(() => {
    DEMO_FLEET.forEach((v, i) => {
      const m = markerRefs.current[i];
      if (m) m.setIcon(createVehIcon(v.st, i === selIdx));
    });
  }, [selIdx]);

  const movCount = DEMO_FLEET.filter(v => v.st === 'Moving').length;
  const idlCount = DEMO_FLEET.filter(v => v.st === 'Idle').length;
  const mntCount = DEMO_FLEET.filter(v => v.st === 'Maintenance').length;
  const brkCount = DEMO_FLEET.filter(v => v.st === 'Breakdown').length;

  const sel   = selIdx !== null ? DEMO_FLEET[selIdx] : null;
  const selRt = sel ? GEO_ROUTES[sel.ri] : null;
  const selEta = sel?.st === 'Moving'
    ? `${((1 - progRef.current[selIdx]) * 8).toFixed(1)}h`
    : sel?.st === 'Idle' ? 'At Depot' : 'N/A';

  const glass = { position:'absolute', zIndex:1000, background:'rgba(5,12,28,0.93)', border:'1px solid rgba(59,130,246,0.35)', borderRadius:10, padding:'10px 12px', backdropFilter:'blur(8px)' };

  return (
    <div style={{ position:'relative', height:500, borderRadius:10, overflow:'hidden' }}>

      {/* Demo mode banner */}
      <div style={{ position:'absolute',top:0,left:0,right:0,zIndex:1001,display:'flex',alignItems:'center',gap:8,padding:'5px 12px',background:'rgba(180,83,9,0.92)' }}>
        <span style={{fontSize:11}}>⚠️</span>
        <span style={{fontSize:10,fontWeight:700,color:'#fff'}}>GPS devices are not connected. Showing demo fleet data.</span>
        <span style={{marginLeft:'auto',fontSize:9,background:'rgba(0,0,0,0.3)',color:'#fef3c7',padding:'2px 7px',borderRadius:3,fontWeight:700}}>DEMO MODE</span>
      </div>

      {/* Leaflet map */}
      <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{width:'100%',height:'100%'}} zoomControl={false} attributionControl={false}>
        <TileLayer key={mapLayer} url={TILES[mapLayer]} maxZoom={18} />

        {/* Route polylines */}
        {GEO_ROUTES.map((rt, i) => {
          const f = GEO_CITIES[rt.from], t = GEO_CITIES[rt.to];
          return <Polyline key={i} positions={[[f.lat,f.lng],[t.lat,t.lng]]} color="#2563eb" weight={2} opacity={0.5} dashArray="7,5" />;
        })}

        {/* Warehouse markers */}
        {WAREHOUSES_GEO.map((w, i) => (
          <Marker key={`wh${i}`} position={[w.lat,w.lng]} icon={WH_ICON()} />
        ))}

        {/* Customer markers */}
        {CUSTOMERS_GEO.map((c, i) => (
          <Marker key={`cu${i}`} position={[c.lat,c.lng]} icon={CU_ICON()} />
        ))}

        {/* Vehicle markers — positions driven by markerRef.setLatLng in interval */}
        {DEMO_FLEET.map((v, i) => {
          const rt = GEO_ROUTES[v.ri], f = GEO_CITIES[rt.from], t = GEO_CITIES[rt.to], p = progRef.current[i];
          return (
            <Marker key={i}
              ref={el => { markerRefs.current[i] = el; }}
              position={[f.lat + (t.lat - f.lat) * p, f.lng + (t.lng - f.lng) * p]}
              icon={createVehIcon(v.st, i === selIdx)}
              eventHandlers={{ click: () => setSelIdx(selIdx === i ? null : i) }} />
          );
        })}
      </MapContainer>

      {/* Layer controls — top-right */}
      <div style={{...glass, top:34, right:10, display:'flex', gap:4, padding:'5px 7px'}}>
        {[['dark','🌙'],['streets','🗺️'],['satellite','🛰️']].map(([k, ico]) => (
          <button key={k} onClick={() => setMapLayer(k)}
            style={{ background:mapLayer===k?'#1d4ed8':'transparent', color:mapLayer===k?'#fff':'#64748b', border:mapLayer===k?'1px solid #3b82f6':'1px solid #1e293b', borderRadius:5, padding:'3px 8px', fontSize:10, cursor:'pointer', fontWeight:600 }}>
            {ico}
          </button>
        ))}
      </div>

      {/* Live Fleet Summary — top-left */}
      <div style={{...glass, top:34, left:10, minWidth:155}}>
        <div style={{fontSize:10,fontWeight:700,color:'#60a5fa',marginBottom:7,letterSpacing:'0.05em'}}>📊 LIVE FLEET</div>
        {[
          {l:'Running',    v:movCount, c:'#22c55e'},
          {l:'Idle',       v:idlCount, c:'#facc15'},
          {l:'Breakdown',  v:brkCount, c:'#ef4444'},
          {l:'Maintenance',v:mntCount, c:'#8b5cf6'},
          {l:'Active LRs', v:activeCount, c:'#3b82f6'},
        ].map(({l,v,c}) => (
          <div key={l} style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
            <span style={{fontSize:10,color:'#64748b'}}>{l}</span>
            <span style={{fontSize:11,fontWeight:700,color:c}}>{v}</span>
          </div>
        ))}
        <div style={{borderTop:'1px solid #1e3a5f',marginTop:5,paddingTop:5}}>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:9,color:'#475569'}}>Avg Speed</span>
            <span style={{fontSize:9,fontWeight:700,color:'#e2e8f0'}}>62 km/h</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:3}}>
            <span style={{fontSize:9,color:'#475569'}}>Routes Active</span>
            <span style={{fontSize:9,fontWeight:700,color:'#e2e8f0'}}>{GEO_ROUTES.length}</span>
          </div>
        </div>
      </div>

      {/* AI Alerts + GPS card — bottom-right */}
      <div style={{...glass, bottom:10, right:10, maxWidth:178}}>
        <div style={{fontSize:10,fontWeight:700,color:'#f59e0b',marginBottom:6,letterSpacing:'0.05em'}}>⚡ AI ALERTS</div>
        {safeNots.length > 0 ? safeNots.slice(0,3).map((n, i) => (
          <div key={i} style={{marginBottom:5}}>
            <div style={{fontSize:9,fontWeight:700,color:n.priority==='High'?'#ef4444':'#f59e0b'}}>{n.type}</div>
            <div style={{fontSize:9,color:'#475569',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n.message}</div>
          </div>
        )) : <>
          <div style={{marginBottom:4}}><div style={{fontSize:9,fontWeight:700,color:'#ef4444'}}>⚠️ Breakdown Risk</div><div style={{fontSize:9,color:'#475569'}}>AP-11-QR, UP-16-EF on road</div></div>
          <div style={{marginBottom:4}}><div style={{fontSize:9,fontWeight:700,color:'#f59e0b'}}>⛽ Low Fuel</div><div style={{fontSize:9,color:'#475569'}}>3 vehicles below 30%</div></div>
          <div style={{marginBottom:4}}><div style={{fontSize:9,fontWeight:700,color:'#f59e0b'}}>⏱️ Delay Prediction</div><div style={{fontSize:9,color:'#475569'}}>2 trips may be late</div></div>
        </>}
        <button onClick={() => navigate('/ai/notifications')}
          style={{width:'100%',background:'rgba(59,130,246,0.12)',color:'#60a5fa',border:'1px solid rgba(59,130,246,0.25)',borderRadius:4,padding:'3px',fontSize:9,cursor:'pointer',fontWeight:600,marginTop:3}}>
          View All Alerts →
        </button>
        <div style={{borderTop:'1px solid #1e3a5f',marginTop:8,paddingTop:8}}>
          <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:5}}>
            <span>📡</span><span style={{fontSize:10,fontWeight:700,color:'#fff'}}>Connect GPS</span>
          </div>
          <button onClick={() => navigate('/ai/gps-tracking')}
            style={{width:'100%',background:'#1d4ed8',color:'#fff',border:'none',borderRadius:5,padding:'5px',fontSize:9,fontWeight:700,cursor:'pointer',marginBottom:4}}>
            ⚙️ Configure GPS
          </button>
          <button onClick={() => navigate('/ai/fleet-command-center')}
            style={{width:'100%',background:'transparent',color:'#60a5fa',border:'none',fontSize:9,cursor:'pointer',textAlign:'center'}}>
            Learn More →
          </button>
        </div>
      </div>

      {/* Fleet Status legend — bottom-left */}
      <div style={{...glass, bottom:10, left:10, padding:'8px 10px'}}>
        <div style={{fontSize:9,fontWeight:700,color:'#64748b',marginBottom:5,letterSpacing:'0.06em'}}>FLEET STATUS</div>
        {[['#22c55e','🚛','Running'],['#facc15','🚛','Idle'],['#ef4444','⚠️','Breakdown'],['#8b5cf6','🔧','Mainten.'],['#1d4ed8','🏭','Warehouse'],['#f97316','📍','Customer']].map(([c,ico,l]) => (
          <div key={l} style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
            <span style={{fontSize:9}}>{ico}</span>
            <div style={{width:9,height:9,background:c,borderRadius:2,flexShrink:0}} />
            <span style={{fontSize:9,color:'#94a3b8'}}>{l}</span>
          </div>
        ))}
      </div>

      {/* Vehicle detail panel — shown on marker click */}
      {sel && (
        <div style={{...glass, top:34, right:55, width:240, zIndex:1002}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:'#60a5fa'}}>{sel.id}</div>
              <div style={{fontSize:9,fontWeight:700,color:ST_CLR[sel.st]}}>{sel.st.toUpperCase()}{sel.st==='Moving'?` · ${sel.spd} km/h`:''}</div>
            </div>
            <button onClick={() => setSelIdx(null)} style={{background:'transparent',color:'#475569',border:'none',fontSize:14,cursor:'pointer',lineHeight:1}}>✕</button>
          </div>
          <div style={{borderTop:'1px solid #1e3a5f',paddingTop:7,display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 10px'}}>
            {[
              ['Driver',   sel.driver],
              ['Speed',    sel.spd > 0 ? sel.spd + ' km/h' : 'Stopped'],
              ['From',     GEO_CITIES[selRt.from].name],
              ['To',       GEO_CITIES[selRt.to].name],
              ['Trip',     selRt.label],
              ['Status',   sel.st],
              ['ETA',      selEta],
              ['Fuel',     sel.fuel + '%'],
              ['Load',     sel.load],
              ['Health',   sel.hlth],
              ['Engine',   sel.spd > 0 ? 'Running' : 'Off'],
              ['Updated',  'Just now'],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{fontSize:8,color:'#475569'}}>{k}</div>
                <div style={{fontSize:9,fontWeight:600,color:k==='Fuel'&&sel.fuel<30?'#ef4444':k==='Status'?ST_CLR[sel.st]:'#e2e8f0',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{borderTop:'1px solid #1e3a5f',marginTop:7,paddingTop:7,display:'flex',flexWrap:'wrap',gap:4}}>
            {[
              {l:'🗺️ Track',  fn:() => navigate('/ai/gps-tracking')},
              {l:'📋 Trip',   fn:() => navigate('/ai/fleet-command-center')},
              {l:'📞 Call',   fn:() => navigate('/ai/driver-management')},
              {l:'🧭 Nav',    fn:() => navigate('/entries/route-planning')},
              {l:'➕ Assign', fn:() => navigate('/entries/trip-settlement')},
            ].map(({l, fn}) => (
              <button key={l} onClick={fn}
                style={{background:'rgba(59,130,246,0.12)',color:'#60a5fa',border:'1px solid rgba(59,130,246,0.25)',borderRadius:4,padding:'3px 7px',fontSize:9,cursor:'pointer',fontWeight:600}}>
                {l}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, color, sub, onClick }) {
  return (
    <div onClick={onClick} style={{ background:'#111827', border:`1px solid #1e293b`, borderRadius:10, padding:'14px 16px', cursor:onClick?'pointer':'default', flex:1, minWidth:120, transition:'border-color 0.2s' }}
      onMouseEnter={e => { if(onClick) e.currentTarget.style.borderColor=color; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='#1e293b'; }}>
      <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:24, fontWeight:700, color }}>{value}</div>
      <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{sub}</div>}
    </div>
  );
}

export default function FleetCommand() {
  const navigate = useNavigate();
  const { branch } = useAuth();
  const [dash, setDash] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [nots, setNots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countdown, setCountdown] = useState(30);
  const timerRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const branchId = branch?._id || branch?.id;
      const [dRes, nRes, sRes] = await Promise.all([
        api.get('/ai/dashboard'),
        api.get('/ai/notifications'),
        api.get(`/shipments?branch_id=${branchId}&limit=100`),
      ]);
      setDash(dRes.data);
      setNots(nRes.data?.recent || []);
      setShipments(sRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [branch]);

  useEffect(() => {
    load();
    timerRef.current = setInterval(() => {
      setCountdown(c => { if (c <= 1) { load(); return 30; } return c - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [load]);

  const filtered = shipments.filter(s => {
    const q = search.toLowerCase();
    return (
      (statusFilter === 'all' || s.status === statusFilter) &&
      (!q || s.lr_number?.toLowerCase().includes(q) || s.destination?.toLowerCase().includes(q) || s.sender_name?.toLowerCase().includes(q))
    );
  });

  function exportCSV() {
    const hdr = ['LR No', 'Sender', 'Destination', 'Status', 'Amount', 'Date'];
    const rows = filtered.map(s => [s.lr_number, s.sender_name, s.destination, s.status, s.freight_amount, new Date(s.booking_date).toLocaleDateString('en-IN')]);
    const csv = [hdr, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' })); a.download='fleet-command.csv'; a.click();
  }

  const inTransit = shipments.filter(s => s.status === 'in_transit').length;
  const delivered  = shipments.filter(s => s.status === 'delivered').length;
  const booked     = shipments.filter(s => s.status === 'booked').length;
  const hold       = shipments.filter(s => s.status === 'hold' || s.status === 'lost').length;
  const delayed    = shipments.filter(s => s.status === 'in_transit' && new Date(s.booking_date) < new Date(Date.now() - 3*86400000)).length;

  const s = {
    page: { minHeight:'100vh', background:'#0a0e1a', color:'#f1f5f9', fontFamily:'Inter,system-ui,sans-serif', padding:20 },
    card: { background:'#111827', border:'1px solid #1e293b', borderRadius:12, padding:16 },
    btn: (bg='#3b82f6') => ({ background:bg, color:'#fff', border:'none', borderRadius:6, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }),
    btnGhost: { background:'transparent', color:'#94a3b8', border:'1px solid #1e293b', borderRadius:6, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer' },
    tag: (c) => ({ background:c+'22', color:c, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:4, textTransform:'uppercase' }),
    lbl: { fontSize:11, color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, marginBottom:8 },
  };

  if (loading) return (
    <div style={{ ...s.page, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14 }}>
      <div style={{ width:36, height:36, border:'3px solid #1e293b', borderTop:'3px solid #3b82f6', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ color:'#475569' }}>Loading Fleet Command Center…</span>
    </div>
  );

  return (
    <div style={s.page}>
      <style>{`@keyframes livepulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <h1 style={{ fontSize:22, fontWeight:700, margin:0 }}>🚛 Fleet Command Center</h1>
            <span style={{ background:'#10b98122', color:'#10b981', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:4, border:'1px solid #10b98144', animation:'livepulse 2s infinite' }}>LIVE</span>
          </div>
          <p style={{ color:'#475569', fontSize:12, margin:'4px 0 0' }}>Real-time fleet monitoring · Refresh in {countdown}s</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button style={s.btnGhost} onClick={() => navigate('/tracking/veh-current-status')}>📍 Vehicle Status</button>
          <button style={s.btnGhost} onClick={() => navigate('/entries/vehicle-in-out')}>🔑 Vehicle In/Out</button>
          <button style={s.btnGhost} onClick={() => navigate('/entries/trip-settlement')}>📋 Trip Settlement</button>
          <button style={s.btn()} onClick={load}>↻ Refresh</button>
          <button style={s.btn('#10b981')} onClick={exportCSV}>⬇ CSV</button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <KpiCard icon="🚛" label="In Transit" value={inTransit} color="#3b82f6" onClick={() => setStatusFilter('in_transit')} />
        <KpiCard icon="✅" label="Delivered" value={delivered} color="#10b981" onClick={() => setStatusFilter('delivered')} />
        <KpiCard icon="📦" label="Booked" value={booked} color="#f59e0b" onClick={() => setStatusFilter('booked')} />
        <KpiCard icon="⏰" label="Delayed >3 Days" value={delayed} color="#ef4444" sub="Needs attention" onClick={() => navigate('/ai/notifications')} />
        <KpiCard icon="🔴" label="Hold / Lost" value={hold} color="#ef4444" onClick={() => navigate('/entries/hold-lost-damage')} />
        <KpiCard icon="📄" label="Pending POD" value={dash?.pending_pod_count ?? 0} color="#8b5cf6" onClick={() => navigate('/entries/pod-upload')} />
        <KpiCard icon="⚡" label="E-Way Expiring" value={dash?.eway_expiry ?? 0} color="#f59e0b" onClick={() => navigate('/entries/eway-extend-import')} />
        <KpiCard icon="🔔" label="AI Alerts" value={nots.length} color={nots.length > 0 ? '#ef4444' : '#10b981'} onClick={() => navigate('/ai/notifications')} />
      </div>

      {/* 70-30 Split */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16, marginBottom:20 }}>
        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:8 }}>
            <h3 style={{ margin:0, fontSize:14, fontWeight:600 }}>Live Fleet Map — India Network</h3>
            <div style={{ display:'flex', gap:8 }}>
              <button style={s.btnGhost} onClick={() => navigate('/ai/gps-tracking')}>GPS Tracking</button>
              <button style={s.btnGhost} onClick={() => navigate('/ai/route-optimization')}>Route Opt.</button>
            </div>
          </div>
          <FleetMap activeCount={inTransit} nots={nots} />
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* Status breakdown */}
          <div style={s.card}>
            <div style={s.lbl}>Shipment Status</div>
            {[
              { label:'In Transit', value:inTransit, color:'#3b82f6' },
              { label:'Delivered', value:delivered, color:'#10b981' },
              { label:'Booked', value:booked, color:'#f59e0b' },
              { label:'Hold / Lost', value:hold, color:'#ef4444' },
            ].map(item => {
              const pct = shipments.length ? Math.round((item.value / shipments.length) * 100) : 0;
              return (
                <div key={item.label} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:12, color:'#94a3b8' }}>{item.label}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:item.color }}>{item.value}</span>
                  </div>
                  <div style={{ height:5, background:'#1e293b', borderRadius:3 }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:item.color, borderRadius:3, transition:'width 0.6s' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Alerts */}
          <div style={{ ...s.card, flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={s.lbl}>Active Alerts</div>
              <button style={{ background:'transparent', color:'#3b82f6', border:'none', fontSize:11, cursor:'pointer' }} onClick={() => navigate('/ai/notifications')}>View All →</button>
            </div>
            {nots.length === 0 ? (
              <div style={{ textAlign:'center', color:'#475569', fontSize:12, padding:'20px 0' }}>
                <div style={{ fontSize:24, marginBottom:6 }}>✅</div>All Clear
              </div>
            ) : nots.slice(0, 5).map((n, i) => (
              <div key={i} style={{ padding:'7px 0', borderBottom:'1px solid #0f172a' }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:11, fontWeight:700, color: n.priority === 'High' ? '#ef4444' : '#f59e0b' }}>{n.type}</span>
                  <span style={s.tag(n.priority === 'High' ? '#ef4444' : '#f59e0b')}>{n.priority}</span>
                </div>
                <div style={{ color:'#94a3b8', fontSize:11, marginTop:2 }}>{n.message}</div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={s.card}>
            <div style={s.lbl}>Quick Actions</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {[
                { l:'🗺️ Route Plan', p:'/entries/route-planning' },
                { l:'🔧 Maintenance', p:'/ai/fleet-maintenance' },
                { l:'⛽ Fuel Mon.', p:'/ai/fuel-monitoring' },
                { l:'👤 Drivers', p:'/ai/driver-management' },
                { l:'🏭 Warehouse', p:'/ai/warehouse' },
                { l:'🔄 Load Match', p:'/ai/load-matching' },
              ].map(a => (
                <button key={a.l} style={{ ...s.btnGhost, fontSize:11, padding:'6px 8px', textAlign:'left' }} onClick={() => navigate(a.p)}>{a.l}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Shipments Table */}
      <div style={s.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
          <h3 style={{ margin:0, fontSize:14, fontWeight:600 }}>Live Shipment Register <span style={{ color:'#475569', fontWeight:400 }}>({filtered.length})</span></h3>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search LR / city…"
              style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:6, padding:'6px 10px', color:'#f1f5f9', fontSize:12, width:200 }} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:6, padding:'6px 10px', color:'#f1f5f9', fontSize:12 }}>
              <option value="all">All Status</option>
              <option value="booked">Booked</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="hold">Hold</option>
              <option value="lost">Lost</option>
            </select>
            <button style={s.btn()} onClick={exportCSV}>⬇ Export CSV</button>
            <button style={s.btnGhost} onClick={() => navigate('/shipments')}>View All →</button>
          </div>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #1e293b' }}>
                {['LR Number','Sender','Destination','Status','Amount (₹)','Date','Actions'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'8px 10px', color:'#475569', fontWeight:600, fontSize:11, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:30, color:'#334155' }}>No shipments match your filter</td></tr>
              ) : filtered.slice(0, 25).map((sh, i) => {
                const sc = { in_transit:'#3b82f6', delivered:'#10b981', booked:'#f59e0b', hold:'#ef4444', lost:'#ef4444', returned:'#8b5cf6' }[sh.status] || '#64748b';
                return (
                  <tr key={i} style={{ borderBottom:'1px solid #0f172a', transition:'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='#1e293b30'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'8px 10px', color:'#60a5fa', fontWeight:700 }}>{sh.lr_number}</td>
                    <td style={{ padding:'8px 10px', color:'#94a3b8' }}>{sh.sender_name || '—'}</td>
                    <td style={{ padding:'8px 10px', color:'#e2e8f0' }}>{sh.destination || '—'}</td>
                    <td style={{ padding:'8px 10px' }}><span style={s.tag(sc)}>{sh.status}</span></td>
                    <td style={{ padding:'8px 10px', color:'#10b981', fontWeight:600 }}>₹{(sh.freight_amount||0).toLocaleString('en-IN')}</td>
                    <td style={{ padding:'8px 10px', color:'#475569' }}>{new Date(sh.booking_date).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding:'8px 10px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        <button style={{ ...s.btn(), padding:'3px 8px', fontSize:10 }} onClick={() => navigate(`/shipments/${sh._id}`)}>View</button>
                        <button style={{ ...s.btnGhost, padding:'3px 8px', fontSize:10 }} onClick={() => navigate(`/tracking/lr-tracking`)}>Track</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 25 && (
          <div style={{ textAlign:'center', marginTop:12, color:'#475569', fontSize:12 }}>
            Showing 25 of {filtered.length} · <button style={{ ...s.btn(), padding:'4px 10px', fontSize:11 }} onClick={() => navigate('/shipments')}>View All</button>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginTop:16 }}>
        <div style={s.card}>
          <h3 style={{ margin:'0 0 12px', fontSize:13, fontWeight:600 }}>Status Distribution</h3>
          {dash?.shipment_status?.some(x => x.value > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={dash.shipment_status} dataKey="value" cx="50%" cy="50%" outerRadius={65} label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''} labelLine={false} fontSize={9}>
                  {dash.shipment_status.map((e,i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background:'#1e293b', border:'none', color:'#f1f5f9', fontSize:11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign:'center', color:'#334155', padding:'50px 0', fontSize:12 }}>No data yet</div>
          )}
        </div>

        <div style={s.card}>
          <h3 style={{ margin:'0 0 12px', fontSize:13, fontWeight:600 }}>Revenue Trend</h3>
          {dash?.revenue_trend?.some(r => r.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={dash.revenue_trend.slice(-7)}>
                <defs>
                  <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fontSize:9, fill:'#475569' }} />
                <YAxis tick={{ fontSize:9, fill:'#475569' }} />
                <Tooltip contentStyle={{ background:'#1e293b', border:'none', color:'#f1f5f9', fontSize:11 }} formatter={v=>`₹${v.toLocaleString('en-IN')}`} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#fcGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign:'center', color:'#334155', padding:'50px 0', fontSize:12 }}>No revenue data yet</div>
          )}
        </div>

        <div style={s.card}>
          <h3 style={{ margin:'0 0 12px', fontSize:13, fontWeight:600 }}>Fleet Operations</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {[
              { icon:'🏠', label:'Vehicle Arrival (VAR)', desc:'Record arrivals', path:'/entries/vehicle-arrival' },
              { icon:'📊', label:'Trip Wise Profit', desc:'Profitability analysis', path:'/mis/profitability/trip-wise-profit' },
              { icon:'🛒', label:'Market Load Memo', desc:'Hire vehicle trips', path:'/entries/market-load-memo' },
              { icon:'📈', label:'Branch Performance', desc:'Multi-branch KPIs', path:'/mis/branch-performance' },
              { icon:'🔄', label:'Load Matching', desc:'Empty return loads', path:'/ai/load-matching' },
            ].map(a => (
              <button key={a.label} onClick={() => navigate(a.path)} style={{ display:'flex', alignItems:'center', gap:10, background:'#1e293b', border:'none', borderRadius:8, padding:'8px 12px', color:'#f1f5f9', cursor:'pointer', textAlign:'left', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background='#273548'}
                onMouseLeave={e => e.currentTarget.style.background='#1e293b'}>
                <span style={{ fontSize:16 }}>{a.icon}</span>
                <div><div style={{ fontSize:12, fontWeight:600 }}>{a.label}</div><div style={{ fontSize:10, color:'#475569' }}>{a.desc}</div></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
