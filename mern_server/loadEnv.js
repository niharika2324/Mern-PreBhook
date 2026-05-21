// This file exists solely to run dotenv.config() before any other module
// loads, because ES module imports are hoisted above executable code.
import dotenv from 'dotenv';
dotenv.config();
