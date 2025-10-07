# Exercise 2: Netflix Data Sketches
Note: I will be adding genre data from TMDB to my dataset. Genre could be added to most of my visualizations with color, or I could filter my visualizations by genre. However, genre is not integral to any of the questions asked by these sketches.

## Sketch 1: The Ideal Runtime
![Sketch_1](https://github.com/nmolnar-parsons/DataVisualizations_and_InformationAesthetics/blob/main/Exercise2/Sketches/Exercise2_sketch1.png)

A scatterplot with Density Contours (blobs, as drawn above) comparing #view to runtime to see what are the most watched runtimes. At first, the chart would contain both movie and tv-show data, but on scrolling down the page separate plots for movies and tv-shows will be drawn. Contours are overlaid on scatterplot data to show areas of high density, highlighting both the most popular runtime for specific media types and the "whitespace" - in this case, which runtimes are either too short or too long to be watch many times.

View and Runtime Scatterplot (with Density Contours)
https://observablehq.com/@d3/density-contours
https://observablehq.com/@observablehq/plot-point-cloud-density

## Sketch 2: Limited Series vs Season 1
![Sketch_2](https://github.com/nmolnar-parsons/DataVisualizations_and_InformationAesthetics/blob/main/Exercise2/Sketches/Exercise2_sketch2.png)

Miniseries - in netflix-speak, "Limited Series" have become very popular in the last few years. However, are they more popular than the Season 1's of multi-season shows? Are viewers more interested in shows that can promise more than one season? This scatterplot would compare #views to runtime (as in sketch 1), with the idea that Limited Series (squares) are often shorter runtimes than Season Ones (circles). Season Twos will be "added" to Season Ones - an arrow will be drawn from the Season 1 point to the Season 2 point, where the Season 2 point (x,y) is the sum of the runtime and #views of Season 1 and Season 2. This visualization will analyze if people prefer stories that extend beyond one season, or if a contained, tightly told story is more popular, and if adding a Season 2 is "worth it."

## Sketch 3: Days Available/Days Viewed?
![Sketch_4](https://github.com/nmolnar-parsons/DataVisualizations_and_InformationAesthetics/blob/main/Exercise2/Sketches/Exercise2_sketch4.png)

A scatterplot with a 1:1 x-y line. This would filter for media released after Jan 1 2025, and compare the number of days available to watch to the number of hours watched. Viral media would populate the top left of the graph, while less popular media would populate the bottom right, below the line. This graph would highlight recent hits and demonstrate the difficulty of popularity even for recently released media. A potential issue is scaling the number of hours watched on the y-axis.


