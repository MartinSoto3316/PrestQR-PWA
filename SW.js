const cacheName="prestqrweb-v5";
const staticassets=[
    "./",
    "./pinguino del linux.png",
    "./index.html",
    "./manifest.webmanifest",
    "./app.css",
    "./app.js"
];

self.addEventListener("install", async e=>{
    const cache=await caches.open(cacheName);
    await cache.addAll(staticassets);
    return self.skipWaiting();
});

self.addEventListener("activate", async e => {
    // Borra las cachés de versiones anteriores.
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== cacheName).map(key => caches.delete(key)));
    self.clients.claim();
});

self.addEventListener("fetch", e => {
    const req=e.request;
    const url=new URL(req.url);
    if(url.origin==location.origin){
        e.respondWith(cacheFirst(req));
    }
    else{
        e.respondWith(networkAndCache(req));
    }
});

async function cacheFirst(req){
    const cache = await caches.open(cacheName);
    const cached = await cache.match(req);
    return cached || fetch(req);
}

async function networkAndCache(req){
    const cache = await caches.open(cacheName);
    try{
        const fresh = await fetch(req);
        await cache.put(req, fresh.clone());
        return fresh;
    }
    catch(e){
        const cached = await cache.match(req);
        return cached;
    }
}