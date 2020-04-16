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

var l = 0.2*w,
t= h*0.4,
w2 = .4*w,
h2 = .4*h;

 //set top of sticky position so it's centered vertically
  var stickyH = $(".sticky").height();
  var windowH = window.innerHeight;
  var stickyTop = (windowH - stickyH)/2;
  d3.select("figure.sticky").style("top",stickyTop+"px");

///////////////
console.log(width);

var svg = d3.select("figure.map")
              .append("svg")
             .attr("viewBox", `0 0 ${w} ${h}`)
               //.attr("viewBox", `${l} ${t} ${w2} ${h2}`)             
              .attr("width",  "100%")
              .attr("height", "100%")
              .style("position","absolute");
              //.style("left", (100-width)/2 + "%")
              //.style("top", "0");

// setTimeout(function(){
//     svg.transition().duration(5000).attr("viewBox", `${l} ${t} ${w2} ${h2}`);
// },2000)

var imageData = [500,1000,1500,2000,2500,3000]

var images = svg.selectAll("image")
                  .data(imageData)
                  .enter()
                  .append("image")
                  .attr("href", d=>`img/${d}.jpg`)
                  .attr("data-index", d=>d)
                  .attr("class", "stack")
                  .attr("opacity", function(d){
                    if(d == 500) {
                      return 1;
                    } else {
                      return 0;
                    }
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

  var yAxis = d3.axisRight(yScale)
  					.ticks(5)
  					.tickFormat(d3.format("d"));

  var yAxis = svg.append("g")
  					.attr("class", "yAxis")
  					.attr("transform", `translate(${w-axisMargins.right},0)`)
  					.call(yAxis);

  var depthMarker = svg.append("path")
                .attr("d", "M 0 0 L 9 6 L 0 12 z")
                .attr("class", "depthMarker")
                .attr("fill", "#fff")
                .attr("stroke", "none")
                .attr("transform", `translate(${w-axisMargins.right-6},${yScale(currentDepth)-6})`);

  var depthText = d3.select("figure.map").append("p")
                            .attr("class", "depthText")
                            .html(`Depth: <span class="depth">500</span>m`);


   Promise.all([
      d3.json("data/bounding_box_wgs84.geojson"),
      d3.json("data/states.json")
    ])
    .then(function([boxJSON,states_topoJSON]){

    	var box = boxJSON.features;
    	var states = topojson.feature(states_topoJSON, states_topoJSON.objects.states).features;

     	albers.fitExtent([[0,0],[w,h]], boxJSON);

     	var states = svg.append("g")
     					.selectAll(".states")
     					.data(states)
     					.enter()
     					.append("path")
     						.attr("d", path)
     						.attr("class", "states")
     						.attr("fill", "none")
     						.attr("stroke", "#fff")
     						.attr("stroke-width", 0.15)
                .attr("vector-effect", "non-scaling-stroke")
     						.attr("opacity", 0.5);

      var coords = [];

      box.forEach(function(point){
            coords.push(path.centroid(point));
      });
      
      var bounds = {
            top: coords[3][1],
            left: coords[3][0],
            bottom: coords[0][1],
            right: coords[1][0]
      }

      // var extentRect = svg.append("rect")
      //                       .attr("x", bounds.left)
      //                       .attr("y", bounds.top)
      //                       .attr("width", bounds.right - bounds.left)
      //                       .attr("height", bounds.bottom - bounds.top)
      //                       .attr("fill", "none")
      //                       .attr("stroke", "#fff");


     });

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

var target = d3.select(".step").node();
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
  d3.select(".depth").html(Math.round(currentDepth))

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