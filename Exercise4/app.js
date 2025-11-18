// Requires your access token
// Remove dotenv and process.env usage
// const API_KEY = process.env.MAPBOX_ACCESS_TOKEN
// Use Vite's import.meta.env to access the API key
const API_KEY = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

if (!API_KEY) {
  console.warn('Mapbox API key is missing! Check your .env file and Vite config.')
}


let objects

// Loading geo.json features with dedicated d3 method        
d3.json('africa.geo.json')
  .then((geojson) => {
    // Asynchronous JavaScript waiting for data promise to complete before moving on to .then() 
    if (geojson.features) {
      console.log('Number of features:', geojson.features.length)
      objects = geojson
    }
    // https://www.mapbox.com/mapbox-gl-js/api/#accesstoken
    // TODO: add personal mapbox access token
    mapboxgl.accessToken = API_KEY

    // https://www.mapbox.com/mapbox-gl-js/api/#map
    let map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v9',  // try your own, i.e. mapbox://styles/sauter/cksi9buw56sk918mkg9c58qjf
        center: [18.2812, 9.1021], // 9.1021° N, 18.2812° E
        zoom: 2
    })

    // select mapbox container 
    let container = map.getCanvasContainer()
    
    //add svg
    let svg = d3.select(container).append('svg')

    function projectPoint (lon, lat) { //maps are synced up on a projection point
        let point = map.project(new mapboxgl.LngLat(lon, lat)) // give mapbox a point. map. is mapbox map
        this.stream.point(point.x, point.y) //stream that point to d3
          // this is the internal scope
          
    }

    let transform = d3.geoTransform({point: projectPoint}) 
    let path = d3.geoPath().projection(transform) // https://github.com/d3/d3-3.x-api-reference/blob/master/Geo-Paths.md
        
    // Compute population extent for color scale
    const popExtent = d3.extent(geojson.features, d => d.properties.pop_est)
    // Create a color scale (e.g., interpolate from light yellow to dark red)
    const colorScale = d3.scaleSequential()
      .domain(popExtent)
      .interpolator(d3.interpolateYlOrRd)

    let featureElement = svg
        .selectAll('path')
        .data(geojson.features)
        .join('path')
        .attr('d', d3.geoPath().projection(transform))
        .attr('stroke', 'none')
        // Use color scale for fill based on population
        .attr('fill', d => colorScale(d.properties.pop_est))
        .attr('fill-opacity', 0.8)
        .on('mouseover', function (d) {
          // https://developer.mozilla.org/en-US/docs/Web/API/Event/srcElement
          console.log(d.srcElement.__data__)
          d3.select(this).attr('fill', 'dodgerblue')
          //we control name
          d3.select('#hover')
            .text(d.srcElement.__data__.properties.name + ' has a population of ' + (d.srcElement.__data__.properties.pop_est/1000000).toFixed(1) + ' Mio.')
          d3.select('#hover').attr('fill-opacity', 1)
        })
        .on('mouseout', function (d) {
          // Restore color scale on mouseout and hide tooltip
          d3.select(this).attr('fill', colorScale(d.srcElement.__data__.properties.pop_est))
          d3.select('#hover')
            .attr('fill-opacity', 0)
            .text('')
        })
        .on('mousemove', (d) => {
          // console.log(d3.pointer(d))
          d3.select('#hover')
            .attr('x', () => { return d3.pointer(d)[0] + 20 })
            .attr('y', () => { return d3.pointer(d)[1] + 10 })
        })
    
    // add hover label text        
    svg.append('text')
        .attr('id', 'hover')
        
    // sync map views and scales on reset
    let update = () => {
        featureElement.attr('d', path)
    }

    // manage layer visibility during map interactions that change projection
    map.on('viewreset', update)

    map.on('movestart', () => {
        svg.classed('hidden', true)
    })

    map.on('rotate', () => {
        svg.classed('hidden', true)
    })

    map.on('moveend', () => {
        update()
        svg.classed('hidden', false)
    })
})