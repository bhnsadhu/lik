// Identity picture with fallback: the cropped profile pic when set,
// otherwise the first card photo (covers accounts from before avatars).
export function avatarUrl(person) {
  return person?.profile_pic_url || person?.photos?.[0] || null
}

export function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)[1]
  const bytes = atob(data)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}
