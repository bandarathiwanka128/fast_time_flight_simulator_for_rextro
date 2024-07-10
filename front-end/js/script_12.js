//const waypoints = require("./app");


const socket = new WebSocket('ws://localhost:3000');


//------------------ variables --------------------------------------
var gateWays = []; // contain waypoints
var allFlights = [];
var flightInfo = []; // contain information about flights
var firstWaypoint, secondWaypoint, firstLabel, secondLabel;
var flightMarkers = []; // contain all the flight markers
var currentFLight; // used in second setInterval
const options = { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false };





//---------------------------------------------------------------------

socket.onmessage = (event) => {

  const data = JSON.parse(event.data);

  // Extract the array of objects from collection1
  const collection1 = data.collection1;
  const collection2 = data.collection2;

  // Map the objects in the array to a new array of objects with the desired attributes
  gateWays = collection1.map((obj) => {
    return {
      lat: obj.Lat,
      lng: obj.Lng,
      label: obj.Node_name

    };
  });

   // Map the objects in the array to a new array of objects with the desired attributes
   allFlights = collection2.map((obj) => {
      return {
        callsign: obj.Callsign,
        route: rearrangeArray(obj.path[0]) ,                //array of waypoints
        origin: obj.Origin_Info,
        dest: obj.Destination_Info,
        routing: obj.Routing,
        initLat:null,
        initLng:null,
        nextLat:null,
        nextLng:null,
        lat:null,
        lng : null,
        m:null,
        c:null,
        markerName:null,
        tanvalue:null,
        count:1,
        increment:0.05,
        going : true,
        departure_time : obj.Departure_Time
      };
    //}
    
  });

  /*intervalId2 = setInterval(function() {
    flightInfo = collection2.map((obj) => {
      if(compareTime(obj.Departure_Time)){
        return {
          callsign: obj.Callsign,
          route: rearrangeArray(obj.path[0]) ,                //array of waypoints
          origin: obj.Origin_Info,
          dest: obj.Destination_Info,
          routing: obj.Routing,
          initLat:null,
          initLng:null,
          nextLat:null,
          nextLng:null,
          lat:null,
          lng : null,
          m:null,
          c:null,
          markerName:null,
          tanvalue:null,
          count:1,
          increment:0.05,
          going : true
        };
      }
      
    });

  }, 7000);*/

  //flightInfo.push(flightInfo_1[1]);
  //console.log(gateWays);
  //console.log(flightInfo);

};

let map;
var intervalId1, intervalId2;
var waypointList;

function initMap() {
  // Initialize the map
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 0,
    maxZoom: 15,
    minZoom: 2
  });


  //Gateway information
  /*var gateWays = [
    {lat : -5.94, lng : 142.51, label : "A"},
    {lat : -6.94, lng : 149.51, label : "D"},
    //{lat : 2.58777, lng : 129.1825, label : "B"},
    //{lat : 2.58777, lng : 165.1825, label : "B"},
    {lat : -10.58777, lng : 135.1825, label : "B"},
    {lat : -15.58777, lng : 143.1825, label : "C"}
  ];*/

  // loop through each JSON object in 'data'


  //var count = 1;

  // initial position of the air plane
  //var initLat = gateWays[0].lat;
  //console.log('initLat = '+initLat);
  //var initLng = gateWays[0].lng;
  //console.log('initLng = '+initLng);


//---------------------------Iniatial assigning-------------------------------
  for(var i = 0; i < allFlights.length; i++){
    if(allFlights[i].going){

      firstLabel = allFlights[i].route[0];
      secondLabel = allFlights[i].route[1];

      // finding the origin of the airplane
      firstWaypoint = gateWays.find((obj) => obj.label == firstLabel);
      secondWaypoint = gateWays.find((obj) => obj.label == secondLabel);

      // assigning initial and next coordinates 
      allFlights[i].initLat = firstWaypoint.lat;
      allFlights[i].initLng = firstWaypoint.lng;
      allFlights[i].nextLat = secondWaypoint.lat;
      allFlights[i].nextLng = secondWaypoint.lng;
      //flightInfo[i].increment = 0.3; // temporily - this should be initialized using the speed.

      //calculating initial gradient and intercept
      allFlights[i].m = calcGradient(allFlights[i].initLng, allFlights[i].initLat, allFlights[i].nextLng, allFlights[i].nextLat);
      allFlights[i].c = calcIntercept(allFlights[i].nextLng, allFlights[i].nextLat, allFlights[i].m);

      allFlights[i].tanvalue = clacPlaneAngle(allFlights[i].m);
      allFlights[i].markerName = initalString_2(allFlights[i].initLat, allFlights[i].initLng, allFlights[i].nextLat, allFlights[i].nextLng);

      // calculating the initail increment
      if(allFlights[i].initLng > allFlights[i].nextLng){
        allFlights[i].increment = -1*Math.abs(allFlights[i].increment);
      }else{
        allFlights[i].increment = 1*Math.abs(allFlights[i].increment);
      }

      // create the plane marker
      flightMarkers[i] = new google.maps.Marker({
        map: map,
        position: { lat: allFlights[i].initLat, lng: allFlights[i].initLng },
        icon : {
          url: allFlights[i].markerName,
          scaledSize :  new google.maps.Size(20, 20)
        }
      });
    }
    
  }
  //--------------------------------------------------------------------------------

  intervalId2 = setInterval(function() {
    //console.log('flightInfo = '+flightInfo);
    for(let m = 0; m < allFlights.length; m++){
      if(compareTime(allFlights[m].departure_time, allFlights[m].callsign)){
        flightInfo.push(allFlights[m]);
        allFlights.splice(m, 1);
        m--;
      }
    }
    
  }, 7000);

  // create gate way markers
  for(var gws = 0; gws < gateWays.length; gws++){
    createMarker(gateWays[gws]);
  }


  //-------------------------------------------------------------------------------------------
    // this repeats at 1000ms intervals and calculate the new location of the plane
    setTimeout(function() {
    intervalId1 = setInterval(function() {
      // Get the new coordinates for the marker
      if(flightInfo.length > 0){
        for(var k = 0; k < flightInfo.length; k++){
          if(flightInfo[k].going){
            flightInfo[k].lng = flightMarkers[k].getPosition().lng() + flightInfo[k].increment;
            flightInfo[k].lat = flightInfo[k].lng*flightInfo[k].m + flightInfo[k].c;
            flightMarkers[k].setPosition({lat:flightInfo[k].lat, lng:flightInfo[k].lng});
          } 
          if(flightInfo[k].going){
            if(flightInfo[k].initLat > flightInfo[k].nextLat){
              if( flightMarkers[k].getPosition().lat() < flightInfo[k].nextLat && flightInfo[k].count < flightInfo[k].route.length){
  
                flightInfo[k].count = flightInfo[k].count + 1;
  
                if(flightInfo[k].count >= flightInfo[k].route.length){
                  //marker.setPosition({ lat: gateWays[ gateWays.length-1].lat, lng: gateWays[ gateWays.length-1].lng });
                  //console.log('stop lat = '+flightInfo[k].nextLat);
                  //console.log('stop lng = '+flightInfo[k].nextLng);
  
                  flightMarkers[k].setPosition({lat : flightInfo[k].nextLat, lng : flightInfo[k].nextLng});
                  flightInfo[k].going = false;
  
                  continue;
                }
                // Here, the plane reaches a destination gateway. Then it assign coordinates of the 
                // previous journey end gateway to initial gateway coordiates of the next journey
                flightInfo[k].initLat =  flightInfo[k].nextLat;
                flightInfo[k].initLng = flightInfo[k].nextLng;
                //console.log('initlat = '+flightInfo[k].initLat);
                //console.log('initlng = '+flightInfo[k].initLng);
                // plane stopping
                //console.log('label name = '+flightInfo[k].route[flightInfo[k].count]);
                var temp1 = gateWays.find((obj) => obj.label == flightInfo[k].route[flightInfo[k].count]);
                //console.log('temp1 = '+temp1.label);
                flightInfo[k].nextLat = temp1.lat;
                flightInfo[k].nextLng = temp1.lng;
                //console.log('nextlat = '+flightInfo[k].nextLat);
                //console.log('nextlng = '+flightInfo[k].nextLng);
          
                // calculate the new gradient and intercept of the next journey
                flightInfo[k].m = calcGradient(flightInfo[k].initLng, flightInfo[k].initLat,flightInfo[k].nextLng, flightInfo[k].nextLat)
                flightInfo[k].c = calcIntercept(flightInfo[k].nextLng, flightInfo[k].nextLat, flightInfo[k].m);
                //m = calcGradient(initLng, initLat, gateWays[count].lng, gateWays[count].lat);
                //c = calcIntercept(gateWays[count].lng, gateWays[count].lat, m);
                //console.log(m);
                flightInfo[k].tanvalue = clacPlaneAngle(flightInfo[k].m);
                
                if(flightInfo[k].initLat > flightInfo[k].nextLat){
                  flightInfo[k].tanvalue = flightInfo[k].tanvalue + 180;
                }
        
                flightInfo[k].markerName = makeImageString(flightInfo[k].tanvalue-40);
          
                icon = {
                  url: flightInfo[k].markerName,
                  scaledSize: new google.maps.Size(20, 20)
                };
                
                flightMarkers[k].setIcon(icon);
                //marker.setIcon(icon);
                // selecting the right increment whether negative or positive
                if(flightInfo[k].initLng > flightInfo[k].nextLng){
                  flightInfo[k].increment = -1*Math.abs(flightInfo[k].increment);
                }else{
                  flightInfo[k].increment = Math.abs(flightInfo[k].increment);
                }
              }
            }else if(flightInfo[k].initLat <   flightInfo[k].nextLat){
              //if(marker.getPosition().lat() > gateWays[count].lat && count < gateWays.length){
              if( flightMarkers[k].getPosition().lat() > flightInfo[k].nextLat && flightInfo[k].count < flightInfo[k].route.length){
                // Here, the plane reaches a destination gateway. Then it assign coordinates of the 
                // previous journey end gateway to initial gateway coordiates of the next journey
                flightInfo[k].count = flightInfo[k].count + 1;
                //console.log('count = '+flightInfo[k].count);
                //console.log('Limit-count = '+(flightInfo[k].route.length));
  
                if(flightInfo[k].count >= flightInfo[k].route.length){
                  //marker.setPosition({ lat: gateWays[ gateWays.length-1].lat, lng: gateWays[ gateWays.length-1].lng });
                  flightMarkers[k].setPosition({lat : flightInfo[k].nextLat, lng : flightInfo[k].nextLng});
                  flightInfo[k].going = false;
                  //console.log('The End');
                  continue;
                }
                flightInfo[k].initLat =  flightInfo[k].nextLat;
                flightInfo[k].initLng = flightInfo[k].nextLng;
                //console.log('initlat = '+flightInfo[k].initLat);
                //console.log('initlng = '+flightInfo[k].initLng);
        
                // plane stopping
                
                var temp2 = gateWays.find((obj) => obj.label == flightInfo[k].route[flightInfo[k].count]);
                //console.log('temp2 = '+temp2.label);
  
                flightInfo[k].nextLat = temp2.lat;
                flightInfo[k].nextLng = temp2.lng;
                //console.log('nextlat = '+flightInfo[k].nextLat);
                //console.log('nextlng = '+flightInfo[k].nextLng);
          
                // calculate the new gradient and intercept of the next journey
                flightInfo[k].m = calcGradient(flightInfo[k].initLng, flightInfo[k].initLat,flightInfo[k].nextLng, flightInfo[k].nextLat)
                flightInfo[k].c = calcIntercept(flightInfo[k].nextLng, flightInfo[k].nextLat, flightInfo[k].m);
          
                flightInfo[k].tanvalue = clacPlaneAngle(flightInfo[k].m);
                
                if(flightInfo[k].initLat >  flightInfo[k].nextLat){
                  flightInfo[k].tanvalue = flightInfo[k].tanvalue + 180;
                }
        
                flightInfo[k].markerName = makeImageString(flightInfo[k].tanvalue-40);
          
                icon = {
                  url: flightInfo[k].markerName,
                  scaledSize: new google.maps.Size(20, 20)
                };
    
                flightMarkers[k].setIcon(icon);
                // selecting the right increment whether negative or positive
                if(flightInfo[k].initLng > flightInfo[k].nextLng){
                  flightInfo[k].increment = -1*Math.abs(flightInfo[k].increment);
                }else{
                  flightInfo[k].increment = Math.abs(flightInfo[k].increment);
                }
              }
            }
          }
        }
      }
      

    }, 1000);
  }, 5000);

}

const testFunction = () =>{

  clearInterval(intervalId1);
  clearInterval(intervalId2);
}

window.initMap = initMap;

