require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const path = require('path');
const pool = require('./config/database');

console.log('DB_HOST:', process.env.DB_HOST);

const app = express();

app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET not configured');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(limiter);

// =======================================
// AUTH MIDDLEWARE
// =======================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    req.user = user;
    next();
  });
};

// =======================================
// LOGIN
// =======================================

app.post('/api/login', async (req, res) => {
  try {

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    const [rows] = await pool.execute(
      'SELECT id, username, password, role FROM users WHERE username = ?',
      [username]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }
    
    const user = rows[0];

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }
    
    const [permissions] = await pool.execute(`
    SELECT
        p.id,
        p.name,
        p.description,
        p.category
    FROM user_permissions up
    INNER JOIN permissions p
        ON p.id = up.permission_id
    WHERE up.user_id = ?
    ORDER BY p.category, p.name
`, [user.id]);

    console.log("ANTES DO JWT");

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: '7d'
      }
    ); 

    console.log("DEPOIS DO JWT");

console.log("LOGIN:");
console.log({
    id: user.id,
    username: user.username,
    permissions
});

   res.json({
    token,
    user: {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions
    }
});

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Server error'
    });
  }
});

// =======================================
// GET ALL CARS
// =======================================

app.get('/api/cars', authenticateToken, async (req, res) => {
  try {

    const [cars] = await pool.execute(`
      SELECT
        id,
        name,
        model,
        plate,
        chassis,
        DATE_FORMAT(arrival_date, '%Y-%m-%d') AS arrivalDate,
        DATE_FORMAT(scheduled_departure, '%Y-%m-%d') AS scheduledDeparture,
        DATE_FORMAT(departure_date, '%Y-%m-%d') AS departureDate
      FROM cars
      ORDER BY id DESC
    `);

    res.json(cars);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Server error'
    });
  }
});

// =======================================
// ADD CAR
// =======================================

app.post('/api/cars', authenticateToken, async (req, res) => {
  try {

    const {
      name,
      model,
      plate,
      chassis,
      arrivalDate,
      scheduledDeparture
    } = req.body;

    const [result] = await pool.execute(
      `
      INSERT INTO cars
      (
        name,
        model,
        plate,
        chassis,
        arrival_date,
        scheduled_departure
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        model,
        plate,
        chassis,
        arrivalDate || null,
        scheduledDeparture || null
      ]
    );

    res.status(201).json({
      id: result.insertId
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Server error'
    });
  }
});

// =======================================
// UPDATE CAR
// =======================================

app.put('/api/cars/:id', authenticateToken, async (req, res) => {
  try {

    const { id } = req.params;

    const {
      name,
      model,
      plate,
      chassis,
      arrivalDate,
      scheduledDeparture,
      departureDate
    } = req.body;

    await pool.execute(
      `
      UPDATE cars
      SET
        name = ?,
        model = ?,
        plate = ?,
        chassis = ?,
        arrival_date = ?,
        scheduled_departure = ?,
        departure_date = ?
      WHERE id = ?
      `,
      [
        name,
        model,
        plate,
        chassis,
        arrivalDate || null,
        scheduledDeparture || null,
        departureDate || null,
        id
      ]
    );

    res.json({
      message: 'Car updated successfully'
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Server error'
    });
  }
});

// =======================================
// DELETE CAR
// =======================================

app.delete('/api/cars/:id', authenticateToken, async (req, res) => {
  try {

    const { id } = req.params;

    await pool.execute(
      'DELETE FROM cars WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Car deleted successfully'
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Server error'
    });
  }
});

// =======================================
// GET EVENTS
// =======================================

app.get('/api/events', authenticateToken, async (req, res) => {
  try {

    const [events] = await pool.execute(`
      SELECT
        id,
        car_id AS carId,
        type,
        title,
        DATE_FORMAT(date, '%Y-%m-%d') AS date,
        TIME_FORMAT(time, '%H:%i') AS time,
        vendor,
        client,
        note
      FROM events
      ORDER BY date, time
    `);

    res.json(events);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Server error'
    });
  }
});

// =======================================
// ADD EVENT
// =======================================

app.post('/api/events', authenticateToken, async (req, res) => {
  try {

    const {
      type,
      title,
      date,
      time,
      carId,
      vendor,
      client,
      note
    } = req.body;

    const [result] = await pool.execute(
      `
      INSERT INTO events
      (
        type,
        title,
        date,
        time,
        car_id,
        vendor,
        client,
        note
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        type || 'saida',
        title || null,
        date,
        time,
        carId || null,
        vendor,
        client || null,
        note || null
      ]
    );

    res.status(201).json({
      id: result.insertId
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Server error'
    });
  }
});

// =======================================
// UPDATE EVENT
// =======================================

app.put('/api/events/:id', authenticateToken, async (req, res) => {
  try {

    const { id } = req.params;

    const {
      type,
      title,
      date,
      time,
      carId,
      vendor,
      client,
      note
    } = req.body;

    await pool.execute(
      `
      UPDATE events
      SET
        type = ?,
        title = ?,
        date = ?,
        time = ?,
        car_id = ?,
        vendor = ?,
        client = ?,
        note = ?
      WHERE id = ?
      `,
      [
        type || 'saida',
        title || null,
        date,
        time,
        carId || null,
        vendor,
        client || null,
        note || null,
        id
      ]
    );

    res.json({
      message: 'Event updated successfully'
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Server error'
    });
  }
});

// =======================================
// DELETE EVENT
// =======================================

app.delete('/api/events/:id', authenticateToken, async (req, res) => {
  try {

    const { id } = req.params;

    await pool.execute(
      'DELETE FROM events WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Event deleted successfully'
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Server error'
    });
  }
});

// =======================================
// GET USERS
// =======================================

app.get('/api/users', authenticateToken, async (req, res) => {
  try {

    const [users] = await pool.execute(`
      SELECT
        id,
        username,
        role
      FROM users
      ORDER BY username
    `);

    res.json(users);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Server error'
    });
  }
});

// =======================================
// GET PERMISSIONS
// =======================================

app.get('/api/permissions', authenticateToken, async (req, res) => {
  try {

    res.json({
      admin: true,
      create: true,
      edit: true,
      delete: true
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Server error'
    });
  }
});

// =======================================
// HEALTH CHECK
// =======================================

app.get('/api/health', async (req, res) => {
  try {

    const [rows] = await pool.execute(
      'SELECT 1 AS ok'
    );

    res.json({
      ok: true,
      result: rows
    });

  } catch (error) {

    console.error('Health check DB error:', error);

    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// =======================================
// START SERVER
// =======================================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});