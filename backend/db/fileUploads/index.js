/**
 * File Uploads module - exports all file upload related functions
 * @module db/fileUploads
 */

import { createFileUpload } from './createFileUpload.js';
import { getFileUploadById } from './getFileUploadById.js';
import { getFileUploadsBySchema } from './getFileUploadsBySchema.js';
import { deleteFileUpload } from './deleteFileUpload.js';
import { searchFileUploads } from './searchFileUploads.js';

export {
  createFileUpload,
  getFileUploadById,
  getFileUploadsBySchema,
  deleteFileUpload,
  searchFileUploads
};
