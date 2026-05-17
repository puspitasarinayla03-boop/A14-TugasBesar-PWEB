'use strict';

const db = require('../config/db');

// GET /api/projects
async function index(req, res) {
  try {
    const [projects] = await db.execute(
      'SELECT * FROM projects ORDER BY created_at DESC'
    );
    res.json({ success: true, data: projects });
  } catch (err) {
    console.error('[projects.index]', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data project.' });
  }
}

// POST /api/projects
async function store(req, res) {
  try {
    const { name, description, status, start_date, end_date } = req.body;

    if (!name || !name.trim()) {
      return res.status(422).json({ success: false, message: 'Nama project wajib diisi.' });
    }

    const [result] = await db.execute(
      'INSERT INTO projects (name, description, status, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
      [
        name.trim(),
        description ? description.trim() || null : null,
        status || 'pending',
        start_date || null,
        end_date   || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Project berhasil disimpan.',
      data:    { id: result.insertId },
    });
  } catch (err) {
    console.error('[projects.store]', err);
    res.status(500).json({ success: false, message: 'Gagal menyimpan project.' });
  }
}

// GET /api/projects/:id
async function show(req, res) {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM projects WHERE id = ? LIMIT 1',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Project tidak ditemukan.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[projects.show]', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data project.' });
  }
}

// PUT /api/projects/:id
async function update(req, res) {
  try {
    const { name, description, status, start_date, end_date } = req.body;
    const { id } = req.params;

    if (!name || !name.trim()) {
      return res.status(422).json({ success: false, message: 'Nama project wajib diisi.' });
    }

    // Cek project ada sebelum update
    const [check] = await db.execute(
      'SELECT id FROM projects WHERE id = ? LIMIT 1',
      [id]
    );
    if (!check.length) {
      return res.status(404).json({ success: false, message: 'Project tidak ditemukan.' });
    }

    await db.execute(
      'UPDATE projects SET name = ?, description = ?, status = ?, start_date = ?, end_date = ? WHERE id = ?',
      [
        name.trim(),
        description ? description.trim() || null : null,
        status || 'pending',
        start_date || null,
        end_date   || null,
        id,
      ]
    );

    res.json({ success: true, message: 'Project berhasil diupdate.' });
  } catch (err) {
    console.error('[projects.update]', err);
    res.status(500).json({ success: false, message: 'Gagal mengupdate project.' });
  }
}

// DELETE /api/projects/:id
async function destroy(req, res) {
  try {
    // Cek project ada sebelum hapus
    const [check] = await db.execute(
      'SELECT id FROM projects WHERE id = ? LIMIT 1',
      [req.params.id]
    );
    if (!check.length) {
      return res.status(404).json({ success: false, message: 'Project tidak ditemukan.' });
    }

    await db.execute('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Project berhasil dihapus.' });
  } catch (err) {
    console.error('[projects.destroy]', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus project.' });
  }
}

module.exports = { index, store, show, update, destroy };
