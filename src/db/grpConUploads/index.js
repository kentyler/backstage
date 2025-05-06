/**
 * Group conversation uploads database operations
 * @module db/grpConUploads
 */

import createGrpConUpload from './createGrpConUpload.js';
import getGrpConUploadById from './getGrpConUploadById.js';
import getGrpConUploadsByConversation from './getGrpConUploadsByConversation.js';
import deleteGrpConUpload from './deleteGrpConUpload.js';

export {
  createGrpConUpload,
  getGrpConUploadById,
  getGrpConUploadsByConversation,
  deleteGrpConUpload
};

export default {
  createGrpConUpload,
  getGrpConUploadById,
  getGrpConUploadsByConversation,
  deleteGrpConUpload
};