// add movies production data from TMDB API using imdb IDs to the NetflixMovies_added.csv file

const fs = require('fs');
const path = require('path');
// const fetch = require('node-fetch');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const d3 = require('d3-dsv');

const TMDB_TOKEN = "NOPE"

// Load Netflix movies dataset
const csvPath = path.join(__dirname, '/Data/NetflixMovies_added.csv');
const outputPath = path.join(__dirname, '/Data/NetflixMovies_production_enriched.json');

async function loadCSV(filePath) {
    const csvString = fs.readFileSync(filePath, 'utf8');
    return d3.csvParse(csvString);
}

// Fetch production countries from TMDB using IMDb ID
async function fetchProductionCountries(imdbId) {
    const findUrl = `https://api.themoviedb.org/3/find/${imdbId}?external_source=imdb_id`;
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_TOKEN}`
        }
    };
    try {
        const findResponse = await fetch(findUrl, options);
        const findData = await findResponse.json();

        const results = findData.movie_results?.length > 0
            ? findData.movie_results
            : findData.tv_results;

        if (!results || results.length === 0) {
            console.log(`No match for ${imdbId}`);
            return null;
        }

        const tmdbId = results[0].id;
        const mediaType = findData.movie_results?.length > 0 ? 'movie' : 'tv';

        // Fetch detailed info for production countries and overview
        const detailsUrl = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}`;
        const detailsResponse = await fetch(detailsUrl, options);
        const details = await detailsResponse.json();

        return {
            productionCountries: details.production_countries || [],
            originCountry: details.origin_country || [],
            overview: details.overview || ''
        };
    } catch (error) {
        console.error(`Error fetching ${imdbId}:`, error);
        return null;
    }
}

// Fetch and save function
async function fetchAndSave(data, maxCount) {
    const sample = data.slice(0, maxCount);
    const enrichedData = [];
    const notFound = [];

    for (let i = 0; i < sample.length; i++) {
        const title = sample[i];
        // Movies use 'tconst', TV shows use 'externals.imdb'
        const imdbId = title.tconst || title['externals.imdb'];

        if (!imdbId) {
            notFound.push({ title: title.Title || title.name, reason: 'No IMDb ID' });
            continue;
        }

        const countryInfo = await fetchProductionCountries(imdbId);

        if (countryInfo) {
            enrichedData.push({
                ...title,
                productionCountries: countryInfo.productionCountries,
                originCountry: countryInfo.originCountry,
                overview: countryInfo.overview
            });
        } else {
            notFound.push({ title: title.Title || title.name, imdbId: imdbId });
        }

        // 40 req/sec rate limit
        await new Promise(resolve => setTimeout(resolve, 25));
    }

    console.log(`✅ Fetched ${enrichedData.length} movies`);
    if (notFound.length > 0) {
        console.log(`❌ ${notFound.length} not found in TMDB:`);
        notFound.forEach(item => {
            console.log(`  - ${item.title} (${item.imdbId || item.reason})`);
        });
    }

    // Save to file
    fs.writeFileSync(outputPath, JSON.stringify(enrichedData, null, 2), 'utf8');
    console.log(`Results saved to ${outputPath}`);
}

(async () => {
    const moviesData = await loadCSV(csvPath);
    console.log(`Loaded ${moviesData.length} movies`);
    await fetchAndSave(moviesData, 1851);
})();
