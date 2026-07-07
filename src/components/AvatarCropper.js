import { useRef, useState } from 'react'

const RING = 110 // on-screen crop circle radius
const OUT = 320 // exported square size

function getPinchDist(touches) {
  const dx = touches[1].clientX - touches[0].clientX
  const dy = touches[1].clientY - touches[0].clientY
  return Math.hypot(dx, dy)
}

// Full-screen circular avatar cropper, ported from the earlier lik build:
// pick a photo, drag to reposition, pinch or scroll to zoom, confirm to get
// a square jpeg data url cropped to the ring.
export default function AvatarCropper({ onDone, onClose }) {
  const [raw, setRaw] = useState(null)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [scale, setScale] = useState(1)

  const boxRef = useRef(null)
  const imgRef = useRef(null)
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 })
  const pinch = useRef({ dist: 0, scale: 1 })
  const dragging = useRef(false)

  function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setRaw(ev.target.result)
      setPanX(0)
      setPanY(0)
      setScale(1)
    }
    reader.readAsDataURL(file)
  }

  function onTouchStart(e) {
    if (e.touches.length === 1) {
      panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, px: panX, py: panY }
      dragging.current = true
    } else if (e.touches.length === 2) {
      dragging.current = false
      pinch.current = { dist: getPinchDist(e.touches), scale }
    }
  }

  function onTouchMove(e) {
    if (e.touches.length === 1 && dragging.current) {
      setPanX(panStart.current.px + (e.touches[0].clientX - panStart.current.x))
      setPanY(panStart.current.py + (e.touches[0].clientY - panStart.current.y))
    } else if (e.touches.length === 2) {
      const d = getPinchDist(e.touches)
      setScale(Math.min(3, Math.max(0.5, pinch.current.scale * (d / pinch.current.dist))))
    }
  }

  function onMouseDown(e) {
    panStart.current = { x: e.clientX, y: e.clientY, px: panX, py: panY }
    dragging.current = true
  }

  function onMouseMove(e) {
    if (!dragging.current) return
    setPanX(panStart.current.px + (e.clientX - panStart.current.x))
    setPanY(panStart.current.py + (e.clientY - panStart.current.y))
  }

  function endDrag() {
    dragging.current = false
  }

  function onWheel(e) {
    setScale((s) => Math.min(3, Math.max(0.5, s * (e.deltaY < 0 ? 1.06 : 0.94))))
  }

  function crop() {
    const box = boxRef.current
    const img = imgRef.current
    if (!box || !img || !img.naturalWidth) return null
    const cW = box.clientWidth
    const cH = box.clientHeight
    const iW = img.naturalWidth
    const iH = img.naturalHeight
    const baseScale = Math.max(cW / iW, cH / iH)
    const total = baseScale * scale
    const srcX = iW / 2 - (RING + panX) / total
    const srcY = iH / 2 - (RING + panY) / total
    const srcSize = (RING * 2) / total
    const canvas = document.createElement('canvas')
    canvas.width = OUT
    canvas.height = OUT
    const ctx = canvas.getContext('2d')
    // export the full square and let css round it: a circle-clipped jpeg
    // would bake opaque corners into the file
    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUT, OUT)
    return canvas.toDataURL('image/jpeg', 0.86)
  }

  function confirm() {
    if (!raw) return
    const result = crop()
    if (result) onDone(result)
  }

  return (
    <div className="cropper">
      <div className="cropper__bar">
        <button className="btn-text" style={{ margin: 0 }} onClick={onClose}>Cancel</button>
        <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16 }}>Your profile pic</span>
        <button
          className="btn-text"
          style={{ margin: 0, color: raw ? 'var(--volt)' : 'var(--ink-3)', fontWeight: 700 }}
          disabled={!raw}
          onClick={confirm}
        >
          Done
        </button>
      </div>

      {raw ? (
        <>
          <div
            ref={boxRef}
            className="cropper__stage"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={endDrag}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            onWheel={onWheel}
          >
            <img
              ref={imgRef}
              src={raw}
              alt=""
              draggable={false}
              style={{ transform: `translate(${panX}px, ${panY}px) scale(${scale})` }}
            />
            <div className="cropper__ring" />
          </div>
          <p className="cropper__hint">Drag to reposition · Pinch or scroll to zoom</p>
          <p className="cropper__hint">Shows next to your name in liks and chats</p>
          <label className="cropper__swap">
            Change photo
            <input type="file" accept="image/*" hidden onChange={onFile} />
          </label>
        </>
      ) : (
        <label className="cropper__stage cropper__stage--empty">
          <span style={{ fontSize: 40, fontWeight: 300, lineHeight: 1 }}>+</span>
          <span style={{ fontSize: 14 }}>Tap to pick a photo</span>
          <input type="file" accept="image/*" hidden onChange={onFile} />
        </label>
      )}
    </div>
  )
}
