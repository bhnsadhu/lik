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

function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function getPinchDist(touches) {
  const dx = touches[1].clientX - touches[0].clientX;
  const dy = touches[1].clientY - touches[0].clientY;
  return Math.hypot(dx, dy);
}

export default function BasicsSetup() {
  const { user, refreshProfile, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.state?.editMode === true;

  const [name, setName] = useState(profile?.name || '');
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '');
  const [ageError, setAgeError] = useState(false);
  const [year, setYear] = useState(profile?.year || '');
  const [major, setMajor] = useState(profile?.major || '');
  const [showMajorDropdown, setShowMajorDropdown] = useState(false);
  const [bio, setBio] = useState(profile?.bio || '');
  const [profilePicDataUrl, setProfilePicDataUrl] = useState(profile?.profile_pic_url || null);
  const [rawPhotoDataUrl, setRawPhotoDataUrl] = useState(null);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [scale, setScale] = useState(1);
  const [showCropModal, setShowCropModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cropContainerRef = useRef();
  const cropImgRef = useRef();
  const panStartRef = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const pinchRef = useRef({ dist: 0, scale: 1 });
  const isDragging = useRef(false);

  const filteredMajors = major.trim().length >= 1
    ? UIUC_MAJORS.filter(m => m.toLowerCase().includes(major.toLowerCase()))
    : [];

  const handleCropFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setRawPhotoDataUrl(ev.target.result);
      setPanX(0); setPanY(0); setScale(1);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropTouchStart = (e) => {
    if (e.touches.length === 1) {
      panStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, px: panX, py: panY };
      isDragging.current = true;
    } else if (e.touches.length === 2) {
      isDragging.current = false;
      pinchRef.current = { dist: getPinchDist(e.touches), scale };
    }
  };

  const handleCropTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging.current) {
      setPanX(panStartRef.current.px + (e.touches[0].clientX - panStartRef.current.x));
      setPanY(panStartRef.current.py + (e.touches[0].clientY - panStartRef.current.y));
    } else if (e.touches.length === 2) {
      const newDist = getPinchDist(e.touches);
      setScale(Math.min(3, Math.max(0.5, pinchRef.current.scale * (newDist / pinchRef.current.dist))));
    }
  };

  const handleCropTouchEnd = () => { isDragging.current = false; };

  const startMousePan = (e) => {
    panStartRef.current = { x: e.clientX, y: e.clientY, px: panX, py: panY };
    isDragging.current = true;
  };
  const moveMousePan = (e) => {
    if (!isDragging.current) return;
    setPanX(panStartRef.current.px + (e.clientX - panStartRef.current.x));
    setPanY(panStartRef.current.py + (e.clientY - panStartRef.current.y));
  };
  const endMousePan = () => { isDragging.current = false; };

  const doCrop = () => {
    const c = cropContainerRef.current;
    const img = cropImgRef.current;
    if (!c || !img || !img.naturalWidth) return null;
    const cW = c.clientWidth, cH = c.clientHeight;
    const iW = img.naturalWidth, iH = img.naturalHeight;
    const baseScale = Math.max(cW / iW, cH / iH);
    const totalScale = baseScale * scale;
    const R = 110;
    const srcX = iW / 2 - (R + panX) / totalScale;
    const srcY = iH / 2 - (R + panY) / totalScale;
    const srcSize = (R * 2) / totalScale;
    const canvas = document.createElement('canvas');
    canvas.width = 220; canvas.height = 220;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(110, 110, 110, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, 220, 220);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const openCropModal = () => setShowCropModal(true);

  const handleDone = () => {
    if (!rawPhotoDataUrl) { setShowCropModal(false); return; }
    const result = doCrop();
    if (result) setProfilePicDataUrl(result);
    setShowCropModal(false);
  };

  const ageNum = parseInt(age, 10);
  const ageValid = age.length === 2 && !isNaN(ageNum) && ageNum >= 16 && !ageError;
  const canContinue = !!(name.trim() && ageValid && year && major.trim() && profilePicDataUrl && bio.trim());

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
      }
    } catch {
      setError('something went wrong · try again');
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`.lk-input::placeholder { color: rgba(255,255,255,0.18); }`}</style>

      <div style={{ minHeight: '100vh', background: '#0A0E12' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 8px' }}>
          <span onClick={() => navigate('/setup/photos')} style={{ fontSize: '18px', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontWeight: 300, padding: '8px', margin: '-8px' }}>←</span>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#fff' }}>lik</span>
          <span style={{ width: '24px' }} />
        </div>

        {!isEditMode && <StepIndicator currentStep={2} onStepClick={(route) => navigate(route)} />}

        <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#fff', padding: '0 18px 12px', margin: 0 }}>your profile</p>

        {/* Cards */}
        <div style={{ padding: '0 14px' }}>

          {/* Profile pic card */}
          <div
            style={{ background: '#0d1117', borderRadius: '12px', padding: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', position: 'relative' }}
            onClick={openCropModal}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#131820', border: '1.5px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              {profilePicDataUrl
                ? <img src={profilePicDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '16px' }}>+</span>
              }
            </div>
            <div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontWeight: 300, marginBottom: '3px', fontFamily: "'Outfit', sans-serif" }}>profile pic</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', fontWeight: 300, fontFamily: "'Outfit', sans-serif" }}>{profilePicDataUrl ? 'tap to change' : 'tap to set'}</div>
            </div>
          </div>

          {/* Name card */}
          <div style={{ background: '#0d1117', borderRadius: '12px', padding: '12px', marginBottom: '8px' }}>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontWeight: 300, marginBottom: '3px', fontFamily: "'Outfit', sans-serif" }}>name</div>
            <input
              className="lk-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="first and last name"
              maxLength={60}
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '12px', color: '#fff', fontWeight: 300, fontFamily: "'Outfit', sans-serif", padding: 0, boxSizing: 'border-box' }}
            />
          </div>

          {/* Age + year cards */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <div style={{ flex: 1, background: '#0d1117', borderRadius: '12px', padding: '12px' }}>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontWeight: 300, marginBottom: '3px', fontFamily: "'Outfit', sans-serif" }}>age</div>
              <input
                className="lk-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={age}
                onChange={e => setAge(e.target.value.replace(/\D/g, '').slice(0, 2))}
                placeholder="16+"
                maxLength={2}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '12px', color: ageError ? 'rgba(255,80,80,0.8)' : '#fff', fontWeight: 300, fontFamily: "'Outfit', sans-serif", padding: 0 }}
                onBlur={() => {
                  if (!age) { setAgeError(false); return; }
                  if (age.length !== 2 || parseInt(age, 10) < 16) setAgeError(true);
                  else setAgeError(false);
                }}
              />
              {ageError && <div style={{ fontSize: '9px', color: 'rgba(255,80,80,0.7)', marginTop: '3px', fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}>must be 2 digits, 16 or older</div>}
            </div>
            <div style={{ flex: 1, background: '#0d1117', borderRadius: '12px', padding: '12px', position: 'relative' }}>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontWeight: 300, marginBottom: '3px', fontFamily: "'Outfit', sans-serif" }}>year</div>
              <select
                value={year}
                onChange={e => setYear(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '12px', color: year ? '#fff' : 'rgba(255,255,255,0.2)', fontWeight: 300, fontFamily: "'Outfit', sans-serif", padding: 0, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}
              >
                <option value="" disabled style={{ background: '#131820' }}>select</option>
                <option value="freshman" style={{ background: '#131820' }}>freshman</option>
                <option value="sophomore" style={{ background: '#131820' }}>sophomore</option>
                <option value="junior" style={{ background: '#131820' }}>junior</option>
                <option value="senior" style={{ background: '#131820' }}>senior</option>
                <option value="masters student" style={{ background: '#131820' }}>masters student</option>
                <option value="doctoral student" style={{ background: '#131820' }}>doctoral student</option>
                <option value="other" style={{ background: '#131820' }}>other</option>
              </select>
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '10px', pointerEvents: 'none' }}>▾</span>
            </div>
          </div>

          {/* Major card with autocomplete */}
          <div style={{ background: '#0d1117', borderRadius: '12px', padding: '12px', marginBottom: '8px', position: 'relative' }}>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontWeight: 300, marginBottom: '3px', fontFamily: "'Outfit', sans-serif" }}>major</div>
            <input
              className="lk-input"
              value={major}
              onChange={e => { setMajor(e.target.value); setShowMajorDropdown(true); }}
              onBlur={() => setTimeout(() => setShowMajorDropdown(false), 150)}
              placeholder="start typing your major..."
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '12px', color: '#fff', fontWeight: 300, fontFamily: "'Outfit', sans-serif", padding: 0 }}
            />
            {showMajorDropdown && major && filteredMajors.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#131820', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', zIndex: 10, maxHeight: '160px', overflowY: 'auto', marginTop: '4px' }}>
                {filteredMajors.slice(0, 6).map((m, i) => (
                  <div
                    key={i}
                    onMouseDown={() => { setMajor(m); setShowMajorDropdown(false); }}
                    style={{ padding: '10px 14px', fontSize: '11px', color: i === 0 ? '#3DDCFF' : 'rgba(255,255,255,0.5)', fontWeight: 300, fontFamily: "'Outfit', sans-serif", borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                  >{m}</div>
                ))}
              </div>
            )}
          </div>

          {/* Bio card */}
          <div style={{ background: '#0d1117', borderRadius: '12px', padding: '12px', marginBottom: '8px' }}>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontWeight: 300, marginBottom: '3px', fontFamily: "'Outfit', sans-serif" }}>bio</div>
            <textarea
              className="lk-input"
              value={bio}
              onChange={e => {
                setBio(e.target.value.slice(0, 150));
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              placeholder="night owl, keeps things clean, loves to cook"
              rows={1}
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: '12px', color: '#fff', fontWeight: 300, fontFamily: "'Outfit', sans-serif", padding: 0, boxSizing: 'border-box', overflow: 'hidden', lineHeight: '1.5' }}
            />
            <div style={{ textAlign: 'right', fontSize: '8px', color: 'rgba(255,255,255,0.15)', marginTop: '4px', fontFamily: "'Outfit', sans-serif" }}>{bio.length} / 150</div>
          </div>

          {error && <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 300, color: '#FF6B6B', textAlign: 'center', margin: '0 0 8px' }}>{error}</p>}
        </div>

        {/* Sticky bottom bar */}
        <div style={{ position: 'sticky', bottom: 0, background: '#0A0E12', padding: '12px 18px 28px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            style={{
              background: canContinue ? '#3DDCFF' : 'rgba(61,220,255,0.12)',
              color: canContinue ? '#0A0E12' : 'rgba(61,220,255,0.3)',
              fontFamily: "'Outfit', sans-serif",
              fontSize: '12px',
              fontWeight: 600,
              padding: '9px 20px',
              borderRadius: '20px',
              border: 'none',
              cursor: canContinue && !saving ? 'pointer' : 'not-allowed',
            }}
          >{saving ? 'saving...' : isEditMode ? 'save changes' : 'next →'}</button>
        </div>
      </div>

      {/* Crop modal */}
      {showCropModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#0A0E12', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', flexShrink: 0 }}>
            <span onClick={() => setShowCropModal(false)} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>cancel</span>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: '#fff' }}>set profile pic</span>
            <span onClick={handleDone} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: rawPhotoDataUrl ? '#3DDCFF' : 'rgba(61,220,255,0.3)', cursor: rawPhotoDataUrl ? 'pointer' : 'default' }}>done</span>
          </div>

          {rawPhotoDataUrl ? (
            <>
              <div
                ref={cropContainerRef}
                style={{ margin: '0 18px', height: 'calc(100vh - 200px)', borderRadius: 12, overflow: 'hidden', position: 'relative', background: '#0d1820', cursor: 'grab', flexShrink: 0, touchAction: 'none' }}
                onTouchStart={handleCropTouchStart}
                onTouchMove={handleCropTouchMove}
                onTouchEnd={handleCropTouchEnd}
                onMouseDown={startMousePan}
                onMouseMove={moveMousePan}
                onMouseUp={endMousePan}
                onMouseLeave={endMousePan}
              >
                <img
                  ref={cropImgRef}
                  src={rawPhotoDataUrl}
                  alt=""
                  draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none', userSelect: 'none', transform: `translate(${panX}px, ${panY}px) scale(${scale})`, transformOrigin: 'center center' }}
                />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 220, height: 220, borderRadius: '50%', border: '2px solid #3DDCFF', boxShadow: '0 0 0 2000px rgba(0,0,0,0.55)', zIndex: 2, pointerEvents: 'none' }} />
              </div>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 300, color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '10px 18px', margin: 0 }}>drag to reposition · pinch to zoom</p>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 300, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '4px 18px', margin: 0 }}>shown next to your name in chats and matches</p>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 18px' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 300, color: '#3DDCFF' }}>change photo</span>
                  <input type="file" accept="image/*" onChange={handleCropFileSelect} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                </div>
              </div>
            </>
          ) : (
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
