import express from 'express';
import promptRoutes from './promptProcessor.js';

const router = express.Router();

/**
 * Main LLM router
 * This router serves as an entry point for LLM-related API endpoints
 * All functionality has been extracted to more specific modules
 */

// Mount the prompt processing routes
router.use('/prompt', promptRoutes);



export default router;
