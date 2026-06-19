-- ============================================================
-- LEGAL CASE MANAGEMENT SYSTEM - DATABASE SCHEMA
-- DB: legal_db  |  USER: root  |  PASS: Root@123
-- ============================================================

CREATE DATABASE IF NOT EXISTS legal_db;
USE legal_db;

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- 1. COURTS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS courts (
    court_id   INT PRIMARY KEY AUTO_INCREMENT,
    court_name VARCHAR(100) NOT NULL,
    location   VARCHAR(255),
    court_type VARCHAR(50)
);

-- --------------------------------------------------------
-- 2. USERS (master auth table)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id       INT PRIMARY KEY AUTO_INCREMENT,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(50)  NOT NULL DEFAULT 'writer', -- writer / judge / admin / clerk
    phone         VARCHAR(20),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- 3. ROLES (RBAC support)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    role_id   INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id INT,
    role_id INT,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- --------------------------------------------------------
-- 4. JUDGES
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS judges (
    judge_id         INT PRIMARY KEY AUTO_INCREMENT,
    user_id          INT,
    name             VARCHAR(100) NOT NULL,
    court_id         INT,
    experience_years INT,
    specialization   VARCHAR(100),
    active_cases     INT DEFAULT 0,
    FOREIGN KEY (user_id)   REFERENCES users(user_id),
    FOREIGN KEY (court_id)  REFERENCES courts(court_id)
);

-- --------------------------------------------------------
-- 5. CASES (core)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS cases (
    case_id          INT PRIMARY KEY AUTO_INCREMENT,
    fir_text         TEXT,
    summary          TEXT,
    case_type        VARCHAR(50),
    offense_type     VARCHAR(100),
    legal_status     VARCHAR(50)  DEFAULT 'pending',
    trial_status     VARCHAR(50)  DEFAULT 'not_started',
    current_stage    VARCHAR(50)  DEFAULT 'registered',
    current_status   VARCHAR(50)  DEFAULT 'active',
    filing_date      DATE,
    last_hearing_date DATE,
    court_id         INT,
    judge_id         INT,
    created_by       INT,
    is_active        BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (court_id)  REFERENCES courts(court_id),
    FOREIGN KEY (judge_id)  REFERENCES judges(judge_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- --------------------------------------------------------
-- 6. PERSONS (accused / victim / witness)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS persons (
    person_id          INT PRIMARY KEY AUTO_INCREMENT,
    case_id            INT,
    role               VARCHAR(50),   -- victim / accused / witness
    name               VARCHAR(100),
    age                INT,
    gender             VARCHAR(10),
    location           VARCHAR(255),
    health_flag        BOOLEAN DEFAULT FALSE,
    disability_flag    BOOLEAN DEFAULT FALSE,
    vulnerability_score INT DEFAULT 0,
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

-- --------------------------------------------------------
-- 7. ADVOCATES
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS advocates (
    advocate_id        INT PRIMARY KEY AUTO_INCREMENT,
    name               VARCHAR(100) NOT NULL,
    bar_registration_no VARCHAR(50) UNIQUE,
    contact_info       VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS case_advocates (
    case_id      INT,
    advocate_id  INT,
    side         VARCHAR(50),   -- prosecution / defense
    PRIMARY KEY (case_id, advocate_id),
    FOREIGN KEY (case_id)     REFERENCES cases(case_id),
    FOREIGN KEY (advocate_id) REFERENCES advocates(advocate_id)
);

-- --------------------------------------------------------
-- 8. LEGAL SECTIONS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS legal_sections (
    section_id           INT PRIMARY KEY AUTO_INCREMENT,
    section              VARCHAR(20),
    law_code             VARCHAR(20),
    description          TEXT,
    punishment_type      VARCHAR(50),
    max_sentence_years   INT,
    max_sentence_days    INT,
    bailability          VARCHAR(20),
    is_non_finite_sentence BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS case_sections (
    case_id    INT,
    section_id INT,
    PRIMARY KEY (case_id, section_id),
    FOREIGN KEY (case_id)    REFERENCES cases(case_id),
    FOREIGN KEY (section_id) REFERENCES legal_sections(section_id)
);

-- --------------------------------------------------------
-- 9. DETENTION DETAILS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS detention_details (
    id                    INT PRIMARY KEY AUTO_INCREMENT,
    case_id               INT,
    detention_days        INT     DEFAULT 0,
    expected_sentence_days INT    DEFAULT 0,
    life_sentence_flag    BOOLEAN DEFAULT FALSE,
    detention_ratio       FLOAT   DEFAULT 0,
    overstay_flag         BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

-- --------------------------------------------------------
-- 10. CASE TIMELINE DATA
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS case_timeline (
    id                INT PRIMARY KEY AUTO_INCREMENT,
    case_id           INT,
    days_pending      INT DEFAULT 0,
    last_hearing_gap  INT DEFAULT 0,
    number_of_trials  INT DEFAULT 0,
    no_of_adjournments INT DEFAULT 0,
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

-- --------------------------------------------------------
-- 11. NLP / AI FEATURES
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS case_nlp_features (
    id                   INT PRIMARY KEY AUTO_INCREMENT,
    case_id              INT,
    urgency_nlp          VARCHAR(20),
    bail_eligibility_nlp BOOLEAN DEFAULT FALSE,
    case_complexity      VARCHAR(20),
    keywords             TEXT,
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

-- --------------------------------------------------------
-- 12. DERIVED FEATURES (cluster input)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS case_features (
    id                INT PRIMARY KEY AUTO_INCREMENT,
    case_id           INT,
    detention_ratio   FLOAT DEFAULT 0,
    overstay_flag     BOOLEAN DEFAULT FALSE,
    severity_score    INT   DEFAULT 0,
    vulnerability_score INT DEFAULT 0,
    urgency_score     FLOAT DEFAULT 0,
    priority_cluster  INT   DEFAULT 0,
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

-- --------------------------------------------------------
-- 13. LIFECYCLE EVENTS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS case_events (
    event_id        INT PRIMARY KEY AUTO_INCREMENT,
    case_id         INT,
    event_type      VARCHAR(50),
    event_subtype   VARCHAR(50),
    event_date      DATETIME DEFAULT CURRENT_TIMESTAMP,
    performed_by    VARCHAR(100),
    role            VARCHAR(50),
    description     TEXT,
    previous_status VARCHAR(50),
    new_status      VARCHAR(50),
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

-- --------------------------------------------------------
-- 14. HEARING SCHEDULE (AI planning layer)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS hearing_schedule (
    schedule_id        INT PRIMARY KEY AUTO_INCREMENT,
    case_id            INT,
    scheduled_date     DATE,
    time_slot          VARCHAR(50),
    court_id           INT,
    judge_id           INT,
    priority_cluster   INT DEFAULT 0,
    priority_rank      INT DEFAULT 0,
    scheduling_reason  TEXT,
    scheduling_status  VARCHAR(50) DEFAULT 'scheduled',
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id)  REFERENCES cases(case_id),
    FOREIGN KEY (court_id) REFERENCES courts(court_id),
    FOREIGN KEY (judge_id) REFERENCES judges(judge_id)
);

-- --------------------------------------------------------
-- 15. HEARINGS (actual execution)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS hearings (
    hearing_id        INT PRIMARY KEY AUTO_INCREMENT,
    case_id           INT,
    schedule_id       INT,
    hearing_date      DATE,
    actual_start_time TIME,
    actual_end_time   TIME,
    hearing_type      VARCHAR(50),
    judge_id          INT,
    outcome           VARCHAR(100),
    next_action       VARCHAR(100),
    remarks           TEXT,
    FOREIGN KEY (case_id)     REFERENCES cases(case_id),
    FOREIGN KEY (schedule_id) REFERENCES hearing_schedule(schedule_id),
    FOREIGN KEY (judge_id)    REFERENCES judges(judge_id)
);

-- --------------------------------------------------------
-- 16. HEARING PARTICIPANTS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS hearing_participants (
    id                INT PRIMARY KEY AUTO_INCREMENT,
    hearing_id        INT,
    person_id         INT,
    advocate_id       INT,
    role              VARCHAR(50),
    attendance_status VARCHAR(50),
    FOREIGN KEY (hearing_id) REFERENCES hearings(hearing_id)
);

-- --------------------------------------------------------
-- 17. HEARING DOCUMENTS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS hearing_documents (
    doc_id        INT PRIMARY KEY AUTO_INCREMENT,
    hearing_id    INT,
    document_type VARCHAR(50),
    file_path     VARCHAR(255),
    uploaded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hearing_id) REFERENCES hearings(hearing_id)
);

-- --------------------------------------------------------
-- 18. HEARING RESCHEDULE LOG
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS hearing_reschedule_log (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    schedule_id     INT,
    old_date        DATE,
    new_date        DATE,
    reason          TEXT,
    rescheduled_by  VARCHAR(100),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES hearing_schedule(schedule_id)
);

-- --------------------------------------------------------
-- 19. ADJOURNMENTS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS adjournments (
    adj_id        INT PRIMARY KEY AUTO_INCREMENT,
    case_id       INT,
    reason        TEXT,
    adjourned_date DATE,
    next_date     DATE,
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

-- --------------------------------------------------------
-- 20. JUDGMENTS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS judgments (
    judgment_id        INT PRIMARY KEY AUTO_INCREMENT,
    case_id            INT,
    judgment_date      DATE,
    verdict            VARCHAR(50),
    sentence_given_days INT,
    fine_amount        DECIMAL(10,2),
    remarks            TEXT,
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

-- --------------------------------------------------------
-- 21. APPEALS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS appeals (
    appeal_id  INT PRIMARY KEY AUTO_INCREMENT,
    case_id    INT,
    filed_date DATE,
    court_id   INT,
    status     VARCHAR(50),
    FOREIGN KEY (case_id)  REFERENCES cases(case_id),
    FOREIGN KEY (court_id) REFERENCES courts(court_id)
);

-- --------------------------------------------------------
-- 22. DOCUMENTS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    document_id   INT PRIMARY KEY AUTO_INCREMENT,
    case_id       INT,
    document_type VARCHAR(50),
    file_path     VARCHAR(255),
    uploaded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

-- --------------------------------------------------------
-- 23. BLOCKCHAIN LOGS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS blockchain_logs (
    log_id            INT PRIMARY KEY AUTO_INCREMENT,
    case_id           INT,
    case_hash         VARCHAR(255),
    transaction_hash  VARCHAR(255),
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

-- --------------------------------------------------------
-- 24. NOTIFICATIONS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    case_id         INT,
    recipient_type  VARCHAR(50),
    message         TEXT,
    status          VARCHAR(50) DEFAULT 'unread',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

-- --------------------------------------------------------
-- 25. CASE HISTORY (audit trail)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS case_history (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    case_id    INT,
    status     VARCHAR(50),
    remarks    TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

-- --------------------------------------------------------
-- 26. WRITERS (clerk details)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS writers (
    writer_id        INT PRIMARY KEY AUTO_INCREMENT,
    user_id          INT,
    court_id         INT,
    experience_years INT,
    FOREIGN KEY (user_id)  REFERENCES users(user_id),
    FOREIGN KEY (court_id) REFERENCES courts(court_id)
);

-- --------------------------------------------------------
-- 27. CASE REGISTRATION
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS case_registration (
    registration_id   INT PRIMARY KEY AUTO_INCREMENT,
    case_id           INT,
    registered_by     INT,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registration_mode VARCHAR(50) DEFAULT 'manual',
    remarks           TEXT,
    FOREIGN KEY (case_id)       REFERENCES cases(case_id),
    FOREIGN KEY (registered_by) REFERENCES users(user_id)
);

-- --------------------------------------------------------
-- 28. JUDGE CASE ASSIGNMENTS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS judge_case_assignments (
    assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    case_id       INT,
    judge_id      INT,
    assigned_by   INT,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status        VARCHAR(50) DEFAULT 'active',
    FOREIGN KEY (case_id)     REFERENCES cases(case_id),
    FOREIGN KEY (judge_id)    REFERENCES judges(judge_id),
    FOREIGN KEY (assigned_by) REFERENCES users(user_id)
);

-- --------------------------------------------------------
-- 29. CASE ADVOCATE ASSIGNMENTS (judge-controlled)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS case_advocate_assignments (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    case_id       INT,
    advocate_id   INT,
    assigned_by   INT,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    side          VARCHAR(50),   -- prosecution / defense
    status        VARCHAR(50) DEFAULT 'active',
    FOREIGN KEY (case_id)     REFERENCES cases(case_id),
    FOREIGN KEY (advocate_id) REFERENCES advocates(advocate_id),
    FOREIGN KEY (assigned_by) REFERENCES users(user_id)
);

-- --------------------------------------------------------
-- 30. USER ACTIONS (audit log)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_actions (
    action_id   INT PRIMARY KEY AUTO_INCREMENT,
    user_id     INT,
    case_id     INT,
    action_type VARCHAR(50),
    description TEXT,
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

-- --------------------------------------------------------
-- 31. JUDGE DAILY LOAD
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS judge_daily_load (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    judge_id       INT,
    date           DATE,
    total_hearings INT DEFAULT 0,
    FOREIGN KEY (judge_id) REFERENCES judges(judge_id)
);

-- --------------------------------------------------------
-- 32. CASE SCHEDULE (simpler scheduling)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS case_schedule (
    schedule_id   INT PRIMARY KEY AUTO_INCREMENT,
    case_id       INT,
    hearing_date  DATE,
    priority_rank INT,
    status        VARCHAR(50),
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT IGNORE INTO roles (role_name) VALUES ('admin'), ('judge'), ('writer'), ('clerk');

INSERT IGNORE INTO courts (court_name, location, court_type) VALUES
  ('Supreme Court of India', 'New Delhi', 'Supreme Court'),
  ('High Court of Delhi', 'New Delhi', 'High Court'),
  ('District Court Bangalore', 'Bangalore', 'District Court'),
  ('Sessions Court Mumbai', 'Mumbai', 'Sessions Court'),
  ('Fast Track Court Chennai', 'Chennai', 'Fast Track');

-- Default admin user  (password: Admin@123)
INSERT IGNORE INTO users (name, email, password_hash, role, phone) VALUES
  ('System Admin', 'admin@legal.gov.in',
   '$2a$10$4LD5P4s0i3aa29usuG2BbuTugWquwCLnBEwc0/Lg18.n8r2tQHh2W',
   'admin', '9000000001');

-- Sample judge user (password: Judge@123)
INSERT IGNORE INTO users (name, email, password_hash, role, phone) VALUES
  ('Justice Ramesh Kumar', 'judge@legal.gov.in',
   '$2a$10$cCi5OW0TBYBpZwnZv9rMquDb9LzpR7lsz6MqfRILoCnv4UL6xDhy2',
   'judge', '9000000002');

-- Sample writer user (password: Writer@123)
INSERT IGNORE INTO users (name, email, password_hash, role, phone) VALUES
  ('Clerk Priya Sharma', 'writer@legal.gov.in',
   '$2a$10$mw/WGEy.rtpddKHIIlGEhuQbENa5pDNyrmD1rHauqcTYVbRzuptqC',
   'writer', '9000000003');

INSERT IGNORE INTO advocates (name, bar_registration_no, contact_info) VALUES
  ('Adv. Suresh Nair',     'BAR-DL-001', 'suresh@legalaid.in'),
  ('Adv. Meena Joshi',     'BAR-DL-002', 'meena@legalaid.in'),
  ('Adv. Rajiv Malhotra',  'BAR-MH-001', 'rajiv@legalaid.in'),
  ('Adv. Anita Desai',     'BAR-KA-001', 'anita@legalaid.in');

INSERT IGNORE INTO legal_sections (section, law_code, description, punishment_type, max_sentence_years, bailability) VALUES
  ('302',  'IPC', 'Murder',                           'Imprisonment', 99, 'Non-Bailable'),
  ('376',  'IPC', 'Rape',                             'Imprisonment', 10, 'Non-Bailable'),
  ('420',  'IPC', 'Cheating and dishonestly inducing', 'Imprisonment', 7,  'Bailable'),
  ('498A', 'IPC', 'Cruelty by husband / relatives',   'Imprisonment', 3,  'Bailable'),
  ('307',  'IPC', 'Attempt to murder',                'Imprisonment', 10, 'Non-Bailable'),
  ('379',  'IPC', 'Theft',                            'Imprisonment', 3,  'Bailable'),
  ('354',  'IPC', 'Assault on woman',                 'Imprisonment', 2,  'Bailable'),
  ('406',  'IPC', 'Criminal breach of trust',         'Imprisonment', 3,  'Bailable');
