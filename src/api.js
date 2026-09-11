let objectId = '';
export function selectObject(id) { objectId = id; }
export async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers); headers.set('X-EmotionChat','1');
  const response = await window.fetch(url.replace('/api/', `/api/objects/${encodeURIComponent(objectId)}/`), {...options,headers});
  if (response.status === 401) window.dispatchEvent(new Event('emotion-locked'));
  return response;
}
