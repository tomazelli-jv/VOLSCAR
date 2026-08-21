CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  document VARCHAR(30) UNIQUE,
  phone VARCHAR(30),
  email VARCHAR(150),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_clients_name (name)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS client_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  car_id INT NULL,
  vehicle_name VARCHAR(150),
  vehicle_plate VARCHAR(20),
  movement_type ENUM('interesse','reserva','retirada','devolucao','observacao') NOT NULL DEFAULT 'observacao',
  movement_date DATE NOT NULL,
  responsible VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_client_history_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_client_history_car FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE SET NULL,
  INDEX idx_client_history_date (client_id, movement_date)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO permissions (name, description, category) VALUES
('view_clients', 'Ver clientes e historicos', 'clients'),
('create_clients', 'Cadastrar clientes', 'clients'),
('edit_clients', 'Editar clientes e historicos', 'clients'),
('delete_clients', 'Excluir clientes e historicos', 'clients')
ON DUPLICATE KEY UPDATE description = VALUES(description), category = VALUES(category);

INSERT IGNORE INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id FROM users u CROSS JOIN permissions p
WHERE u.role = 'admin'
  AND p.name IN ('view_clients', 'create_clients', 'edit_clients', 'delete_clients');
