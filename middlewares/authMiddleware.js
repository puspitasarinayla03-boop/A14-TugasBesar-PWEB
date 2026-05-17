'use strict';

// Proteksi route — redirect ke login jika belum login (halaman)
// Untuk API route: return 401 JSON
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    res.locals.user = req.session.user;
    return next();
  }

  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ success: false, message: 'Sesi berakhir. Silakan login kembali.' });
  }

  res.redirect('/login');
}

// Cegah user yang sudah login mengakses halaman login
function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  next();
}

module.exports = { isAuthenticated, redirectIfAuthenticated };
