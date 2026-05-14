const express = require('express');
const router  = express.Router();
const authenticate = require('../middleware/authenticate');
const { issueCertificate, getCertificate, getMyCertificates } = require('../controllers/certificateController');

router.get('/',            authenticate, getMyCertificates);
router.get('/:courseId',   authenticate, getCertificate);
router.post('/:courseId',  authenticate, issueCertificate);

module.exports = router;
