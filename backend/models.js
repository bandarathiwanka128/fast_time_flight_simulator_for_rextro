const mongoose = require("mongoose");

// mongoose.connect('mongodb://127.0.0.1:27017',
//   {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//   }
// ).then(() => {
//   console.log('Connected to MongoDB');
  
// })
// .catch((error) => {
//   console.log('Error connecting to MongoDB', error);
// });

const LogInSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
});

const Userschema = new mongoose.Schema({
  name: {
      type: String,
      required: true,
  },
  password: {
      type: String,
      required: true,
  },
});

const WayPointSchema = new mongoose.Schema({
    Node_name: {
      type: String,
      required: true,
    },
    Lat: {
      type: Number,
      default: 0,
    },
    Lng:{
      type: Number,
      default: 0
    }
}, { collection: 'WayPoints_100' });

const PlaneSchema = new mongoose.Schema({
    Callsign : {
      type : String
    },
    Origin_Info:{
      type: String
    },
    Destination_Info : {
      type: String
    },
    path:{
      type: String
    },
    Routing : {
      type : String
    },
    Departure_Time : {
      type : String
    },
    Aircraft_Type : {
      type : String
    },
    Altitude : {
      type : String
    },
    landed_time : {
      type : String
    },
    Speed_multiplied : {
      type : String
    }
});

const altitudeSchema = new mongoose.Schema({
    TakeOff_levels : {
      type : String
    },
    Cruise_Levels : {
      type : String
    },
    Decent_levels : {
      type : String
    }
  }, { collection: 'altitudeCollection'});

const landedFlightsSchema = new mongoose.Schema({
    callSign : {
      type : String
    },
    departure_time : {
      type : String
    },
    landed_time : {
      type : String
    },
    lat : {
      type : Number
    },
    lng : {
      type : Number
    }
});

const RoutingSchema = new mongoose.Schema({
  Name : {
    type : String
  },
  Routing : {
    type : String
  }
})

const User = mongoose.model("User", LogInSchema);
const Users = mongoose.model("Users", Userschema, 'logincollections');
const PlaneModel = mongoose.model("PlaneCollection", PlaneSchema);
//const RouteCollection = mongoose.model("RouteCollection", RouteSchema);
const WaypointCollection = mongoose.model("WaypointCollection",WayPointSchema);
const AltitudeCollection = mongoose.model("AltitudeCollection", altitudeSchema);
const LandedFlightModel = mongoose.model("landed_flights", landedFlightsSchema);
const RoutingTable = mongoose.model('RoutingTable', RoutingSchema);

module.exports = {
  User,
  Users,
  PlaneModel,
  //RouteCollection,
  WaypointCollection,
  AltitudeCollection,
  LandedFlightModel,
  RoutingTable
};





