import express from 'express'
import mongoose from './db.js';
import dotenv from 'dotenv';
// for importing express change the type to module in package.json file and also change the main file to server.js from index.js
// const express = require('express');     // this is old method

dotenv.config();     // this is to load the environment variables from the .env file
const app = express();
mongoose.connect(process.env.MONGO_URL);

app.get('/', (req, res) => { 
  res.send('Backend is running‼️')
})


app.listen(5001, () => {
  console.log(`Server is running on http://localhost:5001`)      // Here we can use both backticks and single quotes.
})
