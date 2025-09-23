// canvas


data = d3.json("Obsidian_Raw.json").then(function(data) {
    //xScale (years)
    console.log(data);
    console.log(typeof(data));

    const series = d3.stack()
        .keys(["Poseidon_Processed","Obsidian_Processed",])
        (data);
    // ai (GPT-4.1) helped me stack this
    
    const svg = d3.select("#canvas");
    const width = window.innerWidth;
    const height = window.innerHeight;        
    svg.attr("width", width).attr("height", height);

    //margins (standard from d3 Observable example)
    const marginTop = 30;
    const marginRight = 0;
    const marginBottom = 30;
    const marginLeft = 40;

    // xScale
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.Year))
        .range([marginLeft, width - marginRight])

    // yScale
    const yMax = d3.max(data, d => d.Obsidian_Harvested + d.Poseidon_Harvested + d.Obsidian_Processed + d.Poseidon_Processed);
    const yScale = d3.scaleLinear()
        .domain([0, yMax])
        .range([height - marginBottom, marginTop]);

    // have created the container already

    const colors = ["#8a0b39", "#390eaeff", "#797777ff", "#b5b3b3ff"]; // want these to be custom

    svg.append("g")
        .selectAll("g")
        .data(series)
        .join("g")
            .attr("fill", (d, i) => colors[i])
        .selectAll("rect")
        .data(d => d)
        .join("rect")
            .attr("x", (d, i) => xScale(data[i].Year))
            .attr("y", d => yScale(d[1]))
            .attr("height", d => yScale(d[0]) - yScale(d[1]))
            .attr("width", xScale.bandwidth());


    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(xScale).tickSizeOuter(0));

})
