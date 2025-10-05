const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

// ✅ Serve everything from /public including HTML, CSS, JS, images
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Explicit routes for your main HTML files (optional but clear)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/tag.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'tag.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/authority-dashboard.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'authority-dashboard.html')));

// ✅ Simulated authorities database (by pincode prefix)
const authorityDB = {
  '452': { name: 'Indore Fire Station', type: 'fire', contact: 'fire@indore.gov' },
  '453': { name: 'Indore Police Station', type: 'police', contact: 'police@indore.gov' },
  '110': { name: 'New Delhi Police', type: 'police', contact: 'police@delhi.gov' }
};

// ✅ Helper to pick authority by pincode or tag
function findAuthorityByPincode(pincode, tag) {
  if (!pincode)
    return { name: 'City Emergency Center', type: 'general', contact: 'help@city.gov' };

  const prefix = pincode.toString().slice(0, 3);
  if (authorityDB[prefix]) return authorityDB[prefix];

  return {
    name:
      tag === 'Fire'
        ? 'Nearest Fire Station'
        : tag === 'Violence' || tag === 'SOS'
        ? 'Nearest Police Station'
        : 'Municipal Office',
    type: tag.toLowerCase(),
    contact: 'contact@city.gov'
  };
}

// ✅ API endpoint to receive reports (simulated)
app.post('/api/report', (req, res) => {
  const report = req.body || {};
  const authority = findAuthorityByPincode(report.pincode, report.tag);

  setTimeout(() => {
    res.json({
      success: true,
      message: `Report received and forwarded to ${authority.name}`,
      authority
    });
  }, 800); // simulate network delay
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 TagIT server running at http://localhost:${PORT}`)
);
