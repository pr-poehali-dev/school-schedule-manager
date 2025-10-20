CREATE TABLE IF NOT EXISTS t_p1843782_school_schedule_mana.teachers (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);