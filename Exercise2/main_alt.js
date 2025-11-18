// Load Netflix Data
// scatterplot of each datapoint by:
    // runtime on X
    // #views on Y




//things to change:
//tooltip turns white
//contour around genres
//legend box remove
    // just do checkmarks instead
    // add a "unclick all" button

//text alignment should be unified across all text
// a little bit of color rebalancing so the yellow "animation" genre doesn't DOMINATE
    // or could use this to my advtange. Action and animation are important, so highlight them


// load data

data_movies = d3.csv("Data/NetflixMovies_added.csv").then( function(data_movies) {
    console.log(data_movies);
    console.log(typeof(data_movies));
    console.log(typeof(data_movies[0]['runtimeMinutes']));


    function runtime_to_minutes(d){
        let parts = d.split(":")
        return +parts[0]*60 + +parts[1];
    }
    console.log(runtime_to_minutes("1:54"));

    //runtime from string to numbers
    data_movies.forEach ( d => {
        d.runtimeMinutes = +d.runtimeMinutes;
        d.Views = +d.Views;
        d.genres = d.genres.split(","); // split genres into array
        d.fixed_minutes = runtime_to_minutes(d.Runtime);
        d.startYear = +d.startYear;
    })
    loadChart(data_movies);

    loadChart_zoomed_in(data_movies);

    });
    

function loadChart(data_movies) {
    const contour_width = 10;
    const contour_color = "black";

    const width = window.innerWidth * 0.9 + 100;
    const height = window.innerHeight * 0.83;
    const marginTop = 20;
    const marginRight = 50;
    const marginBottom = 30;
    const marginLeft = 80;

 
    //X axis
    x_axis = d3.scaleLinear()
        .domain(d3.extent(data_movies, d => d.fixed_minutes)).nice()
        .range([marginLeft, width - marginRight]);



    y_axis = d3.scaleLinear()
        .domain(d3.extent(data_movies, d => d.Views)).nice()
        .range([height - marginBottom, marginTop]);


    //genres check
    MoviePerGenre = d3.rollup(data_movies, v => v.length, d => d.genres[0]); //naive as it only takes the first genre
    console.log(MoviePerGenre);
    console.log(typeof(MoviePerGenre));
  

    // Colorscale for genres
    const allGenres = new Set(); // ai helped with this
    data_movies.forEach(d => d.genres.forEach(g => allGenres.add(g)));
    //list of removed
    allGenres.delete(""); // remove empty genre
    allGenres.delete("\\N") //remove second empty genre
    allGenres.delete("Mystery")
    allGenres.delete("Music")
    allGenres.delete("Family")
    allGenres.delete("Fantasy")
    allGenres.delete("SciFi")
    allGenres.delete("Western")
    allGenres.delete("Sport")
    allGenres.delete("Musical")
    allGenres.delete("Short")
    // allGenres.delete("Biography")
    allGenres.delete("War")
    allGenres.delete("History")
    allGenres.delete("Thriller")
    allGenres.delete("Crime")
    allGenres.delete("Sci-Fi")

    const genreCounts = Array.from(allGenres).map(genre => ({
        genre: genre,
        count: data_movies.filter(d => d.genres.includes(genre)).length
    }));
    console.log(genreCounts);


    //color
    const color = d3.scaleOrdinal()
        .domain(allGenres)
        .range(d3.schemeSet1);
    
    //tooltip

    //append div to svg
    var tooltip = d3.select("#canvas")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "#b20710")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px")

    //mouseover function

    var mouseover = function(d) {
    tooltip
      .style("opacity", 1)
    }

    var mousemove = function(event, d) {
        const canvasRect = document.getElementById('canvas').getBoundingClientRect();
        const tooltipHeight = tooltip.node().offsetHeight;
        tooltip
            .html(`<span style="font-weight:bold;">${d.primaryTitle}</span><br>`
                + d.genres.join(", ") + "<br>" 
                + d.startYear + "<br>" 
                + "Views: " + d.Views.toLocaleString())
            .style("left", ((event.clientX - canvasRect.left) + 15) + "px") // right of cursor
            .style("top", ((event.clientY - canvasRect.top) - tooltipHeight / 2) + "px") // center vertically on mouse
            .style("color", "black")
    }

    // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
    var mouseleave = function(d) {
        tooltip
        .style("opacity", 0)
        .style("left", "0px")
        .style("top", "0px");
    }

    //setup canvas
    const svg = d3.select("#canvas")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("display", "block")
        .attr("viewBox", [0, 0, width, height])
        // .attr("style", "max-width: 100%; height: auto;")
        .on("click", function() {
            //reset opacity
            svg.selectAll("circle").attr("opacity", 1)
            //reset pointer events
            svg.selectAll("circle").attr("pointer-events", "auto")
            //reset highlighted legend button
            d3.selectAll("#legend button")
                .style("border-width", "1px");
        })
        .style("background", "black");

    //append axes 
    svg.append("g") // x
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x_axis).tickSizeOuter(0))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
            .attr("y", -3)
            .attr("dy", null)
            .attr("font-weight", "bold")
            .attr("fill", "white")
            .text("Runtime (minutes)"))

    svg.append("g") // y
        .attr("class", "axis")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y_axis).tickSizeOuter(0))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
            .attr("x", 3)
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text("Views"));



    

    //genre picker
    // if genre is animation pick animation. if genre is romance pick romance. if neither of these two, pick the first genre
    genre_picker = function(d) {
        if (d.genres.includes("Animation")) {
            return "Animation";
        } else if (d.genres.includes("Romance")) {
            return "Romance";
        } else {
            return d.genres[0];
        }
    }

    // append dots
    svg.append("g")
        .selectAll("circle")
        .data(data_movies)
        .join("circle")
            .attr("cx", d => x_axis(d.fixed_minutes))
            .attr("cy", d => y_axis(d.Views))
            //.attr("r", d => (height -y_axis(d.Views))/20)
            .attr("r", 8)//d => size(d.startYear))
            .attr("fill", d => color(genre_picker(d))) // color by first genre
        .on("mouseover", mouseover )
        .on("mousemove", mousemove )
        .on("mouseleave", mouseleave )

    //append contours
    // not for final
    // svg.append("g")
    //         .attr("fill", "none")
    //         .attr("stroke", "steelblue")
    //         .attr("stroke-linejoin", "round")
    //     .selectAll()
    //     .data(contours)
    //     .join("path")
    //         .attr("stroke-width", (d, i) => i % 5 ? 0.25 : 1)
    //         .attr("d", d3.geoPath());



    // it's a bit redundant to have clicker function on both rect and text
    highlight_circle_basic = function(event, genre) {
        svg.selectAll("circle")
            .attr("opacity", d => genre_picker(d) === genre ? 1 : 0.1)
            .attr("pointer-events", d => genre_picker(d) === genre ? "auto" : "none");
        //highlight selected legend button
        d3.selectAll("#legend button")
            .style("border-width", d => d === genre ? "5px" : "1px");
    }

    const legendDiv = d3.select("#legend")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("align-items", "stretch"); // optional, makes buttons fill width


    legendDiv.html('<div style="font-weight:bold; color: white; font-size:20px; margin-bottom:8px;">Filter:</div>');

    // Add a button for each genre
    legendDiv.selectAll("button")
        .data(Array.from(allGenres))
        .join("button")
        .attr("type", "button")
        .attr("class", "btn btn-outline-primary btn-sm m-1")
        .style("background-color", d => color(d))
        .style("color", "black")
        .style("width", "180px")
        .style("box-sizing", "border-box") 
        .text(d => {
            const countObj = genreCounts.find(g => g.genre === d);
            const count = countObj ? countObj.count : 0;
            return `${d} (${count})`;
        })
        .on("click", function(event, genre) {
            highlight_circle_basic(event, genre);
        });
    
}

//really bad way to do this is to have the same function twice with minor changes
// I will change this later.
function loadChart_zoomed_in(data_movies) {
    const contour_width = 10;
    const contour_color = "black";

    const width = window.innerWidth * 0.9 + 100;
    const height = window.innerHeight * 0.85;
    const marginTop = 20;
    const marginRight = 50;
    const marginBottom = 30;
    const marginLeft = 80;

 
    //X axis
    x_axis = d3.scaleLinear()
        .domain([80,130]).nice()
        .range([marginLeft, width - marginRight]);



    y_axis = d3.scaleLinear()
        .domain([0,60000000]).nice()
        .range([height - marginBottom, marginTop]);


    //genres check
    MoviePerGenre = d3.rollup(data_movies, v => v.length, d => d.genres[0]); //naive as it only takes the first genre
    console.log(MoviePerGenre);
    console.log(typeof(MoviePerGenre));
  


    // Colorscale for genres
    const allGenres = new Set(); // ai helped with this
    data_movies.forEach(d => d.genres.forEach(g => allGenres.add(g)));
    //list of removed
    allGenres.delete(""); // remove empty genre
    allGenres.delete("\\N") //remove second empty genre
    allGenres.delete("Mystery")
    allGenres.delete("Music")
    allGenres.delete("Family")
    allGenres.delete("Fantasy")
    allGenres.delete("SciFi")
    allGenres.delete("Western")
    allGenres.delete("Sport")
    allGenres.delete("Musical")
    allGenres.delete("Short")
    // allGenres.delete("Biography")
    allGenres.delete("War")
    allGenres.delete("History")
    allGenres.delete("Thriller")
    allGenres.delete("Crime")
    allGenres.delete("Sci-Fi")

    const genreCounts = Array.from(allGenres).map(genre => ({
        genre: genre,
        count: data_movies.filter(d => d.genres.includes(genre)).length
    }));
    console.log(genreCounts);


    //color
    const color = d3.scaleOrdinal()
        .domain(allGenres)
        .range(d3.schemeSet1);
    
    //tooltip

    //append div to svg
    var tooltip = d3.select("#zoomed_in")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "#b20710")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px")

    //mouseover function

    var mouseover = function(d) {
    tooltip
      .style("opacity", 1)
    }

    var mousemove = function(event, d) {
        const canvasRect = document.getElementById('zoomed_in').getBoundingClientRect();
        const tooltipHeight = tooltip.node().offsetHeight;
        tooltip
            .html(`<span style="font-weight:bold;">${d.primaryTitle}</span><br>`
                + d.genres.join(", ") + "<br>" 
                + d.startYear + "<br>" 
                + "Views: " + d.Views.toLocaleString())
            .style("left", ((event.clientX - canvasRect.left) + 15) + "px") // right of cursor
            .style("top", ((event.clientY - canvasRect.top) - tooltipHeight / 2) + "px") // center vertically on mouse
            .style("color", "black")
    }

    // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
    var mouseleave = function(d) {
        tooltip
        .style("opacity", 0)
        .style("left", "0px")
        .style("top", "0px");
    }

    //setup canvas
    const svg = d3.select("#zoomed_in")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("display", "block")
        .attr("viewBox", [0, 0, width, height])
        // .attr("style", "max-width: 100%; height: auto;")
        .on("click", function() {
            //reset opacity
            svg.selectAll("circle").attr("opacity", 1)
            //reset pointer events
            svg.selectAll("circle").attr("pointer-events", "auto")
            //reset legend button borders
            d3.selectAll("#legend2 button")
                .style("border-width", "1px");
        })
        .style("background", "black");

    //append axes 
    svg.append("g") // x
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x_axis).tickSizeOuter(0))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
            .attr("y", -3)
            .attr("dy", null)
            .attr("font-weight", "bold")
            .attr("fill", "white")
            .text("Runtime (minutes)"))

    svg.append("g") // y
        .attr("class", "axis")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y_axis).tickSizeOuter(0))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
            .attr("x", 3)
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text("Views"));



    

    //genre picker
    // if genre is animation pick animation. if genre is romance pick romance. if neither of these two, pick the first genre
    genre_picker = function(d) {
        if (d.genres.includes("Animation")) {
            return "Animation";
        } else if (d.genres.includes("Romance")) {
            return "Romance";
        } else {
            return d.genres[0];
        }
    }

    // append dots
    svg.append("g")
        .selectAll("circle")
        .data(data_movies)
        .join("circle")
            .attr("cx", d => x_axis(d.fixed_minutes))
            .attr("cy", d => y_axis(d.Views))
            //.attr("r", d => (height -y_axis(d.Views))/20)
            .attr("r", 8)//d => size(d.startYear))
            .attr("fill", d => color(genre_picker(d))) // color by first genre
        .on("mouseover", mouseover )
        .on("mousemove", mousemove )
        .on("mouseleave", mouseleave )

    //append contours
    // not for final
    // svg.append("g")
    //         .attr("fill", "none")
    //         .attr("stroke", "steelblue")
    //         .attr("stroke-linejoin", "round")
    //     .selectAll()
    //     .data(contours)
    //     .join("path")
    //         .attr("stroke-width", (d, i) => i % 5 ? 0.25 : 1)
    //         .attr("d", d3.geoPath());



    // it's a bit redundant to have clicker function on both rect and text
    highlight_circle = function(event, genre) {
        svg.selectAll("circle")
            .attr("opacity", d => genre_picker(d) === genre ? 1 : 0.1)
            .attr("pointer-events", d => genre_picker(d) === genre ? "auto" : "none");
        //highlight selected legend button
        d3.selectAll("#legend2 button")
            .style("border-width", d => d === genre ? "5px" : "1px");
    }
    



    var legendDiv = d3.select("#legend2")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("align-items", "stretch"); // optional, makes buttons fill width

    legendDiv.html('<div style="font-weight:bold; color: white; font-size:20px; margin-bottom:8px;">Filter:</div>');


    // Add a button for each genre
    legendDiv.selectAll("button")
        .data(Array.from(allGenres))
        .join("button")
        .attr("type", "button")
        .attr("class", "btn btn-outline-primary btn-sm m-1")
        .style("background-color", d => color(d))
        .style("color", "black")
        .style("width", "180px")
        .style("box-sizing", "border-box") 
        .text(d => {
            const countObj = genreCounts.find(g => g.genre === d);
            const count = countObj ? countObj.count : 0;
            return `${d} (${count})`;
        })
        .on("click", function(event, genre) {
            highlight_circle(event, genre);
        });

    //default highlight for second chart
    const defaultGenre = ["Animation","Action"][0];
    highlight_circle(null, defaultGenre);
    //highlight selected legend button
    legendDiv.selectAll("button")
        .style("border-width", d => d === defaultGenre ? "5px" : "1px");
    
}






// Code Graveyard



        //Limited x axis
    // x_axis = d3.scaleLinear()
    //     .domain([80,120]).nice()
    //     .range([marginLeft, width - marginRight]);

    // alternate fixed viewcount so we can observe more of the data
    // y_axis = d3.scaleLinear()
    //     .domain([1000000,15000000]).nice()
    //     .range([height - marginBottom, marginTop]);


    //size scale based on release date
    // const size = d3.scaleLinear()
    //     .domain([2015,2025])
    //     .range([3, 15]);
    //will not use - maybe works better for another feature like opacity or color if I were not using color for genre



    //contours are not used in final version
    // var contours = d3.contourDensity()
    //         .x(d => x_axis(d.fixed_minutes))
    //         .y(d => y_axis(d.Views))
    //         .size([width, height])
    //         .bandwidth(10)
    //         .thresholds(10)
    //         (data_movies);

    //contours
    // svg.append("g")
    //         .attr("class", "contour-group")
    //         .attr("fill", "none")
    //         .attr("stroke", contour_color)
    //         .attr("stroke-linejoin", "round")
    //     .selectAll()
    //     .data(contours)
    //     .join("path")
    //         .attr("stroke-width", (d, i) => i % 5 ? 0.25 : 1)
    //         .attr("d", d3.geoPath());


    // //legend for colors
    // const legend = d3.select("#legend")
    //     .append("svg")
    //     .attr("width", 200)
    //     .attr("height", 20 * allGenres.size)
    //     .attr("viewBox", [0, 0, 200, 20 * allGenres.size])
    //     .attr("style", "max-width: 100%; height: auto;")


// legend.selectAll("rect")
//         .data(Array.from(allGenres))
//         .join("rect")
//             .attr("x", 10)
//             .attr("y", (d, i) => i * 20)
//             .attr("width", 15)
//             .attr("height", 15)
//             .attr("fill", d => color(d))
//             .style("cursor", "pointer")
//             .on("click", highlight_circle);
    
//     legend.selectAll("text")
//         .attr("class", "legend-text")
//         .data(Array.from(allGenres))
//         .join("text")
//             .attr("x", 30)
//             .attr("y", (d, i) => i * 20 + 12)
//             .text(d => {
//                 const countObj = genreCounts.find(g => g.genre === d);
//                 const count = countObj ? countObj.count : 0;
//                 return `${d} (${count})`;
//             })
//             .attr("font-size", "12px")
//             .attr("fill", "white")
//             .style("cursor", "pointer")
//             .on("click", highlight_circle);