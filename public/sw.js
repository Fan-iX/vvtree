// A service worker for caching assets defined in the manifest file.
const CACHE_NAME = 'font-assets'
const ASSET_MANIFESTS = ['/assets/fonts.manifest.json']
const ASSETS_BASE = '/assets/'

self.addEventListener('install', event => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

async function updateCache() {
    const cache = await caches.open(CACHE_NAME)
    for (const manifest of ASSET_MANIFESTS) {
        const response = await fetch(`${manifest}?t=${Date.now()}`)
        const { version, files } = await response.json()
        if (await cache.match(`${manifest}?version`)?.then?.(r => r?.text?.()) === version)
            return
        for (const { path, hash } of files) {
            const cachedResponse = await cache.match(`${ASSETS_BASE}${path}`)
            if (cachedResponse?.headers?.get?.('X-File-Hash') === hash) continue
            const resp = await fetch(`${ASSETS_BASE}${path}`)
            if (!resp.ok) continue
            const headers = new Headers(resp.headers)
            headers.append('X-File-Hash', hash)
            await cache.put(`${ASSETS_BASE}${path}`, new Response(resp.body, { status: resp.status, headers }))
        }
        await cache.put(`${manifest}?version`, new Response(new Blob([version])))
    }
}

self.addEventListener('message', (event) => {
    if (event.data === 'START_CACHE') updateCache()
})

self.addEventListener('fetch', (event) => {
    if (new URL(event.request.url).pathname.startsWith(ASSETS_BASE))
        event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)))
})
