// ======================================================
// class.js  (FULL FIXED VERSION)
// ======================================================

// ------------------- FLIGHT CLASS ----------------------
class Flight {
  constructor(obj) {
    this.callsign = obj.Callsign;
    this.route = rearrangeArray(obj.path);

    this.origin = obj.Origin_Info;
    this.dest = obj.Destination_Info;
    this.routing = obj.Routing;

    this.initLat = null;
    this.initLng = null;
    this.nextLat = null;
    this.nextLng = null;
    this.lat = null;
    this.lng = null;

    this.m = null;
    this.c = null;

    this.marker = null;
    this.markerName = null;

    this.tanvalue = null;
    this.count = 1;
    this.increment = 0.06;
    this.going = true;

    this.departure_time = obj.Departure_Time;

    this.altitude = rearrangeArray(obj.Altitude);
    this.currentAltitude = this.altitude[0];
    this.prevAltitude = this.altitude[0];

    this.speeds = rearrangeArray(obj.Speed_multiplied);
    this.currentSpeed = parseFloat(this.speeds[0]);

    this.landed = true;

    this.collectionName = getHourRange(this.departure_time);
  }

  // ------------------- CREATE MARKER -------------------
  createMarker() {
    return new google.maps.Marker({
      map: map,
      position: { lat: this.initLat, lng: this.initLng },
      icon: {
        url: this.markerName,
        scaledSize: new google.maps.Size(20, 20),
      },
      setTitle: this.callsign,
    });
  }

  // ------------------- INITIALIZE ----------------------
  initializing() {
    let firstWP = gateWays.find((obj) => obj.label === this.route[0]);
    let nextWP = gateWays.find((obj) => obj.label === this.route[1]);

    this.initLat = firstWP.lat;
    this.initLng = firstWP.lng;

    this.nextLat = nextWP.lat;
    this.nextLng = nextWP.lng;

    this.m = calcGradient(this.initLng, this.initLat, this.nextLng, this.nextLat);
    this.c = calcIntercept(this.nextLng, this.nextLat, this.m);

    this.tanvalue = clacPlaneAngle(this.m);
    this.markerName = initalString_2(this.initLat, this.initLng, this.nextLat, this.nextLng);

    if (this.initLng > this.nextLng) this.increment = -Math.abs(this.increment);

    this.marker = this.createMarker();

    this.marker.addListener("click", () => {
      document.getElementById('slidingComponent').classList.add('open');

      displayInfo(
        this.callsign,
        this.departure_time,
        this.route[0],
        this.route[this.route.length - 1],
        this.routing
      );

      const btn = document.getElementById("altitude-btn");
      btn.setAttribute("data-info", this.callsign);
      btn.setAttribute("value", this.departure_time);
      btn.setAttribute("name", this.collectionName);
    });
  }

  // ------------------- MOVE PLANE ------------------------
  incrementing() {
    const newLoc = calculateNewPositionOnCircle(
      this.marker.getPosition().lat(),
      this.marker.getPosition().lng(),
      this.nextLat,
      this.nextLng,
      this.currentSpeed * 1.0288
    );

    this.lat = newLoc.latitude;
    this.lng = newLoc.longitude;

    this.marker.setPosition({ lat: this.lat, lng: this.lng });
  }

  // ------------------- CHECK DESTINATION -----------------
  isDestinationReached(j, k, username) {
    this.count++;
    this.prevAltitude = this.currentAltitude;
    this.currentAltitude = this.altitude[this.count - 1];
    this.currentSpeed = parseFloat(this.speeds[this.count - 1]);

    if (this.count >= this.route.length) {
      this.marker.setPosition({ lat: this.nextLat, lng: this.nextLng });
      this.going = false;
      this.landed = true;

      this.sendDestinationPost(username);

      try {
        flightInfo[j].splice(k, 1);
      } catch (e) {}

      return true;
    }
    return false;
  }

  // ------------------- DESTINATION POST ------------------
  sendDestinationPost(username) {
    let xhr = new XMLHttpRequest();

    const localDate = new Date();
    let endTime =
      localDate.getHours() +
      ":" +
      localDate.getMinutes() +
      ":" +
      localDate.getSeconds();

    let url =
      BASE_URL +
      "/grp11/backend/destination?username=" +
      encodeURIComponent(username) +
      "&callSign=" +
      encodeURIComponent(this.callsign) +
      "&startTime=" +
      encodeURIComponent(this.departure_time) +
      "&endTime=" +
      encodeURIComponent(endTime) +
      "&lat=" +
      encodeURIComponent(this.nextLat) +
      "&lng=" +
      encodeURIComponent(this.nextLng);

    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.send();
  }

  // ------------------- WAYPOINT CHANGE (DOWN) -------------
  waypointChanging_down(j, k, username) {
    if (this.isDestinationReached(j, k, username)) return false;

    this.initLat = this.nextLat;
    this.initLng = this.nextLng;

    let temp = gateWays.find((obj) => obj.label === this.route[this.count]);

    this.nextLat = temp.lat;
    this.nextLng = temp.lng;

    this.m = calcGradient(this.initLng, this.initLat, this.nextLng, this.nextLat);
    this.c = calcIntercept(this.nextLng, this.nextLat, this.m);

    this.tanvalue = clacPlaneAngle(this.m);
    if (this.initLat > this.nextLat) this.tanvalue += 180;

    this.markerName = makeImageString(this.tanvalue - 40);
    this.marker.setIcon({
      url: this.markerName,
      scaledSize: new google.maps.Size(20, 20),
    });

    this.increment = this.initLng > this.nextLng ? -Math.abs(this.increment) : Math.abs(this.increment);

    return true;
  }

  // ------------------- WAYPOINT CHANGE (UP) ---------------
  waypointChanging_up(j, k, username) {
    if (this.isDestinationReached(j, k, username)) return false;

    this.initLat = this.nextLat;
    this.initLng = this.nextLng;

    let temp = gateWays.find((obj) => obj.label === this.route[this.count]);

    this.nextLat = temp.lat;
    this.nextLng = temp.lng;

    this.m = calcGradient(this.initLng, this.initLat, this.nextLng, this.nextLat);
    this.c = calcIntercept(this.nextLng, this.nextLat, this.m);

    this.tanvalue = clacPlaneAngle(this.m);
    if (this.initLat > this.nextLat) this.tanvalue += 180;

    this.markerName = makeImageString(this.tanvalue - 40);

    this.marker.setIcon({
      url: this.markerName,
      scaledSize: new google.maps.Size(20, 20),
    });

    this.increment = this.initLng > this.nextLng ? -Math.abs(this.increment) : Math.abs(this.increment);

    return true;
  }
}

// ------------------- WAYPOINT CLASS ------------------------
class WayPoint {
  constructor(obj) {
    this.lat = obj.Lat;
    this.lng = obj.Lng;
    this.label = obj.Node_name;
    this.waypointMarker = null;
  }
}
