d3.json("Obsidian_Raw.json").then(data => {
    const svg = d3.select("#canvas");
    const width = window.innerWidth;
    const height = window.innerHeight/1.5 ;        
    svg.attr("width", width).attr("height", height);

    // standardize them margins
    const marginTop = 30;
    const marginRight = 30;
    const marginBottom = 40;
    const marginLeft = 60;

    // Keys for the streamgraph
    const keys = [
        "Obsidian_Harvested",
        "Poseidon_Harvested",
    ]; // in this order so processed on the outside

    // stack data
    console.log(data);
    console.log(keys);


    // VScode AI (GPT-4.1) helped me with this stacking and y-scaling
    const stack = d3.stack()
        .keys(keys)
        .offset(d3.stackOffsetNone); // creates a function which stacks the data based on the inputted keys
    const series = stack(data); //call this function on our data
    console.log(series);

    // Set up scales
    const tons = data.map(d => d.Total_H)
    console.log(tons);

    const years = data.map(d => d.Year);
    const xScale = d3.scaleLinear()
        .domain(d3.extent(years)) // gives the minimum and maximum year
        .range([marginLeft, width - marginRight]);

    // Find y extent for scaling
    const yExtent = [
        d3.min(series, layer => d3.min(layer, d => d[0])),
        d3.max(series, layer => d3.max(layer, d => d[1]))
    ];

    const yScale = d3.scaleLinear()
        .domain(yExtent)
        .range([height - marginBottom, marginTop]);

    // Color Scale
    const color = d3.scaleOrdinal()
        .domain(keys)
        .range(["#8a0b39", "#3951d4ff", "#8a0b3a97", "#3950d487"]); // keep these fixed, only have 4


    // Set up center of graph and radius
    const centerX = width / 2;
    const centerY = height / 2;
    const innerRadius = 80;
    const outerRadius = Math.min(width, height) / 2 - 20;

    // Angle scale for years (AI helped here)
    const angle = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Year)) //gives min and max year in dataset
        .range([0, 2 * Math.PI]); // scale is from 0 to 2pi radians

    // Radial scale for stacked values
    const maxY = d3.max(series, layer => d3.max(layer, d => d[1])); // look through series, look at each layer's d[1] top value, and find the highest
    const r = d3.scaleLinear() 
        .domain([0, maxY]) // from 0 to the highest stacked value, as calculated above
        .range([innerRadius, outerRadius]); //output to the min and max radius we've specified

    // Radial area generator
    const radialArea = d3.areaRadial() // this function will generate an area from a baseline and topline
        .angle((d, i) => angle(data[i].Year)) //turn each year into an angle
        // specifcy inner and outer radius of area by the stacked data
        .innerRadius(d => r(d[0])) //take the bottom value of the stack
        .outerRadius(d => r(d[1])) //take the top value of the stack
        .curve(d3.curveCatmullRomClosed); //make it a curve

    // Draw layers
    svg.selectAll("path")
        .data(series)
        .join("path")
        .attr("fill", (d, i) => color(keys[i]))
        .attr("d", d => radialArea(d)) // for each layer draw the radial area
        .attr("transform", `translate(${centerX},${centerY})`); // center on canvas

    // Draw circular axis
    const axisRadius = 60;
    svg.append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", axisRadius)
        .attr("fill", "none")

    // "Axis Labels"
    years.forEach((year, i) => {
        const a = angle(year) - Math.PI / 2; // rotate so 0 is at top
        const maxOuter = d3.max(series, layer => layer[i][1]);
        let lineRadius = r(maxOuter); // make it extend a bit past the outer edge

        if (i == years.length-1) lineRadius = r(maxOuter) + 10
        svg.append("line")
            .attr("x1", centerX)
            .attr("y1", centerY)
            .attr("x2", centerX + lineRadius * Math.cos(a))
            .attr("y2", centerY + lineRadius * Math.sin(a))
            .attr("stroke", "#000000ff")
            .attr("stroke-dasharray", "3 3")
            .attr("stroke-width", 1.5);

        const spacer = 30
        let labelX = centerX + (lineRadius + spacer)* Math.cos(a);
        let labelY = centerY + (lineRadius + spacer) * Math.sin(a);

        // Manually shift first and last years
        if (i === years.length-1) labelX -= 50, labelY += -1; 
        if (i === 0) labelX += 50, labelY += -20;

        const rotation = (a * 180 / Math.PI) + 90; //rotate to be tangent
        const displayRotation = rotation > 90 && rotation < 270 ? rotation + 180 : rotation; // flip upside-down labels. GPT-4.1 helped me with this logic
        const textElem = svg.append("text")
            .attr("x", labelX)
            .attr("y", labelY)
            .attr("transform", `rotate(${displayRotation},${labelX},${labelY})`)
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("font-size", 15)
            .attr("fill", "#000");

        textElem.append("tspan")
            .text(year.toString() + " ");

        textElem.append("tspan")
            .text(`(${tons[i].toString()})`)
            .attr("fill", "#000000ff") // or any color you want
            .attr("font-size", 12);    // or any style you want
    });




    // legend
    const legend = svg.selectAll(".legend")
        .data(keys)
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0, ${i * 1})`);
    
    legend.append("rect")
        .attr("x", 20)
        .attr("y", (d, i) => 25 + i * 25)
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", d => color(d));
    
    legend.append("text")
        .attr("x", 50)
        .attr("y", (d, i) => 40 + i * 25)
        .text(d => d.replace("_Harvested", "").replace("Obsidian", "Obsidian Ridge Vineyard").replace("Poseidon", "Poseidon Vineyard"))
        .attr("text-anchor", "start")
        .attr("font-size", 15)
        .attr("fill", "#000");

    //Legend Title
    svg.append("text")
        .attr("x", 20)
        .attr("y", 15)
        .text("Year (Tons)")
        .attr("font-size", 18)
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("class", "legend_title");
    
});





    