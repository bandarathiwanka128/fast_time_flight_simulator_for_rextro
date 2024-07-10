
//------------------ variables --------------------------------------
var gateWays = []; // contain waypoints
var allFlights = [];
var flightInfo = []; // contain information about flights
var firstWaypoint, secondWaypoint, firstLabel, secondLabel;
var flightMarkers = []; // contain all the flight markers
var currentFLight; // used in second setInterval
const options = { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false }; // format of the time obtained by the local computer
var radius = 3000; // minimum separation between two planes
var compArr = []; // array that temporily stores the flight data for collision detection
var table; //collision-table
var cell1, cell2, cell3; // cells of the collision table
var collidedPoints = [];
let circles = [];
let blinkTimers = [];
let count = 0;
let current_hour;
let map;
var intervalId1, intervalId2, intervalId3;
var waypointList;
var altitudesArr = [[], [], []];
let uniqueAltitudes = [];
let namingObject = {};// contains the naming of the flightInfo array rows
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');
//const theUrl = 'https://demo.eminenceapps.com';
const theUrl = '';
var routingArray = [];
var waypointGraph;
var fetchedFlights = [];
var markedRegionPolygon;
var rerouteNeededFlights = [];
var Planecount = 0;

// const markedRegionPolygon = new google.maps.Polygon({
//   paths: markedRegionVertices,
//   strokeColor: '#FF0000', // Border color of the polygon
//   strokeOpacity: 0.8,
//   strokeWeight: 2,
//   fillColor: '#FF0000', // Fill color of the polygon
//   fillOpacity: 0.35,
// });

// sends a get request to fetch waypoint data
async function getWaypoints(){
  return new Promise((resolve, reject) => {
    const xhr1 = new XMLHttpRequest();
    //console.log('heeyyy = '+apiUrl);
    const url = theUrl+'/grp11/backend/wayPoints?username=' + encodeURIComponent(username);
    xhr1.open('GET', url, true);
    xhr1.setRequestHeader('Content-Type', 'application/json');

    xhr1.onreadystatechange = function(){
      if(xhr1.readyState === 4 && xhr1.status === 200){
        const response = JSON.parse(xhr1.responseText);
        // Map the objects in the array to a new array of objects with the desired attributes
        for(let i = 0; i < response.collection1.length; i++){
          gateWays.push(new WayPoint(response.collection1[i]));
        }
        resolve(gateWays); // Resolve the Promise with the retrieved data
        //console.log(gateWays);
        displayWaypoints();
        //detectLineCrossing();
        getRouting();
      } else {
        reject(xhr1.statusText); // Reject the Promise if there's an error
        console.error(xhr1.statusText);
      }
    }
    xhr1.send();
  });
}


function firstRequest() {
  console.log('Inside first request')
  const data = createTimeCollection();
  // Perform your AJAX request here
  const xhr = new XMLHttpRequest();
  const url = theUrl+'/grp11/backend/data?time=' + encodeURIComponent(data)+'&username='+encodeURIComponent(username); // Include the string as a query parameter
  xhr.open('GET', url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      console.log("response recieved");
      const response = JSON.parse(xhr.responseText);
      console.log('length = '+response.collection2.length)

      for(let i = 0; i < response.collection2.length; i++){
        const ob1 = new Flight(response.collection2[i]);   
        ob1.initializing();

        // checking whether the flight path intersects the restricted area
        if(detectLineCrossing(ob1.route, markedRegionPolygon)){
          // calculate the new route
          const newPath = waypointGraph.findValidShortestPath(ob1.route[0], ob1.route[ob1.route.length-1]);
          if(newPath === null){
            //console.log('No optional path')
            continue;
          }
          //console.log(newPath);
          ob1.route = newPath;
          ob1.altitude = generateAltitudes(newPath.length);
          ob1.speeds = generateSpeeds(newPath.length)
          allFlights.push(ob1);
          //console.log(ob2)
        
        }else{

          allFlights.push(ob1);
        }
      }
      console.log('finsihed detecting')
      insertToFlightInfo();
    } else {
      console.error(xhr.statusText);
    }
  };
  xhr.send();
}


function sendRequest() {
  current_hour++;

  // Calculate the next hour
  const nextHour = (current_hour + 1) % 24;
  const data = current_hour + '-' + nextHour;
  current_hour = nextHour;

  // Perform your AJAX request here
  const xhr = new XMLHttpRequest();
  const url = theUrl+'/grp11/backend/data?time=' + encodeURIComponent(data) + '&username=' + encodeURIComponent(username) ; // Include the string as a query parameter
  xhr.open('GET', url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      allFlights = [];
      console.log("response recieved");
      const response = JSON.parse(xhr.responseText);
      for(let i = 0; i < response.collection2.length; i++){
        const ob1 = new Flight(response.collection2[i]);
        ob1.initializing();
        if(detectLineCrossing(ob1.route, markedRegionPolygon)){
          fetchedFlights.push(ob1);
        }else{
          allFlights.push(ob1);
        }
      }
      console.log('finsihed detecting')
      insertToFlightInfo();
    } else {
      console.error(xhr.statusText);
    }
  };
  xhr.send();
}

function getRouting(){
  return new Promise(function(resolve, reject) {
    const xhr2 = new XMLHttpRequest();
    const url = theUrl+'/grp11/backend/fetchRouting?username=' + encodeURIComponent(username); 
    xhr2.open('GET', url, true);
    xhr2.setRequestHeader('Content-Type', 'application/json');

    xhr2.onreadystatechange = function() {
      if (xhr2.readyState === 4) {
        if (xhr2.status === 200) {
          if (xhr2.responseText) {
            const routings = JSON.parse(xhr2.responseText);
            resolve();
            waypointGraph = createGraph(routings.collection1, gateWays);
            //insertValue()
            scheduleRequest();
          } else {
            console.error('Empty response');
            alert("Please refresh the page");
          }
        } else {
          console.error(xhr2.status);
        }
      }
    };
    xhr2.send();
  });
}

function handleAltitudeLevels(flight, altitude){
  if(altitude in namingObject){
    flightInfo[namingObject[altitude]].push(flight);

  }else if(!(altitude in namingObject)){
    namingObject[altitude] = Object.keys(namingObject).length;
    flightInfo.push([]);
    flightInfo[namingObject[altitude]].push(flight);
  }
}



//initializing the ajax request every hour and 
function scheduleRequest() {
  console.log("inside scheduleRequest");
  const now = new Date();
  const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
  const delay = nextHour - now;
  console.log("Delay = "+(delay/1000)+" s");
  firstRequest();
  setTimeout(() => {
    sendRequest();
    setInterval(function() {
      sendRequest();
      
    }, 3600000); // Repeat every hour (in milliseconds)
  }, delay);
}

function collisionHandling(){
  //console.log('Inside collisionHandling');
  //console.log(compArr);
  for(let j = 0; j < compArr.length; j++){
    while(compArr[j].length > 0){
      let ob1 = compArr[j].pop();
      //console.log(ob1)

      for(let k = 0; k < compArr[j].length; k++){
        let distance = google.maps.geometry.spherical.computeDistanceBetween(ob1.marker.position, compArr[j][k].marker.position);
        if (distance < radius) {

          blinkCircle(ob1.marker.position.lat(), ob1.marker.position.lng());
          const localDate = new Date();
          const localHours = localDate.getHours();
          const localMinutes = localDate.getMinutes();
          const localSeconds = localDate.getSeconds();
          // markers are colliding
          //console.log(compArr[p].callsign+' colllides with '+compArr[pInner].callsign);
          table = document.getElementById('collision-table');
          // Create a new row for the table
          var newRow = table.insertRow();
          cell1 = newRow.insertCell(0);
          cell2 = newRow.insertCell(1);
          cell3 = newRow.insertCell(2);
          cell4 = newRow.insertCell(3);
          cell5 = newRow.insertCell(4);
          // Populate the cells with the data for the new record
          cell1.innerHTML = ob1.callsign;
          cell2.innerHTML = compArr[j][k].callsign;
          cell3.innerHTML = localHours+":"+localMinutes+":"+localSeconds;
          cell4.innerHTML = ob1.lat;
          cell5.innerHTML = ob1.lng;
        } 
      }
    }
  }
}

function initMap() {
  // Initialize the map
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 1.99702, lng: 106.66321 },
    zoom: 0,
    maxZoom: 15,
    minZoom: 7
  });

}

// async function namingflightInfo(){
//   try{
//     await getAltitudes();
//     for(let i = 0; i < uniqueAltitudes.length; i++){
//       flightInfo.push([]);
//       namingObject[uniqueAltitudes[i]] = i;
//     }
//   }catch(error){
//     console.error(error);
//   }
// }

function displayWaypoints(){
  for(var gws = 0; gws < gateWays.length; gws++){
    console.log("Creating waypoints");
    gateWays[gws].waypointMarker = createMarker(gateWays[gws]);
    gateWays[gws].waypointMarker.addListener("click", function(){
      console.log(this.setTitle);
    })
  }
}

function insertToFlightInfo(){
  intervalId2 = setInterval(function() {
    //console.log('flightInfo = '+flightInfo);
    for(let m = 0; m < allFlights.length; m++){
      //if(1){
      if(compareTime(allFlights[m].departure_time, allFlights[m].callsign)){ 
        if((allFlights.length > 0) && (allFlights[m].currentAltitude in namingObject)){
          allFlights[m].landed = true;
          flightInfo[namingObject[allFlights[m].currentAltitude]].push(allFlights[m]);
          allFlights.splice(m, 1);
          m--;
        }else if((allFlights.length > 0) && !(allFlights[m].currentAltitude in namingObject)){
          namingObject[allFlights[m].currentAltitude] = Object.keys(namingObject).length;
          flightInfo.push([]);
          flightInfo[namingObject[allFlights[m].currentAltitude]].push(allFlights[m]);
          allFlights[m].landed = true;
          allFlights.splice(m, 1);
          m--;
        }
      }
      //console.log(allFlights)
    } 

  }, 6000);
 }

function insertValue(){
  const ob1 = {
    Callsign : 'MI320',
    //path : '[WSSS,VTK,VJR,GUPTA,VKL,WMKK]',
    //path : '[WSSS,VTK,PADLI,ISTAN,VKL,WMKK]',
    //path : '[WBGG,VKG,KAMIN,TOMAN,VTK,WSSS]',
    path : '[WBGG,VKG,AGOBA,SABIP,TOMAN,HOSBA,VTK,WSSS]',
    Routing : 'WBGG_WSSS',
    Departure_Time : '05.00.00',
    Altitude : '[12000,38000,38000,38000,38000,38000,7000]',
    Speed_multiplied : '[1160, 3600, 3600, 3600, 3600, 3600, 3600, 3600, 1280]'
  }

  const ob2 = new Flight(ob1);
  ob2.initializing();
  if(detectLineCrossing(ob2.route, markedRegionPolygon)){
    console.log('before rerouting = '+ob2.route)
    console.log('intersecting')
    const newPath = waypointGraph.findValidShortestPath(ob2.route[0], ob2.route[ob2.route.length-1]);
    console.log(newPath);
    if(newPath != null){
      ob2.route = newPath;
      ob2.altitude = generateAltitudes(newPath.length);
      ob2.speeds = generateSpeeds(newPath.length)
      console.log(ob2)
      if(ob2.currentAltitude in namingObject){
        flightInfo[namingObject[ob2.currentAltitude]].push(ob2);
      }else{
        namingObject[ob2.currentAltitude] = Object.keys(namingObject).length;
        flightInfo.push([]);
        flightInfo[namingObject[ob2.currentAltitude]].push(ob2);
      }
    }
  }else{
    allFlights.push(ob2);
    console.log('allflightsss')
    insertToFlightInfo();
  }
}


function main(){
  //console.log('username = '+username);

  getWaypoints();
  //Create the marked region polygon
  const markedRegionVertices = [
    { lat: 1.675, lng: 103.66 },/*VJR*/
    { lat: 2.1633333, lng: 102.641666 }, /*GUPTA*/
    { lat: 2.80055, lng: 102.671944 } /*SAROX */
  ];

  // const markedRegionVertices = [
  //   { lat: 2.368333333, lng: 107.099444444 },/*VJR*/
  //   { lat: 1.97833333333, lng: 108.5 }, /*GUPTA*/
  //   { lat: 1.41444444444, lng: 107.990555555 }, /*SAROX */
   
  // ];

  markedRegionPolygon = new google.maps.Polygon({
    paths: markedRegionVertices.map(vertex => ({ lat: vertex.lat, lng: vertex.lng })),
    strokeColor: '#FF0000', // Border color of the polygon
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#FF0000', // Fill color of the polygon
    fillOpacity: 0.35,
  });
  
  markedRegionPolygon.setMap(map);
  
  // setTimeout(function() {
  //   const ob1 = {
  //     Callsign : 'MI320',
  //     //path : '[WSSS,VTK,VJR,GUPTA,VKL,WMKK]',
  //     //path : '[WSSS,VTK,PADLI,ISTAN,VKL,WMKK]',
  //     //path : '[WBGG,VKG,KIBOL,VPT,PADLI,VPK]',
  //     path : '[WBGG,VKG,AGOBA,SABIP,TOMAN,HOSBA,VTK,WSSS]',
  //     Routing : 'WSSS_WMKK',
  //     Departure_Time : '05.00.00',
  //     Altitude : '[12000,36000,36000,36000,12000]',
  //     Speed_multiplied : '[1240, 3200, 3200, 3200, 1280]'
  //   }
  //   //fetchedFlights.push(new Flight(ob1));
  //   //fetchedFlights[0].initializing();
  //   const ob2 = new Flight(ob1);
  //   ob2.initializing();
  //   if(detectLineCrossing(ob2.route, markedRegionPolygon)){
  //     //fetchedFlights.push(ob2);
  //     console.log('fetched')
  //     console.log(ob2.route[0]+'  '+ob2.route[ob2.route.length-1])
  //     const newPath = waypointGraph.findValidShortestPath(ob2.route[0], ob2.route[ob2.route.length-1]);
  //     console.log('new path = '+newPath)
  //     ob2.route = newPath;
  //     ob2.altitude = generateAltitudes(newPath.length);
  //     ob2.speeds = generateSpeeds(newPath.length);
  //     flightInfo.push([]);
  //     flightInfo[namingObject[ob1.currentAltitude]].push(ob2);
  //   }else{
  //     allFlights.push(ob2);
  //     console.log('allflights')
  //     //insertToFlightInfo();
  //   }
  // }, 7000);


  //--------------------------------------------------------------------------------
  //pushing flights to the flightinfo array for the simulation - flightinfo contains the flights that fly
  // intervalId2 = setInterval(function() {
  //   //console.log('flightInfo = '+flightInfo);
  //   for(let m = 0; m < allFlights.length; m++){
  //     //if(1){
  //     if(compareTime(allFlights[m].departure_time, allFlights[m].callsign)){ 
  //       if((allFlights.length > 0) && (allFlights[m].currentAltitude in namingObject)){
  //         allFlights[m].landed = true;
  //         flightInfo[namingObject[allFlights[m].currentAltitude]].push(allFlights[m]);
  //         allFlights.splice(m, 1);
  //         m--;
  //       }else if((allFlights.length > 0) && !(allFlights[m].currentAltitude in namingObject)){
  //         namingObject[allFlights[m].currentAltitude] = Object.keys(namingObject).length;
  //         flightInfo.push([]);
  //         flightInfo[namingObject[allFlights[m].currentAltitude]].push(allFlights[m]);
  //         allFlights[m].landed = true;
  //         allFlights.splice(m, 1);
  //         m--;
  //       }
  //     }
  //     console.log(flightInfo)
  //   } 

  // }, 7000);

  
  // this event listner listns to the changes of the zooming and adjust the size of the waypoints accordingly
  google.maps.event.addListener(map, 'zoom_changed', function() {
    var zoomLevel = map.getZoom();
    if(zoomLevel == 5){
      for(var gws = 0; gws < gateWays.length; gws++){
        gateWays[gws].waypointMarker.setIcon({
          url: "./images/waypoint2.png",
          scaledSize: new google.maps.Size(1, 1)
        });
      }
    }else if(zoomLevel == 7){
      for(var gws = 0; gws < gateWays.length; gws++){
        gateWays[gws].waypointMarker.setIcon({
          url: "./images/waypoint2.png",
          scaledSize: new google.maps.Size(10, 10)
        });
      }
    }else if(zoomLevel == 9){
      for(var gws = 0; gws < gateWays.length; gws++){
        gateWays[gws].waypointMarker.setIcon({
          url: "./images/waypoint2.png",
          scaledSize: new google.maps.Size(15, 15)
        });
      }
    }
  });

  const closeButton = document.getElementById("closeButton");

  closeButton.addEventListener("click", () => {
    // Hide the sliding component by adjusting its 'left' property
    slidingComponent.style.left = "-300px";
  });

  document.getElementById('createCSV').addEventListener('click', function() {
    // Button click logic goes here
    const xhr = new XMLHttpRequest();
    xhr.open('GET', theUrl+'/grp11/backend/download-landed-flights?username='+ encodeURIComponent(username), true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.responseType = 'blob'; // Set the response type to blob

    xhr.onload = function() {
      if (xhr.status === 200) {
        // Create a download link for the CSV file
        const downloadLink = document.createElement('a');
        downloadLink.href = window.URL.createObjectURL(xhr.response);
        downloadLink.download = 'landed_flights.csv';
        downloadLink.click();
      } else {
        console.error(xhr.statusText);
      }
    };
    xhr.send();
  });

  //-------------------------------------------------------------------------------------------
  //setTimeout(function() {
      // this repeats at 2000ms intervals and calculate the new location of the plane
    intervalId1 = setInterval(function() {
      // Get the new coordinates for the marker
      for(let j = 0; j < flightInfo.length; j++){ // iterate through flight levels 
        if(flightInfo[j].length > 0){
          for(var k = 0;k < flightInfo[j].length; k++){   
            
            if (flightInfo[j][k] instanceof Flight) {
              flightInfo[j][k].incrementing();

              if(flightInfo[j][k].going){
                // At this point the flight reaches a waypoint
                if(flightInfo[j][k].initLat > flightInfo[j][k].nextLat){
                  // Going down the map.
                  if( flightInfo[j][k].marker.getPosition().lat() < flightInfo[j][k].nextLat && flightInfo[j][k].count < flightInfo[j][k].route.length){
                    if(flightInfo[j][k].waypointChanging_down(j, k, username) && (flightInfo[j][k].previousAltitude != flightInfo[j][k].currentAltitude)){
                      let arrayName = flightInfo[j][k].currentAltitude;
                      let removedFlight = flightInfo[j].splice(k, 1)[0];
                      //console.log('flight removed')
                      handleAltitudeLevels(removedFlight, arrayName);
                      k--;
                    }

                  }
                  //going up the map
                }else if(flightInfo[j][k].initLat <   flightInfo[j][k].nextLat){
                  if( flightInfo[j][k].marker.getPosition().lat() > flightInfo[j][k].nextLat && flightInfo[j][k].count < flightInfo[j][k].route.length){
                    if(flightInfo[j][k].waypointChanging_up(j, k, username) && (flightInfo[j][k].previousAltitude != flightInfo[j][k].currentAltitude)){

                      let arrayName = flightInfo[j][k].currentAltitude;
                      let removedFlight = flightInfo[j].splice(k, 1)[0];
                      handleAltitudeLevels(removedFlight, arrayName);
                      k--;
                    }
                  }
                }
              }
            }
          }
          // copying flight info to another array
          compArr = Array.from(flightInfo, arr => [...arr]);
          collisionHandling();
        }
      }
      
    }, 2500);
  //}, 2000);
}



