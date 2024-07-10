const mongoose = require('mongoose');

// Connection URL
const url = 'mongodb://127.0.0.1:27017/FlightSimulator';

// Define a schema for the collection
const PlaneShcema = new mongoose.Schema({
    Callsign : {
      type : String,
      required : true,
    },
    Origin_Info:{
      type: String
    },
    Destination_Info : {
      type: String
    },
    path:{
      type: [String]
    },
    Routing : {
      type : String
    },
    Departure_Time : {
      type : String
    }
  }, {collection : '5-7'});

// Model for the '5-7' collection
const Planes = new mongoose.model('5-7', PlaneShcema);


// Remove last two characters from Departure_Time value
const removeLastTwoCharacters = (str) => {
  return str.slice(0, -1);
};

// Connect to MongoDB
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected successfully to MongoDB');

    // Find all documents in the collection
    return Planes.find({}).lean(); // Add .lean() to convert Query object to array
  })
  .then((documents) => {
    // Update each document
    const updates = documents.map((document) => {
      const updatedDepartureTime = removeLastTwoCharacters(document.Departure_Time);

      return Planes.updateOne(
        { _id: document._id },
        { Departure_Time: updatedDepartureTime }
      );
    });

    // Execute all updates
    return Promise.all(updates);
  })
  .then(() => {
    console.log('Departure_Time values updated successfully');
  })
  .catch((err) => {
    console.error('Error occurred:', err);
  })
  .finally(() => {
    mongoose.connection.close();
  });