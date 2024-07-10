class Flight{
    constructor(obj){
        this.callsign = obj.Callsign;
        //this.route = rearrangeArray(obj.path[0]);
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
        this.markerName = null;
        this.tanvalue = null;
        this.count = 1;
        this.increment = 0.06;
        this.going = true;
        this.departure_time = obj.Departure_Time;
        this.marker = null;
        this.altitude = rearrangeArray(obj.Altitude);
        this.currentAltitude = this.altitude[0];
        this.prevAltitude = this.altitude[0];
        this.landed = true;
        this.speeds = rearrangeArray(obj.Speed_multiplied);
        this.currentSpeed = parseFloat(this.speeds[0]);
        this.collectionName = getHourRange(this.departure_time);
    }

    // rearrangeArray(inputString){
    //     // remove initial '[' and final ']' characters
    //     inputString = inputString.slice(1, -1);
    //     // split the input string by commas
    //     const elements = inputString.split(",");
    //     // create a new array of strings
    //     const outputArray = elements.map((element) => {
    //       // remove any leading or trailing whitespace
    //       element = element.trim();
    //       // return the element as a string
    //       return String(element);
    //     });
    //     // return the output array
    //     return outputArray;
    // }

    createMarker(){
        const newMarker = new google.maps.Marker({
            map: map,
            position: { lat: this.initLat, lng: this.initLng },
            icon : {
                url: this.markerName,
                scaledSize :  new google.maps.Size(20, 20)
            },
            /*label:{                           
                text : allFlights[i].callsign,      
                labelVisible : false                
            },*/
            setTitle : this.callsign
        });
        return newMarker;
    }

    initializing(){
        //console.log(this);
        //console.log(this.route[0]);
        //console.log(gateWays);
        let firstWaypoint = gateWays.find((obj) => obj.label == this.route[0]);
        let secondWaypoint = gateWays.find((obj) => obj.label == this.route[1]);
        //console.log('first waypoint = '+firstWaypoint);


        // assigning initial and next coordinates 
        this.initLat = firstWaypoint.lat;
        this.initLng = firstWaypoint.lng;
        this.nextLat = secondWaypoint.lat;
        this.nextLng = secondWaypoint.lng;
        //calculating initial gradient and intercept
        this.m = calcGradient( this.initLng,  this.initLat,  this.nextLng,  this.nextLat);
        this.c = calcIntercept( this.nextLng,  this.nextLat,  this.m);

        this.tanvalue = clacPlaneAngle( this.m);
        this.markerName = initalString_2( this.initLat,  this.initLng,  this.nextLat,  this.nextLng);
        // calculating the initail increment
        if( this.initLng >  this.nextLng){
            this.increment = -1*Math.abs( this.increment);
        }else{
            this.increment = 1*Math.abs( this.increment);
        }
        // creates the marker of the planes
        this.marker = this.createMarker();

        this.marker.addListener("click", () =>{
            slidingComponent.style.left = "0";
            displayInfo(this.callsign, this.departure_time, this.route[0], this.route[this.route.length-1], this.routing);
            //console.log(this.setTitle);
            // Get a reference to the button element
            const button = document.getElementById("altitude-btn");

            // Set the dynamic value to the data-info attribute
            button.setAttribute('data-info', this.callsign);
            button.setAttribute('value', this.departure_time);
            button.setAttribute('name', this.collectionName);
            button.setAttribute('data-xdata', this.count);

        })
    }

    incrementing(){
        //console.log("inside incrementing");
        //console.log('old position lat = '+this.marker.getPosition().lat()+', lng = '+this.marker.getPosition().lng())
        const newLocation = calculateNewPositionOnCircle(
            this.marker.getPosition().lat(),
            this.marker.getPosition().lng(),
            this.nextLat,
            this.nextLng,
            this.currentSpeed * 1.0288
        );
        this.lat = newLocation.latitude;
        this.lng = newLocation.longitude;
        //console.log('new position lat = '+this.marker.getPosition().lat()+', lng = '+this.marker.getPosition().lng())


        //this.lng = this.marker.getPosition().lng() + this.increment;
        //this.lat =  this.lng* this.m +  this.c;
        this.marker.setPosition({lat: this.lat, lng: this.lng});
    }

    waypointChanging_down(j, k, username){
        //console.log("inside down");
        if(this.isDestinationReached(j, k, username)){
            return 0;
        }
        this.initLat =  this.nextLat;
        this.initLng = this.nextLng;
        let temp1 = gateWays.find((obj) => obj.label == this.route[this.count]);
       // console.log('next waypoint = ');
        //console.log(temp1);
        this.nextLat = temp1.lat;
        this.nextLng = temp1.lng;
        //console.log('nextlat = '+this.nextLat+', nextlng = '+this.nextLng);
        this.m = calcGradient(this.initLng, this.initLat,this.nextLng, this.nextLat);
        this.c = calcIntercept(this.nextLng, this.nextLat, this.m);
        this.tanvalue = clacPlaneAngle(this.m);
        if(this.initLat > this.nextLat){
            this.tanvalue = this.tanvalue + 180;
        }
        //console.log('tanvalue = '+this.tanvalue);
        this.markerName = makeImageString(this.tanvalue-40);
        //console.log('marker name = '+this.markerName);
        let icon = {
            url: this.markerName,
            scaledSize: new google.maps.Size(20, 20)
        };
        this.marker.setIcon(icon);
        if(this.initLng > this.nextLng){
            this.increment = -1*Math.abs(this.increment);
        }else{
            this.increment = Math.abs(this.increment);
        }

        return 1;
    }

    sendDestinationPost(username){
        let xhr = new XMLHttpRequest();
        const localDate = new Date();
        let destinationTime = localDate.getHours()+':'+localDate.getMinutes()+':'+localDate.getSeconds();

        //let url = 'https://demo.eminenceapps.com/grp11/destination?username='+encodeURIComponent(username)+'&callSign='+encodeURIComponent(this.callsign)+'&startTime='+encodeURIComponent(this.departure_time)+'&endTime=' + encodeURIComponent(destinationTime) + '&lat='+encodeURIComponent(this.nextLat)+'&lng=' + encodeURIComponent(this.nextLng);
        let url = apiUrl+'/grp11/destination?username='+encodeURIComponent(username)+'&callSign='+encodeURIComponent(this.callsign)+'&startTime='+encodeURIComponent(this.departure_time)+'&endTime=' + encodeURIComponent(destinationTime) + '&lat='+encodeURIComponent(this.nextLat)+'&lng=' + encodeURIComponent(this.nextLng);

        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = function() {
            if (xhr.status === 200) {
              // Request was successful
              console.log(xhr.responseText);
            } else {
              // Request failed
              console.error('Request failed. Status:', xhr.status);
            }
        };
        xhr.send();
    
    }

    isDestinationReached(j, k, username){
        //console.log("inside reached");
        this.count = this.count + 1;
        this.prevAltitude = this.currentAltitude;
        this.currentAltitude = this.altitude[this.count-1];
        this.currentSpeed = parseFloat(this.speeds[this.count-1]);
        //console.log("count = "+this.count);
        
        //console.log("coutn = "+this.count);
        if(this.count >= this.route.length){
            //console.log("removed");
            //console.log("End reached");
            this.marker.setPosition({lat : this.nextLat, lng : this.nextLng});
            this.going = false;
            this.landed = true;
            this.sendDestinationPost(username);
            try{
                flightInfo[j].splice(k, 1);
            }catch(error){
                console.log(error);
                //console.log('callsign = '+this.callsign);
                //console.log('j = '+j);
                //console.log('k = '+k);
            }
            return 1;
        }
        return 0;
    }

    waypointChanging_up(j, k, username){
        //console.log("inside up");
        if(this.isDestinationReached(j, k, username)){
            return 0;
        }
        this.initLat =  this.nextLat;
        this.initLng =this.nextLng;
        // plane stopping
        var temp2 = gateWays.find((obj) => obj.label == this.route[this.count]);
        //console.log('next waypoint = ');
        //console.log(temp2);
        this.nextLat = temp2.lat;
        this.nextLng = temp2.lng;
        //console.log('nextlat = '+this.nextLat+', nextlng = '+this.nextLng);

        // calculate the new gradient and intercept of the next journey
        this.m = calcGradient(this.initLng, this.initLat,this.nextLng, this.nextLat)
        this.c = calcIntercept(this.nextLng, this.nextLat, this.m);

        this.tanvalue = clacPlaneAngle(this.m);
        if(this.initLat >  this.nextLat){
            this.tanvalue = this.tanvalue + 180;
        }
        //console.log('tanvalue = '+this.tanvalue);
        this.markerName = makeImageString(this.tanvalue-40);
        //console.log('marker name = '+this.markerName);

        let icon = {
            url: this.markerName,
            scaledSize: new google.maps.Size(20, 20)
        };
        this.marker.setIcon(icon);
        // selecting the right increment whether negative or positive
        if(this.initLng > this.nextLng){
            this.increment = -1*Math.abs(this.increment);
        }else{
            this.increment = Math.abs(this.increment);
        }
        return 1;
    }

}

class WayPoint{
    constructor(obj){
        this.lat = obj.Lat;
        this.lng = obj.Lng;
        this.label = obj.Node_name;
        this.waypointMarker = null;
    }
    
}


