// Load Netflix Data
// scatterplot of each datapoint by:
    // runtime on X
    // #views on Y



// load data

data_movies = d3.csv("Data/NetflixTV_added.csv").then( function(data_movies) {
    console.log(data_movies);
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


    })
    

    const contour_width = 10;
    const contour_color = "black";
    

   

    const width = 1300;
    const height = 800;
    const marginTop = 20;
    const marginRight = 50;
    const marginBottom = 30;
    const marginLeft = 80;

 
    //X axis
    x_axis = d3.scaleLinear()
        .domain([0,1500]).nice()
        .range([marginLeft, width - marginRight]);

    //Limited x axis
    // x_axis = d3.scaleLinear()
    //     .domain([80,120]).nice()
    //     .range([marginLeft, width - marginRight]);

    y_axis = d3.scaleLinear()
        .domain(d3.extent(data_movies, d => d.Views)).nice()
        .range([height - marginBottom, marginTop]);


    // alternate fixed viewcount so we can observe more of the data
    // y_axis = d3.scaleLinear()
    //     .domain([1000000,15000000]).nice()
    //     .range([height - marginBottom, marginTop]);


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
    allGenres.delete("History")
    allGenres.delete("Thriller")
    allGenres.delete("Crime")




    console.log(allGenres); // check all genres

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
        .style("background-color", "white")
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
        tooltip
            .html(d.Title + "<br>" + d.genres)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY + 10) + "px");
    }

    // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
    var mouseleave = function(d) {
        tooltip
        .style("opacity", 0)
    }



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
        .attr("class", "x-axis")
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
        .attr("class", "y-axis")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y_axis).tickSizeOuter(0))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
            .attr("x", 3)
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text("Views"));


    // var contours = d3.contourDensity()
    //         .x(d => x_axis(d.fixed_minutes))
    //         .y(d => y_axis(d.Views))
    //         .size([width, height])
    //         .bandwidth(10)
    //         .thresholds(10)
    //         (data_movies);

    //     //contours
    //     svg.append("g")
    //             .attr("class", "contour-group")
    //             .attr("fill", "none")
    //             .attr("stroke", contour_color)
    //             .attr("stroke-linejoin", "round")
    //         .selectAll()
    //         .data(contours)
    //         .join("path")
    //             .attr("stroke-width", (d, i) => i % 5 ? 0.25 : 1)
    //             .transition()
    //             .delay((d, i) => i * 100) // 100ms delay per contour
    //             .duration(1000)
    //             .attr("d", d3.geoPath());
    

    // // append dots
    // svg.append("g")
    //     .selectAll("circle")
    //     .data(data_movies)
    //     .join("circle")
    //         .attr("cx", d => x_axis(d.fixed_minutes))
    //         .attr("cy", d => y_axis(d.Views))
    //         //.attr("r", d => (height -y_axis(d.Views))/20)
    //         .attr("r", 6)
    //         .attr("fill", d => color(d.genres[0])) // color by first genre
    //     .on("mouseover", mouseover )
    //     .on("mousemove", mousemove )
    //     .on("mouseleave", mouseleave )

    //append contours
    // svg.append("g")
    //         .attr("fill", "none")
    //         .attr("stroke", "steelblue")
    //         .attr("stroke-linejoin", "round")
    //     .selectAll()
    //     .data(contours)
    //     .join("path")
    //         .attr("stroke-width", (d, i) => i % 5 ? 0.25 : 1)
    //         .attr("d", d3.geoPath());


        

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





    const dotsGroup = svg.append("g")
        .attr("clip-path", "url(#clip)");

    dotsGroup.selectAll("circle")
        .data(data_movies)
        .join("circle")
        .attr("cx", d => x_axis(d.fixed_minutes))
        .attr("cy", d => y_axis(d.Views))
        .attr("r", 6)
        .attr("fill", d => color(d.genres[0]))
        .on("mouseover", mouseover )
        .on("mousemove", mousemove )
        .on("mouseleave", mouseleave ); //these are nonfunctional with brushing enabled

    // const brush = d3.brush()
    //     .extent([[marginLeft, marginTop], [width - marginRight, height - marginBottom]])
    //     .on("end", updateChart);

    // svg.append("g")
    //     .attr("class", "brush")
    //     .call(brush);

    // function updateChart(event) {
    //     const extent = event.selection;
    //     if (!extent) return;

    //     // Convert pixel boundaries to data boundaries
    //     const x0 = x_axis.invert(extent[0][0]);
    //     const x1 = x_axis.invert(extent[1][0]);
    //     const y0 = y_axis.invert(extent[1][1]); // Note: SVG y-axis is inverted
    //     const y1 = y_axis.invert(extent[0][1]);

    //     // Update axis domains
    //     x_axis.domain([x0, x1]);
    //     y_axis.domain([y0, y1]);

    //     // Redraw axes
    //     svg.select(".x-axis")
    //         .transition()
    //         .duration(1000)
    //         .call(d3.axisBottom(x_axis).tickSizeOuter(0));

    //     svg.select(".y-axis")
    //         .transition()
    //         .duration(1000)
    //         .call(d3.axisLeft(y_axis).tickSizeOuter(0));

    //     // Reposition dots
    //     dotsGroup.selectAll("circle")
    //         .transition()
    //         .duration(1000)
    //         .attr("cx", d => x_axis(d.fixed_minutes))
    //         .attr("cy", d => y_axis(d.Views));

    //     // Remove old contours
    //     svg.selectAll(".contour-group").remove();
        
    //     // Density Contours from (https://observablehq.com/@d3/density-contours)
    //     var contours = d3.contourDensity()
    //         .x(d => x_axis(d.fixed_minutes))
    //         .y(d => y_axis(d.Views))
    //         .size([width, height])
    //         .bandwidth(10)
    //         .thresholds(10)
    //         (data_movies);

    //     //contours
    //     svg.append("g")
    //             .attr("class", "contour-group")
    //             .attr("fill", "none")
    //             .attr("stroke", contour_color)
    //             .attr("stroke-linejoin", "round")
    //         .selectAll()
    //         .data(contours)
    //         .join("path")
    //             .attr("stroke-width", (d, i) => i % 5 ? 0.25 : 1)
    //             .transition()
    //             .delay((d, i) => i * 100) // 100ms delay per contour
    //             .duration(1000)
    //             .attr("d", d3.geoPath());


    //     // Remove brush selection
    //     svg.select(".brush").call(brush.move, null);

    // }

    // svg.on("dblclick", function() {
    //     // Reset axis domains to full data extent
    //     x_axis.domain(d3.extent(data_movies, d => d.fixed_minutes)).nice();
    //     y_axis.domain(d3.extent(data_movies, d => d.Views)).nice();

    //     // Redraw axes 
    //     svg.select(".x-axis")
    //         .transition()
    //         .duration(1000)
    //         .call(d3.axisBottom(x_axis).tickSizeOuter(0));
    //     svg.select(".y-axis")
    //         .transition()
    //         .duration(1000)
    //         .call(d3.axisLeft(y_axis).tickSizeOuter(0));

    //     // Reposition dots
    //     dotsGroup.selectAll("circle")
    //         .transition()
    //         .duration(1000)
    //         .attr("cx", d => x_axis(d.fixed_minutes))
    //         .attr("cy", d => y_axis(d.Views));

    //     //redraw contours
    //     // Remove old contours
    //     svg.selectAll(".contour-group").remove();

    //     // Recompute contours
    //     var contours = d3.contourDensity()
    //         .x(d => x_axis(d.fixed_minutes))
    //         .y(d => y_axis(d.Views))
    //         .size([width, height])
    //         .bandwidth(10)
    //         .thresholds(10)
    //         (data_movies);

    //     //contours
    //     svg.append("g")
    //         .attr("class", "contour-group")
    //         .attr("fill", "none")
    //         .attr("stroke", contour_color)
    //         .attr("stroke-linejoin", "round")
    //     .selectAll("path")
    //     .data(contours)
    //     .join("path")
    //         .attr("stroke-width", (d, i) => i % 5 ? 0.25 : 1)
    //         .transition()
    //         .delay((d, i) => i * 200)
    //         .duration(1000)
    //         .attr("d", d3.geoPath());

        
    //     // Re-enable brush overlay for further brushing
    //     svg.select(".brush").selectAll(".overlay")
    //         .style("pointer-events", "all");
    // });


});


//brushing
    // svg.call(d3.brush().on("start brush end", ({selection}) => {
    //     let value = [];
    //     if (selection) {
    //     const [[x0, y0], [x1, y1]] = selection;
    //     value = dot
    //         .style("stroke", "gray")
    //         .filter(d => x0 <= x(d["fixed_minutes"]) && x(d["fixed_minutes"]) < x1
    //                 && y0 <= y(d["Views"]) && y(d["Views"]) < y1)
    //         .style("stroke", "steelblue")
    //         .data();
    //     } else {
    //     dot.style("stroke", "steelblue");
    //     }

    //     // Inform downstream cells that the selection has changed.
    //     svg.property("value", value).dispatch("input");

    //     //currently does not do anything, I just wanted to see what the brushing would look like
    // }));

    //Make brush update chart:
        //create update chart function
        //will need to update x and y axis based on the selection done by the brush

// var clip = svg.append("defs").append("svg:clipPath")
//         .attr("id", "clip")
//         .append("svg:rect")
//         .attr("width", width )
//         .attr("height", height )
//         .attr("x", 0)
//         .attr("y", 0);

//     var brush = d3.brush()                   // Add the brush feature using the d3.brush function
//         .extent( [ [0,0], [width,height] ] )  // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
//         .on("end", updateChart)               // Each time the brush selection changes, trigger the 'updateChart' function

    
//     var area = svg.append('g')
//       .attr("clip-path", "url(#clip)")

//     // Create an area generator
//     var areaGenerator = d3.area()
//       .x(function(d) { return x(d.fixed_minutes) })
//       .y0(y(0))
//       .y1(function(d) { return y(d.Views) })

//     // Add the area
//     area.append("path")
//       .datum(data)
//       .attr("class", "myArea")  // I add the class myArea to be able to modify it later on.
//       .attr("fill", "#69b3a2")
//       .attr("fill-opacity", .3)
//       .attr("stroke", "black")
//       .attr("stroke-width", 1)
//       .attr("d", areaGenerator )

//     area
//       .append("g")
//         .attr("class", "brush")
//         .call(brush);
        
//     // A function that set idleTimeOut to null
//     var idleTimeout
//     function idled() { idleTimeout = null; }

//     // A function that update the chart for given boundaries
//     function updateChart() {

//       // What are the selected boundaries?
//       extent = d3.event.selection

//       // If no selection, back to initial coordinate. Otherwise, update X axis domain
//       if(!extent){
//         if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
//         x.domain([ 4,8])
//       }else{
//         x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
//         area.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
//       }

//       // Update axis and area position
//       xAxis.transition().duration(1000).call(d3.axisBottom(x))
//       area
//           .select('.myArea')
//           .transition()
//           .duration(1000)
//           .attr("d", areaGenerator)
//     }

//     // If user double click, reinitialize the chart
//     svg.on("dblclick",function(){
//       x.domain(d3.extent(data, function(d) { return d.date; }))
//       xAxis.transition().call(d3.axisBottom(x))
//       area
//         .select('.myArea')
//         .transition()
//         .attr("d", areaGenerator)
//     });