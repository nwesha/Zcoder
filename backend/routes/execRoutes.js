// backend/routes/execRoutes.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// map your editor’s language keys → Judge0 language_ids
const LANGUAGE_ID = {
  javascript: 63,
  python:    71,
  java:      62,
  cpp:       54,
  html:      216,
  css:       186,
};
(async () => {
  try {
    const resp = await axios.post(
      'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true',
      { source_code: 'print("hello, world")', language_id: 71 }, // Python
      {
        headers: {
          'X-RapidAPI-Host':  'judge0-ce.p.rapidapi.com',
          'X-RapidAPI-Key':   process.env.JUDGE0_API_KEY,
          'Content-Type':     'application/json'
        }
      }
    );
    console.log('✅ Judge0 test OK:', resp.data.status.description, 
                '\nstdout:', resp.data.stdout);
  } catch (e) {
    console.error('⛔ Judge0 test failed:', e.response?.status, e.response?.data || e.message);
  }
})();
router.post('/', async (req, res) => {
  const { code, language } = req.body;
  const language_id = LANGUAGE_ID[language] || LANGUAGE_ID.javascript;

  try {
    const submitResp = await axios.post(
      'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true',
      { source_code: code, language_id },
      {
        headers: {
          'X-RapidAPI-Host':   'judge0-ce.p.rapidapi.com',
          'X-RapidAPI-Key':    process.env.JUDGE0_API_KEY,
          'Content-Type':      'application/json'
        }
      }
    );
    const result = submitResp.data;
    return res.json({
      success: true,
      output: result.stdout || result.stderr || 'No output',
      status: result.status.description
    });
  } catch (err) {
    console.error('Exec error status:', err.response?.status);
    console.error('Exec error headers:', err.response?.headers);
    console.error('Exec error data:', err.response?.data);
    console.error('Exec error message:', err.message);
    return res.status(500).json({ success: false, message: 'Execution failed' });
  }
});


module.exports = router;
