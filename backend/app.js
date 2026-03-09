// app.js - cleaned and env-driven
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const csvParser = require('csv-parser');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors');
const { parse: json2csv } = require('json2csv');

const {
  User,
  Users,
  PlaneModel,
  RoutingTable,
  WaypointCollection,
  LandedFlightModel
} = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI_BASE = process.env.MONGO_URI_BASE; // without DB name
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret';
const API_URL = process.env.API_URL || '';
const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_KEY || '';

if (!MONGO_URI_BASE) {
  console.warn('WARNING: MONGO_URI_BASE is not set. Set it in .env to connect to MongoDB.');
} else {
  // Connect default mongoose connection to central "users_db" for login/signup
  mongoose.connect(`${MONGO_URI_BASE}/users_db?retryWrites=true&w=majority`)
    .then(() => console.log('Connected to central users_db'))
    .catch(err => console.error('Central DB connection failed:', err));
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // change to true when using HTTPS
}));

// Serve entire front-end folder
app.use('/front-end', express.static(path.join(__dirname, '../front-end')));

// Serve data folder for easy CSV downloads
app.use('/data', express.static(path.join(__dirname, '../data')));

// Small config endpoint so frontend can fetch keys / apiUrl
app.get('/config', (req, res) => {
  res.json({
    apiUrl: API_URL,
    googleMapsKey: GOOGLE_MAPS_KEY
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Helper: build per-user connection string and return a mongoose connection.
// NOTE: MONGO_URI_BASE should not include a database name; we append the username as DB name.
async function getUserConnection(username) {
  if (!MONGO_URI_BASE) {
    throw new Error('MONGO_URI_BASE not configured in .env');
  }
  const dbName = username.replace(/[^a-zA-Z0-9]/g, '_');
  const uri = `${MONGO_URI_BASE}/${dbName}?retryWrites=true&w=majority`;
  return mongoose.createConnection(uri).asPromise();
}

// Multer — memory storage so it works on Vercel (no writable disk in serverless)
const upload = multer({ storage: multer.memoryStorage() });

// ---------- AUTH / USER ----------

// Signup: create user entry in central "logincollections" (Users model) and create an empty DB for them
app.post('/grp11/backend/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const existing = await Users.findOne({ name: username }).exec();
    if (existing) {
      return res.status(409).json({ error: 'user exists' });
    }

    await Users.create({ name: username, password });
    // Optionally create user DB by making a connection then closing it
    if (MONGO_URI_BASE) {
      const conn = await getUserConnection(username);
      // initialise a users collection for that DB
      conn.model('User', User.schema);
      // close after a short delay to ensure DB created
      setTimeout(() => conn.close().catch(() => {}), 1000);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('signup error', err);
    res.status(500).json({ error: 'internal error' });
  }
});

// Login — simple username/password check in central collection
app.post('/grp11/backend/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await Users.findOne({ name: username }).exec();
    if (user && user.password === password) {
      // create session if you want
      req.session.username = username;
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'invalid credentials' });
    }
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ error: 'internal error' });
  }
});

// ---------------- CSV UPLOAD ----------------
// Upload route expects up to 4 files (first flights, second waypoints, third routing, optional fourth)
app.post('/grp11/backend/upload', upload.array('file', 4), async (req, res) => {
  const files = req.files || [];
  const username = req.query.username;
  if (!username) return res.status(400).json({ error: 'username query param required' });

  let conn;
  try {
    conn = await getUserConnection(username);
  } catch (err) {
    console.error('upload error - no MONGO base', err);
    return res.status(500).json({ error: 'server misconfiguration' });
  }

  // models per user DB
  const WaypointsModel = conn.model('WayPoints_100', WaypointCollection.schema);
  const RoutingModel = conn.model('routingtables', RoutingTable.schema);
  const LandedModel = conn.model('LandedFlightModel', LandedFlightModel.schema);

  // clear existing waypoint & routing collections before inserting new
  try {
    await WaypointsModel.deleteMany({});
    await RoutingModel.deleteMany({});
    // flights collections will be per-hour and handled below
  } catch (err) {
    console.error('Error clearing collections', err);
  }

  // helper to parse a CSV buffer into documents and insert
  function insertCsvBufferToModel(buffer, model, options = {}) {
    return new Promise((resolve, reject) => {
      const { Readable } = require('stream');
      const rows = [];
      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable
        .pipe(csvParser(options))
        .on('data', (row) => rows.push(row))
        .on('end', async () => {
          try {
            if (rows.length) await model.insertMany(rows);
            resolve(rows.length);
          } catch (e) { reject(e); }
        })
        .on('error', err => reject(err));
    });
  }

  try {
    // expect file[0] -> flights, file[1] -> waypoints, file[2] -> routing
    const flightsFile  = files[0];
    const waypointsFile = files[1];
    const routingFile  = files[2];

    if (waypointsFile) {
      await insertCsvBufferToModel(waypointsFile.buffer, WaypointsModel);
      console.log('Waypoints uploaded');
    }
    if (routingFile) {
      await insertCsvBufferToModel(routingFile.buffer, RoutingModel, { separator: ';' });
      console.log('Routing uploaded');
    }

    if (flightsFile) {
      await new Promise((resolve, reject) => {
        const { Readable } = require('stream');
        const readable = new Readable();
        readable.push(flightsFile.buffer);
        readable.push(null);
        const stream = readable.pipe(csvParser({ separator: ';' }));
        const hourModels = {};
        stream.on('data', async (row) => {
          try {
            const departureTime = String(row.Departure_Time || '');
            const hour = parseInt(departureTime.split('.')[0]) || 0;
            const collectionName = `${hour}-${hour + 1}`;
            if (!hourModels[collectionName]) {
              hourModels[collectionName] = conn.model(collectionName, PlaneModel.schema);
              try { await hourModels[collectionName].deleteMany({}); } catch (e) {}
            }
            const doc = {
              Callsign: row.Callsign, Origin_Info: row.Origin_Info,
              Destination_Info: row.Destination_Info, path: row.path,
              Routing: row.Routing, Departure_Time: row.Departure_Time,
              Aircraft_Type: row.Aircraft_Type, Altitude: row.Altitude,
              landed_time: row.landed_time, Speed_multiplied: row.Speed_multiplied
            };
            hourModels[collectionName].create(doc).catch(err => console.error('save flight error', err));
          } catch (err) { console.error('processing flights row', err); }
        });
        stream.on('end', () => resolve());
        stream.on('error', err => reject(err));
      });
      console.log('Flights uploaded');
    }

    res.json({ success: true, username });
  } catch (err) {
    console.error('upload error', err);
    res.status(500).json({ error: 'upload failed' });
  } finally {
    // close user connection if present
    if (conn) {
      try { conn.close(); } catch (e) {}
    }
  }
});

// --------- WAYPOINTS ----------
app.get('/grp11/backend/wayPoints', async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ error: 'username required' });

  let conn;
  try {
    conn = await getUserConnection(username);
    const WaypointsModel = conn.model('WayPoints_100', WaypointCollection.schema);
    const docs = await WaypointsModel.find().exec();
    res.json({ collection1: docs });
  } catch (err) {
    console.error('/wayPoints error', err);
    res.status(500).json({ error: 'error fetching waypoints' });
  } finally {
    if (conn) try { conn.close(); } catch (e) {}
  }
});

// --------- ALTITUDES (graph) ----------
app.post('/grp11/backend/altitudes', async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ error: 'username required' });

  const { value_time, value_callsign, value_name } = req.body;
  if (!value_time || !value_callsign || !value_name) {
    return res.status(400).json({ error: 'missing body params' });
  }

  let conn;
  try {
    conn = await getUserConnection(username);
    const CollectionModel = conn.model(value_name, PlaneModel.schema);
    const query = { Departure_Time: value_time, Callsign: value_callsign };
    const doc = await CollectionModel.findOne(query).exec();
    if (!doc) return res.status(404).json({ error: 'not found' });

    function removeBrackets(s = '') {
      if (typeof s !== 'string') return s;
      return s.startsWith('[') && s.endsWith(']') ? s.slice(1, -1) : s;
    }

    const grphData = {
      altitudes: removeBrackets(doc.Altitude),
      waypoints: removeBrackets(doc.path),
      speeds: removeBrackets(doc.Speed_multiplied)
    };
    res.json(grphData);
  } catch (err) {
    console.error('/altitudes error', err);
    res.status(500).json({ error: 'internal error' });
  } finally {
    if (conn) try { conn.close(); } catch (e) {}
  }
});

// --------- FETCH ROUTING (unique pairs) ----------
app.get('/grp11/backend/fetchRouting', async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ error: 'username required' });

  let conn;
  try {
    conn = await getUserConnection(username);
    const RoutingModel = conn.model('routingtables', RoutingTable.schema);
    const docs = await RoutingModel.find().exec();

    function createUniqueWaypointPairs(data) {
      const pairsSet = new Set();
      data.forEach(document => {
        const waypointPath = document.Routing || '';
        const waypoints = waypointPath.split(' ');
        for (let i = 0; i < waypoints.length - 1; i++) {
          const pair = [waypoints[i], waypoints[i + 1]];
          const sortedPair = pair.slice().sort();
          pairsSet.add(JSON.stringify(sortedPair));
        }
      });
      return Array.from(pairsSet).map(p => JSON.parse(p));
    }

    const waypointPairArray = createUniqueWaypointPairs(docs);
    res.json({ collection1: waypointPairArray });
  } catch (err) {
    console.error('/fetchRouting error', err);
    res.status(500).json({ error: 'internal error' });
  } finally {
    if (conn) try { conn.close(); } catch (e) {}
  }
});

// --------- DATA (hour bucket) ----------
app.get('/grp11/backend/data', async (req, res) => {
  const username = req.query.username;
  const timeColl = req.query.time;
  if (!username || !timeColl) return res.status(400).json({ error: 'username and time required' });

  let conn;
  try {
    conn = await getUserConnection(username);
    const CollectionModel = conn.model(timeColl, PlaneModel.schema);
    const docs = await CollectionModel.find().exec();
    res.json({ collection2: docs });
  } catch (err) {
    console.error('/data error', err);
    res.status(500).json({ error: 'internal error' });
  } finally {
    if (conn) try { conn.close(); } catch (e) {}
  }
});

// --------- DESTINATION / LANDING persistence ----------
app.post('/grp11/backend/destination', async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ error: 'username required' });

  const { callSign, startTimee, endTime, lat, lng } = req.query; // original used query params
  let conn;
  try {
    conn = await getUserConnection(username);
    const LandedModel = conn.model('LandedFlightModel', LandedFlightModel.schema);
    const landed = new LandedModel({
      callSign: callSign,
      departure_time: startTimee,
      landed_time: endTime,
      lat: parseFloat(lat) || 0,
      lng: parseFloat(lng) || 0
    });
    await landed.save();
    res.status(200).send(`Landed flight ${callSign} created`);
  } catch (err) {
    console.error('destination error', err);
    res.status(500).send('error saving landed flight');
  } finally {
    if (conn) try { conn.close(); } catch (e) {}
  }
});

// --------- DOWNLOAD landed flights as CSV ----------
app.get('/grp11/backend/download-landed-flights', async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ error: 'username required' });

  let conn;
  try {
    conn = await getUserConnection(username);
    const LandedModel = conn.model('LandedFlightModel', LandedFlightModel.schema);
    const docs = await LandedModel.find({}).lean().exec();
    const csv = json2csv(docs, { fields: ['callSign', 'departure_time', 'landed_time', 'lat', 'lng'] });
    res.setHeader('Content-Disposition', 'attachment; filename=landed_flights.csv');
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  } catch (err) {
    console.error('download-landed-flights error', err);
    res.status(500).send('error exporting CSV');
  } finally {
    if (conn) try { conn.close(); } catch (e) {}
  }
});

// Fallback - serve index if file exists
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'front-end', 'html', 'index.html');
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  res.send('Fast Time Flight Simulator backend');
});

// Start server locally; on Vercel the exported app is used directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}

module.exports = app;
