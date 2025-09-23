d3.json("Obsidian_Raw.json").then(data => {
    const svg = d3.select("#canvas");
    const width = window.innerWidth;
    const height = window.innerHeight;        
    svg.attr("width", width).attr("height", height);

    // standardize them magins
    const marginTop = 30;
    const marginRight = 30;
    const marginBottom = 40;
    const marginLeft = 60;

    // Keys for the streamgraph
    const keys = [
        "Obsidian_Harvested",
        "Poseidon_Harvested",
        "Obsidian_Processed",
        "Poseidon_Processed",
    ]; // in this order so processed on the outside

    const keysP = [
        "Obsidian_Processed",
        "Poseidon_Processed",
    ];


    // Set up scales
    const years = data.map(d => d.Year);

    const xScale = d3.scaleLinear()
        .domain(d3.extent(years)) // gives the minimum and maximum year
        .range([marginLeft, width - marginRight]);


    const stack = d3.stack()
        .keys(keys)
        .offset(d3.stackOffsetNone);
    const series = stack(data);

    const stack_P = d3.stack()
        .keys(keysP)
        .offset(d3.stackOffsetNone);
    const series_P = stack_P(data);


    // Find y extent for scaling
    const yExtent = [
        d3.min(series, layer => d3.min(layer, d => d[0])),
        d3.max(series, layer => d3.max(layer, d => d[1]))
    ];

    const yScale = d3.scaleLinear()
        .domain(yExtent)
        .range([height - marginBottom, marginTop]);

    // Color scale for the layers
    const color = d3.scaleOrdinal()
        .domain(keys)
        .range(["#8a0b39", "#390eaeff", "#797777ff", "#b5b3b3ff"]);

    const color2 = d3.scaleOrdinal()
        .domain(keysP)
        .range(["#454545ff", "#d1cfcfff"]);
    // Assume: data, keys, stack, series, color are already defined as in your code

    // Area generator
    const area = d3.area()
        .x((d, i) => xScale(data[i].Year))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]))
        .curve(d3.curveCardinal.tension(.7)
);

    // Draw the streamgraph layers
    svg.append("g")
        .attr("class","default_group")
        .selectAll("path")
        .data(series)
        .join("path")
        .attr("fill", (d, i) => color(keys[i]))
        .attr("d", d => area(d));

    // svg.append("g")
    //     .attr("class","alt_group")
    //     .selectAll("path")
    //     .data(series_P)
    //     .join("path")
    //     .attr("fill", (d,i) => color2(keys[i]))
    //     .attr("d", d => area(d))
    //     .attr("")
    //     .style("opacity",0.3)

    // X Axis (years)
    svg.append("g")
        .attr("transform", `translate(0,${height-30})`)
        .call(d3.axisBottom(xScale).ticks(10).tickFormat(d3.format("d")));

    // Y Axis
    svg.append("g")
        .attr("transform", `translate(50,0)`)
        .call(d3.axisLeft(yScale));


    


    // second canvas
    const svg2 = d3.select("#canvas2")
    svg2.attr("width", width).attr("height", height);

    const centerX = width / 2;
    const centerY = height / 2;
    const innerRadius = 80;
    const outerRadius = Math.min(width, height) / 2 - 20;


    const angle = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Year))
        .range([0, 2 * Math.PI]);

    // Radial scale for stacked values
    const maxY = d3.max(series, layer => d3.max(layer, d => d[1]));
    const r = d3.scaleLinear()
        .domain([0, maxY])
        .range([innerRadius, outerRadius]);

    // Radial area generator
    const radialArea = d3.areaRadial()
        .angle((d, i) => angle(data[i].Year))
        .innerRadius(d => r(d[0]))
        .outerRadius(d => r(d[1]))
        .curve(d3.curveCatmullRomClosed);

    // Draw layers
    svg2.selectAll("path")
        .data(series)
        .join("path")
        .attr("fill", (d, i) => color(keys[i]))
        .attr("d", d => radialArea(d))
        .attr("transform", `translate(${centerX},${centerY})`);

    // Draw circular axis
    const axisRadius = 60;
    svg2.append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", axisRadius)
        .attr("fill", "none")

    // "Axis Labels"
    years.forEach((year, i) => {
        const a = angle(year) - Math.PI / 2; // rotate so 0 is at top
        const maxOuter = d3.max(series, layer => layer[i][1]);
        const lineRadius = r(maxOuter);

        svg2.append("line")
            .attr("x1", centerX)
            .attr("y1", centerY)
            .attr("x2", centerX + lineRadius * Math.cos(a))
            .attr("y2", centerY + lineRadius * Math.sin(a))
            .attr("stroke", "#000000ff")
            .attr("stroke-dasharray", "2 2")
            .attr("stroke-width", 1);

        const spacer = 30
        let labelX = centerX + (lineRadius + spacer )* Math.cos(a);
        let labelY = centerY + (lineRadius + spacer) * Math.sin(a);

        // Offset first and last label horizontally
        if (i === 0) labelX -= 40; // shift first label left
        if (i === years.length - 1) labelX += 40, labelY += -10; // shift last label right

        
        const rotation = (a * 180 / Math.PI) + 90; //rotate to be tangent
        const displayRotation = rotation > 90 && rotation < 270 ? rotation + 180 : rotation;
        svg2.append("text")
            .attr("x", labelX )
            .attr("y", labelY)
            .attr("transform", `rotate(${displayRotation},${labelX},${labelY})`)
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("font-size", 15   )
            .attr("fill", "#000")
            .text(year);
    });

    svg2.selectAll("legend")
        .data(keys)
        .enter()
        .append("rect")
        .attr("x", 20)
        .attr("y", (d, i) => 20 + i * 25)
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", d => color(d));

    svg2.selectAll("legendLabels")
        .data(keys)
        .enter()
        .append("text")
        .attr("x", 50)
        .attr("y", (d, i) => 35 + i * 25)
        .text(d => d.replace("_", ", ").replace("Obsidian", "Obsidian Vineyard").replace("Poseidon", "Poseidon Vineyard"))
        .attr("text-anchor", "start")
        .attr("alignment-baseline", "middle")
        .attr("font-size", 15)
        .attr("fill", "#000");
    

});





    