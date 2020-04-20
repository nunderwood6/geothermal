      
      d3.json("data/developing_plants.geojson").then(function(data){

        developing = data.features;

         /////Aggregate by Geothermal Area//////////
      var geoAreaNames = [];
      var geoAreas = [];

      //add areas
      for(var plant of developing){
          console.log(plant);
          var area = plant.properties["GEO_LOC"];
          //add objects for each area
          //for plants without area
          if(area==null) {
            geoAreaNames.push(plant.properties["PROJECT"]);
            geoAreas.push({
              "name": plant.properties["PROJECT"],
              "plants": []
            });
          }
          else if(geoAreaNames.indexOf(area)==-1) {
            geoAreaNames.push(area);
            geoAreas.push({
              "name": area,
              "plants": []
            });
          }

      }

      console.log(geoAreaNames);
      console.log(geoAreas);


      //add plants to areas
      for(var plant of developing){
        console.log(plant);
        var areaName = plant.properties["GEO_LOC"];
        if(areaName == null){
          console.log("here!")
           var areaName = plant.properties["PROJECT"];
        }
        console.log(areaName);
        for(var area of geoAreas){
            if(area["name"] == areaName){
              area.plants.push(plant);
            }
        }
      }

      console.log(geoAreas);

      //calculate lat/long for each geoArea
      for(var area of geoAreas){
          var longitudes =[];
          var latitudes =[];
          for(var plant of area.plants){
              var longlat = plant.geometry.coordinates;
              longitudes.push(longlat[0]);
              latitudes.push(longlat[1]);
          }
          var meanLong = d3.mean(longitudes);
          var meanLat = d3.mean(latitudes);
        area.geometry = {
          "type": "Point",
          "coordinates": [meanLong,meanLat]
        }
      }

      console.log(geoAreas);

      })

     