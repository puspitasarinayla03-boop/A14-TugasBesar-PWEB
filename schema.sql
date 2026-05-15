-- ============================================
-- DATABASE SCHEMA: Authentication & ACL System
-- ============================================

CREATE DATABASE IF NOT EXISTS fti_project CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fti_project;

-- Tabel roles (dibuat lebih dulu karena direferensikan oleh users)
CREATE TABLE IF NOT EXISTS roles (
    id        INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    name      VARCHAR(50)     NOT NULL UNIQUE,          -- contoh: 'admin', 'user'
    label     VARCHAR(100)    NOT NULL,                 -- label tampilan: 'Administrator', 'Regular User'
    created_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Tabel users
CREATE TABLE IF NOT EXISTS users (
    id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    name        VARCHAR(150)    NOT NULL,
    email       VARCHAR(255)    NOT NULL UNIQUE,
    password    VARCHAR(255)    NOT NULL,               -- bcrypt hash, bukan plain text!
    role_id     INT UNSIGNED    NOT NULL DEFAULT 2,     -- default ke role 'user'
    is_active   TINYINT(1)      NOT NULL DEFAULT 1,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Seed data: masukkan role default
INSERT INTO roles (name, label) VALUES
    ('admin', 'Administrator'),
    ('user',  'Regular User')
ON DUPLICATE KEY UPDATE label = VALUES(label);

-- (Opsional) Seed akun admin awal
-- Password: Admin@123  →  hash bcrypt di bawah dihasilkan dengan saltRounds=12
-- Ganti hash ini jika ingin password berbeda (jalankan: node -e "require('bcrypt').hash('passwordmu',12).then(console.log)")
INSERT INTO users (name, email, password, role_id) VALUES
    ('Super Admin', 'admin@ftiproject.com', '$2b$12$u9d2/vfTGj77qlTLOWjrYOH/3hTZPr16JAm.uMoFGHhpzs3yVxlx2', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);
