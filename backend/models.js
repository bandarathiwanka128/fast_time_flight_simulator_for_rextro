// models.js - cleaned schemas and exports
const mongoose = require('mongoose');

const LogInSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { type: String, required: true }
}, { collection: 'logincollections' });

const Userschema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { type: String, required: true }
}, { collection: 'logincollections' });

// Waypoints - collection name WayPoints_100 (keeps compatibility)
const WayPointSchema = new mongoose.Schema({
  Node_name: { type: String, required: true },
  Lat: { type: Number, default: 0 },
  Lng: { type: Number, default: 0 }
}, { collection: 'WayPoints_100' });

// Plane / flight schema - used for hour-bucket collections (e.g., "5-6")
const PlaneSchema = new mongoose.Schema({
  Callsign: { type: String },
  Origin_Info: { type: String },
  Destination_Info: { type: String },
  path: { type: String },
  Routing: { type: String },
  Departure_Time: { type: String },
  Aircraft_Type: { type: String },
  Altitude: { type: String },
  landed_time: { type: String },
  Speed_multiplied: { type: String }
}, { strict: false });

// altitude collection (if used)
const altitudeSchema = new mongoose.Schema({
  TakeOff_levels: { type: String },
  Cruise_Levels: { type: String },
  Decent_levels: { type: String }
}, { collection: 'altitudeCollection' });

// landed flights collection
const landedFlightsSchema = new mongoose.Schema({
  callSign: { type: String },
  departure_time: { type: String },
  landed_time: { type: String },
  lat: { type: Number },
  lng: { type: Number }
}, { collection: 'landed_flights' });

const RoutingSchema = new mongoose.Schema({
  Name: { type: String },
  Routing: { type: String }
}, { collection: 'routingtables' });

// central models (do not connect here; connections will be created in app.js per DB)
const User = mongoose.model('User', LogInSchema); // generic login model
const Users = mongoose.model('Users', Userschema, 'logincollections');

const PlaneModel = mongoose.model('PlaneCollection', PlaneSchema); // used as schema reference
const WaypointCollection = mongoose.model('WaypointCollection', WayPointSchema);
const AltitudeCollection = mongoose.model('AltitudeCollection', altitudeSchema);
const LandedFlightModel = mongoose.model('LandedFlightModel', landedFlightsSchema);
const RoutingTable = mongoose.model('RoutingTable', RoutingSchema);

module.exports = {
  User,
  Users,
  PlaneModel,
  WaypointCollection,
  AltitudeCollection,
  LandedFlightModel,
  RoutingTable
};
