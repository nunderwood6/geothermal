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
  console.log("tall");
  width = 100;
  d3.select("figure.sticky").style("width", "100vw")
                            .style("height", 100/1.5+"vw");
} else {
  console.log("wide");
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

var plantsGroup = svg.append("g")
                      .attr("class", "plantsGroup")
                      .attr("opacity", 1);

var depthGroup = svg.append("g")
                      .attr("class", "depthGroup")
                      .attr("opacity", 0);

var hillshade = plantsGroup.append("image")
                      .attr("href", "img/dark_hillshade_2.jpg")
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
                  .attr("opacity", 0)
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

  var rScale = d3.scaleSqrt()
            .domain([0,850])
            .range([0,30]);

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
                            .html(`Depth: <span class="depthNumber">500</span>m`);

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
      d3.json("data/operating_plants.geojson")
    ])
    .then(function([boxJSON,states_topoJSON,operatingJSON]){

    	var box = boxJSON.features;
    	var states = topojson.feature(states_topoJSON, states_topoJSON.objects.states).features;
      var operating = operatingJSON.features.sort(function(a,b){
          return b.properties["CAP_MW"] - a.properties["CAP_MW"];
      });

      //loaded txt file as javascript
      console.log(geoAreas);


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

    addDiscreteListeners();

    // setTimeout(function(){
    //     svg.transition().duration(3000).attr("viewBox", `${l} ${t} ${w2} ${h2}`);
    // },2000)


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
  },
  fadeInDepth: function(){
    console.log("fade in depth!");
    //fade out hillshade and plants
    plantsGroup.transition("fadeOut")
              .duration(1000)
              .attr("opacity", 0);
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
    //fade out hillshade and plants
    plantsGroup.transition("fadeIn")
              .duration(1000)
              .attr("opacity", 1);
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

  // //fly from origin to centroids
  // stateCentroids.attr("cx", function(d){
  //     var x2 = d3.select(this).attr("x2");
  //     var x = x2*percent;
  //     return x;
  // }).attr("cy", function(d){
  //     var y2 = d3.select(this).attr("y2");
  //     var y = y2*percent;
  //     return y;
  // });


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

}
window.onload = wrapper();