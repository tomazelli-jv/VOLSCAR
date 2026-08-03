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
  app.set('trust proxy', 1);

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

  const carId = result.insertId;

  // Cria evento automático de saída
  if (scheduledDeparture) {

    await pool.execute(
      `
      INSERT INTO events
      (
        car_id,
        type,
        title,
        date,
        time,
        vendor,
        client,
        note,
        source,
        source_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
      carId,
      'saida',
      `🚗 ${name}`,
      scheduledDeparture,
      '08:00',
      '',
      '',
      `
Veículo: ${name}

Modelo: ${model}

Placa: ${plate}

Chassi: ${chassis}

Entrada: ${arrivalDate || '-'}

Saída prevista: ${scheduledDeparture || '-'}
  `,
      'system',
      carId
  ]
    );

  }

  res.status(201).json({
    id: carId
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

      // Busca o veículo atual
      const [rows] = await pool.execute(
        `
        SELECT
          name,
          model,
          plate,
          chassis,
          arrival_date,
          scheduled_departure,
          departure_date
        FROM cars
        WHERE id = ?
        `,
        [id]
      );

      if (!rows.length) {
        return res.status(404).json({
          error: 'Veículo não encontrado'
        });
      }

      const currentCar = rows[0];
      const {
        name,
        model,
        plate,
        chassis,
        arrivalDate,
        scheduledDeparture,
        departureDate
      } = req.body;

      const finalName = name ?? currentCar.name;
      const finalModel = model ?? currentCar.model;
      const finalPlate = plate ?? currentCar.plate;
      const finalChassis = chassis ?? currentCar.chassis;
      const finalArrivalDate = arrivalDate ?? currentCar.arrival_date;
      const finalScheduledDeparture = scheduledDeparture ?? currentCar.scheduled_departure;
      const finalDepartureDate = departureDate ?? currentCar.departure_date;

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
    name ?? currentCar.name,
    model ?? currentCar.model,
    plate ?? currentCar.plate,
    chassis ?? currentCar.chassis,
    arrivalDate ?? currentCar.arrival_date,
    finalScheduledDeparture ?? currentCar.scheduled_departure,
    finalDepartureDate ?? currentCar.departure_date,
    id
  ]

  
);

  // =======================================
  // Atualiza evento automático da agenda
  // =======================================

  // Procura se já existe um evento automático deste veículo
  const [eventRows] = await pool.execute(
    `
    SELECT id
    FROM events
    WHERE source = 'system'
      AND source_id = ?
    `,
    [id]
  );

  if (finalScheduledDeparture) {

    if (eventRows.length) {

      // Atualiza o evento existente
      await pool.execute(
        `
        UPDATE events
        SET
          title = ?,
          date = ?,
          note = ?
          WHERE id = ?
        `,
        [
      `🚗 ${finalName}`,
      finalScheduledDeparture,
      `
Veículo: ${finalName}

Modelo: ${finalModel}

Placa: ${finalPlate}

Chassi: ${finalChassis}

Entrada: ${finalArrivalDate || '-'}

Saída prevista: ${finalScheduledDeparture || '-'}
  `,
      eventRows[0].id
  ]
      );

    } else {

      // Cria o evento caso ainda não exista
      await pool.execute(
        `
        INSERT INTO events
        (
          car_id,
          type,
          title,
          date,
          time,
          vendor,
          client,
          note,
          source,
          source_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          id,
          'saida',
          `Saída prevista - ${finalName}`,
          finalScheduledDeparture,
          '00:00',
          '',
          '',
          'Gerado automaticamente',
          'system',
          id
        ]
      );

    }

  } else {

    // Remove o evento caso a data de saída tenha sido apagada
    await pool.execute(
      `
      DELETE FROM events
      WHERE source = 'system'
        AND source_id = ?
      `,
      [id]
    );

  }

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

  // Remove todos os eventos automáticos do veículo
  await pool.execute(
      `
      DELETE FROM events
      WHERE source = 'system'
        AND source_id = ?
      `,
      [id]
  );

  // Remove o veículo
  await pool.execute(
      'DELETE FROM cars WHERE id = ?',
      [id]
  );

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

    // Busca o evento
    const [rows] = await pool.execute(
      `
      SELECT
        source,
        source_id
      FROM events
      WHERE id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Evento não encontrado'
      });
    }

    const event = rows[0];

    if (event.source === 'system') {

      // Remove todos os eventos automáticos do veículo
      await pool.execute(
        `
        DELETE FROM events
        WHERE source = 'system'
          AND source_id = ?
        `,
        [event.source_id]
      );

      // Remove o veículo
      await pool.execute(
        `
        DELETE FROM cars
        WHERE id = ?
        `,
        [event.source_id]
      );

    } else {

      // Remove apenas o evento manual
      await pool.execute(
        `
        DELETE FROM events
        WHERE id = ?
        `,
        [id]
      );

    }

    res.json({
      message: 'Event deleted successfully'
    });

  }

    catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Server error'
    });

  }

});

  // =======================================
  //  USERS
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
  // GET USER PERMISSIONS
  // =======================================

  app.get('/api/users/:id/permissions', authenticateToken, async (req, res) => {
    try {

      const { id } = req.params;

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
      `, [id]);

      res.json(permissions);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: error.message
      });

    }
  });

  // =======================================
  // CREATE USER
  // =======================================

  app.post('/api/users', authenticateToken, async (req, res) => {
    try {

      const {
        username,
        password,
        role,
        permissions = []
      } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          error: 'Usuário e senha são obrigatórios'
        });
      }

      // Verifica se o usuário já existe
      const [exists] = await pool.execute(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );

      if (exists.length) {
        return res.status(400).json({
          error: 'Usuário já existe'
        });
      }

      // Criptografa a senha
      const hash = await bcrypt.hash(password, 10);

      // Cria o usuário
      const [result] = await pool.execute(
        `
        INSERT INTO users
        (
          username,
          password,
          role
        )
        VALUES (?, ?, ?)
        `,
        [
          username,
          hash,
          role || 'user'
        ]
      );

      const userId = result.insertId;

      // Salva permissões
      if (Array.isArray(permissions)) {

        for (const permission of permissions) {

          const permissionId =
            typeof permission === 'object'
              ? permission.id
              : permission;

          if (!permissionId) continue;

          await pool.execute(
            `
            INSERT INTO user_permissions
            (
              user_id,
              permission_id
            )
            VALUES (?, ?)
            `,
            [
              userId,
              permissionId
            ]
          );
        }
      }

      res.status(201).json({
        id: userId,
        message: 'Usuário criado com sucesso'
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: error.message
      });

    }
  });


  // =======================================
  // UPDATE USER
  // =======================================

  app.put('/api/users/:id', authenticateToken, async (req, res) => {
    try {

      const { id } = req.params;

      const {
        username,
        role,
        permissions = []
      } = req.body;

      if (!username) {
        return res.status(400).json({
          error: 'Usuário é obrigatório'
        });
      }

      // Verifica se outro usuário já utiliza esse username
      const [exists] = await pool.execute(
        `
        SELECT id
        FROM users
        WHERE username = ?
        AND id <> ?
        `,
        [
          username,
          id
        ]
      );

      if (exists.length) {
        return res.status(400).json({
          error: 'Já existe um usuário com esse nome.'
        });
      }

      // Atualiza usuário
      await pool.execute(
        `
        UPDATE users
        SET
          username = ?,
          role = ?
        WHERE id = ?
        `,
        [
          username,
          role,
          id
        ]
      );

      // Remove permissões atuais
      await pool.execute(
        `
        DELETE FROM user_permissions
        WHERE user_id = ?
        `,
        [id]
      );

      // Insere novamente
      if (Array.isArray(permissions)) {

        for (const permission of permissions) {

          const permissionId =
            typeof permission === 'object'
              ? permission.id
              : permission;

          if (!permissionId) continue;

          await pool.execute(
            `
            INSERT INTO user_permissions
            (
              user_id,
              permission_id
            )
            VALUES (?, ?)
            `,
            [
              id,
              permissionId
            ]
          );
        }

      }

      res.json({
        message: 'Usuário atualizado com sucesso.'
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: error.message
      });

    }
  });

  // =======================================
  // UPDATE USER PASSWORD
  // =======================================

  app.put('/api/users/:id/password', authenticateToken, async (req, res) => {
    try {

      const { id } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          error: 'Senha é obrigatória.'
        });
      }

      const hash = await bcrypt.hash(password, 10);

      await pool.execute(
        `
        UPDATE users
        SET password = ?
        WHERE id = ?
        `,
        [
          hash,
          id
        ]
      );

      res.json({
        message: 'Senha alterada com sucesso.'
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: error.message
      });

    }
  });


  // =======================================
  // DELETE USER
  // =======================================

  app.delete('/api/users/:id', authenticateToken, async (req, res) => {
    try {

      const { id } = req.params;

      // Não permitir excluir o próprio usuário
      if (Number(id) === Number(req.user.id)) {
        return res.status(400).json({
          error: 'Você não pode excluir seu próprio usuário.'
        });
      }

      // Remove permissões
      await pool.execute(
        `
        DELETE FROM user_permissions
        WHERE user_id = ?
        `,
        [id]
      );

      // Remove usuário
      await pool.execute(
        `
        DELETE FROM users
        WHERE id = ?
        `,
        [id]
      );

      res.json({
        message: 'Usuário removido com sucesso.'
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: error.message
      });

    }
  });

  // =======================================
  // GET PERMISSIONS
  // =======================================

  app.get('/api/permissions', authenticateToken, async (req, res) => {
    try {

      const [permissions] = await pool.execute(`
        SELECT
          id,
          name,
          description,
          category
        FROM permissions
        ORDER BY category, name
      `);

      res.json(permissions);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: error.message
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

