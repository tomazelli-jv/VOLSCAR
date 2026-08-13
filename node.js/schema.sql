-- VW Fleet Manager Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE,
  role ENUM('admin', 'user') DEFAULT 'user',
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User permissions mapping table
CREATE TABLE IF NOT EXISTS user_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  permission_id INT NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_permission (user_id, permission_id)
);

-- Cars table
CREATE TABLE IF NOT EXISTS cars (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  model VARCHAR(100) NOT NULL,
  plate VARCHAR(20) UNIQUE NOT NULL,
  chassis VARCHAR(50) UNIQUE NOT NULL,
  arrival_date DATETIME,
  scheduled_departure DATETIME,
  departure_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  car_id INT,
  type ENUM('saida', 'chegada', 'revisao', 'entrega', 'outro') DEFAULT 'saida',
  title VARCHAR(120),
  date DATE NOT NULL,
  time TIME,
  vendor VARCHAR(100) NOT NULL,
  client VARCHAR(100),
  note VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);

-- Insert sample permissions
INSERT INTO permissions (name, description, category) VALUES
('view_cars', 'Ver listagem de veículos', 'cars'),
('add_car', 'Adicionar novo veículo', 'cars'),
('edit_car', 'Editar dados de veículo', 'cars'),
('delete_car', 'Deletar veículo', 'cars'),
('view_events', 'Ver eventos/agenda', 'events'),
('add_event', 'Adicionar novo evento', 'events'),
('edit_event', 'Editar evento', 'events'),
('delete_event', 'Deletar evento', 'events'),
('view_dashboard', 'Acessar dashboard', 'dashboard'),
('manage_users', 'Gerenciar usuários', 'users'),
('manage_permissions', 'Gerenciar permissões', 'users'),
('view_reports', 'Gerar relatórios', 'reports');

-- Insert sample users
INSERT INTO users (username, password, email, role, status) VALUES
('admin', '$2b$10$oUElNd9Fy1.N4Z6fgbmHr.md2Bj/F62EFijLNpTZja4zDvVet1Mxq', 'admin@vw.com', 'admin', 'active'),
('user1', '$2b$10$RzrCR.H0GUH9K1aRsF3Im./DKIISSobEfdb1I7rGsNuzPXIEjA05u', 'user1@vw.com', 'user', 'active');

-- Grant all permissions to admin
INSERT INTO user_permissions (user_id, permission_id) 
SELECT u.id, p.id FROM users u, permissions p 
WHERE u.username = 'admin' AND p.id IS NOT NULL
ON DUPLICATE KEY UPDATE granted_at = NOW();

-- Grant basic permissions to user1 (view only)
INSERT INTO user_permissions (user_id, permission_id) 
SELECT u.id, p.id FROM users u, permissions p 
WHERE u.username = 'user1' 
AND p.name IN ('view_cars', 'view_events', 'view_dashboard')
ON DUPLICATE KEY UPDATE granted_at = NOW();

-- Insert sample cars
INSERT INTO cars (name, model, plate, chassis, arrival_date, scheduled_departure, departure_date) VALUES
('Volkswagen Polo', 'Polo', 'ABC-1234', '9BWZZZ377VT004251', '2026-04-10 09:30:00', '2026-05-01 10:00:00', NULL),
('Volkswagen Golf', 'Golf', 'GHI-9012', '9BWZZZ377VT004253', '2026-04-12 16:20:00', NULL, NULL),
('Volkswagen Tiguan', 'Tiguan', 'DEF-5678', '9BWZZZ377VT004252', '2026-03-29 14:15:00', NULL, '2026-04-15 11:45:00');

-- Insert sample events
INSERT INTO events (car_id, type, title, date, time, vendor, client, note) VALUES
(1, 'saida', 'Entrega agendada', '2026-05-01', '10:00', 'Vendedor X', 'Cliente Y', 'Saída prevista para serviço'),
(2, 'chegada', 'Recepção', '2026-04-12', '16:20', 'Vendedor Z', 'Cliente W', 'Veículo chegou no pátio');
