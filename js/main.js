// Add all scripts to the JS folder
function wrapper(){


 //store width in pixels
  var h = $("div.map").height();
  var w = $("div.map").width();

  // //check screen aspect ratio, set margins
  // var aspectRatio = w/h;
  // var focusArea;

  // console.log(w,h,aspectRatio);

  // if(aspectRatio>1.5){
  // 		console.log("wide!");
  //     focusArea = {
  //       width: h*1.5,
  //       height: h
  //     }
  // } else {
  //     focusArea = {
  //       width: w,
  //       height: h
  //     }
  // }

  // // var margins = {
  // //   top: (h - focusArea.height)/2,
  // //   left: (w - focusArea.width)/2
  // // }

  // console.log(focusArea,margins);

  var svg = d3.select("div.map")
              .append("svg")
              .attr("overflow", "visible")
              // .attr("width", w+"px")
              // .attr("height", h+"px")
              .attr("viewBox", `0 0 ${w} ${h}`)
              .style("position","absolute")
              .style("left", "0")
              .style("top", "0");

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
  							.attr("fill", "#fff")
  							.attr("stroke", "none")
  							.attr("transform", `translate(${w-axisMargins.right-6},${yScale(500)-6})`);

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
     						.attr("stroke", "#777")
     						.attr("stroke-width", 0.1)
     						.attr("opacity", 0.7);

     	// var box = svg.append("g")
     	// 				.selectAll(".box")
     	// 				.data(box)
     	// 				.enter()
     	// 				.append("path")
     	// 					.attr("d", path)
     	// 					.attr("class", "states")
     	// 					.attr("fill", "none")
     	// 					.attr("stroke", "#fff")
     	// 					.attr("stroke-width", 0.25);


     });

























}
window.onload = wrapper();