import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import StepIndicator from '../components/StepIndicator';

const UIUC_MAJORS = [
  'Accountancy','Actuarial Science','Advertising','Aerospace Engineering',
  'African American Studies','Agricultural and Biological Engineering',
  'Agricultural and Consumer Economics',
  'Agricultural Leadership Education and Communications','Agronomy',
  'Animal Sciences','Anthropology','Architectural Studies','Art History',
  'Asian American Studies','Astronomy','Astrophysics','Atmospheric Sciences',
  'Biochemistry','Bioengineering','Brain and Cognitive Science','Business',
  'Chemical Engineering','Chemistry','Civil Engineering','Classics',
  'Communication','Community Health','Comparative and World Literature',
  'Computer Engineering','Computer Science','Computer Science and Advertising',
  'Computer Science and Economics','Computer Science and Astronomy',
  'Computer Science and Bioengineering','Computer Science and Chemistry',
  'Computer Science and Music','Computer Science and Physics',
  'Computer Science and Philosophy','Creative Writing','Crop Sciences','Dance',
  'Dietetics and Nutrition','Early Childhood Education',
  'Earth Society and Environmental Sustainability',
  'East Asian Languages and Cultures',
  'Econometrics and Quantitative Economics','Economics',
  'Electrical Engineering','Elementary Education','Engineering Mechanics',
  'Engineering Technology and Management','English','Environmental Engineering',
  'Environmental Sustainability','Finance','Food Science','French',
  "Gender and Women's Studies",
  'Geography and Geographic Information Science','Geology','Germanic Studies',
  'Global Studies','Graphic Design','History','Hospitality Management',
  'Human Development and Family Studies','Industrial Design',
  'Industrial Engineering','Information Sciences','Information Systems',
  'Innovation Leadership and Engineering Entrepreneurship',
  'Integrative Biology','Interdisciplinary Health Sciences','Italian',
  'Jazz Performance','Journalism','Kinesiology','Landscape Architecture',
  'Latin American Studies','Latina and Latino Studies',
  'Learning and Education Studies','Liberal Studies','Linguistics',
  'Management','Marketing','Materials Science and Engineering','Mathematics',
  'Mathematics and Computer Science','Mechanical Engineering','Media',
  'Media and Cinema Studies','Middle Grades Education',
  'Molecular and Cellular Biology','Music','Music Composition',
  'Music Education','Music Technology',
  'Natural Resources and Environmental Sciences','Neural Engineering',
  'Neuroscience','Nuclear Plasma and Radiological Engineering',
  'Nutrition and Health','Operations Management','Philosophy','Physics',
  'Plant Biotechnology','Political Science','Portuguese','Psychology',
  'Public Health','Recreation Sport and Tourism','Religion',
  'Russian East European and Eurasian Studies','Secondary Education',
  'Social Work','Sociology','Spanish','Special Education',
  'Speech and Hearing Science','Sports Media','Statistics',
  'Strategy Innovation and Entrepreneurship','Studio Art',
  'Supply Chain Management',
  'Sustainability in Food and Environmental Systems','Sustainable Design',
  'Systems Engineering and Design','Theatre','Urban Studies and Planning','Voice',
];

const YEARS = [
  'freshman','sophomore','junior','senior',
  'masters student','doctoral student','other',
];

const F = {
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 0,
  padding: '10px 0',
  fontFamily: "'Outfit', sans-serif",
  fontSize: 13,
  fontWeight: 300,
  color: 'white',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
};

const LBL = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 9,
  fontWeight: 300,
  color: 'rgba(255,255,255,0.28)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  marginBottom: 4,
  display: 'block',
};

const WRAP = { margin: '0 18px 16px' };

function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export default function BasicsSetup() {
  const { user, refreshProfile, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.state?.editMode === true;

  const [name, setName] = useState(profile?.name || '');
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '');
  const [ageError, setAgeError] = useState('');
  const [year, setYear] = useState(profile?.year || '');
  const [major, setMajor] = useState(profile?.major || '');
  const [majorSuggestions, setMajorSuggestions] = useState([]);
  const [showMajorDrop, setShowMajorDrop] = useState(false);
  const [bio, setBio] = useState(profile?.bio || '');
  const [profilePicDataUrl, setProfilePicDataUrl] = useState(profile?.profile_pic_url || null);
  const [rawPhotoDataUrl, setRawPhotoDataUrl] = useState(null);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [showCropModal, setShowCropModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cropContainerRef = useRef();
  const cropImgRef = useRef();
  const panStartRef = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const isDragging = useRef(false);

  // Major autocomplete
  const handleMajorChange = (val) => {
    setMajor(val);
    if (val.trim().length < 2) { setMajorSuggestions([]); setShowMajorDrop(false); return; }
    const lower = val.toLowerCase();
    const matches = UIUC_MAJORS.filter(m => m.toLowerCase().includes(lower)).slice(0, 8);
    setMajorSuggestions(matches);
    setShowMajorDrop(matches.length > 0);
  };

  const selectMajor = (m) => { setMajor(m); setMajorSuggestions([]); setShowMajorDrop(false); };

  const handleAgeBlur = () => {
    const n = parseInt(age, 10);
    if (age && (isNaN(n) || n < 16)) setAgeError('must be 16 or older');
    else setAgeError('');
  };

  // Profile pic file selection → read dataURL → open crop modal
  const handleCropFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setRawPhotoDataUrl(ev.target.result);
      setPanX(0);
      setPanY(0);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Pan handlers for crop area
  const startPan = (clientX, clientY) => {
    panStartRef.current = { x: clientX, y: clientY, px: panX, py: panY };
    isDragging.current = true;
  };
  const movePan = (clientX, clientY) => {
    if (!isDragging.current) return;
    setPanX(panStartRef.current.px + (clientX - panStartRef.current.x));
    setPanY(panStartRef.current.py + (clientY - panStartRef.current.y));
  };
  const endPan = () => { isDragging.current = false; };

  // Canvas crop
  const doCrop = () => {
    const c = cropContainerRef.current;
    const img = cropImgRef.current;
    if (!c || !img || !img.naturalWidth) return null;
    const cW = c.clientWidth, cH = c.clientHeight;
    const iW = img.naturalWidth, iH = img.naturalHeight;
    const scale = Math.max(cW / iW, cH / iH);
    const R = 110;
    const srcX = iW / 2 - (R + panX) / scale;
    const srcY = iH / 2 - (R + panY) / scale;
    const srcSize = (R * 2) / scale;
    const canvas = document.createElement('canvas');
    canvas.width = 220; canvas.height = 220;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(110, 110, 110, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, 220, 220);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const handleDone = () => {
    if (!rawPhotoDataUrl) { setShowCropModal(false); return; }
    const result = doCrop();
    if (result) setProfilePicDataUrl(result);
    setShowCropModal(false);
  };

  const ageNum = parseInt(age, 10);
  const canContinue = !!(
    name.trim() &&
    age && !isNaN(ageNum) && ageNum >= 16 &&
    year &&
    major.trim() &&
    profilePicDataUrl
  );

  const handleContinue = async () => {
    if (!canContinue || saving) return;
    setSaving(true);
    setError('');
    try {
      let picUrl = profilePicDataUrl;
      if (profilePicDataUrl?.startsWith('data:')) {
        const blob = dataUrlToBlob(profilePicDataUrl);
        const path = `${user.id}/profile_pic_${Date.now()}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from('photos').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
        if (uploadErr) { setError('upload failed · try again'); setSaving(false); return; }
        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path);
        picUrl = publicUrl;
      }
      const updates = {
        name: name.trim(), age: ageNum, year,
        major: major.trim(), bio: bio.trim() || null,
        profile_pic_url: picUrl,
        updated_at: new Date().toISOString(),
      };
      if (isEditMode) {
        await supabase.from('profiles').update(updates).eq('id', user.id);
        await refreshProfile();
        navigate('/profile');
      } else {
        await supabase.from('profiles').update({ ...updates, onboarding_step: 'housing' }).eq('id', user.id);
        await refreshProfile();
        // router routes step='housing' → /setup/housing
      }
    } catch {
      setError('something went wrong · try again');
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        .lk-input::placeholder { color: rgba(255,255,255,0.2); }
        .lk-select { -webkit-appearance: none; appearance: none; }
        .lk-select option { background: #131820; color: white; }
        .lk-major-opt:hover { color: white !important; }
      `}</style>

      <div style={{ minHeight: '100vh', overflowY: 'auto', background: '#0A0E12', paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ padding: '16px 18px 8px' }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: '#fff' }}>lik</span>
        </div>

        {!isEditMode && <StepIndicator currentStep={2} />}

        {/* Title + subhead */}
        <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#fff', padding: '0 18px 3px', margin: 0 }}>your profile</p>
        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.3)', padding: '0 18px 16px', margin: 0 }}>how you show up everywhere</p>

        {/* Profile pic */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 18px 18px' }}>
          <div style={{ position: 'relative', width: 72, height: 72 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#0d1820', border: '1.5px solid rgba(255,255,255,0.08)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profilePicDataUrl
                ? <img src={profilePicDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 22, fontWeight: 300 }}>+</span>
              }
            </div>
            {profilePicDataUrl
              ? <div onClick={() => setShowCropModal(true)} style={{ position: 'absolute', inset: 0, borderRadius: '50%', cursor: 'pointer' }} />
              : <input type="file" accept="image/*" onChange={handleCropFileSelect} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', borderRadius: '50%' }} />
            }
          </div>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 300, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>tap to set profile pic</span>
        </div>

        {/* Full name */}
        <div style={WRAP}>
          <span style={LBL}>full name</span>
          <input className="lk-input" style={F} type="text" value={name}
            onChange={e => setName(e.target.value)} placeholder="first and last name" maxLength={60} />
        </div>

        {/* Age + Year */}
        <div style={{ display: 'flex', gap: 24, margin: '0 18px 16px' }}>
          <div style={{ flex: 1 }}>
            <span style={LBL}>age</span>
            <input className="lk-input" style={F} type="number" value={age}
              onChange={e => setAge(e.target.value)} onBlur={handleAgeBlur}
              placeholder="16+" maxLength={2} min={16} max={99} />
            {ageError && <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 300, color: 'rgba(255,100,100,0.8)', display: 'block', marginTop: 3 }}>{ageError}</span>}
          </div>
          <div style={{ flex: 1 }}>
            <span style={LBL}>year</span>
            <div style={{ position: 'relative' }}>
              <select className="lk-select" style={{ ...F, cursor: 'pointer' }} value={year} onChange={e => setYear(e.target.value)}>
                <option value="" disabled>select</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: 10, pointerEvents: 'none' }}>▾</span>
            </div>
          </div>
        </div>

        {/* Major autocomplete */}
        <div style={{ ...WRAP, position: 'relative' }}>
          <span style={LBL}>major</span>
          <input className="lk-input" style={F} type="text" value={major}
            onChange={e => handleMajorChange(e.target.value)}
            onFocus={() => { if (major.trim().length >= 2 && majorSuggestions.length > 0) setShowMajorDrop(true); }}
            onBlur={() => setTimeout(() => setShowMajorDrop(false), 150)}
            placeholder="start typing your major..." />
          {showMajorDrop && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#131820', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, zIndex: 10, maxHeight: 160, overflowY: 'auto' }}>
              {majorSuggestions.map((m, i) => (
                <div key={m} className="lk-major-opt" onMouseDown={() => selectMajor(m)}
                  style={{ padding: '10px 14px', fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 300, color: i === 0 ? '#3DDCFF' : 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                  {m}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bio */}
        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 300, color: 'rgba(255,255,255,0.22)', margin: '0 18px 4px', padding: 0 }}>describe yourself as a roommate</p>
        <div style={WRAP}>
          <span style={LBL}>bio</span>
          <textarea className="lk-input" style={{ ...F, height: 80, resize: 'none' }}
            value={bio} onChange={e => setBio(e.target.value.slice(0, 150))}
            placeholder="early bird, clean, love cooking..." maxLength={150} />
          <span style={{ display: 'block', textAlign: 'right', fontFamily: "'Outfit', sans-serif", fontSize: 9, fontWeight: 300, color: 'rgba(255,255,255,0.18)', marginTop: 2 }}>{bio.length} / 150</span>
        </div>

        {error && <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 300, color: '#FF6B6B', textAlign: 'center', margin: '0 18px 8px' }}>{error}</p>}
      </div>

      {/* Sticky bottom bar — outside the scrollable div so it truly sticks */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0A0E12', padding: '12px 18px 28px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleContinue} style={{
          fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600,
          background: canContinue ? '#3DDCFF' : 'rgba(61,220,255,0.15)',
          color: canContinue ? '#0A0E12' : 'rgba(61,220,255,0.35)',
          borderRadius: 20, padding: '10px 22px', border: 'none',
          cursor: canContinue && !saving ? 'pointer' : 'default',
          pointerEvents: canContinue && !saving ? 'auto' : 'none',
        }}>
          {saving ? 'saving...' : isEditMode ? 'save changes' : 'next →'}
        </button>
      </div>

      {/* Crop modal */}
      {showCropModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#0A0E12', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', flexShrink: 0 }}>
            <span onClick={() => setShowCropModal(false)} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>cancel</span>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: '#fff' }}>set profile pic</span>
            <span onClick={handleDone} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: rawPhotoDataUrl ? '#3DDCFF' : 'rgba(61,220,255,0.3)', cursor: rawPhotoDataUrl ? 'pointer' : 'default' }}>done</span>
          </div>

          {rawPhotoDataUrl ? (
            <>
              {/* Crop area */}
              <div
                ref={cropContainerRef}
                style={{ margin: '0 18px', height: 'calc(100vh - 200px)', borderRadius: 12, overflow: 'hidden', position: 'relative', background: '#0d1820', cursor: 'grab', flexShrink: 0, touchAction: 'none' }}
                onTouchStart={e => startPan(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchMove={e => movePan(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchEnd={endPan}
                onMouseDown={e => startPan(e.clientX, e.clientY)}
                onMouseMove={e => movePan(e.clientX, e.clientY)}
                onMouseUp={endPan}
                onMouseLeave={endPan}
              >
                <img
                  ref={cropImgRef}
                  src={rawPhotoDataUrl}
                  alt=""
                  draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `calc(50% + ${panX}px) calc(50% + ${panY}px)`, display: 'block', pointerEvents: 'none', userSelect: 'none' }}
                />
                {/* Circular crop cutout via box-shadow */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 220, height: 220, borderRadius: '50%', border: '2px solid #3DDCFF', boxShadow: '0 0 0 2000px rgba(0,0,0,0.55)', zIndex: 2, pointerEvents: 'none' }} />
              </div>

              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 300, color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '10px 18px', margin: 0 }}>drag to reposition</p>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 300, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '4px 18px', margin: 0 }}>shown next to your name in chats and matches</p>

              {/* Change photo link */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 18px' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 300, color: '#3DDCFF' }}>change photo</span>
                  <input type="file" accept="image/*" onChange={handleCropFileSelect} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                </div>
              </div>
            </>
          ) : (
            /* No photo yet */
            <div style={{ margin: '0 18px', height: 'calc(100vh - 200px)', borderRadius: 12, background: '#0d1820', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none' }}>
                <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 40, fontWeight: 300, lineHeight: 1 }}>+</span>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.3)' }}>tap to select a photo</span>
              </div>
              <input type="file" accept="image/*" onChange={handleCropFileSelect} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', borderRadius: 12 }} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
