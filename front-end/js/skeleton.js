//------------------ variables --------------------------------------
var gateWays = []; // contain waypoints
var allFlights = [];
var flightInfo = []; // contain information about flights
var firstWaypoint, secondWaypoint, firstLabel, secondLabel;
var flightMarkers = []; // contain all the flight markers
var currentFLight; // used in second setInterval
const options = { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false }; // format of the time obtained by the local computer
var radius = 5000; // minimum separation between two planes
var compArr = []; // array that temporily stores the flight data for collision detection
var table; //collision-table
var cell1, cell2, cell3; // cells of the collision table
var collidedPoints = [];
let circles = [];
let blinkTimers = [];
let count = 0;
let current_hour;

function getWaypoints(){
  const xhr1 = new XMLHttpRequest();
  xhr1.open('GET', '/wayPoints', true);
  xhr1.setRequestHeader('Content-Type', 'application/json');

  xhr1.onreadystatechange = function(){
    if(xhr1.readyState === 4 && xhr1.status === 200){
      const response = JSON.parse(xhr1.responseText);
      // Map the objects in the array to a new array of objects with the desired attributes
      gateWays = response.collection1.map((obj) => {
        return {
          lat: obj.Lat,
          lng: obj.Lng,
          label: obj.Node_name,
          waypointMarker: null // stores the waypoint marker
        };
      });
    } else {
      console.error(xhr1.statusText);
    }
  }
  xhr1.send();
}

function firstRequest() {
    // Get the present hour
    console.log("Inside firstrequest skeleton");
    const now = new Date();
    const presentHour = now.getHours();
    current_hour = presentHour;
    console.log("current hour = "+current_hour);
  
    // Calculate the next hour
    const nextHour = (current_hour + 1) % 24;
    console.log("next hour = "+nextHour);
  
    // Create the string in the format "A-B"
    const data = current_hour + '-' + nextHour;
  
    // Perform your AJAX request here
    const xhr = new XMLHttpRequest();
    const url = '/data?time=' + encodeURIComponent(data); // Include the string as a query parameter
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
  
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        allFlights = [];
        console.log("response recieved");
        const response = JSON.parse(xhr.responseText);
        allFlights = response.collection2.map((obj) => {
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
            departure_time : obj.Departure_Time,
            marker : null
          };
      });
      initializing();
      } else {
        console.error(xhr.statusText);
      }
    };
    xhr.send();
  }

  function sendRequest() {
    // Get the present hour
    console.log("Inside sendrequest");
    //const now = new Date();
    //const presentHour = now.getHours();
    current_hour++;
    console.log("current hour = "+current_hour);
  
    // Calculate the next hour
    const nextHour = (current_hour + 1) % 24;
    console.log("Next hour = "+nextHour);
  
    // Create the string in the format "A-B"
    const data = current_hour + '-' + nextHour;
    current_hour = nextHour;
  
    // Perform your AJAX request here
    const xhr = new XMLHttpRequest();
    const url = '/data?time=' + encodeURIComponent(data); // Include the string as a query parameter
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
  
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        allFlights = [];
        console.log("response recieved");
        const response = JSON.parse(xhr.responseText);
        allFlights = response.collection2.map((obj) => {
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
            departure_time : obj.Departure_Time,
            marker : null
          };
      });
      initializing();
      } else {
        console.error(xhr.statusText);
      }
    };
    xhr.send();
  }

  function initializing(){
    console.log("inside initializing");
    console.log("length = "+allFlights.length);
    for(var i = 0; i < allFlights.length; i++){
      if(allFlights[i].going){
        //console.log("initializing flights");
        //console.log(allFLights);
  
        // Finding the waypoints of the first journey
        firstLabel = allFlights[i].route[0];
        //console.log("First label = "+firstLabel);
        secondLabel = allFlights[i].route[1];
        //console.log("callsign = "+allFLights[i].callsign);
  
        // finding the origin of the airplane
        firstWaypoint = gateWays.find((obj) => obj.label == firstLabel);
        //console.log("fistWaypoint = ");
        //console.log(firstWaypoint);
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
  
          // creates the marker of the planes
        /*const newMarker = new google.maps.Marker({
          name : 'initialized'
        });
        allFlights[i].marker = newMarker;*/
  
        /*allFlights[i].marker.addListener("click", function(){
          console.log(this.setTitle);
        })*/
      }
      
    }
  }

  //initializing the ajax request every hour and 
function scheduleRequest() {
  console.log("Inside sheduleRequest");
  const now = new Date();
  const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
  const delay = nextHour - now;
  console.log("Delay = "+(delay/1000)+" s");
  firstRequest();
  
  //initializing();
  setTimeout(() => {
    console.log("fetching time reached");
    sendRequest();
    setInterval(function() {
      allFlights = [];
      sendRequest();
      //initializing();
    }, 3600000); // Repeat every hour (in milliseconds)
  }, delay);
}

function main(){
  console.log("Inside main");
  getWaypoints();
  scheduleRequest();

  intervalId2 = setInterval(function() {
    //console.log('flightInfo = '+flightInfo);
    for(let m = 0; m < allFlights.length; m++){
      if(compareTime(allFlights[m].departure_time, allFlights[m].callsign)){   
        flightInfo.push(allFlights[m]);
        allFlights.splice(m, 1);
        m--;
      }
    }
    console.log("flightInfo = ");
    console.log(flightInfo);
  }, 7000);
}

