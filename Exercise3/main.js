// Two plots: 
    // Scatterplot on the left taking up 1/2 window.width
        //Scatterplot from exercise 2
        // runtime and viewcount 
    // Barplot on right taking up 1/2 window.width
        //text frequency from title
        //or title length (number of words, or number of characters?)


// Movie Data


//Legend:
    // Checkboxes filter out pre-selected genres
    // this needs a state variable to hold which genres are checked

// Slider:
    // filter movies by viewcount (vertically)


// -----------------------------------------------------------------------
//  Variabes and Constants
// -----------------------------------------------------------------------




let dimensions = [window.innerWidth/1.9, window.innerHeight] // dimensions shared for each plot
let margins = {top: 20, right: 50, bottom: 30, left: 50}; // shared 



// Genres:
let genres = ["Action", "Comedy", "Drama", "Romance", "Adventure", "Animation", "Documentary", "Family", "Biography", "Horror"];

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

  

  
    // drawing can only happen after data is here
    draw();

}



function initializeLayout(){
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
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${svgHeight - margins.bottom})`);

    barplot_svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margins.left},0)`);

}


function draw(){
    // data will be changed here based on state filters
    

    console.log("Data sample:", data[0]);
    console.log("fixed_minutes extent:", d3.extent(data, d => d.fixed_minutes));
    console.log("Views extent:", d3.extent(data, d => d.Views));
    console.log("SVG exists:", d3.select("#scatterplot_svg").size());

    // Scatterplot:

    // domains for scales
    x_scale.domain(d3.extent(data, d => d.fixed_minutes)).nice();
    y_scale.domain(d3.extent(data, d => d.Views)).nice();
        //color has been set already

    // select svg
    const scatterplot_svg = d3.select("#scatterplot_svg");

    // draw points
    const points = scatterplot_svg.selectAll(".point")
        .data(data, d => d.title); // use title as key

    points.enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", d => x_scale(d.fixed_minutes))
        .attr("cy", d => y_scale(d.Views))
        .attr("r", 3)
        .attr("fill", d => color_scale(d.genres[0])); // color by first genre

    // update axes
    scatterplot_svg.select(".scatter_x-axis")
        .call(d3.axisBottom(x_scale).ticks(6).tickFormat(d => d + " min"));

    scatterplot_svg.select(".scatter_y-axis")
        .call(d3.axisLeft(y_scale).ticks(6).tickFormat(d3.format(".2s")));
   



   





}





load_data();