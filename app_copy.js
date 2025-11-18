// Netflix Titles World Map - Production Countries
// Maps Netflix content by production country using TMDB API data


// Load GeoJSON and Netflix data
const geojson = await d3.json('Data/countries.geojson')
const moviesData = await d3.csv('Data/NetflixMovies_production_cleaned.csv')

console.log(`Loaded ${moviesData.length} movies`)

// Group movies by country and compute mean RuntimeMinutes
function groupByCountryFromCSV(data) {
    const map = new Map()
    data.forEach(item => {
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
                title: item.searched || item.Title || item.name, // Use "searched" column
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
const map = L.map('map').setView([20, 0], 2)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
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
                color: '#666',
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
        }
    }).addTo(map)
}

renderMap()

