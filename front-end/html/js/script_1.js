// =========================================================
// script_1.js  (FULL FIXED VERSION)
// =========================================================

// ------------------ GLOBAL VARIABLES ----------------------
var gateWays = [];
var allFlights = [];
var flightInfo = [];
var flightMarkers = [];

var currentFLight;
var radius = 3000;

var compArr = [];
var collidedPoints = [];

let circles = [];
let blinkTimers = [];

let count = 0;
let current_hour;
let map;
let waypointGraph;

var intervalId1, intervalId2;
var fetchedFlights = [];

var markedRegionPolygon;
var namingObject = {};

// ------------------ USERNAME FIX (DEFAULT VALUE) -----------------------
const urlParams = new URLSearchParams(window.location.search);
let username = urlParams.get("username");

// If no username in URL, use a default demo username so UI works
if (!username || username === "null" || username === null) {
    username = "demoUser";
    console.log("✔ No username provided → Using demoUser (UI demo mode)");
}


// ------------------ GET WAYPOINTS -------------------------
async function getWaypoints() {
  return new Promise((resolve, reject) => {
    const xhr1 = new XMLHttpRequest();
    const url = BASE_URL + "/grp11/backend/wayPoints?username=" + encodeURIComponent(username);

    xhr1.open("GET", url, true);
    xhr1.setRequestHeader("Content-Type", "application/json");

    xhr1.onreadystatechange = function () {
      if (xhr1.readyState === 4 && xhr1.status === 200) {
        const response = JSON.parse(xhr1.responseText);

        for (let i = 0; i < response.collection1.length; i++) {
          gateWays.push(new WayPoint(response.collection1[i]));
        }

        resolve(gateWays);
        displayWaypoints();
        getRouting();
      }
    };

    xhr1.send();
  });
}

// ------------------ FIRST REQUEST --------------------------
function firstRequest() {
  const data = createTimeCollection();
  const xhr = new XMLHttpRequest();

  const url =
    BASE_URL +
    "/grp11/backend/data?time=" +
    encodeURIComponent(data) +
    "&username=" +
    encodeURIComponent(username);

  xhr.open("GET", url, true);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const response = JSON.parse(xhr.responseText);

      for (let i = 0; i < response.collection2.length; i++) {
        const ob1 = new Flight(response.collection2[i]);
        ob1.initializing();

        if (detectLineCrossing(ob1.route, markedRegionPolygon)) {
          const newPath = waypointGraph.findValidShortestPath(
            ob1.route[0],
            ob1.route[ob1.route.length - 1]
          );

          if (newPath == null) continue;

          ob1.route = newPath;
          ob1.altitude = generateAltitudes(newPath.length);
          ob1.speeds = generateSpeeds(newPath.length);
          allFlights.push(ob1);
        } else {
          allFlights.push(ob1);
        }
      }

      insertToFlightInfo();
    }
  };

  xhr.send();
}

// ------------------ SCHEDULE REQUEST -----------------------
function scheduleRequest() {
  const now = new Date();
  const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1);

  const delay = nextHour - now;

  firstRequest();

  setTimeout(() => {
    sendRequest();
    setInterval(sendRequest, 3600000);
  }, delay);
}

// ------------------ SEND NEXT HOUR REQUEST -----------------
function sendRequest() {
  const sim = getSimTime();
  current_hour = sim.h;
  const nextHour = (current_hour + 1) % 24;
  const data = current_hour + "-" + nextHour;

  const xhr = new XMLHttpRequest();
  const url =
    BASE_URL +
    "/grp11/backend/data?time=" +
    encodeURIComponent(data) +
    "&username=" +
    encodeURIComponent(username);

  xhr.open("GET", url, true);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      allFlights = [];
      const response = JSON.parse(xhr.responseText);

      for (let i = 0; i < response.collection2.length; i++) {
        const ob1 = new Flight(response.collection2[i]);
        ob1.initializing();

        if (detectLineCrossing(ob1.route, markedRegionPolygon)) {
          fetchedFlights.push(ob1);
        } else {
          allFlights.push(ob1);
        }
      }

      insertToFlightInfo();
    }
  };

  xhr.send();
}

// ------------------ GET ROUTING GRAPH ----------------------
function getRouting() {
  return new Promise((resolve, reject) => {
    const xhr2 = new XMLHttpRequest();
    const url = BASE_URL + "/grp11/backend/fetchRouting?username=" + encodeURIComponent(username);

    xhr2.open("GET", url, true);

    xhr2.onreadystatechange = function () {
      if (xhr2.readyState === 4 && xhr2.status === 200) {
        const routings = JSON.parse(xhr2.responseText);
        waypointGraph = createGraph(routings.collection1, gateWays);
        resolve();
        scheduleRequest();
      }
    };

    xhr2.send();
  });
}

// ------------------ DISPLAY WAYPOINTS -----------------------
function displayWaypoints() {
  for (let gws = 0; gws < gateWays.length; gws++) {
    gateWays[gws].waypointMarker = createMarker(gateWays[gws]);
  }
}

// ------------------ INSERT FLIGHTS INTO FLIGHT LEVELS -------
function insertToFlightInfo() {
  intervalId2 = setInterval(function () {
    for (let m = 0; m < allFlights.length; m++) {
      if (compareTime(allFlights[m].departure_time, allFlights[m].callsign)) {
        const altitude = allFlights[m].currentAltitude;

        if (altitude in namingObject) {
          flightInfo[namingObject[altitude]].push(allFlights[m]);
        } else {
          namingObject[altitude] = Object.keys(namingObject).length;
          flightInfo.push([]);
          flightInfo[namingObject[altitude]].push(allFlights[m]);
        }

        allFlights.splice(m, 1);
        m--;
      }
    }
  }, 6000);
}

// ------------------ COLLISION HANDLING ----------------------
function collisionHandling() {
  for (let j = 0; j < compArr.length; j++) {
    while (compArr[j].length > 0) {
      let ob1 = compArr[j].pop();

      for (let k = 0; k < compArr[j].length; k++) {
        let distance = google.maps.geometry.spherical.computeDistanceBetween(
          ob1.marker.position,
          compArr[j][k].marker.position
        );

        if (distance < radius) {
          blinkCircle(ob1.marker.position.lat(), ob1.marker.position.lng());

          const localDate = new Date();
          const table = document.getElementById("collision-table");

          var newRow = table.insertRow();
          newRow.insertCell(0).innerHTML = ob1.callsign;
          newRow.insertCell(1).innerHTML = compArr[j][k].callsign;
          newRow.insertCell(2).innerHTML =
            localDate.getHours() +
            ":" +
            localDate.getMinutes() +
            ":" +
            localDate.getSeconds();
          newRow.insertCell(3).innerHTML = ob1.lat;
          newRow.insertCell(4).innerHTML = ob1.lng;
        }
      }
    }
  }
}

// ------------------ INIT MAP (GOOGLE CALLBACK) -------------
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 1.99, lng: 106.66 },
    zoom: 7,
    maxZoom: 15,
    minZoom: 5,
  });

  window.dispatchEvent(new Event('mapReady'));
  main();
}

// ------------------ MAIN SIMULATION ENTRY ------------------
function main() {
  getWaypoints();

  // Restricted polygon
  const markedRegionVertices = [
    { lat: 1.675, lng: 103.66 },
    { lat: 2.1633333, lng: 102.641666 },
    { lat: 2.80055, lng: 102.671944 },
  ];

  markedRegionPolygon = new google.maps.Polygon({
    paths: markedRegionVertices,
    strokeColor: "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#FF0000",
    fillOpacity: 0.35,
  });

  markedRegionPolygon.setMap(map);

  // ---------------- Simulation Update (2.5 sec) ------------------
  intervalId1 = setInterval(function () {
    for (let j = 0; j < flightInfo.length; j++) {
      if (flightInfo[j].length > 0) {
        for (let k = 0; k < flightInfo[j].length; k++) {
          if (flightInfo[j][k] instanceof Flight) {
            flightInfo[j][k].incrementing();

            if (flightInfo[j][k].going) {
              const reached = flightInfo[j][k].lat !== null;

              if (reached && flightInfo[j][k].count < flightInfo[j][k].route.length) {
                if (
                  flightInfo[j][k].waypointChanging_down(j, k, username) &&
                  flightInfo[j][k].prevAltitude !== flightInfo[j][k].currentAltitude
                ) {
                  const altitude = flightInfo[j][k].currentAltitude;
                  const removed = flightInfo[j].splice(k, 1)[0];
                  handleAltitudeLevels(removed, altitude);
                  k--;
                }
              }
            }
          }
        }

        compArr = flightInfo.map((arr) => [...arr]);
        collisionHandling();
      }
    }
  }, 2500);
}

// ------------------ ALTITUDE ORGANIZER ----------------------
function handleAltitudeLevels(flight, altitude) {
  if (altitude in namingObject) {
    flightInfo[namingObject[altitude]].push(flight);
  } else {
    namingObject[altitude] = Object.keys(namingObject).length;
    flightInfo.push([]);
    flightInfo[namingObject[altitude]].push(flight);
  }
}

// ------------------ TIME UTILS -------------------------------
function createTimeCollection() {
  // Use simulation clock hour (defined in script_2.js)
  const sim = getSimTime();
  current_hour = sim.h;
  const nextHour = (current_hour + 1) % 24;
  return current_hour + "-" + nextHour;
}
