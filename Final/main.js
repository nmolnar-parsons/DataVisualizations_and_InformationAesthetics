// todo:
    // calculate "the average netflix movie"
        // average runtimeMinutes and average Views
    // calculate for each genre and for every runtimeMinutes between 80 and 130 minutes 

    //figure out genre-specific stories
    
    // Intro Scatterplot:
        // looks like it's shifted to the left too much
        // highlight top 10 movies?
        // box or border area for "irregulars?"




    
// -----------------------------------------------------------------------
//  Variables and Constants
// -----------------------------------------------------------------------




let dimensions = [window.innerWidth/2.8, window.innerHeight*0.5] // Make plots even smaller to fit properly
let margins = {top: 10, right: 20, bottom: 30, left: 40}; // Reduce margins

let intro_dimensions = [window.innerWidth*0.9, window.innerHeight*0.5];
let intro_margins = {top: 10, right: 200, bottom: 30, left: 250};

// Genres:
let genres = ["Action", "Comedy", "Drama", "Romance", "Adventure", "Animation", "Documentary", "Horror"];

let state = {
    filters: {
        menu: genres,
        checked: genres,
    }
    // optionally could do tooltip here, but I think I'll try my version first and then redo if it makes sense
}


// also define scales globally
let x_scale, y_scale, color_scale; // for scatterplot
let x_scale_bar, y_scale_bar; // for barplot

// data
let data = [];

// add a variable to store the static max for barplot y-axis
let barplot_y_max = 0;

// -----------------------------------------------------------------------

async function load_data(){

// initialize the layout
    initializeLayout();

    // load external data file
    source = await d3.csv("Data/NetflixMovies_added.csv");

    console.log(source);
    console.log(typeof(source));
    console.log(typeof(source[0]['runtimeMinutes']));


    //cleaning data:
    function runtime_to_minutes(d){
        let parts = d.split(":")
        return +parts[0]*60 + +parts[1];
    }
    
    source.forEach( d => {
            d.runtimeMinutes = +d.runtimeMinutes;
            d.Views = +d.Views;
            d.genres = d.genres.split(","); // split genres into array
            d.fixed_minutes = runtime_to_minutes(d.Runtime);
            d.startYear = +d.startYear;
    })

    console.log(source);
    console.log(typeof(source));
    console.log(typeof(source[0]['runtimeMinutes']));

    data = Array.from(source);
    console.log(data)

    // Compute static barplot_y_max from all data
    let allWords = [];
    data.forEach(d => {
        let title_words = d.primaryTitle.split(" ");
        title_words.forEach(word => {
            allWords.push(word.toLowerCase());
        });
    });
    const allWordRollup = d3.rollup(allWords, v => v.length, d => d);
    const allBarData = Array.from(allWordRollup, ([word, count]) => ({word, count}));
    barplot_y_max = d3.max(allBarData, d => d.count);

    // drawing can only happen after data is here
    draw_intro();
    draw();

}



function initializeLayout(){

    // Set figure dimensions
    var figureHeight = window.innerHeight / 2;
    var figureMarginTop = (window.innerHeight - figureHeight) / 2;

    const figure = d3.select("figure")
        .style("height", figureHeight + "px")
        .style("top", figureMarginTop + "px");

        //add top menu with checkboxes for genres
    const topmenu = d3.select("#menu").append("div").attr("class","top-menu");

    topmenu.append("div").attr("class", "title").html(`
      <h4>Select a Genre</h4>
    `);
    topmenu.append("div").attr("class", "filters");

        //add checkboxes for each genre
    const checkGenre = topmenu.select(".filters")
        .selectAll(".checkbox-genre")
        .data(genres)
        .enter()
        .append("div")
        .attr("class", "checkbox-genre")
        .html(d => `
            <input type="checkbox" name="${d}" checked="true"/>
            <label for="${d}">${d}</label>
        `);

        //add event listener to checkboxes
    checkGenre.select("input").on("change", function(event, d) {
        onCheckboxChange(d);
    });

    const svgWidth = dimensions[0];
    const svgHeight = dimensions[1];
    
    //set up ranges for scales
    x_scale = d3.scaleLinear().range([margins.left, svgWidth - margins.right]);
    y_scale = d3.scaleLinear().range([svgHeight - margins.bottom, margins.top]);

    x_scale_bar = d3.scaleBand().range([margins.left, svgWidth - margins.right]).padding(0.1);
    y_scale_bar = d3.scaleLinear().range([svgHeight - margins.bottom, margins.top]);
    
    color_scale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(genres);

    //Scatterplot
    const scatterplot_svg = d3.select("#plots")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .attr("id", "scatterplot_svg");
        
    //Scatterplot Axes:
    scatterplot_svg.append("g")
        .attr("class", "scatter_x-axis")
        .attr("transform", `translate(0,${svgHeight - margins.bottom})`);

    scatterplot_svg.append("g")
        .attr("class", "scatter_y-axis")
        .attr("transform", `translate(${margins.left},0)`);

    
    // Barplot
    const barplot_svg = d3.select("#plots")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .attr("id", "barplot_svg");

    //Barplot Axes:
    barplot_svg.append("g")
        .attr("class", "bar_x-axis")
        .attr("transform", `translate(0,${svgHeight - margins.bottom})`);

    barplot_svg.append("g")
        .attr("class", "bar_y-axis")
        .attr("transform", `translate(${margins.left},0)`);

    // Add tooltip div (hidden by default)
    d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("background", "rgba(30,30,30,0.95)")
        .style("color", "#fff")
        .style("padding", "8px 12px")
        .style("border-radius", "6px")
        .style("font-size", "14px")
        .style("z-index", "1000")
        .style("display", "none");

    //dimensions for top10 figure
    const svgWidth_top10 = intro_dimensions[0];
    const svgHeight_top10 = intro_dimensions[1];


    //Top 10 List barchart in <div id="top-10-figure">
    top_10_figure = d3.select("#top-10-figure")
        .append("svg")
        .attr("width", svgWidth_top10)
        .attr("height", svgHeight_top10);
        // axes for top10:
    //vertical position is 1-10 using scaleBand
    top10_y_scale = d3.scaleBand()
        .range([intro_margins.top, svgHeight_top10 - intro_margins.bottom])
        .padding(0.1);
    // horizontal position is runtimeMinutes, linear scale
    top10_x_scale = d3.scaleLinear()
        .range([intro_margins.left, svgWidth_top10 - intro_margins.right]);

    top_10_figure.append("g")
        .attr("class", "top10_x-axis")
        .attr("transform", `translate(0,${svgHeight_top10 - intro_margins.bottom})`);

    top_10_figure.append("g")
        .attr("class", "top10_y-axis")
        .attr("transform", `translate(${intro_margins.left},0)`);

    // Into figure uses the structure of scatterplot but with margins and dimensions from intro
    intro_scatterplot = d3.select("#intro-scatterplot")
        .append("svg")
        .attr("width", svgWidth_top10)
        .attr("height", svgHeight_top10)
        .attr("id", "intro_scatterplot_svg");
    
    //set up ranges for intro scatterplot scales
    intro_x_scale = d3.scaleLinear().range([intro_margins.left, svgWidth_top10 - intro_margins.right]);
    intro_y_scale = d3.scaleLinear().range([svgHeight_top10 - intro_margins.bottom, intro_margins.top]);

    //axes
    intro_scatterplot.append("g")
        .attr("class", "intro_scatter_x-axis")
        .attr("transform", `translate(0,${svgHeight_top10 - intro_margins.bottom})`);
    intro_scatterplot.append("g")
        .attr("class", "intro_scatter_y-axis")
        .attr("transform", `translate(${intro_margins.left},0)`);



}

function onCheckboxChange(genre){
    console.log("checkbox changed:", genre);

    // was the clicked box checked or unchecked?
    const index = state.filters.checked.indexOf(genre);

    // this array will hold the new checked values, whether something has been checked or unchecked
    let nextCheckedValues = Array.from(state.filters.checked);
    console.log(nextCheckedValues)
    console.log(index)
    
    // if box is checked, uncheck it
    if (index > -1) {
        // take it out of the array of checked values
        nextCheckedValues.splice(index, 1);
    // otherwise, add it to the checked values
    } else {
        nextCheckedValues.push(genre);
    }

    // update the checked values in the state
    state.filters.checked = Array.from(nextCheckedValues);

    // and update the visualization
    draw();

}



function draw(){
    // Helper to get the genre used for color and filtering (always agrees)
    function getColorGenre(d) {
        if (d.genres.includes("Animation")) return "Animation";
        if (d.genres.includes("Romance")) return "Romance";
        return d.genres[0];
    }

    // Filter data: only include movies whose color genre is checked
    let filteredData = data.filter(d => {
        return state.filters.checked.includes(getColorGenre(d));
    });

    // Scatterplot:

    // domains for scales
    // x_scale.domain(d3.extent(data, d => d.fixed_minutes)).nice();
    // y_scale.domain(d3.extent(data, d => d.Views)).nice();
    //domains for scales are 80 to 130 minutes and 0 to 80M Views in filtered data
    x_scale.domain([75, 150]).nice();
    y_scale.domain([0, 80000000]).nice();
    //color has been set already

    // select svg
    const scatterplot_svg = d3.select("#scatterplot_svg");

    // Tooltip selection
    const tooltip = d3.select("#tooltip");

    // Helper to get the first checked genre for a movie, with Animation/Romance override
    function getFirstCheckedGenre(d) {
        if (d.genres.includes("Animation")) return "Animation";
        if (d.genres.includes("Romance")) return "Romance";
        return d.genres.find(g => state.filters.checked.includes(g)) || d.genres[0];
    }

    // draw points (update pattern)
    const points = scatterplot_svg.selectAll(".point")
        .data(filteredData, d => d.primaryTitle);

    // EXIT old points
    points.exit()
        .transition()
        .duration(200)
        .attr("r", 0)
        .remove();

    // UPDATE existing points
    points
        .transition()
        .duration(200)
        .attr("cx", d => x_scale(d.fixed_minutes))
        .attr("cy", d => y_scale(d.Views))
        .attr("fill", d => color_scale(getColorGenre(d)))
        .attr("r", 6); // Ensure radius is reset to 6

    // ENTER new points
    points.enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", d => x_scale(d.fixed_minutes))
        .attr("cy", d => y_scale(d.Views))
        .attr("r", 0)
        .attr("fill", d => color_scale(getColorGenre(d)))
        .on("mouseover", function(event, d) {
            tooltip
                .style("display", "block")
                .html(
                    `<strong>${d.primaryTitle}</strong><br/>
                    ${d.fixed_minutes} min<br/>
                    ${d.genres.join(", ")}<br/>
                    ${d3.format(",")(d.Views)} views`
                );
            d3.select(this)
                .attr("stroke", "#fff")
                .attr("stroke-width", 2)
                .attr("r", 8); // increase r to 8 on hover

            // --- Highlight bars in barplot if word in title matches ---
            // Remove colons before splitting
            const hoveredWords = new Set(
                d.primaryTitle.replace(/:/g, "").split(" ").map(w => w.toLowerCase())
            );
            d3.selectAll("#barplot_svg .bar")
                .attr("fill", barD => hoveredWords.has(barD.word.toLowerCase()) ? "#ff8000ff" : "#e50914");
        })
        .on("mousemove", function(event) {
            tooltip
                .style("left", (event.pageX + 16) + "px")
                .style("top", (event.pageY - 24) + "px");
        })
        .on("mouseleave", function() {
            tooltip.style("display", "none");
            d3.select(this)
                .attr("stroke", null)
                .attr("stroke-width", null)
                .attr("r", 6); // decrease r back to 6 on mouseleave

            // --- Remove bar highlight on mouse leave ---
            d3.selectAll("#barplot_svg .bar")
                .attr("fill", "#e50914");
        })
        .transition()
        .duration(300)
        .attr("r", 6);

    // update axes
    scatterplot_svg.select(".scatter_x-axis")
        .call(d3.axisBottom(x_scale).ticks(6).tickFormat(d => d + " min"));

    scatterplot_svg.select(".scatter_y-axis")
        .call(d3.axisLeft(y_scale).ticks(6).tickFormat(d3.format(".2s")));
        
    // Barplot:
    
    // Get word frequencies from titles
    let words = [];
    const wordsNotIncluded = new Set(["The", "the", "of", "a", "A", "&", "-", "and", "to", "in"]);
    filteredData.forEach(d => {
        // Remove colons before splitting
        let title_words = d.primaryTitle.replace(/:/g, "").split(" ");
        title_words.forEach(word => {
            let w = word;
            if (!wordsNotIncluded.has(w)) {
                words.push(w);
            }
        });
    });

    

    // D3 rollup - creates a Map with word as key and count as value
    const d3word_rollup = d3
        .rollup(words, v => v.length, d => d);



        



    // // Map to sum views for each word in titles
    // const wordViewsMap = new Map();
    // filteredData.forEach(d => {
    //     // Remove colons before splitting
    //     let title_words = d.primaryTitle.replace(/:/g, "").split(" ");
    //     title_words.forEach(word => {
    //         let w = word.toLowerCase();
    //         if (!wordsNotIncluded.has(w)) {
    //             wordViewsMap.set(w, (wordViewsMap.get(w) || 0) + d.Views);
    //         }
    //     });
    // });
    // // Example: convert to array and sort by total views
    // const wordViewsArray = Array.from(wordViewsMap, ([word, totalViews]) => ({ word, totalViews }));
    // wordViewsArray.sort((a, b) => d3.descending(a.totalViews, b.totalViews));
    // console.log("Words sorted by total views:");
    // console.log(wordViewsArray);



    const barData = Array.from(d3word_rollup, ([word, count]) => ({word, count}));
    console.log(barData);

    // sort descending by count and take top 20
    barData.sort((a, b) => d3.descending(a.count, b.count));
    const topBarData = barData.slice(0, 30);

    // domains for barplot scales
    x_scale_bar.domain(topBarData.map(d => d.word));
    // set y_scale_bar domain to static max
    y_scale_bar.domain([0, 100]).nice();

    // select svg
    const barplot_svg = d3.select("#barplot_svg");

    // draw bars (update pattern)
    const bars = barplot_svg.selectAll(".bar")
        .data(topBarData, d => d.word); // use word as key

    // EXIT old bars
    bars.exit().remove();

    // UPDATE existing bars
    bars.transition()
        .duration(400)
        .attr("x", d => x_scale_bar(d.word))
        .attr("y", d => y_scale_bar(d.count))
        .attr("width", x_scale_bar.bandwidth())
        .attr("height", d => y_scale_bar.range()[0] - y_scale_bar(d.count));

    // ENTER new bars
    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x_scale_bar(d.word))
        .attr("y", d => y_scale_bar(d.count))
        .attr("width", x_scale_bar.bandwidth())
        .attr("height", d => y_scale_bar.range()[0] - y_scale_bar(d.count))
        .attr("fill", "#e50914")
        .on("mouseover", function(event, d) {
            // Highlight scatterplot points whose title contains this word
            const barWord = d.word.toLowerCase();
            const matchingTitles = new Set();
            d3.selectAll("#scatterplot_svg .point").each(function(pointD) {
                const words = pointD.primaryTitle.replace(/:/g, "").toLowerCase().split(" ");
                if (words.includes(barWord)) {
                    matchingTitles.add(pointD.primaryTitle);
                    // Bring to front
                    this.parentNode.appendChild(this);
                }
            });
            // now highlight the points
            d3.selectAll("#scatterplot_svg .point")
                .attr("r", pointD => matchingTitles.has(pointD.primaryTitle) ? 8 : 6)
                .attr("stroke", pointD => matchingTitles.has(pointD.primaryTitle) ? "#fff" : null)
                .attr("stroke-width", pointD => matchingTitles.has(pointD.primaryTitle) ? 2 : null);
            //Highlight the bar itself
            d3.select(this).attr("fill", "#ff8000ff");
        })
        .on("mouseleave", function(event, d) {
            // Remove highlight from scatterplot points
            d3.selectAll("#scatterplot_svg .point")
                .attr("fill", pointD => color_scale(getColorGenre(pointD)))
                .attr("r", 6)
                .attr("stroke", null)
                .attr("stroke-width", null);
            // Restore bar color
            d3.select(this).attr("fill", "#e50914");
        });

    // update axes
    barplot_svg.select(".bar_x-axis")
        .call(d3.axisBottom(x_scale_bar).tickValues([])); // hide x tick labels for clarity

    barplot_svg.select(".bar_y-axis")
        .call(d3.axisLeft(y_scale_bar).ticks(6));

    // append vertically rotated text labels to bars (with update pattern and transition)
    const labels = barplot_svg.selectAll(".bar-label")
        .data(topBarData, d => d.word);

    // EXIT old labels
    labels.exit().remove();

    // ENTER new labels
    const labelsEnter = labels.enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "10px");

    // MERGE enter and update selections
    const labelsUpdate = labelsEnter.merge(labels);

    // Apply attributes to both new and existing labels
    labelsUpdate
        .attr("x", d => x_scale_bar(d.word) + x_scale_bar.bandwidth() / 2)
        .attr("y", d => y_scale_bar(d.count) - 10)
        .attr("transform", d => {
            const x = x_scale_bar(d.word) + x_scale_bar.bandwidth() / 2;
            const y = y_scale_bar(d.count) - 10;
            return `rotate(-45, ${x}, ${y})`;
        })
        .text(d => d.word)
        .style("opacity", 0)
        .transition()
        .duration(600)
        .style("opacity", 1);
}


function draw_intro(){
    // get 10 movies with highest Views
    let top10 = Array.from(data);
    top10.sort((a,b) => d3.descending(a.Views, b.Views));
    top10 = top10.slice(0,10);

    // set domains for scales
    top10_y_scale.domain(top10.map((d,i) => i+1)); // 1-10
    top10_x_scale.domain([0, d3.max(top10, d => d.fixed_minutes)]).nice();

    // draw bars
    const bars = top_10_figure.selectAll(".top10-bar")
        .data(top10, d => d.primaryTitle);

    bars.enter()
        .append("rect")
        .attr("class", "top10-bar")
        .attr("x", intro_margins.left)
        .attr("y", (d,i) => top10_y_scale(i+1))
        .attr("width", d => top10_x_scale(d.fixed_minutes) - margins.left)
        .attr("height", top10_y_scale.bandwidth())
        .attr("fill", "#e50914");

    // update axes
    top_10_figure.select(".top10_x-axis")
        .call(d3.axisBottom(top10_x_scale).ticks(6).tickFormat(d => d + " min"));

    top_10_figure.select(".top10_y-axis")
        .call(d3.axisLeft(top10_y_scale).tickFormat((d,i) => `${d}. ${top10[i].primaryTitle}`));
    
    //Text labels for left side of bars
    const labels = top_10_figure.selectAll(".top10-bar-label")
        .data(top10, d => d.primaryTitle);

    labels.enter()
        .append("text")
        .attr("class", "top10-bar-label")
        .attr("text-anchor", "end")
        .attr("fill", "white")
        .attr("font-size", "12px")
        .attr("x", intro_margins.left - 10)
        .attr("y", (d,i) => top10_y_scale(i+1) + top10_y_scale.bandwidth()/2 + 4)
        .text(d => d.primaryTitle);

    //add runtime labels at end of bars
    const runtimeLabels = top_10_figure.selectAll(".top10-bar-runtime-label")
        .data(top10, d => d.primaryTitle);

    runtimeLabels.enter()
        .append("text")
        .attr("class", "top10-bar-runtime-label")
        .attr("text-anchor", "start")
        .attr("fill", "white")
        .attr("font-size", "12px")
        .attr("x", d => top10_x_scale(d.fixed_minutes)+150)
        .attr("y", (d,i) => top10_y_scale(i+1) + top10_y_scale.bandwidth()/2 + 4)
        .text(d => `${d.fixed_minutes} min`);
    
    //console.log combined viewcount
    let totalViews = d3.sum(top10, d => d.Views);
    console.log("Total Views for Top 10 Movies:", totalViews);
    
    // add views for each film at base of each bar. class("top10-viewcount-label")
    const viewcountLabels = top_10_figure.selectAll(".top10-viewcount-label")
        .data(top10, d => d.primaryTitle);

    viewcountLabels.enter()
        .append("text")
        .attr("class", "top10-viewcount-label")
        .attr("text-anchor", "start")
        .attr("fill", "black")
        .attr("font-size", "10px")
        .attr("x", intro_margins.left + 5 )
        .attr("y", (d,i) => top10_y_scale(i+1) + top10_y_scale.bandwidth()/2 + 4)
        .text(d => `${d3.format(",")(d.Views)} views`);

    // Intro scatterplot:
    // domains for intro scatterplot scales
    intro_x_scale.domain(d3.extent(data, d => d.fixed_minutes)).nice();
    intro_y_scale.domain(d3.extent(data, d => d.Views)).nice();

    // select svg
    const intro_scatterplot_svg = d3.select("#intro_scatterplot_svg");

    // draw points
    intro_scatterplot_svg.selectAll(".intro-point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "intro-point")
        .attr("cx", d => intro_x_scale(d.fixed_minutes))
        .attr("cy", d => intro_y_scale(d.Views))
        .attr("r", 4)
        .attr("fill", d => {
            if (d.genres.includes("Animation")) return color_scale("Animation");
            if (d.genres.includes("Romance")) return color_scale("Romance");
            return color_scale(d.genres[0]);
        }) // add tooltip
        .on("mouseover", function(event, d) {
            const tooltip = d3.select("#tooltip");
            tooltip
                .style("display", "block")
                .html(
                    `<strong>${d.primaryTitle}</strong><br/>
                    ${d.fixed_minutes} min<br/>
                    ${d.genres.join(", ")}<br/>
                    ${d3.format(",")(d.Views)} views`
                );
            d3.select(this)
                .attr("stroke", "#fff")
                .attr("stroke-width", 2)
                .attr("r", 6); // increase r to 6 on hover
        })
        .on("mousemove", function(event) {
            const tooltip = d3.select("#tooltip");
            tooltip
                .style("left", (event.pageX + 16) + "px")
                .style("top", (event.pageY - 24) + "px");
        })
        .on("mouseleave", function() {
            const tooltip = d3.select("#tooltip");
            tooltip.style("display", "none");
            d3.select(this)
                .attr("stroke", null)
                .attr("stroke-width", null)
                .attr("r", 4); // decrease r back to 4 on mouseleave
        });
    //highlight top 10 movies in intro scatterplot
    intro_scatterplot_svg.selectAll(".intro-point")
        .attr("stroke", d => top10.includes(d) ? "#ffb700ff" : null)
        .attr("stroke-width", d => top10.includes(d) ? 2 : null)
        .attr("r", d => top10.includes(d) ? 8 : 4)
        //mouse leave should not remove highlight or radius for top10
        .on("mouseleave", function(event, d) {
            const tooltip = d3.select("#tooltip");
            tooltip.style("display", "none");
            d3.select(this)
                .attr("stroke", d => top10.includes(d) ? "#ffb700ff" : null)
                .attr("stroke-width", d => top10.includes(d) ? 2 : null)
                .attr("r", d => top10.includes(d) ? 8 : 4); // keep radius for top10
        });
        

    // Update axes
    intro_scatterplot_svg.select(".intro_scatter_x-axis")
        .call(d3.axisBottom(intro_x_scale).ticks(6).tickFormat(d => d + " min"))
        .selectAll("path, line") // Select axis lines and ticks
        .attr("stroke", "white"); // Set stroke to white

    intro_scatterplot_svg.select(".intro_scatter_y-axis")
        .call(d3.axisLeft(intro_y_scale).ticks(6).tickFormat(d3.format(".2s")))
        .selectAll("path, line") // Select axis lines and ticks
        .attr("stroke", "white"); // Set stroke to white

    // Update axis text labels to white
    intro_scatterplot_svg.selectAll(".intro_scatter_x-axis text, .intro_scatter_y-axis text")
        .attr("fill", "white");
    
}




// Initialize Scrollama
const scroller = scrollama();

// Handle scroll events
scroller
  .setup({
    step: ".step",
    offset: 0.5,
    debug: false,
  })
  .onStepEnter((response) => {
    const stepIndex = response.index;
    handleStepChange(stepIndex);
  });

function handleStepChange(stepIndex) {
  if (stepIndex === 0) {
    // Intro step: Show all data
    state.filters.checked = genres;
  } else if (stepIndex === 1) {
    // Focus on Animation genre
    state.filters.checked = ["Animation"];
  } else if (stepIndex === 2) {
    // Focus on Action genre
    state.filters.checked = ["Action"];
  } else if (stepIndex === 3) {
    // Focus on Comedy genre
    state.filters.checked = ["Romance"];
  }

  // Redraw the visualization with the updated filters
  draw();
}

// Ensure the layout updates on resize
window.addEventListener("resize", scroller.resize);
load_data();