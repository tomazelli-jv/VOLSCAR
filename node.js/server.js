  require('dotenv').config();

  const express = require('express');
  const cors = require('cors');
  const helmet = require('helmet');
  const rateLimit = require('express-rate-limit');
  const bcrypt = require("bcryptjs");
  const jwt = require('jsonwebtoken');
  const path = require('path');
  const pool = require('./config/database');
  const { normalizePermissionIds, validateUserPayload } = require('./utils/userValidation');

  const app = express();faaç
  app.set('trust proxy', 1);

  app.use((req, res, next) => {
      console.log(`${req.method} ${req.originalUrl}`);
      next();
  });

  const PORT = process.env.PORT || 3000;
  const JWT_SECRET = process.env.JWT_SECRET;
  const APP_ORIGIN = process.env.APP_ORIGIN;
  const JWT_ISSUER = process.env.JWT_ISSUER || 'volscar';
  const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'volscar-web';

  if (!JWT_SECRET || JWT_SECRET.length < 64) {
    throw new Error('JWT_SECRET must contain at least 64 characters');
  }
  if (process.env.NODE_ENV === 'production' && !APP_ORIGIN) {
    throw new Error('APP_ORIGIN must be configured in production');
  }

  // Middleware
  app.disable('x-powered-by');
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'no-referrer' }
  }));
  app.use(cors({
    origin(origin, callback) {
      if (!origin || !APP_ORIGIN || origin === APP_ORIGIN) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400
  }));
  app.use(express.json({ limit: '32kb', strict: true }));
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(express.static(path.join(__dirname)));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false
  });

  app.use(limiter);

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { error: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' }
  });

  // =======================================
  // AUTH MIDDLEWARE
  // =======================================

  const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const tokenUser = jwt.verify(token, JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
      });

      const hasStatusColumn = await userHasStatusColumn();
      const [rows] = await pool.execute(
        `SELECT id, username, role${hasStatusColumn ? ', status' : ''}
         FROM users WHERE id = ? LIMIT 1`,
        [tokenUser.id]
      );
      const currentUser = rows[0];
      if (!currentUser || (hasStatusColumn && currentUser.status !== 'active')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      req.user = currentUser;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Authentication required' });
    }
  };


// =====================================================//
// PERMISSION MIDDLEWARE - ADICIONADO 04-08-2026 - TOMAZ//
// =====================================================//

const requirePermission = (permissionName) => {

  return async (req, res, next) => {

    try {

      // Administrador sempre possui acesso
      if (req.user.role === 'admin') {
        return next();
      }

      const [rows] = await pool.execute(
        `
        SELECT 1
        FROM user_permissions up
        INNER JOIN permissions p
          ON p.id = up.permission_id
        WHERE up.user_id = ?
          AND p.name = ?
        LIMIT 1
        `,
        [
          req.user.id,
          permissionName
        ]
      );

      if (!rows.length) {
       return res.status(403).json({
  success: false,
  code: "PERMISSION_DENIED",
  error: "VOCÊ NÃO TEM PERMISSÃO PARA ACESSAR ESTA ÁREA!",
  permission: permissionName
});
      }

      next();

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        error: 'Erro ao validar permissões.'
      });

    }

  };

};

const requireAdmin = async (req, res, next) => {
  try {
    const hasStatusColumn = await userHasStatusColumn();
    const [rows] = await pool.execute(
      `SELECT role${hasStatusColumn ? ', status' : ''} FROM users WHERE id = ? LIMIT 1`,
      [req.user.id]
    );

    const user = rows[0];
    if (!user || user.role !== 'admin' || (hasStatusColumn && user.status !== 'active')) {
      return res.status(403).json({
        success: false,
        code: 'ADMIN_REQUIRED',
        error: 'Acesso restrito a administradores.'
      });
    }

    next();
  } catch (error) {
    console.error('Admin authorization failed:', error);
    res.status(500).json({ error: 'Erro ao validar autorização.' });
  }
};



  async function userHasStatusColumn() {
    try {
      const [rows] = await pool.execute("SHOW COLUMNS FROM users LIKE 'status'");
      return rows.length > 0;
    } catch (error) {
      return false;
    }
  }

  // =======================================
  // LOGIN
  // =======================================

  app.post('/api/login', loginLimiter, async (req, res) => {
    try {

      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          error: 'Username and password are required'
        });
      }

      const hasStatusColumn = await userHasStatusColumn();
      const [rows] = await pool.execute(
        `SELECT id, username, password, role${hasStatusColumn ? ', status' : ''}
         FROM users WHERE username = ?`,
        [username]
      );

      if (!rows || rows.length === 0) {
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }
      
      const user = rows[0];

      if (hasStatusColumn && user.status !== 'active') {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(
        password,
        user.password
      );

      if (!validPassword) {
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }
      
      let permissions = [];
      try {
        [permissions] = await pool.execute(`
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
      } catch (error) {
        console.warn('Could not load permissions for user:', error.message);
        permissions = [];
      }

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role
        },
        JWT_SECRET,
        {
          algorithm: 'HS256',
          expiresIn: '2h',
          issuer: JWT_ISSUER,
          audience: JWT_AUDIENCE,
          subject: String(user.id)
        }
      ); 

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

  app.get('/api/cars',
    authenticateToken,
    requirePermission('view_cars'),
    async (req, res) => {
    try {

      const [cars] = await pool.execute(`
        SELECT
          id,
          name,
          model,
          plate,
          chassis,
          DATE_FORMAT(arrival_date, '%Y-%m-%dT%H:%i') AS arrivalDate,
          DATE_FORMAT(scheduled_departure, '%Y-%m-%dT%H:%i') AS scheduledDeparture,
          DATE_FORMAT(departure_date, '%Y-%m-%dT%H:%i') AS departureDate
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

 app.post(
  '/api/cars',
  authenticateToken,
  requirePermission('create_cars'),
  async (req, res) => {
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

      return res.status(201).json({
        id: result.insertId
      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        error: 'Server error'
      });

    }
  }
);

  // =======================================
  // UPDATE CAR
  // =======================================

  app.put('/api/cars/:id',
    authenticateToken,
    requirePermission('edit_cars'),
    async (req, res) => {
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
      const finalScheduledDeparture = Object.prototype.hasOwnProperty.call(req.body, 'scheduledDeparture')
        ? (scheduledDeparture || null)
        : currentCar.scheduled_departure;
      const finalDepartureDate = Object.prototype.hasOwnProperty.call(req.body, 'departureDate')
        ? (departureDate || null)
        : currentCar.departure_date;

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

  app.post('/api/auth/confirm-password', loginLimiter, authenticateToken, requireAdmin, async (req, res) => {
    try {
      const password = typeof req.body.password === 'string' ? req.body.password : '';
      if (!password) {
        return res.status(400).json({ error: 'Senha obrigatória.' });
      }

      const [rows] = await pool.execute(
        'SELECT password FROM users WHERE id = ? LIMIT 1',
        [req.user.id]
      );
      const valid = rows.length && await bcrypt.compare(password, rows[0].password);
      if (!valid) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      res.json({ valid: true });
    } catch (error) {
      console.error('Password confirmation failed:', error);
      res.status(500).json({ error: 'Erro ao confirmar credenciais.' });
    }
  });

  // Registra ou substitui a saída de um veículo. Um veículo mantém
  // somente um evento de saída, evitando duplicatas após edições.
  app.put(
    '/api/cars/:id/exit',
    authenticateToken,
    requirePermission('edit_cars'),
    async (req, res) => {
      const connection = await pool.getConnection();

      try {
        const { id } = req.params;
        const {
          scheduledDeparture,
          departureDate,
          date,
          time,
          vendor,
          client,
          note
        } = req.body;

        if (!date || !time || !vendor) {
          return res.status(400).json({
            error: 'Data, horário e vendedor são obrigatórios.'
          });
        }

        await connection.beginTransaction();

        const [carRows] = await connection.execute(
          'SELECT id, name FROM cars WHERE id = ? FOR UPDATE',
          [id]
        );

        if (!carRows.length) {
          await connection.rollback();
          return res.status(404).json({ error: 'Veículo não encontrado.' });
        }

        await connection.execute(
          `UPDATE cars
           SET scheduled_departure = ?, departure_date = ?
           WHERE id = ?`,
          [scheduledDeparture || null, departureDate || null, id]
        );

        // Remove tanto eventos manuais quanto automáticos antigos desse carro.
        await connection.execute(
          `DELETE FROM events
           WHERE car_id = ? AND type = 'saida'`,
          [id]
        );

        const isScheduled = Boolean(scheduledDeparture);
        await connection.execute(
          `INSERT INTO events
           (type, title, date, time, car_id, vendor, client, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'saida',
            `${isScheduled ? 'Saída prevista' : 'Saída'} - ${carRows[0].name}`,
            date,
            time,
            id,
            vendor,
            client || null,
            note || null
          ]
        );

        await connection.commit();
        res.json({ message: 'Saída salva com sucesso.' });
      } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Erro ao salvar saída.' });
      } finally {
        connection.release();
      }
    }
  );

  // =======================================
  // DELETE CAR
  // =======================================

app.delete(
  '/api/cars/:id',
  authenticateToken,
  requirePermission('delete_cars'),
  async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { id } = req.params;
      await connection.beginTransaction();

      const [carRows] = await connection.execute(
        'SELECT id FROM cars WHERE id = ? FOR UPDATE',
        [id]
      );

      if (!carRows.length) {
        await connection.rollback();
        return res.status(404).json({ error: 'Veículo não encontrado.' });
      }

      // Exclui eventos manuais e automáticos vinculados ao veículo.
      await connection.execute(
        `DELETE FROM events
         WHERE car_id = ? OR (source = 'system' AND source_id = ?)`,
        [id, id]
      );

      await connection.execute(
        'DELETE FROM cars WHERE id = ?',
        [id]
      );

      await connection.commit();

      return res.status(200).json({
        success: true,
        message: 'Veículo e eventos vinculados excluídos com sucesso.'
      });

    } catch (error) {
      await connection.rollback();
      console.error('Erro ao excluir veículo:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor.'
      });
    } finally {
      connection.release();
    }
  }
);




  // =======================================
  // GET EVENTS
  // =======================================

 app.get(
  '/api/events',
  authenticateToken,
  requirePermission('view_events'), async (req, res) => {
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

  app.post(
  '/api/events',
  authenticateToken,
  requirePermission('create_events'), async (req, res) => {
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

 app.put(
  '/api/events/:id',
  authenticateToken,
  requirePermission('edit_events'), async (req, res) => {
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

 app.delete(
  '/api/events/:id',
  authenticateToken,
  requirePermission('delete_events'), async (req, res) => {
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

  app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
    try {

      const hasStatusColumn = await userHasStatusColumn();
      const [users] = await pool.execute(`
        SELECT
          id,
          username,
          role${hasStatusColumn ? ', status' : ''}
        FROM users
        ORDER BY username
      `);

      const normalizedUsers = (users || []).map(user => ({
        ...user,
        status: user.status || 'active'
      }));

      res.json(normalizedUsers);

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

  app.get('/api/users/:id/permissions', authenticateToken, requireAdmin, async (req, res) => {
    try {

      const { id } = req.params;

      let permissions = [];

  
      
      try {
        [permissions] = await pool.execute(`
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
      } catch (error) {
        console.warn('Could not load permissions for user:', error.message);
        permissions = [];
      }

      res.json(permissions);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: error.message
      });

    }
  });

  app.post('/api/users/:userId/permissions/:permissionId', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { userId, permissionId } = req.params;

      const [userRows] = await pool.execute(
        'SELECT id FROM users WHERE id = ?',
        [userId]
      );

      if (!userRows.length) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const [permissionRows] = await pool.execute(
        'SELECT id FROM permissions WHERE id = ?',
        [permissionId]
      );

      if (!permissionRows.length) {
        return res.status(404).json({ error: 'Permissão não encontrada' });
      }

      const [existingRows] = await pool.execute(
        'SELECT id FROM user_permissions WHERE user_id = ? AND permission_id = ?',
        [userId, permissionId]
      );

      if (existingRows.length) {
        return res.status(200).json({ message: 'Permissão já concedida' });
      }

      await pool.execute(
        'INSERT INTO user_permissions (user_id, permission_id) VALUES (?, ?)',
        [userId, permissionId]
      );

      res.status(201).json({ message: 'Permissão concedida com sucesso' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/users/:userId/permissions/:permissionId', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { userId, permissionId } = req.params;

      await pool.execute(
        'DELETE FROM user_permissions WHERE user_id = ? AND permission_id = ?',
        [userId, permissionId]
      );

      res.json({ message: 'Permissão removida com sucesso' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // =======================================
  // CREATE USER
  // =======================================

  app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
    try {

      const {
        username,
        password,
        role,
        status,
        permissions = []
      } = req.body;

      const normalizedPermissions = normalizePermissionIds(Array.isArray(permissions) ? permissions : []);

      if (!username || !password) {
        return res.status(400).json({
          error: 'Usuário e senha são obrigatórios'
        });
      }

      if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
        return res.status(400).json({
          error: 'A senha deve possuir entre 12 e 128 caracteres.'
        });
      }

      const validation = validateUserPayload(req.body);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
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
      const hasStatusColumn = await userHasStatusColumn();

      // Cria o usuário
      const [result] = hasStatusColumn
        ? await pool.execute(
            `
            INSERT INTO users
            (
              username,
              password,
              role,
              status
            )
            VALUES (?, ?, ?, ?)
            `,
            [
              username,
              hash,
              role || 'user',
              status || 'active'
            ]
          )
        : await pool.execute(
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
      if (normalizedPermissions.length) {
        for (const permissionId of normalizedPermissions) {
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

  app.put('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {

      const { id } = req.params;

      const {
        username,
        role,
        status,
        permissions = []
      } = req.body;

      const normalizedPermissions = normalizePermissionIds(Array.isArray(permissions) ? permissions : []);

      if (!username) {
        return res.status(400).json({
          error: 'Usuário é obrigatório'
        });
      }

      const validation = validateUserPayload(req.body);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
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

      const hasStatusColumn = await userHasStatusColumn();

      // Atualiza usuário
      if (hasStatusColumn) {
        await pool.execute(
          `
          UPDATE users
          SET
            username = ?,
            role = ?,
            status = ?
          WHERE id = ?
          `,
          [
            username,
            role,
            status || 'active',
            id
          ]
        );
      } else {
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
      }

      // Remove permissões atuais
      await pool.execute(
        `
        DELETE FROM user_permissions
        WHERE user_id = ?
        `,
        [id]
      );

      // Insere novamente
      if (normalizedPermissions.length) {
        for (const permissionId of normalizedPermissions) {
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

  app.put('/api/users/:id/password', authenticateToken, requireAdmin, async (req, res) => {
    try {

      const { id } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          error: 'Senha é obrigatória.'
        });
      }

      if (password.length < 12 || password.length > 128) {
        return res.status(400).json({
          error: 'A senha deve possuir entre 12 e 128 caracteres.'
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
        error: 'Database unavailable'
      });

    }
  });


  // =======================================
  // DELETE USER
  // =======================================

  app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
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

  app.get('/api/permissions', authenticateToken, requireAdmin, async (req, res) => {
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
        error: 'Database unavailable'
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
        error: 'Database unavailable'
      });
    }
  });

  // =======================================
  // START SERVER
  // =======================================

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

