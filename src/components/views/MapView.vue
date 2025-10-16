<template>
  <div class="e2-wrapper">
    <div class="toolbar">
      <div class="row">
        <label class="sr-only" for="cat">Category</label>
        <select id="cat" v-model="category" @change="onCategoryChange" aria-label="Select category">
          <option value="hospital">Hospital</option>
          <option value="police">Police</option>
        </select>

        <label class="sr-only" for="profile">Travel mode</label>
        <select id="profile" v-model="profile" @change="recalcRouteIfAny" aria-label="Select travel mode">
          <option value="mapbox/driving">Driving</option>
          <option value="mapbox/walking">Walking</option>
          <option value="mapbox/cycling">Cycling</option>
        </select>

        <button :disabled="loadingPlaces" @click="searchNearby">
          {{ loadingPlaces ? 'Searching' : `Search nearby ${category === 'hospital' ? 'hospitals' : 'police stations'}` }}
        </button>
        <button :disabled="!routeOnMap" @click="clearRoute">Clear route</button>
      </div>
      <div class="status" role="status">{{ status }}</div>
    </div>

    <div class="content">
      <div ref="mapEl" id="map" aria-label="Map" />
      <aside class="panel" aria-label="Results list">
        <div v-for="(p, idx) in places" :key="p.id || idx" class="card" @click="focusPlace(p)" :aria-label="`Place ${p.text || p.place_name}`" tabindex="0">
          <div class="title">
            <span class="badge">{{ idx + 1 }}</span>
            <strong>{{ p.text || p.place_name }}</strong>
          </div>
          <div class="sub">{{ p.place_name }}</div>
          <div class="actions">
            <button @click.stop="navigateTo(p)">Navigate</button>
            <button @click.stop="centerOn(p)">Focus</button>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, reactive } from 'vue'
import mapboxgl from 'mapbox-gl'


const URLS = {
  places: 'https://australia-southeast1-<project-id>.cloudfunctions.net/mbPlaces',
  route:   'https://australia-southeast1-<project-id>.cloudfunctions.net/mbRoute'
}

const props = defineProps({
  mapToken: { type: String, default: '' },  
  center: { type: Array, default: () => [144.9631, -37.8136] }, 
})

if (props.mapToken) {
  mapboxgl.accessToken = props.mapToken
}

const mapEl = ref(null)
let map
let userMarker
let poiMarkers = []

const category = ref('hospital')
const profile = ref('mapbox/driving')
const status = ref('')
const loadingPlaces = ref(false)

const places = reactive([]) 
const myLngLat = ref(null) 
const routeOnMap = ref(false)

onMounted(async () => {
  map = new mapboxgl.Map({
    container: mapEl.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: props.center,
    zoom: 12,
  })

  map.addControl(new mapboxgl.NavigationControl(), 'top-left')
  const geo = new mapboxgl.GeolocateControl({ trackUserLocation: true, positionOptions: { enableHighAccuracy: true }})
  map.addControl(geo, 'top-left')

  map.on('load', () => {
    geo.trigger()

    map.addSource('route-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
    map.addLayer({ id: 'route-line', type: 'line', source: 'route-source', paint: { 'line-width': 5, 'line-color': '#3b82f6' } })
  })

  geo.on('geolocate', (e) => {
    myLngLat.value = [e.coords.longitude, e.coords.latitude]
    drawUser()
  })
})

onBeforeUnmount(() => { if (map) map.remove() })

function drawUser () {
  if (!myLngLat.value || !map) return
  if (!userMarker) userMarker = new mapboxgl.Marker({ color: '#10b981' })
  userMarker.setLngLat(myLngLat.value).addTo(map)
}

async function api(fullUrl, params = {}) {
  const url = new URL(fullUrl)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const r = await fetch(url)
  if (!r.ok) throw new Error(`API ${url.pathname} failed: ${r.status}`)
  return r.json()
} 

async function searchNearby () {
  loadingPlaces.value = true
  status.value = 'Searching'
  try {
    const center = myLngLat.value || map.getCenter().toArray()
    const data = await api(URLS.places, { q: category.value, center: `${center[0]},${center[1]}`, limit: 20 })

    poiMarkers.forEach(m => m.remove()); poiMarkers = []
    places.splice(0, places.length)

    const feats = (data.features || []).map(f => ({ ...f }))
    feats.forEach((f, idx) => {
      const [lng, lat] = f.center
      f.id = f.id || `${category.value}-${idx}-${lng}-${lat}`
      const m = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map)
      m.getElement().addEventListener('click', () => focusPlace(f))
      poiMarkers.push(m)
      places.push(f)
    })

    if (feats.length) fitToPoints(feats.map(f => f.center))
    status.value = `Found ${feats.length} ` + (category.value === 'hospital' ? 'hospitals' : 'police stations')
  } catch (e) {
    console.error(e)
    status.value = 'Search failed'
  } finally { loadingPlaces.value = false }
}

function fitToPoints(points) {
  let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity
  points.forEach(([x,y]) => { minX=Math.min(minX,x); minY=Math.min(minY,y); maxX=Math.max(maxX,x); maxY=Math.max(maxY,y) })
  if (isFinite(minX) && isFinite(minY)) map.fitBounds([[minX,minY],[maxX,maxY]], { padding: 60, duration: 600 })
}

function onCategoryChange(){ searchNearby() }
function centerOn (f) { map.flyTo({ center: f.center, zoom: 15 }) }
function focusPlace (f) { centerOn(f) }

async function navigateTo (f) {
  try {
    const origin = myLngLat.value || map.getCenter().toArray()
    const dest = f.center
    const data = await api(URLS.route, { origin: `${origin[0]},${origin[1]}`, dest: `${dest[0]},${dest[1]}`, profile: profile.value })

    const route = data.routes && data.routes[0]
    if (!route) { status.value = 'No route found'; return }

    const fc = { type: 'FeatureCollection', features: [ { type: 'Feature', properties: {}, geometry: route.geometry } ]}
    map.getSource('route-source').setData(fc)
    routeOnMap.value = true

    const mins = route.duration / 60
    status.value = `Route: approx ${formatKm(route.distance)} · ${formatMins(mins)}`

    fitToPoints(route.geometry.coordinates)
  } catch (e) {
    console.error(e)
    status.value = 'Navigation failed'
  }
}

function clearRoute () {
  if (map?.getSource('route-source')) map.getSource('route-source').setData({ type:'FeatureCollection', features: [] })
  routeOnMap.value = false
  status.value = ''
}

function formatMins (mins) {
  if (!isFinite(mins)) return ''
  if (mins < 60) return `${Math.round(mins)} min`
  const h = Math.floor(mins/60), m = Math.round(mins%60)
  return `${h} h ${m} min`
}
function formatKm (meters) {
  if (!isFinite(meters)) return ''
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters/1000).toFixed(1)} km`
}

function recalcRouteIfAny(){ if (!routeOnMap.value) return; clearRoute() }
</script>
