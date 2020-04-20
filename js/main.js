window.onbeforeunload = function () {
  window.scrollTo(0, 0);
}

// Add all scripts to the JS folder
function wrapper(){

//Set image width and height as percentages
//window width and height
var screenRatio = window.innerWidth/window.innerHeight;

// var imageRatio = image.naturalWidth/image.naturalHeight;
var imageRatio = 1.5
var width;
var currentDepth = 500;

if(imageRatio>screenRatio){
  width = 100;
  d3.select("figure.sticky").style("width", "100vw")
                            .style("height", 100/1.5+"vw");
} else {
  width = window.innerHeight * 1.6 / window.innerWidth * 100;
  d3.selectAll("figure.sticky").style("width", width + "vw")
                           .style("height", width/1.5+"vw")
                           .style("margin", "0 auto");
                           //.style("margin-left", (100-width)/2 + "%")
                          // .style("padding-top", 2+"px");
}

var h = $("figure.sticky").height();
var w = $("figure.sticky").width();

//set top of sticky position so it's centered vertically
var stickyH = $(".sticky").height();
var windowH = window.innerHeight;
var stickyTop = (windowH - stickyH)/2;
d3.select("figure.sticky").style("top",stickyTop+"px");

///////////////

var svg = d3.select("figure.map")
              .append("svg")
             .attr("viewBox", `0 0 ${w} ${h}`)
               //.attr("viewBox", `${l} ${t} ${w2} ${h2}`)             
              .attr("width",  "100%")
              .attr("height", "100%")
              .style("position","absolute");
              //.style("left", (100-width)/2 + "%")
              //.style("top", "0");

var depthGroup = svg.append("g")
                      .attr("class", "depthGroup")
                      .attr("opacity", 1);

var plantsGroup = svg.append("g")
                      .attr("class", "plantsGroup")
                      .attr("opacity", 0);

var enhancedGroup = svg.append("g")
                      .attr("class","enhancedGroup")
                      .attr("opacity", 0);

var hillshade = plantsGroup.append("image")
                      .attr("href", "img/dark_hillshade_2.jpg")
                      .attr("x", 0)
                      .attr("y", 0)
                      .attr("width", w+"px")
                      .attr("height", h+"px");

var enchancedPotential = enhancedGroup.append("image")
                      .attr("href", "img/egs_resource.jpg")
                      .attr("x", 0)
                      .attr("y", 0)
                      .attr("width", w+"px")
                      .attr("height", h+"px");



var imageData = [500,1000,1500,2000,2500,3000]


var images = depthGroup.selectAll(".stack")
                  .data(imageData)
                  .enter()
                  .append("image")
                  .attr("href", d=>`img/${d}.jpg`)
                  .attr("data-index", d=>d)
                  .attr("class", "stack")
                  .attr("opacity", function(d){
                    if(d==500) return 1;
                    else return 0;
                  })
                  .attr("x", 0)
                  .attr("y", 0)
                  .attr("width", w+"px")
                  .attr("height", h+"px");

  //create projection
  const albers = d3.geoConicEqualArea()
	                  .parallels([29.5, 45.5])
	                  .rotate([96, 0]) //center longitude
	                  .center([0,38.7]); //center latitude

  //path generator
  const path = d3.geoPath()
                 .projection(albers);

  var axisMarginTop = 100;
  var axisMargins = {
  	top: 100,
  	right: 60,
  	bottom: 50
  }

  var mobile = w < 600;

  if(mobile){
  	axisMargins = {
	  top: 20,
	  right: 40,
	  bottom: 20
  	}
  }

  //create y scale to show depth
  var yScale = d3.scaleLinear()
  				  .domain([0,3000])
  				  .range([axisMargins.top,h - axisMargins.bottom]);

  var scaleFactor = w/600;

  var rScale = d3.scaleSqrt()
            .domain([0,850])
            .range([0,30*scaleFactor]);

  var yAxis = d3.axisRight(yScale)
  					.ticks(5)
  					.tickFormat(d3.format("d"));

  var yAxis = depthGroup.append("g")
  					.attr("class", "yAxis")
  					.attr("transform", `translate(${w-axisMargins.right},0)`)
  					.call(yAxis);

  var depthMarker = depthGroup.append("path")
                .attr("d", "M 0 0 L 9 6 L 0 12 z")
                .attr("class", "depthMarker")
                .attr("fill", "#fff")
                .attr("stroke", "none")
                .attr("transform", `translate(${w-axisMargins.right-6},${yScale(currentDepth)-6})`);

  var depthText = d3.select("figure.map").append("p")
                            .attr("class", "depthText depth")
                            .html(`Depth:<br><span class="depthNumber">500</span>m`)
                            .style("bottom", h-axisMargins.top-10+"px")
                            .style("text-align", "right");

  function addDiscreteListeners(){
    
    var stepSel = d3.selectAll(".discrete");

    enterView({
      selector: stepSel.nodes(),
      offset: 0,
      enter: el=> {
        const index = d3.select(el).attr('forward');
        updateChart[index]();
      },
      exit: el => {
        let index = d3.select(el).attr('backward');
        updateChart[index]();
      }
    });
 }

////////////////////////////////////////////////////////////
/////////////////Load Data//////////////////////////
////////////////////////////////////////////////////////////


   Promise.all([
      d3.json("data/bounding_box_wgs84.geojson"),
      d3.json("data/states.json"),
      d3.json("data/operating_plants.geojson"),
      d3.json("data/forge.geojson")
    ])
    .then(function([boxJSON,states_topoJSON,operatingJSON,forgeJSON]){

    	var box = boxJSON.features;
    	var states = topojson.feature(states_topoJSON, states_topoJSON.objects.states).features;
      var operating = operatingJSON.features.sort(function(a,b){
          return b.properties["CAP_MW"] - a.properties["CAP_MW"];
      });
      var forge = forgeJSON.features;

      var geothermalStates = ["CA","ID","NM","NV","OR","UT"];

     	albers.fitExtent([[0,0],[w,h]], boxJSON);

     	var statesBorders = svg.append("g")
     					.selectAll(".states")
     					.data(states)
     					.enter()
     					.append("path")
     						.attr("d", path)
     						.attr("class", "states")
     						.attr("fill", "none")
            //with hillshade
                .attr("stroke", "#bbb")
               .attr("opacity", 0.5)
                .attr("stroke-width", 0.15)
            //with temperature
     						// .attr("stroke", "#fff")
           //     .attr("opacity", 0.5)
     						// .attr("stroke-width", 0.15)
                .attr("vector-effect", "non-scaling-stroke");


      //postal
      var stateLabels = plantsGroup.append("g")
                    .selectAll(".stateLabels")
                    .data(states)
                    .enter()
                    .append("text")
                        .attr("text-anchor", "middle")
                        .attr("x", function(d){
                          if(d.properties["postal"]!="CA"){
                            return path.centroid(d)[0];
                          }else {
                            return path.centroid(d)[0] - 10;
                          }
                        })
                        .attr("y", function(d){
                          if(d.properties["postal"]!="NV"){
                            return path.centroid(d)[1];
                          }else {
                            return path.centroid(d)[1] + 10;
                          }
                        })
                        .attr("fill", function(d){
                            var hasGeothermal = geothermalStates.indexOf(d.properties["postal"]) != -1
                            if(hasGeothermal){
                                return "#bbb";
                              } else {
                                return "#777";
                              }
                        })
                        .attr("font-size", function(d){
                            var hasGeothermal = geothermalStates.indexOf(d.properties["postal"]) != -1
                            if(hasGeothermal){
                                return 6;
                              } else {
                                return 6;
                              }
                        })
                        .attr("font-weight", function(d){
                              var hasGeothermal = geothermalStates.indexOf(d.properties["postal"]) != -1
                              if(hasGeothermal){
                                return "bold";
                              } else {
                                return "normal";
                              }
                        })
                        .text(function(d){
                            return d.properties["postal"];
                        })
		
      var geoAreaSymbols = plantsGroup.append("g")
                    .attr("class", "operatingGroup")
                    .selectAll(".operating")
                    .data(geoAreas)
                    .enter()
                    .append("circle")
                      .attr("cx", function(d){
                        return albers(d.geometry.coordinates)[0];
                    })
                      .attr("cy", function(d){
                          return albers(d.geometry.coordinates)[1];
                      })
                      .attr("r", function(d){
                        var totalMW= 0;
                        for(var plant of d.plants){
                            totalMW+=plant.properties["CAP_MW"];
                        }
                        return rScale(totalMW);
                      })
                      .attr("fill", "#5d95b3")
                      .attr("fill-opacity", 0.8)
                      .attr("stroke", "#c9e5f5")
                      .attr("stroke-width", 0.2);

    var legendValues = [100,500,1000];
    var legendSize = rScale.range()[1]*2.2+20;

    var legendDiv = d3.select("div.circleLegend .inner")
                                .style("width", legendSize+10+"px")
                                .style("height", legendSize+"px");


    //legend
    var circleLegend = legendDiv.append("svg")
                            .attr("width", "100%")
                            .attr("height", "100%")
                            .style("position", "absolute")
                            .style("top", "0px")
                            .style("left", "0px");

    var circleLegendCircles = circleLegend.selectAll(".legendCircles")
                            .data(legendValues)
                            .enter()
                            .append("circle")
                                .attr("r", d=>rScale(d))
                                .attr("cx", legendSize/2)
                                .attr("cy", d=> legendSize- rScale(d))
                                .attr("fill", "none")
                                .attr("stroke", "#c9e5f5")
                                .attr("stroke-width", 1);

    var legendLines = circleLegend.selectAll(".legendLines")
                            .data(legendValues)
                            .enter()
                            .append("line")
                                .attr("x1", legendSize/2)
                                .attr("x2", legendSize+10)
                                .attr("y1", d=>legendSize - rScale(d)*2)
                                .attr("y2", d=>legendSize - rScale(d)*2)
                                .attr("stroke", "#fff")
                                .attr("stroke-width", 1)

    var legendText = circleLegend.selectAll(".legendText")
                            .data(legendValues)
                            .enter()
                            .append("text")
                                .text(d=>d)
                                .attr("x", legendSize-15)
                                .attr("y", d=>legendSize - rScale(d)*2)
                                .attr("alignment-baseline", "bottom")
                                .attr("stroke", "#fff")
                                .attr("stroke-width", 1)


    //add utah forge site
    var forgeSite = enhancedGroup.selectAll(".forgeSite")
                                  .data(forge)
                                  .enter()
                                  .append("circle")
                                  .attr("cx", function(d){
                                      return albers(d.geometry.coordinates)[0];
                                  })
                                    .attr("cy", function(d){
                                        return albers(d.geometry.coordinates)[1];
                                  })
                                  .attr("r", 3)
                                  .attr("fill", "#fff")
                                  .attr("stroke", "none")
                                  .attr("stroke-width", 1.5);

    //add forge label
    var forgeLabel = enhancedGroup.selectAll(".forgeSiteLabel")
                                  .data(forge)
                                  .enter()
                                  .append("text")
                                  .attr("x", function(d){
                                      return albers(d.geometry.coordinates)[0]+3.5;
                                  })
                                    .attr("y", function(d){
                                        return albers(d.geometry.coordinates)[1]+12;
                                  })
                                  .attr("fill", "#fff")
                                  .attr("font-size", "12px")
                                  .text("FORGE site Milton, UT")
                                  .call(wrapText, 90, 12);



    addDiscreteListeners();

     });

//////////////////////////////////////////////////////////////////////
//////////////////1)Discrete Animations///////////////////////////////
//////////////////////////////////////////////////////////////////////

var updateChart = {
  zoomToOperating: function(){
    console.log("zoom to operating!");
    var l = 0*w,
    t= h*0.25,
    w2 = .5*w,
    h2 = .5*h;

    //reset rScale radius down simultaneously
    var newRange = rScale.range().map(e=>e/2);
    console.log(newRange);
    rScale.range(newRange);

    plantsGroup.selectAll("circle").transition("shrink").duration(2000)
                .attr("r", function(d){
                        var totalMW= 0;
                        for(var plant of d.plants){
                            totalMW+=plant.properties["CAP_MW"];
                        }
                        console.log(rScale(totalMW));
                        return rScale(totalMW);
                      });


    svg.transition("zoom in!").duration(2000).attr("viewBox", `${l} ${t} ${w2} ${h2}`);
  },
  addDeveloping: function(){
    console.log("add developing!");

  },
  removeDeveloping: function(){
    console.log("remove developing!");



  },
  zoomOut: function(){
    console.log("zoom out!");
    svg.transition("zoom out!").duration(2000).attr("viewBox", `0 0 ${w} ${h}`);

    //reset rScale radius down simultaneously
    var newRange = rScale.range().map(e=>e*2);
    rScale.range(newRange);

    plantsGroup.selectAll("circle").transition("grow").duration(2000)
                .attr("r", function(d){
                        var totalMW= 0;
                        for(var plant of d.plants){
                            totalMW+=plant.properties["CAP_MW"];
                        }
                        console.log(rScale(totalMW));
                        return rScale(totalMW);
                      });
  },
  fadeInDepth: function(){
    console.log("fade in depth!");
    //fade out hillshade and plants
    plantsGroup.transition("fadeOut")
              .duration(1000)
              .attr("opacity", 0);
    //fade out circle legend
    d3.select("div.circleLegend")
              .transition("fadeOut")
              .duration(1000)
              .style("opacity", 0);
    //fade in depth group
    depthGroup.transition("fadeIn")
            .duration(1000)
            .attr("opacity", 1);
    //fade in 500m
    depthGroup.select(`[data-index="${500}"]`)
            .transition("fadeIn")
            .duration(1000)
            .attr("opacity", 1);
    //fade in HTML depth elements
    d3.selectAll(".depth")
            .transition("fadeIn")
            .duration(1000)
            .style("opacity", 1);

  },
  fadeOutDepth: function(){
    console.log("fade out depth!");
    //fade in hillshade and plants
    plantsGroup.transition("fadeIn")
              .duration(1000)
              .attr("opacity", 1);
    //fade in circle legend
    d3.select("div.circleLegend")
              .transition("fadeIn")
              .duration(1000)
              .style("opacity", 1);
    //fade out depth group
    depthGroup.transition("fadeOut")
            .duration(1000)
            .attr("opacity", 0);
    //fade out 500m
    depthGroup.select(`[data-index="${500}"]`)
            .transition("fadeOut")
            .duration(1000)
            .attr("opacity", 0);
    //fade out HTML depth elements
    d3.selectAll(".depth")
            .transition("fadeOut")
            .duration(1000)
            .style("opacity", 0);

  },
  fadeInEGS: function(){
    console.log("fade in EGS!");
    //zoom out
    updateChart.zoomOut();
    //fade out hillshade and plants
    plantsGroup.transition("fadeOut")
              .duration(1000)
              .attr("opacity", 0);
    //fade out circle legend
    d3.select("div.circleLegend")
              .transition("fadeOut")
              .duration(1000)
              .style("opacity", 0);
    //fade in EGS
    enhancedGroup.transition("fadeIn")
              .duration(1000)
              .attr("opacity", 1);
    //fade in HTML enhanced elements
    d3.selectAll(".enhanced")
            .transition("fadeIn")
            .duration(1000)
            .style("opacity", 1);


  },
  fadeOutEGS: function(){
    console.log("fade out EGS!");
    //zoom back in
    updateChart.zoomToOperating();
    //fade in hillshade and plants
    plantsGroup.transition("fadeIn")
              .duration(1000)
              .attr("opacity", 1);
    //fade in circle legend
    d3.select("div.circleLegend")
              .transition("fadeIn")
              .duration(1000)
              .style("opacity", 1);
    //fade out EGS
    enhancedGroup.transition("fadeout")
              .duration(1000)
              .attr("opacity", 0);
    //fade out HTML enhanced elements
    d3.selectAll(".enhanced")
            .transition("fadeOut")
            .duration(1000)
            .style("opacity", 0);
  }
}

 


//////////////////////////////////////////////////////////////////////
//////////////////1)Smooth Animations, with RAF///////////////////////////////
//////////////////////////////////////////////////////////////////////

//observer for 1000
var observerOptions = {
  root: null,
  rootMargin: "0px",
  threshold: [0,0.1]
}

let observer = new IntersectionObserver(intersectionCallback, observerOptions);

var target = d3.select(".temperature").node();
observer.observe(target);

var latestKnownTop = window.innerHeight;
var ticking = false;

function onScroll(){
  latestKnownTop = target.getBoundingClientRect().top;
  requestTick();
}

function requestTick(){
  if(!ticking){
      requestAnimationFrame(update);
  }
  ticking = true;
}

function update(){
  //reset tick to capture next scroll
  ticking = false;
  var currentTop = latestKnownTop;

  var percent = (window.innerHeight - currentTop)/ window.innerHeight;
  if(percent>1) percent = 1;
  if(percent<0) percent = 0;
  currentDepth = 500 + 2500*percent;

  svg.selectAll("image.stack").style("opacity", function(d){
    var depth = d3.select(this).attr("data-index");
    var currentPercent = 1 - (depth - currentDepth) /500;
    if(currentPercent < 0){
      return 0;
    } else if(currentPercent > 1) {
      return 1;
    } else {
      return currentPercent;
    }
  });

  d3.select(".depthMarker").attr("transform", `translate(${w-axisMargins.right-6},${yScale(currentDepth)-6})`);
  d3.select(".depthNumber").html(Math.round(currentDepth))

}
var listening;

function intersectionCallback(entries, observer){
  if(entries[0].intersectionRatio>0){
    if(!listening) {
      window.addEventListener("scroll",onScroll);
      console.log("add listener!");
    }
    listening = true;
  } else {
    console.log("remove listener!");
    window.removeEventListener("scroll", onScroll);
    listening = false;
  }
}

//////////////////////////////////////////////////////////////////////
//////////////////1)Energy Cost Chart///////////////////////////////
//////////////////////////////////////////////////////////////////////
var fmtYearAbbrev = d => (d.getFullYear() + "").slice(-2);
var fmtYearFull = d => d.getFullYear();
var fmtDayYear = d => d.getDate() + ", " + d.getFullYear();
var fmtDateFull = d => getAPMonth(d) + " " + fmtDayYear(d).trim();
var formatData = function(data) {
    
  var dataSeries = [];

  data.forEach(function(d) {
    d.date = new Date(d.year, 0, 1);
  });

  /*
   * Restructure tabular data for easier charting.
   */
  for (var column in data[0]) {

    if(column!="year" && column!="date"){

    dataSeries.push({
      name: column,
      values: data.map(function(d) {
        return {
          date: d.date,
          amt: d[column]
        };
        // filter out empty data. uncomment this if you have inconsistent data.
               }).filter(function(d) {
                   return d.amt > 0;
      })
    });

    }


  }
  return dataSeries;

};


//////////////////Load line chart data///////////////////

d3.csv("data/electricity_cost_lcoe.csv").then(function(data){

    var config = {
      "target": "div.lineChart.lcoe",
      "valueUnits": "USD/kWh",
      "format": function(value){
        return Math.round(value*100)/100
      },
      "key": "p.key.lcoe"
    };
    drawLineChart(data,config);   
});

d3.csv("data/electricity_cost_installed.csv").then(function(data){

    var config = {
      "target": "div.lineChart.installed",
      "valueUnits": "USD/kW",
      "format": function(value){
        return d3.format(",")(value);
      },
      "key": "p.key.installed"
    };
    drawLineChart(data,config);

})

function drawLineChart(data,config) {
    
    var formatted = formatData(data);

    var dateColumn = "date";
    var valueColumn = "amt";

    var aspectWidth = 16;
    var aspectHeight = 9;

    var annotationWidth = 75,
    annotationLineHeight = 12;

    var margins = {
      top: 5,
      right: 75,
      bottom: 20,
      left: 50
    };

    var ticksX = 10;
    var ticksY = 5;
    var roundTicksFactor = 0.05;

  var isMobile;
  if(screenRatio<0.8) isMobile = true;

    // Mobile
  if (isMobile) {
    aspectWidth = 4;
    aspectHeight = 3;
    ticksX = 5;
    ticksY = 5;
    margins.right = 75;
    annotationXOffset = -6;
    annotationYOffset = -20;
    annotationWidth = 75;
    annotationLineHeight = 12;
  }
  var containerWidth = $(config.target).width();

  // Calculate actual chart dimensions
  var chartWidth = containerWidth - margins.left - margins.right;
  var chartHeight =
    Math.ceil((containerWidth * aspectHeight) / aspectWidth) -
    margins.top -
    margins.bottom;

  var dates = formatted[0].values.map(d => d.date);
  var extent = [dates[0], dates[dates.length - 1]];

  console.log("chart width", chartWidth);

  var xScale = d3
    .scaleTime()
    .domain(extent)
    .range([0, chartWidth]);

  var values = formatted.reduce(
    (acc, d) => acc.concat(d.values.map(v => v[valueColumn])),
    []
  );

  var floors = values.map(
    v => Math.floor(v / roundTicksFactor) * roundTicksFactor
  );
  var min = Math.min.apply(null, floors);

  if (min > 0) {
    min = 0;
  }

  var ceilings = values.map(
    v => Math.ceil(v / roundTicksFactor) * roundTicksFactor
  );
  var max = Math.max.apply(null, ceilings);

  var yScale = d3
    .scaleLinear()
    .domain([min, max])
    .range([chartHeight, 0]);

  var colorScale = d3
    .scaleOrdinal()
    .domain(formatted.map(d => d.name))
    .range([
      "#4ddb8d",
      "#d6d451",
      "#4d93dd",
      "#793dd9"
    ]);

  var chartElement = d3.select(config.target)
    .append("svg")
    .attr("width", chartWidth + margins.left + margins.right)
    .attr("height", chartHeight + margins.top + margins.bottom)
    .append("g")
    .attr("transform", "translate(" + margins.left + "," + margins.top + ")");

  /*
   * Create D3 axes.
   */
  var xAxis = d3
    .axisBottom()
    .scale(xScale)
    // .tickValues([new Date(1970,0,1),
    //              new Date(1980,0,1),
    //              new Date(1990,0,1),
    //              new Date(2000,0,1),
    //              new Date(2010,0,1),
    //              new Date(2020,0,1)])
    .tickFormat(function(d, i) {
      if (isMobile) {
        return "\u2019" + fmtYearAbbrev(d);
      } else {
        return fmtYearFull(d);
      }
    });

  var yAxis = d3
    .axisLeft()
    .scale(yScale)
    .ticks(ticksY);
    // .tickFormat(function(d){
    //   return d == 0 ? 0 : (d / 1000000000).toFixed(0) + "B";
    // });

  /*
   * Render axes to chart.
   */
  chartElement
    .append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(${0},${chartHeight})`)
    .call(xAxis);

    0, chartHeight

  chartElement
    .append("g")
    .attr("class", "y axis")
    .call(yAxis);

  /*
   * Render grid to chart.
   */
  var xAxisGrid = function() {
    return xAxis;
  };

  var yAxisGrid = function() {
    return yAxis;
  };

  /*
   * Render 0 value line.
   */
  if (min < 0) {
    chartElement
      .append("line")
      .attr("class", "zero-line")
      .attr("x1", 0)
      .attr("x2", chartWidth)
      .attr("y1", yScale(0))
      .attr("y2", yScale(0));
  }

  /*
   * Render lines to chart.
   */
  var line = d3
    .line()
    .x(d => xScale(d[dateColumn]))
    .y(d => yScale(d[valueColumn]));

  chartElement
    .append("g")
    .attr("class", "lines")
    .selectAll("path")
    .data(formatted)
    .enter()
    .append("path")
    .attr("class", function(d, i) {
      return "line " + d.name;
    })
    .attr("stroke", d => colorScale(d.name))
    .attr("d", d => line(d.values));

  //values
  chartElement
    .append("g")
    .attr("class", "value")
    .selectAll("text")
    .data(formatted)
    .enter()
    .append("text")
    .attr("x", function(d, i) {
      var last = d.values[d.values.length - 1];
      return xScale(last[dateColumn]) + 5;
    })
    .attr("y", function(d) {
      var last = d.values[d.values.length - 1];
      return yScale(last[valueColumn]) + 3;
    })
    .text(function(d){
      if(d.name == "Geothermal") return "Geothermal: "+ config.format(d.values[d.values.length - 1][valueColumn]) + " " + config.valueUnits;
    })
    .call(wrapText, annotationWidth, annotationLineHeight);

    //key
    d3.select(config.key)
        .selectAll("b")
        .data(formatted)
        .enter()
        .append("span")
          .html(function(d){
            var color =colorScale(d.name);



            return `<b style="background-color:${color};"></b>` + d.name;

          })
          


    }





//////////////////////////////////////////////////////////////////////
//////////////////1)Geothermal Production Chart///////////////////////////////
//////////////////////////////////////////////////////////////////////

var chartDivW = $("div.chart").width();
$("div.chart").height(chartDivW);

var chartSvg = d3.select("div.chart").append("svg")                                     
              .attr("width",  "100%")
              .attr("height", "100%")
              .style("position", "absolute")
              .style("top", "0px")
              .style("left", "0px")
              .style("z-index", "1");;

var chartW = chartDivW - 30;

//get data
d3.csv("data/2019_energy.csv").then(function(data){

  chartSvg.append("rect")
            .attr("x", 15)
            .attr("y", 15)
            .attr("width", chartW)
            .attr("height", chartW)
            .attr("fill", "#777");

  chartSvg.append("rect")
            .attr("x", 15)
            .attr("y", 15)
            .attr("width", Math.sqrt(chartW*chartW* 16/ 4118))
            .attr("height", Math.sqrt(chartW*chartW* 16/ 4118))
            .attr("fill", "#793dd9");

  d3.select("div.chart")
                .append("p")
                .html("Total U.S. Electricity Production")
                .style("text-align", "center")
                .style("position", "relative")
                .style("width", "90%")
                .style("padding-top", "45%")
                .style("z-index", "5");

  d3.select("div.chart")
                .append("p")
                .html("Geothermal")
                .style("position", "absolute")
                .style("z-index", "5")
                .style("padding", "0px")
                .style("left", 15 + Math.sqrt(chartW*chartW* 16/ 4118) + 5 + "px")
                .style("top", 15 +"px");

});



}
window.onload = wrapper();