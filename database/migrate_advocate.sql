-- ============================================================
-- Migration: Add Advocate user role support
-- Run this in MySQL on database: legal_db
-- ============================================================

-- 1. Add user_id column to advocates table (links advocate to user account)
ALTER TABLE advocates ADD COLUMN user_id INT NULL;
ALTER TABLE advocates ADD CONSTRAINT fk_advocates_user
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;

-- 2. Create victim_requests table for advocate-submitted requests
CREATE TABLE IF NOT EXISTS victim_requests (
    request_id       INT PRIMARY KEY AUTO_INCREMENT,
    person_id        INT NOT NULL,
    advocate_id      INT NOT NULL,
    request_type     VARCHAR(50) NOT NULL,
    description      TEXT,
    urgency          VARCHAR(20) DEFAULT 'normal',
    status           VARCHAR(20) DEFAULT 'pending',
    advocate_notes   TEXT,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (person_id) REFERENCES persons(person_id) ON DELETE CASCADE,
    FOREIGN KEY (advocate_id) REFERENCES advocates(advocate_id) ON DELETE CASCADE
);

-- 3. Insert advocate demo user
INSERT INTO users (name, email, password_hash, role, phone)
VALUES ('Advocate Sharma', 'advocate@legal.gov.in',
        '$2a$10$pH7ki2sislI/Ev0D9PAe0eLn5MGpbluPToyAAwU27xBa2pKCN8E3m',
        'advocate', '9876543210');

-- 4. Link advocate user to existing advocate record (advocate_id = 1)
--    Adjust the advocate_id if needed. Check your advocates table.
SET @adv_user_id = LAST_INSERT_ID();
UPDATE advocates SET user_id = @adv_user_id WHERE advocate_id = 1;

-- 5. Ensure the advocate is assigned to at least some cases
--    (if not already assigned via seed data)
INSERT IGNORE INTO case_advocates (case_id, advocate_id, side) VALUES
  (1, 1, 'defense'),
  (2, 1, 'defense'),
  (3, 1, 'prosecution'),
  (4, 1, 'defense'),
  (5, 1, 'defense');

-- Verify
SELECT 'Advocate user created' AS status,
       u.user_id, u.name, u.email, u.role,
       a.advocate_id, a.bar_registration_no
FROM users u
JOIN advocates a ON a.user_id = u.user_id
WHERE u.email = 'advocate@legal.gov.in';
