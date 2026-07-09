// Absolute origin for links that leave the app (invite links). Inside the
// native shell window.location.origin is capacitor://localhost, which no
// one else can open - outbound links must point at the public site.
export const SHARE_ORIGIN = /^https?:$/.test(window.location.protocol)
  ? window.location.origin
  : 'https://getlik.com'
