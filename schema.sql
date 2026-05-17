-- ================================================
-- FTI Project — Database Schema
-- ================================================

CREATE DATABASE IF NOT EXISTS `fti_project`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `fti_project`;

-- ── Users ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
    `id`                        INT UNSIGNED     NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name`                      VARCHAR(255)     NOT NULL,
    `email`                     VARCHAR(255)     NOT NULL UNIQUE,
    `password`                  VARCHAR(255)     NOT NULL,
    `email_verified_at`         DATETIME         DEFAULT NULL,
    `remember_token`            VARCHAR(255)     DEFAULT NULL,
    `two_factor_secret`         TEXT             DEFAULT NULL,
    `two_factor_recovery_codes` TEXT             DEFAULT NULL,
    `two_factor_confirmed_at`   DATETIME         DEFAULT NULL,
    `created_at`                DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`                DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── Roles ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `roles` (
    `id`         BIGINT       NOT NULL AUTO_INCREMENT,
    `name`       VARCHAR(255) NOT NULL UNIQUE,
    `guard_name` VARCHAR(255) NOT NULL DEFAULT 'web',
    `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
);

-- ── Permissions ───────────────────────────────────
CREATE TABLE IF NOT EXISTS `permissions` (
    `id`         BIGINT       NOT NULL AUTO_INCREMENT,
    `name`       VARCHAR(255) NOT NULL UNIQUE,
    `guard_name` VARCHAR(255) NOT NULL DEFAULT 'web',
    `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
);

-- ── Model Has Roles ───────────────────────────────
CREATE TABLE IF NOT EXISTS `model_has_roles` (
    `role_id`    BIGINT       NOT NULL,
    `model_type` VARCHAR(255) NOT NULL DEFAULT 'User',
    `model_id`   INT UNSIGNED NOT NULL,
    PRIMARY KEY(`role_id`, `model_id`, `model_type`)
);

-- ── Role Has Permissions ──────────────────────────
CREATE TABLE IF NOT EXISTS `role_has_permissions` (
    `permission_id` BIGINT NOT NULL,
    `role_id`       BIGINT NOT NULL,
    PRIMARY KEY(`permission_id`, `role_id`)
);

-- ── Projects ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS `projects` (
    `id`          INT UNSIGNED                          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name`        VARCHAR(255)                          NOT NULL,
    `description` TEXT                                  DEFAULT NULL,
    `status`      ENUM('aktif', 'selesai', 'pending')  NOT NULL DEFAULT 'pending',
    `start_date`  DATE                                  DEFAULT NULL,
    `end_date`    DATE                                  DEFAULT NULL,
    `created_at`  DATETIME                              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME                              NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
