      /////Aggregate by Geothermal Area//////////
      var geoAreaNames = [];
      var geoAreas = [];

      //add areas
      for(var plant of operating){
          console.log(plant);
          var area = plant.properties["GEO_AREA"];
          //add objects for each area
          //for plants without area
          if(area==null) {
            geoAreaNames.push(plant.properties["PLANT_NAME"]);
            geoAreas.push({
              "name": plant.properties["PLANT_NAME"],
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
      for(var plant of operating){
        console.log(plant);
        var areaName = plant.properties["GEO_AREA"];
        if(areaName == null){
          console.log("here!")
           var areaName = plant.properties["PLANT_NAME"];
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
          console.log(longitudes);
          console.log(latitudes);
          var meanLong = d3.mean(longitudes);
          var meanLat = d3.mean(latitudes);
          console.log(meanLong);
          console.log(meanLat);
        area.geometry = {
          "type": "Point",
          "coordinates": [meanLong,meanLat]
        }
      }

      console.log(geoAreas);