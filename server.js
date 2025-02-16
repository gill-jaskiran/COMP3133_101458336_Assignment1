// imports
const express = require('express');
const mongoose = require('mongoose');
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');
const Schema = require('./graphql/schema'); // Your GraphQL schema file

// getting variables from .env file
dotenv.config();

// making a express app 
const app = express();
// middleware 
app.use(express.json()); 

// logging Mongo
console.log("Mongo URI:", process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('Error connecting to MongoDB database:', err));

// POST for adding employee
app.post(
  '/employee',
  // validation of fields
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('position').notEmpty().withMessage('Position is required'),
  // root handling
  (req, res) => {
    // checking for validation err
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // return 400 bad request for error
      return res.status(400).json({ errors: errors.array() });
    }
    // extracting validated fields
    const { name, email, position } = req.body;
    // returning 201 success response with employee details
    res.status(201).json({ message: 'Employee added successfully', name, email, position });
  }
);

// apollo server
const server = new ApolloServer({
  schema: Schema,
});

startStandaloneServer(server, {
    listen: { port: 4001 }, 
}).then(({ url }) => {
    console.log(`Server ready at ${url}`); // logging the port number
});