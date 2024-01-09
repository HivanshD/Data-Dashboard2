selectedGenres = []
const customColorArray = [
  "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
  "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
  "#FF5733", "#33FF57", "#5733FF" // Add more colors as needed
];// Set up SVG dimensions for the bar chart


const barChartWidth = 400;
const barChartHeight = 450;
const barChartMargin = { top: 30, right: 10, bottom: 200, left: 80 };
const barChartSvg = d3.select("#bar-chart-container")
.append("svg")
.attr("width", barChartWidth + barChartMargin.left + barChartMargin.right)
.attr("height", barChartHeight + barChartMargin.top + barChartMargin.bottom + 200)
.append("g")
.attr("transform", "translate(" + barChartMargin.left + "," + barChartMargin.top + ")");

// Load data from CSV file for the bar chart
d3.csv("imdb_top_1000.csv").then(function(data) {
  
  data.forEach(function(d) {
    d.IMDB_Rating = +d.IMDB_Rating;
    d.Genre = d.Genre.split(',')[0].trim();
  });

  console.log("Unique Genres after Data Processing:", [...new Set(data.map(d => d.Genre))]);

  const y = d3.scaleBand().range([barChartHeight, 0]).padding(0.1);
  // Set the domain of the y scale to include all unique genres
  y.domain([...new Set(data.map(d => d.Genre))]);
  const x = d3.scaleLinear().range([0, barChartWidth]);

  // Calculate the average IMDb rating for each genre
  const averageRatings = Array.from(y.domain(), genre => {
    const genreData = data.filter(d => d.Genre === genre);
    const averageRating = d3.mean(genreData, d => d.IMDB_Rating);
    return { genre, averageRating };
  });


  x.domain([0, d3.max(averageRatings, d => d.averageRating)]);

  
  const customColorArray = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
    "#FF5733", "#33FF57", "#5733FF" // Add more colors as needed
  ];
  const barChartColor = d3.scaleOrdinal()
    .range(customColorArray)
    .domain(data.map(d => d.Genre));

  console.log("Data before creating bars:", data);
  
  barChartSvg.selectAll(".bar")
    .data(averageRatings)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("y", d => y(d.genre))
    .attr("height", y.bandwidth())
    .attr("x", 0)
    .attr("width", d => x(d.averageRating))
    .attr("fill", d => barChartColor(d.genre))
    .on("click", function (event, d) {
      const selectedGenre = d.genre;

      
      const index = selectedGenres.indexOf(selectedGenre);

      if (index === -1) {
        
        selectedGenres.push(selectedGenre);
      } else {
        
        selectedGenres.splice(index, 1);
      }

      // Update the appearance of bars based on selection
      barChartSvg.selectAll(".bar")
        .attr("fill", d => selectedGenres.includes(d.genre) ? "black" : barChartColor(d.genre));

      // Update the scatterplot matrix based on selection
      scatterplotMatrixSvg.selectAll(".dot")
        .classed("hidden", function (point) {
          // Hide points if their genre is in the selected genres array
          return selectedGenres.includes(point.Genre.split(',')[0].trim());
        });
      parallelSvg.selectAll(".line")
          .classed("hidden", function (line) {
            // Hide lines if their genre is in the selected genres array
            return selectedGenres.includes(line.Genre.split(',')[0].trim());
          });
      });
    

  barChartSvg.append("g")
    .call(d3.axisLeft(y));

  barChartSvg.append("g")
    .attr("transform", "translate(0," + barChartHeight + ")") // Adjust the translation here
    .call(d3.axisBottom(x).ticks(5));

  barChartSvg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - barChartMargin.left)
    .attr("x", 0 - barChartHeight / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Genre");

  barChartSvg.append("text")
    .attr("y", barChartHeight) // Adjust the vertical position
    .attr("x", barChartWidth / 2)
    .attr("dy", "2em") // Adjust the distance below the x-axis
    .style("text-anchor", "middle")
    .text("Average IMDb Rating");

  barChartSvg.selectAll(".bar-text")
    .data(averageRatings)
    .enter().append("text")
    .attr("class", "bar-text")
    .attr("x", d => x(d.averageRating)) // Adjust the position as needed
    .attr("y", d => y(d.genre) + y.bandwidth() / 2)
    .attr("dy", "0.5em")
    .attr("dx", 5) // Adjust the horizontal position
    .style("font-size", "10px")
    .style("fill", "black")
    .text(d => d3.format(".2f")(d.averageRating));
});

const matrixWidth = 500;
const matrixHeight = 500;
const matrixMargin = { top: 30, right: 10, bottom: 10, left: 80 };
const scatterplotSize = (matrixWidth - matrixMargin.left - matrixMargin.right) / 5; // Assuming 5 scatterplots in a row

const scatterplotMatrixSvg = d3.select("#scatterplot-matrix-container")
  .append("svg")
  .attr("width", matrixWidth + 1500)
  .attr("height", matrixHeight)
  .append("g")
  .attr("transform", "translate(" + matrixMargin.left + "," + matrixMargin.top + ")");

d3.csv("imdb_top_1000.csv").then(function(data) {
  // Data processing for the scatterplot matrix
  data.forEach(function(d) {
    d.IMDB_Rating = +d.IMDB_Rating;
    d.Meta_score = +d.Meta_score;
    d.No_of_Votes = +d.No_of_Votes;
    d.Runtime = +d.Runtime.replace(' min', ''); // Extract numeric part of Runtime
    d.Gross = +d.Gross.replace(/,/g, ''); // Remove commas from Gross and convert to numeric
  });

  // Define numerical attributes for the scatterplot matrix
  const attributes = ["IMDB_Rating", "Meta_score", "No_of_Votes", "Runtime", "Gross"];

  // Create scales for the scatterplot matrix
  const scales = {};
  attributes.forEach(attr => {
    scales[attr] = d3.scaleLinear()
      .domain(d3.extent(data, d => d[attr]))
      .range([scatterplotSize, 0]);
  });

  const axes = {};
  attributes.forEach(attr => {
    axes[attr] = d3.axisLeft(scales[attr]).ticks(5);
  });

  const scatterplotColor = d3.scaleOrdinal()
    .range(customColorArray) // Use the same custom color array as in the bar chart
    .domain(data.map(d => d.Genre.split(',')[0].trim()));

  attributes.forEach((attrX, i) => {
    attributes.forEach((attrY, j) => {
      document.getElementById("gross-slider").addEventListener("input", function () {
            const sliderValue = +this.value;

            
            const filteredData = data.filter(d => d.Gross >= sliderValue);

            
            scatterplotMatrixSvg.selectAll(".dot")
              .attr("fill", d => scatterplotColor(d.Genre.split(',')[0].trim()))
              .classed("hidden", d => sliderValue > 0 && d.Gross < sliderValue);
          });
      const scatterplotX = i * scatterplotSize;
      const scatterplotY = j * scatterplotSize;

      const scatterplot = scatterplotMatrixSvg.append("g")
        .attr("transform", "translate(" + scatterplotX + "," + scatterplotY + ")");

      
      scatterplot.append("rect")
        .attr("width", scatterplotSize)
        .attr("height", scatterplotSize)
        .style("fill", "none")
        .style("stroke", "#ccc")
        .style("stroke-width", 1)
        .attr("class", "correlation-rect") // Add a class for easy selection
          
     
      if (attrX === attrY) {
        scatterplot.append("text")
          .attr("x", scatterplotSize / 2)
          .attr("y", scatterplotSize / 2)
          .style("text-anchor", "middle")
          .style("dominant-baseline", "central")
          .text(attrX);
      } else {
        
        scatterplot.selectAll(".dot")
          .data(data)
          .enter().append("circle")
          .attr("class", "dot")
          .attr("cx", d => scales[attrX](d[attrX]))
          .attr("cy", d => scales[attrY](d[attrY]))
          .attr("r", 3)
          .attr("fill", d => scatterplotColor(d.Genre.split(',')[0].trim())); // Use the first genre for coloring
      }
      
   
      if (j === attributes.length - 1) {
        scatterplot.append("g")
          .attr("class", "axis")
          .attr("transform", "translate(0," + scatterplotSize + ")")
          .call(axes[attrX]);
      }

      if (i === 0) {
        scatterplot.append("g")
          .attr("class", "axis")
          .call(d3.axisLeft(scales[attrY]).ticks(5));
      }
    });
  });

});

    const parallelWidth = 700;
    const parallelHeight = 600;
    const parallelMargin = { top: 0, right: 10, bottom: 30, left: 80 };

    
    const parallelSvg = d3.select("#parallel-coordinates-container")
      .append("svg")
      .attr("width", parallelWidth + parallelMargin.left + parallelMargin.right)
      .attr("height", parallelHeight + parallelMargin.top + parallelMargin.bottom + 200)
      .append("g")
      .attr("transform", "translate(" + parallelMargin.left + "," + parallelMargin.top + ")");

    
    d3.csv("imdb_top_1000.csv").then(function(data) {
      
      data.forEach(function(d) {
        d.IMDB_Rating = +d.IMDB_Rating;
        d.Meta_score = +d.Meta_score;
        d.No_of_Votes = +d.No_of_Votes;

        
        d.Runtime = +d.Runtime.replace(' min', '');

        // Remove commas from Gross and convert to numeric
        d.Gross = +d.Gross.replace(/,/g, '');
      });

      // Define attributes for the parallel coordinates chart
      const parallelAttributes = ["IMDB_Rating", "Meta_score", "No_of_Votes", "Runtime", "Gross"];

      // Create scales for the parallel coordinates chart
      const parallelScales = {};
      parallelAttributes.forEach(attr => {
        parallelScales[attr] = d3.scaleLinear()
          .domain(d3.extent(data, d => +d[attr]))
          .range([parallelHeight, 0]);
      });

      // Create axes for the parallel coordinates chart
      const parallelAxes = {};
      parallelAttributes.forEach(attr => {
        parallelAxes[attr] = d3.axisLeft(parallelScales[attr]).ticks(5);
      });

      
      const parallelColor = d3.scaleOrdinal()
        .range(customColorArray)
        .domain(data.map(d => d.Genre.split(',')[0].trim()));

     
      const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

     
      parallelSvg
        .selectAll(".line")
        .data(data)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("d", (d) =>
          d3.line()(
            parallelAttributes.map((attr, i) => [
              i * (parallelWidth / (parallelAttributes.length - 1)),
              parallelScales[attr](d[attr]),
            ])
          )
        )
        .attr("fill", "none")
        .attr("stroke", (d) => parallelColor(d.Genre.split(",")[0].trim()))
        .on("mouseover", function (event, d) {
          tooltip.transition()
            .duration(200)
            .style("opacity", .9);
          tooltip.html("Genre: " + d.Genre + "<br>" +
            "IMDB Rating: " + d.IMDB_Rating + "<br>" +
            "Meta Score: " + d.Meta_score + "<br>" +
            "No of Votes: " + d.No_of_Votes + "<br>" +
            "Runtime: " + d.Runtime + "<br>" +
            "Gross: " + d.Gross)
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function (d) {
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        });
      document.getElementById("gross-slider").addEventListener("input", function () {
        const sliderValue = +this.value;

        
        parallelSvg.selectAll(".line")
          .attr("stroke", d => parallelColor(d.Genre.split(',')[0].trim()))
          .classed("hidden", d => sliderValue > 0 && d.Gross < sliderValue);
      });

     
      parallelAttributes.forEach((attr, i) => {
        
        parallelSvg
          .append("g")
          .attr("class", "axis")
          .attr(
            "transform",
            "translate(" + i * (parallelWidth / (parallelAttributes.length - 1)) + ",0)"
          )
          .call(parallelAxes[attr]);
      });

     
      parallelSvg.append("text")
        .attr("x", parallelWidth / 2)
        .attr("y", -20)
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .style("font-size", "16px")
        .text("Parallel Coordinates Chart");

     
      parallelSvg.append("text")
        .attr("x", parallelWidth / 2)
        .attr("y", parallelHeight + parallelMargin.bottom - 10)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Genre Legend");

     
      const legend = parallelSvg.selectAll(".legend")
        .data(parallelColor.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => "translate(" + i * 60 + "," + (parallelHeight + parallelMargin.bottom) + ")");

      legend.append("rect")
        .attr("x", 0)
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", parallelColor);

      legend.append("text")
        .attr("x", 30)
        .attr("y", 10)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .style("font-size", "12px")
        .text(d => d);
    });
  const timeGraphWidth = 600;
  const timeGraphHeight = 250;
  const timeGraphMargin = { top: 30, right: 10, bottom: 30, left: 80 };
  const timeGraphSvg = d3.select("#time-graph-container")
    .append("svg")
    .attr("width", timeGraphWidth + timeGraphMargin.left + timeGraphMargin.right)
    .attr("height", timeGraphHeight + timeGraphMargin.top + timeGraphMargin.bottom+ 300)
    .append("g")
    .attr("transform", "translate(" + timeGraphMargin.left + "," + timeGraphMargin.top + ")");

 
  const parseDate = d3.timeParse("%Y");

  
  const timeGraphXScale = d3.scaleTime().range([0, timeGraphWidth]);
  const timeGraphYScale = d3.scaleLinear().range([timeGraphHeight, 0]);

  
  const line = d3.line()
    .x(d => timeGraphXScale(d.Released_Year))
    .y(d => timeGraphYScale(d.Gross));

  
  d3.csv("imdb_top_1000.csv").then(function(data) {
    // Data processing for the time graph
    data.forEach(function(d) {
      d.Released_Year = parseDate(d.Released_Year);
      d.Gross = +d.Gross.replace(/,/g, ''); 
    });

    
    timeGraphXScale.domain(d3.extent(data, d => d.Released_Year));
    timeGraphYScale.domain([0, d3.max(data, d => d.Gross)]);

    timeGraphSvg.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", line)
      .style("stroke", "steelblue")
      .style("fill", "none");

    timeGraphSvg.append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + timeGraphHeight + ")")
      .call(d3.axisBottom(timeGraphXScale));

    timeGraphSvg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(timeGraphYScale));

    timeGraphSvg.append("text")
      .attr("x", timeGraphWidth / 2)
      .attr("y", -10)
      .style("text-anchor", "middle")
      .style("font-weight", "bold")
      .style("font-size", "16px")
      .text("Time Graph - Gross Over Years");

    const zoom = d3.zoom()
      .scaleExtent([1, 10])
      .on("zoom", zoomed);

    timeGraphSvg.call(zoom);

    function zoomed(event) {
      const newTransform = event.transform;
      timeGraphSvg.select(".x-axis").call(d3.axisBottom(newTransform.rescaleX(timeGraphXScale)));
      timeGraphSvg.select(".line").attr("d", line.x(d => newTransform.applyX(timeGraphXScale(d.Released_Year))));
    }
  });
 