-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    login VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'student')),
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table (additional info for students)
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    class_name VARCHAR(50),
    parent_contact VARCHAR(255),
    notes TEXT
);

-- Schedule table
CREATE TABLE IF NOT EXISTS schedule (
    id SERIAL PRIMARY KEY,
    day_name VARCHAR(50) NOT NULL,
    lesson_number INTEGER NOT NULL,
    subject VARCHAR(100) NOT NULL,
    time_start VARCHAR(10) NOT NULL,
    time_end VARCHAR(10) NOT NULL,
    teacher VARCHAR(255) NOT NULL,
    homework TEXT,
    notes TEXT,
    week_number INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lesson files table
CREATE TABLE IF NOT EXISTS lesson_files (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES schedule(id),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: 22)
INSERT INTO users (login, password, role, full_name) 
VALUES ('22', '22', 'admin', 'Администратор')
ON CONFLICT (login) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schedule_day ON schedule(day_name);
CREATE INDEX IF NOT EXISTS idx_schedule_week ON schedule(week_number);
CREATE INDEX IF NOT EXISTS idx_users_login ON users(login);
