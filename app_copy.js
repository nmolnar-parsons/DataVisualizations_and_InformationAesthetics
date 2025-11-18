// Netflix Titles World Map - Production Countries
// Maps Netflix content by production country using TMDB API data


// Load GeoJSON and Netflix data
const geojson = await d3.json('Data/countries.geojson')
const moviesData = await d3.csv('Data/NetflixMovies_production_cleaned.csv')

console.log(`Loaded ${moviesData.length} movies`)

// --- Genre Filter UI ---
const GENRES = [
    "All", "Action", "Comedy", "Drama", "Romance",
    "Adventure", "Animation", "Documentary", "Horror"
]
let selectedGenres = new Set(GENRES.slice(1)) // All except "All" by default

function createGenreFilters() {
    let container = document.getElementById('genre-filters')
    if (!container) {
        container = document.createElement('div')
        container.id = 'genre-filters'
        container.style.position = 'absolute'
        container.style.top = '10px'
        container.style.right = '10px'
        container.style.zIndex = 1100
        container.style.background = 'rgba(255, 1, 1, 0.718)'
        container.style.padding = '0.5em 1em'
        container.style.borderRadius = '4px'
        container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
        container.style.display = 'flex'
        container.style.flexDirection = 'column'
        container.style.gap = '0.5em'
        document.body.appendChild(container)
    }
    container.innerHTML = `
        <div class="genre-label">Select Genre</div>
        ${GENRES.map(genre =>
            `<button class="genre-btn${selectedGenres.has(genre) || (genre === "All" && selectedGenres.size === 8) ? ' active' : ''}" data-genre="${genre}">${genre}</button>`
        ).join('')}
    `
    // Button click handler
    container.querySelectorAll('.genre-btn').forEach(btn => {
        btn.onclick = function() {
            const genre = btn.getAttribute('data-genre')
            if (genre === "All") {
                selectedGenres = new Set(GENRES.slice(1))
            } else {
                selectedGenres = new Set([genre])
            }
            createGenreFilters() // update button states
            renderMap()
        }
    })
}

// Add CSS for active/inactive genre buttons
if (!document.getElementById('genre-btn-style')) {
    const style = document.createElement('style')
    style.id = 'genre-btn-style'
    style.innerHTML = `
        #genre-filters .genre-btn {
            border: 1px solid #aaa;
            background: #f7f7f7;
            color: #333;
            border-radius: 4px;
            padding: 0.3em 0.8em;
            font-size: 1em;
            cursor: pointer;
            transition: background 0.15s, color 0.15s;
        }
        #genre-filters .genre-btn.active {
            background: #000;
            color: #fff;
            border-color: #000;
        }
    `
    document.head.appendChild(style)
}

createGenreFilters()

// Group movies by country and compute mean RuntimeMinutes
function groupByCountryFromCSV(data) {
    const map = new Map()
    data.forEach(item => {
        // Filter by selected genres
        const genres = (item.genres || '').split(',').map(g => g.trim())
        if (!genres.some(g => selectedGenres.has(g))) return

        let countries = []
        try {
            const arr = JSON.parse(item.productionCountries.replace(/'/g, '"'))
            if (Array.isArray(arr)) {
                countries = arr.map(obj => obj.name).filter(Boolean)
            }
        } catch (e) {
            const matches = [...(item.productionCountries || '').matchAll(/"name":\s*"([^"]+)"/g)]
            countries = matches.map(m => m[1])
        }
        countries.forEach(country => {
            if (!map.has(country)) map.set(country, [])
            map.get(country).push({
                title: item.searched || item.Title || item.name,
                runtime: Number(item.RuntimeMinutes) || 0
            })
        })
    })
    // Compute mean runtime for each country, only include if at least 5 movies
    const meanMap = new Map()
    for (const [country, movies] of map.entries()) {
        if (movies.length < 4) continue
        const runtimes = movies.map(m => m.runtime).filter(rt => rt > 0)
        const mean = runtimes.length ? d3.mean(runtimes) : 0
        meanMap.set(country, {
            meanRuntime: mean,
            movies: movies
        })
    }
    return meanMap
}

// Color scale: D3 interpolatePuOr (purple-orange), domain based on runtime
const colorScale = d3.scaleSequential()
    .domain([85, 130]) // Adjust domain as needed for runtime minutes
    .interpolator(d3.interpolateOrRd)
    .clamp(true)

// Initialize map
const map = L.map('map').setView([10, 30], 2)
// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '© OpenStreetMap contributors'
// }).addTo(map)

var CartoDB_DarkMatterNoLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 20
}).addTo(map)

let geoJsonLayer = null

function renderMap() {
    const dataByCountry = groupByCountryFromCSV(moviesData)
    console.log(`Movies: ${moviesData.length} titles, ${dataByCountry.size} countries`)
    if (geoJsonLayer) map.removeLayer(geoJsonLayer)
    
    geoJsonLayer = L.geoJSON(geojson, {
        style: function(feature) {
            const countryData = dataByCountry.get(feature.properties.ADMIN)
            const meanRuntime = countryData ? countryData.meanRuntime : 0
            return {
                fillColor: meanRuntime > 0 ? colorScale(meanRuntime) : '#f0f0f0',
                weight: 1,
                color: '#000000ff',
                fillOpacity: meanRuntime > 0 ? 0.7 : 0.3
            }
        },
        interactive: true,
        onEachFeature: function(feature, layer) {
            const countryData = dataByCountry.get(feature.properties.ADMIN)
            if (countryData && countryData.movies.length > 0) {
                const titles = countryData.movies
                // const list = titles.slice(0, 20).map(t => `<li>${t.title} (${t.runtime} min)</li>`).join('')
                const more = titles.length > 20 ? `<li><em>+${titles.length - 20} more</em></li>` : ''
                const tooltipContent = `
                    <h3>${feature.properties.ADMIN}</h3>
                    <div class="count" style="font-size:1.2em; color:#000;">${titles.length} title${titles.length !== 1 ? 's' : ''}</div>
                    <div class="mean-runtime" style="font-size:1em; color:#000;">Mean runtime: ${countryData.meanRuntime ? countryData.meanRuntime.toFixed(1) : 'N/A'} min</div>
                `
                layer.bindTooltip(tooltipContent, { sticky: true })
                layer.on('mouseover', function() { this.openTooltip() })
                layer.on('mouseout', function() { this.closeTooltip() })
            }
            // Log the fill color when the country is clicked
            layer.on('click', function(e) {
                const style = layer.options
                console.log('Country color:', style.fillColor)
            })
        }
    }).addTo(map)
}

renderMap()

