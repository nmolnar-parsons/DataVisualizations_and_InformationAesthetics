// Load Netflix Data
// scatterplot of each datapoint by:
    // runtime on X
    // #views on Y



// load data

data_movies = d3.csv("Data/NetflixMovies_added.csv").then( function(data_movies) {
    console.log(data_movies);
    console.log(typeof(data_movies[0]['runtimeMinutes']));


    //runtime from string to numbers
    data_movies.forEach ( d => {
        d.runtimeMinutes = +d.runtimeMinutes;
        d.Views = +d.Views;
        d.genres = d.genres.split(","); // split genres into array

    })
    console.log((data_movies[0]['genres'][1]));


   

    const width = 1000;
    const height = 600;
    const marginTop = 20;
    const marginRight = 50;
    const marginBottom = 30;
    const marginLeft = 80;

 
    //X axis
    x_axis = d3.scaleLinear()
        .domain(d3.extent(data_movies, d => d.runtimeMinutes)).nice()
        .range([marginLeft, width - marginRight]);

    // y_axis = d3.scaleLinear()
    //     .domain(d3.extent(data_movies, d => d.Views)).nice()
    //     .range([height - marginBottom, marginTop]);


    // alternate fixed viewcount so we can observe more of the data
    y_axis = d3.scaleLinear()
        .domain([1000000,60000000]).nice()
        .range([height - marginBottom, marginTop]);


    //genres check
    MoviePerGenre = d3.rollup(data_movies, v => v.length, d => d.genres[0]); //naive as it only takes the first genre
    console.log(MoviePerGenre);
    //remove Romance, Music, Family, Fantasy, SciFi, Mystery, Thriller
    // also western sport musical short
    // also war and biography

    // Colorscale for genres
    const allGenres = new Set(); // ai helped with this
    data_movies.forEach(d => d.genres.forEach(g => allGenres.add(g)));
    allGenres.delete(""); // remove empty genre
    allGenres.delete("\\N") //remove second empty genre
    allGenres.delete("Romance")
    allGenres.delete("Music")
    allGenres.delete("Family")
    allGenres.delete("Fantasy")
    allGenres.delete("SciFi")
    allGenres.delete("Western")
    allGenres.delete("Sport")
    allGenres.delete("Musical")
    allGenres.delete("Short")
    allGenres.delete("Biography")
    allGenres.delete("War")




    console.log(allGenres); // check all genres

    const color = d3.scaleOrdinal()
        .domain(allGenres)
        .range(d3.schemePaired);

    // Density Contours from (https://observablehq.com/@d3/density-contours)
    const contours = d3.contourDensity()
        .x(d => x_axis(d.runtimeMinutes))
        .y(d => y_axis(d.Views))
        .size([width, height])
        .bandwidth(30)
        .thresholds(30)
        (data_movies);

    //setup canvas
    const svg = d3.select("#canvas")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;")
        .style("background-color", "lightgrey");

    //append axes 
    svg.append("g") // x
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x_axis).tickSizeOuter(0))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
            .attr("y", -3)
            .attr("dy", null)
            .attr("font-weight", "bold")
            .attr("fill", "black")
            .text("Runtime (minutes)"))

    svg.append("g") // y
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y_axis).tickSizeOuter(0))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
            .attr("x", 3)
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text("Views"));
    

    // append dots
    svg.append("g")
        .selectAll("circle")
        .data(data_movies)
        .join("circle")
            .attr("cx", d => x_axis(d.runtimeMinutes))
            .attr("cy", d => y_axis(d.Views))
            .attr("r", 3)
            .attr("fill", d => color(d.genres[0])) // color by first genre

    //append contours
    svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-linejoin", "round")
        .selectAll()
        .data(contours)
        .join("path")
            .attr("stroke-width", (d, i) => i % 5 ? 0.25 : 1)
            .attr("d", d3.geoPath());


    //legend for colors
    const legend = d3.select("#legend")
        .append("svg")
        .attr("width", 200)
        .attr("height", 20 * allGenres.size)
        .attr("viewBox", [0, 0, 200, 20 * allGenres.size])
        .attr("style", "max-width: 100%; height: auto;")
        .style("background-color", "lightgrey");
        
    legend.selectAll("rect")
        .data(Array.from(allGenres))
        .join("rect")
            .attr("x", 10)
            .attr("y", (d, i) => i * 20)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", d => color(d));
    
    legend.selectAll("text")
        .data(Array.from(allGenres))
        .join("text")
            .attr("x", 30)
            .attr("y", (d, i) => i * 20 + 12)
            .text(d => d)
            .attr("font-size", "12px")
            .attr("fill", "black");

});