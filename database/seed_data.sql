-- ============================================================
-- COMPREHENSIVE SEED DATA
-- Legal Case Management System
-- Run AFTER schema.sql
-- Simulates full application: 15 cases across all roles
-- ============================================================

USE legal_db;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- ADDITIONAL COURTS (courts 1-5 already in schema.sql)
-- ============================================================
INSERT IGNORE INTO courts (court_id, court_name, location, court_type) VALUES
  (6, 'Family Court Hyderabad',   'Hyderabad', 'Family Court'),
  (7, 'Fast Track Court Pune',    'Pune',      'Fast Track'),
  (8, 'Magistrate Court Kolkata', 'Kolkata',   'Magistrate');

-- ============================================================
-- ADDITIONAL USERS  (users 1-3 already in schema.sql)
-- Passwords: Judge@123 / Writer@123 (same bcrypt hashes as schema)
-- ============================================================
INSERT IGNORE INTO users (user_id, name, email, password_hash, role, phone) VALUES
  (4, 'Justice Ananya Singh',  'judge2@legal.gov.in',
   '$2a$10$cCi5OW0TBYBpZwnZv9rMquDb9LzpR7lsz6MqfRILoCnv4UL6xDhy2', 'judge',  '9000000004'),
  (5, 'Justice Vikram Patel',  'judge3@legal.gov.in',
   '$2a$10$cCi5OW0TBYBpZwnZv9rMquDb9LzpR7lsz6MqfRILoCnv4UL6xDhy2', 'judge',  '9000000005'),
  (6, 'Mohan Lal Gupta',       'writer2@legal.gov.in',
   '$2a$10$mw/WGEy.rtpddKHIIlGEhuQbENa5pDNyrmD1rHauqcTYVbRzuptqC', 'writer', '9000000006'),
  (7, 'Sunita Reddy',          'writer3@legal.gov.in',
   '$2a$10$mw/WGEy.rtpddKHIIlGEhuQbENa5pDNyrmD1rHauqcTYVbRzuptqC', 'writer', '9000000007');

-- ============================================================
-- USER ROLES mapping
-- ============================================================
INSERT IGNORE INTO user_roles (user_id, role_id) VALUES
  (1, 1), -- admin  -> role_id 1
  (2, 2), -- judge  -> role_id 2
  (3, 3), -- writer -> role_id 3
  (4, 2),
  (5, 2),
  (6, 3),
  (7, 3);

-- ============================================================
-- JUDGES
-- ============================================================
INSERT IGNORE INTO judges (judge_id, user_id, name, court_id, experience_years, specialization, active_cases) VALUES
  (1, 2, 'Justice Ramesh Kumar', 2, 15, 'Criminal Law',     8),
  (2, 4, 'Justice Ananya Singh', 3, 10, 'Family & Civil',   5),
  (3, 5, 'Justice Vikram Patel', 4, 20, 'Financial Crimes', 6);

-- ============================================================
-- WRITERS (clerks)
-- ============================================================
INSERT IGNORE INTO writers (writer_id, user_id, court_id, experience_years) VALUES
  (1, 3, 2, 5),
  (2, 6, 3, 3),
  (3, 7, 4, 7);

-- ============================================================
-- ADDITIONAL ADVOCATES (advocates 1-4 already in schema.sql)
-- ============================================================
INSERT IGNORE INTO advocates (advocate_id, name, bar_registration_no, contact_info) VALUES
  (5, 'Adv. Prakash Mehta',  'BAR-GJ-001', 'prakash@legalaid.in'),
  (6, 'Adv. Seema Kapoor',   'BAR-UP-001', 'seema@legalaid.in'),
  (7, 'Adv. Ravi Shankar',   'BAR-TN-001', 'ravi@legalaid.in'),
  (8, 'Adv. Deepa Nambiar',  'BAR-KL-001', 'deepa@legalaid.in');

-- ============================================================
-- ADDITIONAL LEGAL SECTIONS (sections 1-8 already in schema.sql)
-- ============================================================
INSERT IGNORE INTO legal_sections (section_id, section, law_code, description, punishment_type, max_sentence_years, max_sentence_days, bailability) VALUES
  (9,  '304',  'IPC', 'Culpable homicide not amounting to murder',    'Imprisonment', 10, 3650, 'Non-Bailable'),
  (10, '323',  'IPC', 'Voluntarily causing hurt',                      'Imprisonment',  1,  365, 'Bailable'),
  (11, '341',  'IPC', 'Wrongful restraint',                            'Imprisonment',  1,  365, 'Bailable'),
  (12, '366',  'IPC', 'Kidnapping / abducting to compel marriage',     'Imprisonment', 10, 3650, 'Non-Bailable'),
  (13, '201',  'IPC', 'Causing disappearance of evidence of offence',  'Imprisonment',  7, 2555, 'Non-Bailable'),
  (14, '120B', 'IPC', 'Criminal conspiracy',                           'Imprisonment',  2,  730, 'Non-Bailable');

-- ============================================================
-- CASES  (15 cases, varied statuses, courts, judges)
-- Priority clusters: 0=CRITICAL  1=HIGH  2=MEDIUM  3=LOW
-- ============================================================
INSERT IGNORE INTO cases
  (case_id, fir_text, summary, case_type, offense_type,
   legal_status, trial_status, current_stage, current_status,
   filing_date, last_hearing_date, court_id, judge_id, created_by, is_active)
VALUES
-- ── CRITICAL : Murder + undertrial overstay ──────────────────
(1,
 'On 12 Jan 2023 victim Ramesh Yadav was found dead at his Karol Bagh residence. '
 'Accused Deepak Verma was apprehended at the scene with a blood-stained knife. '
 'Eyewitness Mrs. Kavita Singh confirms a heated altercation 30 min before death. '
 'Post-mortem confirms 7 stab wounds. Accused in custody since date of arrest.',
 'Murder; eyewitness present; accused in custody 1190+ days; overstay detected.',
 'Criminal', 'Murder',
 'under_trial', 'in_progress', 'trial', 'active',
 '2023-01-15', '2026-04-01', 2, 1, 3, TRUE),

-- ── CRITICAL : Rape (victim minor) ────────────────────────────
(2,
 'Complaint filed 20 Mar 2023 by Ms. Priya (identity protected) under Section 376 IPC. '
 'Accused Sunil Rawat, known to victim, committed the offence at his rented premises. '
 'Medical examination confirms assault; forensic samples collected. Accused in '
 'judicial custody; bail denied twice by this court.',
 'Rape; victim 16 yr; accused in judicial custody; bail denied twice; evidence ongoing.',
 'Criminal', 'Rape',
 'under_trial', 'in_progress', 'evidence', 'active',
 '2023-03-22', '2026-03-28', 2, 1, 3, TRUE),

-- ── HIGH : Attempt to murder ───────────────────────────────────
(3,
 'FIR registered 5 Jun 2023. Accused Akash Trivedi fired a country-made pistol at '
 'victim Naresh Shetty at the Bandra petrol station. Victim sustained gunshot wound '
 'to the shoulder and survived. Accused absconded; arrested 10 Jun after tip-off. '
 'Weapon recovered. CCTV footage available.',
 'Attempt to murder; firearm seized; victim survived; accused arrested; final arguments.',
 'Criminal', 'Attempt to Murder',
 'under_trial', 'in_progress', 'arguments', 'active',
 '2023-06-05', '2026-04-08', 3, 2, 6, TRUE),

-- ── CRITICAL : Gang murder ─────────────────────────────────────
(4,
 'On 2 Sep 2023 victim Hari Shankar Lal was attacked by a gang of four near '
 'Lajpat Nagar market. He succumbed to multiple stab wounds. Three accused – '
 'Ravi Kumar, Vijay Singh, Dinesh Rawat – arrested within 48 hrs. Fourth accused '
 'Mohan Singh is absconding; NBW issued.',
 'Gang murder; 3 of 4 accused arrested; one absconding; conspiracy charge added.',
 'Criminal', 'Murder',
 'under_trial', 'in_progress', 'trial', 'active',
 '2023-09-03', '2026-04-05', 2, 1, 3, TRUE),

-- ── CRITICAL : POCSO – Kidnapping + Rape of minor ─────────────
(5,
 'Minor girl (14 yrs) reported missing 15 Nov 2023 from school premises in Chennai. '
 'Found after 3 days. Medical examination conducted. FIR under Sections 366 and 376 '
 'IPC + POCSO Act, 2012. Accused Suresh Tiwari (34) arrested from bus stand. '
 'Victim in safe custody; identity protected.',
 'POCSO; kidnapping + rape of minor; accused in custody; fast-track court eligible.',
 'Criminal', 'Kidnapping & Rape',
 'under_trial', 'not_started', 'evidence', 'active',
 '2023-11-18', '2026-04-10', 5, NULL, 7, TRUE),

-- ── HIGH : Domestic violence (498A) ───────────────────────────
(6,
 'Complainant Ritu Gupta filed FIR 8 Jan 2024 against husband Asish Gupta for '
 'physical assault and cruelty over persistent dowry demands spanning 4 years. '
 'Medical report shows bruising and fracture of one rib. Two minor children (ages 6 '
 'and 9) are with the complainant at a shelter. Case linked to custody dispute.',
 'Domestic violence + dowry; victim and children at risk; interim protection order issued.',
 'Criminal', 'Domestic Violence',
 'under_trial', 'in_progress', 'arguments', 'active',
 '2024-01-09', '2026-04-12', 3, 2, 6, TRUE),

-- ── MEDIUM : Financial fraud (embezzlement) ────────────────────
(7,
 'Complaint by M/s ABCTech Pvt Ltd against former CFO Sanjay Kapoor for '
 'embezzlement of ₹45 lakhs over 18 months through fraudulent RTGS transfers to '
 'shell companies. Digital forensic audit trail submitted. Accused on bail with '
 'travel restrictions.',
 'Company fraud ₹45L; CFO accused; digital trail strong; on bail; arguments stage.',
 'Criminal', 'Financial Fraud',
 'under_trial', 'in_progress', 'arguments', 'active',
 '2024-02-14', '2026-04-11', 4, 3, 7, TRUE),

-- ── MEDIUM : Criminal breach of trust (property) ──────────────
(8,
 'Complainant Vijay Singh lodged FIR against property agent Rajan Dubey for '
 'misappropriating ₹12 lakh advance for a flat that was never delivered. Three '
 'other complainants with identical facts identified; total loss ₹40 lakhs. '
 'Accused was granted bail by Sessions Court.',
 'Property fraud; 4 victims; ₹40L total; accused on bail; account statements admitted.',
 'Criminal', 'Criminal Breach of Trust',
 'under_trial', 'in_progress', 'evidence', 'active',
 '2024-03-01', '2026-04-09', 4, 3, 7, TRUE),

-- ── HIGH : Assault on woman ────────────────────────────────────
(9,
 'FIR by Neha Rawat 20 Apr 2024 against neighbour Rakesh Mishra for passing '
 'indecent remarks and physically assaulting her near her residence in Koramangala. '
 'CCTV footage from adjacent shop submitted. Accused lives in the same housing '
 'society; bail with no-contact condition.',
 'Assault on woman; CCTV evidence; accused on bail with no-contact order; prosecution arguing.',
 'Criminal', 'Assault on Woman',
 'under_trial', 'in_progress', 'trial', 'active',
 '2024-04-21', '2026-04-14', 3, 2, 6, TRUE),

-- ── LOW : Theft ────────────────────────────────────────────────
(10,
 'Shopkeeper Ram Prasad reported theft of 8 mobile phones worth ₹80,000 from his '
 'shop in Whitefield. CCTV footage identified accused Shyam Kumar; arrested next '
 'day. 5 of 8 phones recovered. First-time offender; surety bail granted.',
 'Simple theft; partial recovery; first offender; bail; final arguments stage.',
 'Criminal', 'Theft',
 'under_trial', 'in_progress', 'trial', 'active',
 '2024-05-10', '2026-04-13', 3, 2, 6, TRUE),

-- ── CLOSED : Judgment delivered – Domestic violence ───────────
(11,
 'FIR by Kamla Devi against husband Sohan Lal for 498A, physical assault sustained '
 'over 3 years. Multiple witnesses including neighbours and a doctor. Children '
 'testimony recorded in camera. Accused contested charges.',
 'Domestic violence; 3 yr history; CONVICTED 2 yr + ₹50,000 fine. CLOSED.',
 'Criminal', 'Domestic Violence',
 'decided', 'completed', 'judgment', 'closed',
 '2022-06-15', '2025-08-20', 2, 1, 3, FALSE),

-- ── CLOSED : Judgment delivered – Theft, guilty plea ─────────
(12,
 'Accused Mohammad Irfan caught by watchman stealing from vehicles in a residential '
 'colony. Stolen goods worth ₹1.2 lakh recovered from accused. CCTV + 3 witnesses. '
 'Accused pleaded guilty at first opportunity; no prior record.',
 'Vehicle theft; guilty plea; 6 months + ₹10,000 fine. CLOSED.',
 'Criminal', 'Theft',
 'decided', 'completed', 'judgment', 'closed',
 '2022-09-01', '2024-03-15', 3, 2, 6, FALSE),

-- ── CRITICAL : Culpable homicide – hearing today ───────────────
(13,
 'FIR filed 15 Jan 2025 against accused Prem Singh for assaulting Ajay Tomar '
 'outside a liquor shop in Dwarka. Victim was taken to hospital and died after '
 '3 days from head injuries. FIR upgraded from 323 to 304 IPC. Bail denied; '
 'accused in custody.',
 'Culpable homicide; victim died in hospital day-3; accused in custody; bail denied.',
 'Criminal', 'Culpable Homicide',
 'under_trial', 'in_progress', 'evidence', 'active',
 '2025-01-15', '2026-04-15', 2, 1, 3, TRUE),

-- ── MEDIUM : Online investment fraud ──────────────────────────
(14,
 'EOW referred case: accused Rahul Mehta and two associates collected ₹2 crore '
 'from 200+ investors promising 40% annual returns through a fake online trading '
 'platform. Platform shut; funds siphoned to offshore accounts. All 3 accused on '
 'conditional bail with passport impounded.',
 'Online fraud ₹2 Cr; 200+ victims; 3 accused on bail; judgment reserved today.',
 'Criminal', 'Cheating',
 'under_trial', 'in_progress', 'arguments', 'active',
 '2025-03-10', '2026-04-12', 4, 3, 7, TRUE),

-- ── MEDIUM : Corporate fraud – recently registered ─────────────
(15,
 'Complainant Arvind Tiwari alleges business partner Kiran Patel forged company '
 'board resolutions and transferred assets worth ₹85 lakhs to a newly formed '
 'entity without consent. Forged documents and bank transfer slips submitted as '
 'evidence. Accused obtained anticipatory bail from High Court.',
 'Corporate fraud ₹85L; forged resolutions; anticipatory bail; first hearing pending.',
 'Criminal', 'Criminal Breach of Trust',
 'under_trial', 'not_started', 'registered', 'active',
 '2026-03-28', NULL, 4, 3, 7, TRUE);

-- ============================================================
-- PERSONS  (accused / victim / witness per case)
-- ============================================================
INSERT IGNORE INTO persons
  (person_id, case_id, role, name, age, gender, location,
   health_flag, disability_flag, vulnerability_score)
VALUES
-- Case 1 (Murder)
(1,  1, 'accused', 'Deepak Verma',        28, 'Male',   'Karol Bagh, New Delhi',     FALSE, FALSE, 2),
(2,  1, 'victim',  'Ramesh Yadav',         45, 'Male',   'Karol Bagh, New Delhi',     FALSE, FALSE, 4),
(3,  1, 'witness', 'Mrs. Kavita Singh',    38, 'Female', 'Karol Bagh, New Delhi',     FALSE, FALSE, 1),
-- Case 2 (Rape)
(4,  2, 'accused', 'Sunil Rawat',          32, 'Male',   'Rohini, New Delhi',         FALSE, FALSE, 1),
(5,  2, 'victim',  'Minor Girl (PW-1)',    16, 'Female', 'Identity Protected',        TRUE,  FALSE, 10),
-- Case 3 (Attempt to murder)
(6,  3, 'accused', 'Akash Trivedi',        25, 'Male',   'Bandra, Mumbai',            FALSE, FALSE, 2),
(7,  3, 'victim',  'Naresh Shetty',        40, 'Male',   'Bandra, Mumbai',            TRUE,  FALSE, 5),
(8,  3, 'witness', 'Petrol Station Guard', 35, 'Male',   'Bandra, Mumbai',            FALSE, FALSE, 1),
-- Case 4 (Gang murder)
(9,  4, 'accused', 'Ravi Kumar',           30, 'Male',   'Lajpat Nagar, New Delhi',   FALSE, FALSE, 3),
(10, 4, 'accused', 'Vijay Singh (Gang)',   27, 'Male',   'Lajpat Nagar, New Delhi',   FALSE, FALSE, 3),
(11, 4, 'accused', 'Dinesh Rawat',         33, 'Male',   'Okhla, New Delhi',          FALSE, FALSE, 3),
(12, 4, 'victim',  'Hari Shankar Lal',     52, 'Male',   'Lajpat Nagar, New Delhi',   FALSE, FALSE, 4),
(13, 4, 'witness', 'Shop Owner Gopal',     48, 'Male',   'Lajpat Nagar, New Delhi',   FALSE, FALSE, 1),
-- Case 5 (POCSO)
(14, 5, 'accused', 'Suresh Tiwari',        34, 'Male',   'Chennai, Tamil Nadu',       FALSE, FALSE, 1),
(15, 5, 'victim',  'Minor Girl (PW-1)',    14, 'Female', 'Identity Protected',        TRUE,  FALSE, 10),
-- Case 6 (Domestic violence)
(16, 6, 'accused', 'Asish Gupta',          38, 'Male',   'MG Road, Bangalore',        FALSE, FALSE, 2),
(17, 6, 'victim',  'Ritu Gupta',           33, 'Female', 'Shelter Home, Bangalore',   TRUE,  FALSE, 9),
(18, 6, 'witness', 'Dr. Mahesh Rao',       55, 'Male',   'Bangalore',                 FALSE, FALSE, 1),
-- Case 7 (Financial fraud)
(19, 7, 'accused', 'Sanjay Kapoor',        45, 'Male',   'Banjara Hills, Hyderabad',  FALSE, FALSE, 1),
-- Case 8 (CBT – property)
(20, 8, 'accused', 'Rajan Dubey',          50, 'Male',   'Andheri, Mumbai',           FALSE, FALSE, 2),
(21, 8, 'victim',  'Vijay Singh (PW-1)',   48, 'Male',   'Andheri, Mumbai',           FALSE, FALSE, 3),
(22, 8, 'victim',  'Sunita Pillai',        42, 'Female', 'Borivali, Mumbai',          FALSE, FALSE, 3),
(23, 8, 'victim',  'Harish Nambiar',       55, 'Male',   'Thane, Mumbai',             FALSE, FALSE, 3),
-- Case 9 (Assault on woman)
(24, 9, 'accused', 'Rakesh Mishra',        40, 'Male',   'Koramangala, Bangalore',    FALSE, FALSE, 2),
(25, 9, 'victim',  'Neha Rawat',           27, 'Female', 'Koramangala, Bangalore',    FALSE, FALSE, 7),
-- Case 10 (Theft)
(26, 10,'accused', 'Shyam Kumar',          22, 'Male',   'Whitefield, Bangalore',     FALSE, FALSE, 1),
(27, 10,'victim',  'Ram Prasad',           55, 'Male',   'Whitefield, Bangalore',     FALSE, FALSE, 2),
-- Case 11 (Closed DV)
(28, 11,'accused', 'Sohan Lal',            50, 'Male',   'Saket, New Delhi',          FALSE, FALSE, 1),
(29, 11,'victim',  'Kamla Devi',           44, 'Female', 'Saket, New Delhi',          TRUE,  FALSE, 7),
-- Case 12 (Closed theft)
(30, 12,'accused', 'Mohammad Irfan',       29, 'Male',   'Bellandur, Bangalore',      FALSE, FALSE, 1),
-- Case 13 (Culpable homicide)
(31, 13,'accused', 'Prem Singh',           36, 'Male',   'Dwarka, New Delhi',         FALSE, FALSE, 2),
(32, 13,'victim',  'Ajay Tomar',           30, 'Male',   'Dwarka, New Delhi',         FALSE, FALSE, 5),
(33, 13,'witness', 'Geeta Sharma',         35, 'Female', 'Dwarka, New Delhi',         FALSE, FALSE, 1),
-- Case 14 (Online fraud)
(34, 14,'accused', 'Rahul Mehta',          38, 'Male',   'Nariman Point, Mumbai',     FALSE, FALSE, 1),
(35, 14,'accused', 'Amit Sharma (Co-A)',   35, 'Male',   'Lower Parel, Mumbai',       FALSE, FALSE, 1),
(36, 14,'accused', 'Pooja Desai (Co-A)',   31, 'Female', 'Worli, Mumbai',             FALSE, FALSE, 1),
-- Case 15 (Corporate fraud)
(37, 15,'accused', 'Kiran Patel',          42, 'Male',   'MIDC, Andheri, Mumbai',     FALSE, FALSE, 1),
(38, 15,'victim',  'Arvind Tiwari',        50, 'Male',   'MIDC, Andheri, Mumbai',     FALSE, FALSE, 3);

-- ============================================================
-- CASE SECTIONS
-- ============================================================
INSERT IGNORE INTO case_sections (case_id, section_id) VALUES
(1,  1),  (1,  13),            -- Murder + concealment of evidence
(2,  2),                       -- Rape
(3,  5),                       -- Attempt to murder
(4,  1),  (4,  14),            -- Murder + criminal conspiracy
(5,  2),  (5,  12),            -- Rape + kidnapping (POCSO)
(6,  4),  (6,  10),            -- 498A + 323 (causing hurt)
(7,  3),                       -- Cheating/embezzlement
(8,  8),                       -- CBT
(9,  7),  (9,  10),            -- Assault on woman + causing hurt
(10, 6),                       -- Theft
(11, 4),  (11, 10),            -- 498A + causing hurt
(12, 6),                       -- Theft
(13, 9),  (13, 13),            -- Culpable homicide + concealment
(14, 3),  (14, 14),            -- Cheating + conspiracy
(15, 8),  (15, 3);             -- CBT + cheating

-- ============================================================
-- CASE ADVOCATES  (prosecution / defense per case)
-- ============================================================
INSERT IGNORE INTO case_advocates (case_id, advocate_id, side) VALUES
(1,  1, 'prosecution'), (1,  2, 'defense'),
(2,  1, 'prosecution'), (2,  3, 'defense'),
(3,  3, 'prosecution'), (3,  4, 'defense'),
(4,  1, 'prosecution'), (4,  2, 'defense'),
(5,  5, 'prosecution'), (5,  6, 'defense'),
(6,  4, 'prosecution'), (6,  6, 'defense'),
(7,  5, 'prosecution'), (7,  7, 'defense'),
(8,  3, 'prosecution'), (8,  8, 'defense'),
(9,  4, 'prosecution'), (9,  6, 'defense'),
(10, 2, 'prosecution'), (10, 7, 'defense'),
(11, 1, 'prosecution'), (11, 3, 'defense'),
(12, 2, 'prosecution'), (12, 4, 'defense'),
(13, 1, 'prosecution'), (13, 5, 'defense'),
(14, 5, 'prosecution'), (14, 7, 'defense'),
(15, 8, 'prosecution'), (15, 2, 'defense');

-- ============================================================
-- DETENTION DETAILS
-- ============================================================
INSERT IGNORE INTO detention_details
  (case_id, detention_days, expected_sentence_days, life_sentence_flag, detention_ratio, overstay_flag)
VALUES
(1,  1187, 730,  FALSE, 1.63, TRUE),   -- 3.25 yr detained vs 2 yr sentence  → OVERSTAY
(2,  757,  3650, FALSE, 0.21, FALSE),  -- 376 max 10yr; still within
(3,  681,  1825, FALSE, 0.37, FALSE),
(4,  591,  3650, FALSE, 0.16, FALSE),  -- murder; life potential
(5,  515,  3650, FALSE, 0.14, FALSE),  -- POCSO; life potential
(6,  463,  365,  FALSE, 1.27, TRUE),   -- 498A 1yr max; 1.27×  → OVERSTAY
(7,  426,  2555, FALSE, 0.17, FALSE),
(8,  411,  1095, FALSE, 0.38, FALSE),
(9,  361,  180,  FALSE, 2.00, TRUE),   -- Assault; significant overstay
(10, 341,  1095, FALSE, 0.31, FALSE),
(11, 0,    730,  FALSE, 0.00, FALSE),  -- Closed; served sentence
(12, 0,    180,  FALSE, 0.00, FALSE),  -- Closed; served sentence
(13, 456,  1825, FALSE, 0.25, FALSE),
(14, 402,  2555, FALSE, 0.16, FALSE),
(15, 18,   1095, FALSE, 0.02, FALSE);  -- Just registered

-- ============================================================
-- CASE TIMELINE
-- ============================================================
INSERT IGNORE INTO case_timeline
  (case_id, days_pending, last_hearing_gap, number_of_trials, no_of_adjournments)
VALUES
(1,  1187, 15, 14, 9),
(2,  757,  19, 9,  5),
(3,  681,  8,  10, 4),
(4,  591,  11, 11, 7),
(5,  515,  6,  4,  2),
(6,  463,  4,  8,  4),
(7,  426,  5,  9,  5),
(8,  411,  7,  8,  3),
(9,  361,  2,  7,  2),
(10, 341,  3,  6,  2),
(11, 0,    0,  16, 6),
(12, 0,    0,  9,  2),
(13, 456,  1,  6,  3),
(14, 402,  4,  7,  2),
(15, 18,   0,  0,  0);

-- ============================================================
-- NLP FEATURES  (AI-extracted from FIR text)
-- ============================================================
INSERT IGNORE INTO case_nlp_features
  (case_id, urgency_nlp, bail_eligibility_nlp, case_complexity, keywords)
VALUES
(1,  'CRITICAL', FALSE, 'High',   'murder,weapon,eyewitness,custody,overstay,stab'),
(2,  'CRITICAL', FALSE, 'High',   'rape,minor,medical,custody,bail_denied,forensic'),
(3,  'HIGH',     FALSE, 'Medium', 'attempt_murder,firearm,grievous_injury,weapon_seized'),
(4,  'CRITICAL', FALSE, 'High',   'murder,gang,conspiracy,absconding,NBW'),
(5,  'CRITICAL', FALSE, 'High',   'minor,kidnapping,rape,POCSO,fast_track,custody'),
(6,  'HIGH',     TRUE,  'Medium', 'domestic_violence,dowry,children,498A,protection_order'),
(7,  'MEDIUM',   TRUE,  'High',   'fraud,embezzlement,digital_evidence,CFO,45_lakhs'),
(8,  'MEDIUM',   TRUE,  'Medium', 'property_fraud,multiple_victims,bail,40_lakhs'),
(9,  'HIGH',     TRUE,  'Low',    'assault,woman,CCTV,no_contact_order,same_locality'),
(10, 'LOW',      TRUE,  'Low',    'theft,first_offender,recovery,mobiles,CCTV'),
(11, 'LOW',      FALSE, 'Low',    'domestic_violence,convicted,2yr,fine,closed'),
(12, 'LOW',      FALSE, 'Low',    'theft,guilty_plea,6_months,closed'),
(13, 'CRITICAL', FALSE, 'Medium', 'culpable_homicide,hospital_death,304_IPC,bail_denied'),
(14, 'HIGH',     TRUE,  'High',   'online_fraud,200_victims,2_crore,organized_scheme,bail'),
(15, 'MEDIUM',   TRUE,  'Medium', 'corporate_fraud,forged_documents,85_lakhs,anticipatory_bail');

-- ============================================================
-- CASE FEATURES  (AI cluster scoring input)
-- priority_cluster: 0=CRITICAL 1=HIGH 2=MEDIUM 3=LOW
-- ============================================================
INSERT IGNORE INTO case_features
  (case_id, detention_ratio, overstay_flag, severity_score,
   vulnerability_score, urgency_score, priority_cluster)
VALUES
(1,  1.63, TRUE,  95, 7,  0.95, 0),
(2,  0.21, FALSE, 92, 10, 0.93, 0),
(3,  0.37, FALSE, 76, 5,  0.79, 1),
(4,  0.16, FALSE, 91, 4,  0.89, 0),
(5,  0.14, FALSE, 98, 10, 0.99, 0),
(6,  1.27, TRUE,  66, 9,  0.73, 1),
(7,  0.17, FALSE, 54, 2,  0.57, 2),
(8,  0.38, FALSE, 49, 3,  0.54, 2),
(9,  2.00, TRUE,  61, 7,  0.69, 1),
(10, 0.31, FALSE, 24, 2,  0.27, 3),
(11, 0.00, FALSE, 0,  0,  0.00, 3),
(12, 0.00, FALSE, 0,  0,  0.00, 3),
(13, 0.25, FALSE, 81, 5,  0.83, 0),
(14, 0.16, FALSE, 54, 3,  0.59, 2),
(15, 0.02, FALSE, 41, 3,  0.43, 2);

-- ============================================================
-- CASE REGISTRATION
-- ============================================================
INSERT IGNORE INTO case_registration
  (case_id, registered_by, registration_date, registration_mode, remarks)
VALUES
(1,  3, '2023-01-15 10:30:00', 'manual',  'FIR at Karol Bagh PS; accused produced in court same day'),
(2,  3, '2023-03-22 14:15:00', 'manual',  'FIR registered; victim examined at Safdarjung Hospital'),
(3,  6, '2023-06-05 09:00:00', 'manual',  'FIR at Bandra PS; weapon and CCTV disc seized'),
(4,  3, '2023-09-03 11:30:00', 'manual',  'FIR at Lajpat Nagar PS; 3 of 4 accused arrested'),
(5,  7, '2023-11-18 08:45:00', 'manual',  'FIR under POCSO + IPC; victim in safe custody'),
(6,  6, '2024-01-09 10:00:00', 'manual',  'FIR with medical report; interim custody of children'),
(7,  7, '2024-02-14 11:00:00', 'online',  'EOW complaint; digital audit report attached'),
(8,  7, '2024-03-01 09:30:00', 'manual',  'FIR with 4 complainants; property documents attached'),
(9,  6, '2024-04-21 16:00:00', 'manual',  'FIR with CCTV disc and medical certificate'),
(10, 6, '2024-05-10 13:00:00', 'manual',  'FIR; accused arrested next day; phones partially recovered'),
(11, 3, '2022-06-15 10:00:00', 'manual',  'FIR; 5 witnesses; medical report attached'),
(12, 6, '2022-09-01 09:00:00', 'manual',  'FIR; accused caught near scene; goods seized'),
(13, 3, '2025-01-15 10:30:00', 'manual',  'FIR 323 IPC; upgraded to 304 after victim died on day-3'),
(14, 7, '2025-03-10 14:00:00', 'online',  'EOW referral; 200+ investor complaints collated online'),
(15, 7, '2026-03-28 10:00:00', 'manual',  'FIR with forged documents and bank transfer slips');

-- ============================================================
-- JUDGE CASE ASSIGNMENTS
-- ============================================================
INSERT IGNORE INTO judge_case_assignments
  (case_id, judge_id, assigned_by, assigned_date, status)
VALUES
(1,  1, 1, '2023-01-20 10:00:00', 'active'),
(2,  1, 1, '2023-03-25 10:00:00', 'active'),
(3,  2, 1, '2023-06-10 09:00:00', 'active'),
(4,  1, 1, '2023-09-10 10:00:00', 'active'),
(6,  2, 1, '2024-01-15 10:00:00', 'active'),
(7,  3, 1, '2024-02-20 11:00:00', 'active'),
(8,  3, 1, '2024-03-10 09:00:00', 'active'),
(9,  2, 1, '2024-04-25 10:00:00', 'active'),
(10, 2, 1, '2024-05-15 09:00:00', 'active'),
(11, 1, 1, '2022-06-20 10:00:00', 'closed'),
(12, 2, 1, '2022-09-10 10:00:00', 'closed'),
(13, 1, 1, '2025-01-20 10:00:00', 'active'),
(14, 3, 1, '2025-03-15 11:00:00', 'active'),
(15, 3, 1, '2026-04-01 10:00:00', 'active');

-- ============================================================
-- CASE ADVOCATE ASSIGNMENTS  (judge-managed side)
-- ============================================================
INSERT IGNORE INTO case_advocate_assignments
  (case_id, advocate_id, assigned_by, assigned_date, side, status)
VALUES
(1,  1, 2, '2023-01-25 10:00:00', 'prosecution', 'active'),
(1,  2, 2, '2023-01-25 11:00:00', 'defense',     'active'),
(2,  1, 2, '2023-03-28 10:00:00', 'prosecution', 'active'),
(2,  3, 2, '2023-03-28 11:00:00', 'defense',     'active'),
(3,  3, 4, '2023-06-15 09:00:00', 'prosecution', 'active'),
(3,  4, 4, '2023-06-15 10:00:00', 'defense',     'active'),
(4,  1, 2, '2023-09-12 10:00:00', 'prosecution', 'active'),
(4,  2, 2, '2023-09-12 11:00:00', 'defense',     'active'),
(6,  4, 4, '2024-01-18 10:00:00', 'prosecution', 'active'),
(6,  6, 4, '2024-01-18 11:00:00', 'defense',     'active'),
(7,  5, 5, '2024-02-22 10:00:00', 'prosecution', 'active'),
(7,  7, 5, '2024-02-22 11:00:00', 'defense',     'active'),
(13, 1, 2, '2025-01-22 10:00:00', 'prosecution', 'active'),
(13, 5, 2, '2025-01-22 11:00:00', 'defense',     'active'),
(14, 5, 5, '2025-03-18 10:00:00', 'prosecution', 'active'),
(14, 7, 5, '2025-03-18 11:00:00', 'defense',     'active');

-- ============================================================
-- HEARING SCHEDULE
-- priority_cluster: 0=CRITICAL 1=HIGH 2=MEDIUM 3=LOW
-- ============================================================
INSERT IGNORE INTO hearing_schedule
  (schedule_id, case_id, scheduled_date, time_slot, court_id, judge_id,
   priority_cluster, priority_rank, scheduling_reason, scheduling_status)
VALUES
-- ── Past completed hearings ───────────────────────────────────
(1,  1,  '2026-04-01', '10:00-10:45', 2, 1, 0, 1,  'Critical; undertrial overstay; witness cross',     'completed'),
(2,  2,  '2026-03-28', '11:00-11:45', 2, 1, 0, 2,  'Bail review hearing; denial expected',             'completed'),
(3,  4,  '2026-04-05', '09:00-09:45', 2, 1, 0, 3,  'Gang murder; forensic report scheduled',           'completed'),
(4,  3,  '2026-04-08', '10:00-10:30', 3, 2, 1, 4,  'Final arguments; defense to complete',             'completed'),
(5,  6,  '2026-04-12', '11:00-11:30', 3, 2, 1, 5,  'DV; doctor witness examination',                   'completed'),
(6,  7,  '2026-04-11', '14:00-14:45', 4, 3, 2, 6,  'Fraud; both sides to finish arguments',            'completed'),
(7,  8,  '2026-04-09', '15:00-15:30', 4, 3, 2, 7,  'CBT; bank statement admission',                    'completed'),
(8,  9,  '2026-04-14', '10:00-10:30', 3, 2, 1, 8,  'Assault; prosecution arguments',                   'completed'),
(9,  10, '2026-04-13', '11:00-11:30', 3, 2, 3, 9,  'Theft; final arguments both sides',                'completed'),
(10, 14, '2026-04-12', '16:00-16:45', 4, 3, 2, 10, 'Online fraud; judgment reservation',               'completed'),
-- ── TODAY (16 Apr 2026) ───────────────────────────────────────
(11, 1,  '2026-04-16', '09:00-09:45', 2, 1, 0, 1,  'Critical; PW-3 cross-examination by defense',      'scheduled'),
(12, 13, '2026-04-16', '10:00-10:45', 2, 1, 0, 2,  'Culpable homicide; forensic evidence recording',   'scheduled'),
(13, 2,  '2026-04-16', '11:30-12:15', 2, 1, 0, 3,  'Rape; bail review + evidence',                     'scheduled'),
(14, 5,  '2026-04-16', '14:00-14:45', 5, NULL, 0, 4,'POCSO mandatory fast-track sitting',               'scheduled'),
(15, 9,  '2026-04-16', '10:00-10:30', 3, 2, 1, 5,  'Assault; defense arguments today',                 'scheduled'),
(16, 6,  '2026-04-16', '11:00-11:30', 3, 2, 1, 6,  'DV; cross-exam of doctor by defense',              'scheduled'),
(17, 7,  '2026-04-16', '15:00-15:45', 4, 3, 2, 7,  'Fraud; defense final reply arguments',             'scheduled'),
(18, 14, '2026-04-16', '14:00-14:45', 4, 3, 2, 8,  'Online fraud; judgment to be pronounced',          'scheduled'),
-- ── Future hearings ───────────────────────────────────────────
(19, 4,  '2026-04-22', '09:00-09:45', 2, 1, 0, 1,  'Gang murder; next witness examination date',       'scheduled'),
(20, 3,  '2026-04-24', '10:00-10:30', 3, 2, 1, 2,  'Attempt to murder; judgment pronouncement',        'scheduled'),
(21, 8,  '2026-04-25', '14:00-14:30', 4, 3, 2, 3,  'CBT; final arguments date',                        'scheduled'),
(22, 10, '2026-04-28', '11:00-11:30', 3, 2, 3, 4,  'Theft; sentencing hearing',                        'scheduled'),
(23, 15, '2026-05-05', '10:00-10:45', 4, 3, 2, 5,  'Corporate fraud; case first admission hearing',    'scheduled');

-- ============================================================
-- HEARINGS  (actual hearings held, linked to schedule)
-- ============================================================
INSERT IGNORE INTO hearings
  (hearing_id, case_id, schedule_id, hearing_date,
   actual_start_time, actual_end_time, hearing_type,
   judge_id, outcome, next_action, remarks)
VALUES
(1, 1,  1,  '2026-04-01', '10:05:00', '10:52:00', 'Witness Examination',
    1, 'PW-3 examined; cross-examination pending',
    'Defense to cross-examine PW-3 on 16 Apr',
    'Mrs. Kavita Singh (PW-3) fully examined by prosecution. Defense sought time.'),
(2, 2,  2,  '2026-03-28', '11:10:00', '11:55:00', 'Bail Application',
    1, 'Bail denied; accused flight risk',
    'Evidence recording to continue 16 Apr',
    'Third bail application denied. Court noted accused attempted to intimidate witness.'),
(3, 4,  3,  '2026-04-05', '09:15:00', '10:05:00', 'Evidence Recording',
    1, 'Forensic ballistics report admitted on record',
    'Witness examination on 22 Apr',
    'Forensic expert (PW-6) examined. Ballistics confirms weapon belonged to accused Ravi Kumar.'),
(4, 3,  4,  '2026-04-08', '10:05:00', '10:38:00', 'Final Arguments',
    2, 'Defense completed arguments',
    'Prosecution reply arguments on 24 Apr',
    'Defense argued misidentification; CCTV angle disputed. Prosecution to reply.'),
(5, 6,  5,  '2026-04-12', '11:08:00', '11:44:00', 'Evidence Recording',
    2, 'Doctor (PW-3) examined by prosecution',
    'Defense cross-examination of doctor on 16 Apr',
    'Dr. Mahesh Rao confirmed rib fracture consistent with assault. Report exhibited.'),
(6, 7,  6,  '2026-04-11', '14:12:00', '14:58:00', 'Final Arguments',
    3, 'Both sides argued; prosecution emphasized digital trail',
    'Judgment reserved; date 16 Apr',
    'CFO case argued from both sides. Audit report extensively cited. Judgment reserved.'),
(7, 8,  7,  '2026-04-09', '15:06:00', '15:44:00', 'Evidence Recording',
    3, 'Bank account statements and RTGS slips admitted',
    'Final arguments on 25 Apr',
    'Prosecution produced 34 transaction records. All admitted without objection.'),
(8, 9,  8,  '2026-04-14', '10:03:00', '10:36:00', 'Arguments',
    2, 'Prosecution completed arguments',
    'Defense arguments on 16 Apr',
    'Prosecution cited CCTV + victim testimony. Defense to present their arguments next.'),
(9, 10, 9,  '2026-04-13', '11:06:00', '11:40:00', 'Final Arguments',
    2, 'Both sides argued; judgment reserved',
    'Sentencing hearing on 28 Apr',
    'Accused admitted partial guilt. Both sides argued on quantum of sentence.'),
(10,14, 10, '2026-04-12', '16:12:00', '17:00:00', 'Final Arguments',
    3, 'Both sides completed; judgment reserved 16 Apr',
    'Judgment to be pronounced 16 Apr 14:00',
    'Extensive arguments on ₹2Cr fraud. Quantum of sentence debated. Judgment 16 Apr.');

-- ============================================================
-- HEARING PARTICIPANTS
-- ============================================================
INSERT IGNORE INTO hearing_participants
  (hearing_id, person_id, advocate_id, role, attendance_status)
VALUES
-- Hearing 1 (Case 1 – Murder, Apr 01)
(1,  1,  2, 'accused', 'present'),
(1,  3,  1, 'witness', 'present'),
-- Hearing 2 (Case 2 – Rape, Mar 28)
(2,  4,  3, 'accused', 'present'),
-- Hearing 3 (Case 4 – Gang murder, Apr 05)
(3,  9,  1, 'accused', 'present'),
(3,  10, 1, 'accused', 'present'),
(3,  11, 1, 'accused', 'present'),
-- Hearing 4 (Case 3 – Attempt to murder, Apr 08)
(4,  6,  3, 'accused', 'present'),
(4,  7,  3, 'victim',  'present'),
-- Hearing 5 (Case 6 – DV, Apr 12)
(5,  17, 4, 'victim',  'present'),
(5,  18, 4, 'witness', 'present'),
-- Hearing 6 (Case 7 – Financial Fraud, Apr 11)
(6,  19, 5, 'accused', 'present'),
-- Hearing 7 (Case 8 – CBT, Apr 09)
(7,  20, 3, 'accused', 'present'),
(7,  21, 3, 'victim',  'present'),
-- Hearing 8 (Case 9 – Assault, Apr 14)
(8,  24, 4, 'accused', 'present'),
(8,  25, 4, 'victim',  'present'),
-- Hearing 9 (Case 10 – Theft, Apr 13)
(9,  26, 2, 'accused', 'present'),
(9,  27, 2, 'victim',  'present'),
-- Hearing 10 (Case 14 – Online fraud, Apr 12)
(10, 34, 5, 'accused', 'present'),
(10, 35, 5, 'accused', 'present'),
(10, 36, 5, 'accused', 'present');

-- ============================================================
-- HEARING DOCUMENTS
-- ============================================================
INSERT IGNORE INTO hearing_documents (hearing_id, document_type, file_path) VALUES
(1,  'Witness Statement', 'docs/case1/pw3_statement.pdf'),
(2,  'Bail Application',  'docs/case2/bail_app_3.pdf'),
(3,  'Forensic Report',   'docs/case4/ballistics.pdf'),
(5,  'Medical Report',    'docs/case6/doctor_report.pdf'),
(6,  'Audit Report',      'docs/case7/digital_audit.pdf'),
(7,  'Bank Statements',   'docs/case8/rtgs_records.pdf');

-- ============================================================
-- HEARING RESCHEDULE LOG
-- ============================================================
INSERT IGNORE INTO hearing_reschedule_log
  (schedule_id, old_date, new_date, reason, rescheduled_by)
VALUES
(11, '2026-04-10', '2026-04-16', 'Presiding judge unwell; rescheduled by court registrar',          'Court Registrar'),
(14, '2026-04-12', '2026-04-16', 'POCSO mandatory fast-track; earlier slot made available',          'Registry'),
(3,  '2026-04-02', '2026-04-05', 'Case added to supplementary board; extra sitting arranged',        'Registrar'),
(19, '2026-04-19', '2026-04-22', 'Defence advocate available from 22 Apr; court accepted',           'Bench Master');

-- ============================================================
-- ADJOURNMENTS
-- ============================================================
INSERT IGNORE INTO adjournments (case_id, reason, adjourned_date, next_date) VALUES
(1,  'Defense requested time to cross-examine PW-3; granted',              '2026-03-10', '2026-04-01'),
(1,  'Court on vacation; board overloaded',                                 '2026-02-08', '2026-03-10'),
(1,  'Prosecution requested additional evidence time',                      '2025-12-12', '2026-02-08'),
(2,  'Accused changed advocate; new counsel sought preparation time',       '2026-02-20', '2026-03-28'),
(2,  'Prosecution witness (doctor) on medical leave',                       '2025-11-15', '2026-02-20'),
(3,  'Defense filed additional documentary evidence; prosecution sought time','2026-03-18','2026-04-08'),
(4,  'One accused hospitalised; request for adjournment accepted',          '2026-03-12', '2026-04-05'),
(4,  'NBW execution pending for absconding accused',                        '2026-02-15', '2026-03-12'),
(4,  'Forensic expert unavailable on fixed date',                           '2026-01-20', '2026-02-15'),
(6,  'Doctor witness (PW-3) unavailable due to medical emergency',          '2026-03-25', '2026-04-12'),
(7,  'Defense advocate on medical leave; substitute sought adjournment',    '2026-03-28', '2026-04-11'),
(8,  'Additional bank documents requested; bank compliance pending',        '2026-03-15', '2026-04-09'),
(9,  'Defense requested time; court noted accused missed previous date',    '2026-03-28', '2026-04-14'),
(13, 'Forensic report not ready; CFSL cited heavy workload',                '2026-03-22', '2026-04-16');

-- ============================================================
-- JUDGMENTS  (closed cases only)
-- ============================================================
INSERT IGNORE INTO judgments
  (case_id, judgment_date, verdict, sentence_given_days, fine_amount, remarks)
VALUES
(11, '2025-08-20', 'Convicted',
     730, 50000.00,
     'Accused Sohan Lal convicted u/s 498A + 323 IPC. 2 years rigorous imprisonment. '
     'Fine ₹50,000. Victim compensation ₹1,00,000 ordered under DPSC Act.'),
(12, '2024-03-15', 'Convicted',
     180, 10000.00,
     'Accused Mohammad Irfan pleaded guilty. Sentenced to 6 months + ₹10,000 fine. '
     'Good behaviour noted; early release possible after 4 months.');

-- ============================================================
-- APPEALS
-- ============================================================
INSERT IGNORE INTO appeals (case_id, filed_date, court_id, status) VALUES
(11, '2025-09-15', 2, 'pending');   -- Accused Sohan Lal appealed conviction to High Court

-- ============================================================
-- DOCUMENTS  (FIRs, medical, forensic, digital evidence)
-- ============================================================
INSERT IGNORE INTO documents (case_id, document_type, file_path) VALUES
(1,  'FIR',                 'docs/case1/fir.pdf'),
(1,  'Post Mortem Report',  'docs/case1/pm_report.pdf'),
(1,  'Weapon Photograph',   'docs/case1/weapon.jpg'),
(1,  'Witness Statement',   'docs/case1/witness_kavita.pdf'),
(2,  'FIR',                 'docs/case2/fir.pdf'),
(2,  'Medical Report',      'docs/case2/medical.pdf'),
(2,  'Forensic FSL Report', 'docs/case2/fsl_report.pdf'),
(3,  'FIR',                 'docs/case3/fir.pdf'),
(3,  'CCTV Evidence',       'docs/case3/cctv.mp4'),
(3,  'Weapon Seizure Memo', 'docs/case3/weapon_seizure.pdf'),
(4,  'FIR',                 'docs/case4/fir.pdf'),
(4,  'Forensic Report',     'docs/case4/ballistics.pdf'),
(4,  'NBW Copy',            'docs/case4/nbw_mohan_singh.pdf'),
(5,  'FIR',                 'docs/case5/fir.pdf'),
(5,  'POCSO Complaint',     'docs/case5/pocso_complaint.pdf'),
(5,  'Medical Report',      'docs/case5/medical.pdf'),
(6,  'FIR',                 'docs/case6/fir.pdf'),
(6,  'Medical Report',      'docs/case6/medical.pdf'),
(6,  'Protection Order',    'docs/case6/protection_order.pdf'),
(7,  'FIR',                 'docs/case7/fir.pdf'),
(7,  'Digital Audit Report','docs/case7/audit_report.pdf'),
(7,  'Bank Statements',     'docs/case7/bank_statements.pdf'),
(8,  'FIR',                 'docs/case8/fir.pdf'),
(8,  'Bank Statements',     'docs/case8/bank_stmts.pdf'),
(8,  'Sale Agreement',      'docs/case8/sale_agreement.pdf'),
(9,  'FIR',                 'docs/case9/fir.pdf'),
(9,  'CCTV Evidence',       'docs/case9/cctv.mp4'),
(9,  'Medical Certificate', 'docs/case9/medical_cert.pdf'),
(10, 'FIR',                 'docs/case10/fir.pdf'),
(10, 'CCTV Evidence',       'docs/case10/cctv.mp4'),
(11, 'FIR',                 'docs/case11/fir.pdf'),
(11, 'Judgment Copy',       'docs/case11/judgment.pdf'),
(12, 'FIR',                 'docs/case12/fir.pdf'),
(12, 'Judgment Copy',       'docs/case12/judgment.pdf'),
(13, 'FIR',                 'docs/case13/fir.pdf'),
(13, 'Death Certificate',   'docs/case13/death_cert.pdf'),
(13, 'Hospital Records',    'docs/case13/hospital_records.pdf'),
(14, 'FIR',                 'docs/case14/fir.pdf'),
(14, 'Investor Complaints', 'docs/case14/investor_list.pdf'),
(14, 'Website Screenshot',  'docs/case14/website_proof.pdf'),
(15, 'FIR',                 'docs/case15/fir.pdf'),
(15, 'Forged Resolutions',  'docs/case15/forged_docs.pdf'),
(15, 'Bank Transfer Slips', 'docs/case15/transfer_slips.pdf');

-- ============================================================
-- CASE EVENTS  (lifecycle audit trail)
-- ============================================================
INSERT IGNORE INTO case_events
  (case_id, event_type, event_subtype, event_date, performed_by, role,
   description, previous_status, new_status)
VALUES
(1,  'STATUS_CHANGE','registered',    '2023-01-15 10:30:00', 'Clerk Priya Sharma',    'writer', 'FIR registered; case created',                          NULL,     'active'),
(1,  'HEARING',      'witness_exam',  '2026-04-01 10:05:00', 'Justice Ramesh Kumar',  'judge',  'PW-3 examined by prosecution',                          'active', 'active'),
(2,  'STATUS_CHANGE','registered',    '2023-03-22 14:15:00', 'Clerk Priya Sharma',    'writer', 'Rape case registered; victim protected',                 NULL,     'active'),
(2,  'BAIL',         'denied',        '2023-06-10 11:00:00', 'Justice Ramesh Kumar',  'judge',  'First bail application denied; flight risk',             'active', 'active'),
(2,  'BAIL',         'denied',        '2024-01-15 10:00:00', 'Justice Ramesh Kumar',  'judge',  'Second bail denied; witness intimidation noted',         'active', 'active'),
(2,  'BAIL',         'denied',        '2026-03-28 12:00:00', 'Justice Ramesh Kumar',  'judge',  'Third bail denied; accused remains in custody',          'active', 'active'),
(3,  'STATUS_CHANGE','registered',    '2023-06-05 09:00:00', 'Mohan Lal Gupta',       'writer', 'Attempt to murder case registered at Bandra PS',         NULL,     'active'),
(4,  'STATUS_CHANGE','registered',    '2023-09-03 11:30:00', 'Clerk Priya Sharma',    'writer', 'Gang murder; 3 of 4 accused arrested',                   NULL,     'active'),
(4,  'NBW',          'issued',        '2023-11-20 10:00:00', 'Justice Ramesh Kumar',  'judge',  'NBW issued against absconding accused Mohan Singh',      'active', 'active'),
(5,  'STATUS_CHANGE','registered',    '2023-11-18 08:45:00', 'Sunita Reddy',          'writer', 'POCSO FIR registered; fast-track recommended',           NULL,     'active'),
(6,  'STATUS_CHANGE','registered',    '2024-01-09 10:00:00', 'Mohan Lal Gupta',       'writer', 'DV case registered with medical report',                 NULL,     'active'),
(6,  'ORDER',        'protection',    '2024-01-12 11:00:00', 'Justice Ananya Singh',  'judge',  'Interim protection order issued to victim',              'active', 'active'),
(7,  'STATUS_CHANGE','registered',    '2024-02-14 11:00:00', 'Sunita Reddy',          'writer', 'Financial fraud case registered; EOW referred',          NULL,     'active'),
(8,  'STATUS_CHANGE','registered',    '2024-03-01 09:30:00', 'Sunita Reddy',          'writer', 'CBT property fraud; 4 complainants',                     NULL,     'active'),
(9,  'STATUS_CHANGE','registered',    '2024-04-21 16:00:00', 'Mohan Lal Gupta',       'writer', 'Assault case with CCTV evidence registered',             NULL,     'active'),
(9,  'BAIL',         'conditional',   '2024-04-25 10:00:00', 'Justice Ananya Singh',  'judge',  'Bail granted with no-contact condition',                 'active', 'active'),
(10, 'STATUS_CHANGE','registered',    '2024-05-10 13:00:00', 'Mohan Lal Gupta',       'writer', 'Theft case; accused arrested; phones partially recovered',NULL,    'active'),
(11, 'STATUS_CHANGE','judgment',      '2025-08-20 14:00:00', 'Justice Ramesh Kumar',  'judge',  'Convicted; 2 yr + ₹50,000 fine',                        'active', 'closed'),
(12, 'STATUS_CHANGE','judgment',      '2024-03-15 11:30:00', 'Justice Ananya Singh',  'judge',  'Guilty plea; 6 months + ₹10,000 fine',                  'active', 'closed'),
(13, 'STATUS_CHANGE','registered',    '2025-01-15 10:30:00', 'Clerk Priya Sharma',    'writer', 'FIR 323 IPC registered; victim in hospital',             NULL,     'active'),
(13, 'STATUS_CHANGE','upgraded',      '2025-01-18 09:00:00', 'Clerk Priya Sharma',    'writer', 'FIR upgraded to 304 IPC; victim died on day-3',          'active', 'active'),
(14, 'STATUS_CHANGE','registered',    '2025-03-10 14:00:00', 'Sunita Reddy',          'writer', 'Online fraud; 200+ investor complaints collated',         NULL,    'active'),
(15, 'STATUS_CHANGE','registered',    '2026-03-28 10:00:00', 'Sunita Reddy',          'writer', 'Corporate fraud registered; anticipatory bail noted',    NULL,     'active');

-- ============================================================
-- CASE HISTORY  (status audit trail)
-- ============================================================
INSERT IGNORE INTO case_history (case_id, status, remarks) VALUES
(1,  'active',  'Case registered; accused produced in court same day'),
(1,  'active',  'Charges framed on 2023-03-10 u/s 302 + 201 IPC'),
(1,  'active',  'Evidence recording commenced 2023-05-15'),
(1,  'active',  'Prosecution evidence completed; cross-examination ongoing'),
(2,  'active',  'Case registered; accused in judicial custody'),
(2,  'active',  'Charges framed; bail denied twice'),
(2,  'active',  'Forensic report received and exhibited'),
(3,  'active',  'Accused arrested after 5 days; weapon seized'),
(3,  'active',  'Charges framed; evidence stage complete'),
(3,  'active',  'Final arguments stage; defense completed'),
(4,  'active',  '3 of 4 accused arrested; NBW for Mohan Singh pending'),
(4,  'active',  'Charges framed u/s 302 + 120B IPC'),
(4,  'active',  'Forensic ballistics admitted; witness examination ongoing'),
(5,  'active',  'POCSO + IPC charges; fast track court recommended'),
(5,  'active',  'Evidence collection in progress; court protection order'),
(6,  'active',  'Interim protection order issued; children with mother'),
(6,  'active',  'Doctor examined; defence cross-examination pending'),
(7,  'active',  'EOW investigation; digital audit trail confirmed'),
(7,  'active',  'Arguments complete; judgment reserved 16 Apr'),
(8,  'active',  'Charge sheet with 4 complainants; bank evidence admitted'),
(9,  'active',  'Accused on conditional bail; no-contact with victim'),
(9,  'active',  'Prosecution arguments done; defense to argue 16 Apr'),
(10, 'active',  'Accused on surety bail; 5 of 8 phones recovered'),
(10, 'active',  'Judgment reserved; sentencing hearing 28 Apr'),
(11, 'closed',  'Convicted u/s 498A + 323; 2 yr + ₹50,000 fine'),
(11, 'closed',  'Appeal filed by accused before High Court Delhi'),
(12, 'closed',  'Guilty plea; 6 months + ₹10,000; served sentence'),
(13, 'active',  'FIR upgraded from 323 to 304; accused in custody'),
(13, 'active',  'Bail denied; forensic report pending'),
(14, 'active',  '3 accused on conditional bail; passports impounded'),
(14, 'active',  'Arguments complete; judgment 16 Apr'),
(15, 'active',  'Anticipatory bail; forged documents seized'),
(15, 'active',  'First hearing scheduled 5 May 2026');

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
INSERT IGNORE INTO notifications
  (case_id, recipient_type, message, status)
VALUES
-- Today's hearing reminders for judge
(1,  'judge',  'HEARING TODAY 09:00 – Case #1 Murder: Defence cross-examination of PW-3.',            'unread'),
(13, 'judge',  'HEARING TODAY 10:00 – Case #13 Culpable Homicide: Evidence recording session.',       'unread'),
(2,  'judge',  'HEARING TODAY 11:30 – Case #2 Rape: Bail review + evidence continuation.',            'unread'),
(5,  'judge',  'HEARING TODAY 14:00 – Case #5 POCSO: Mandatory fast-track sitting.',                  'unread'),
(9,  'judge',  'HEARING TODAY 10:00 – Case #9 Assault: Defence to argue today.',                      'unread'),
(6,  'judge',  'HEARING TODAY 11:00 – Case #6 Domestic Violence: Cross-exam of doctor.',              'unread'),
(7,  'judge',  'HEARING TODAY 15:00 – Case #7 Financial Fraud: Defence reply arguments.',             'unread'),
(14, 'judge',  'JUDGMENT TODAY 14:00 – Case #14 Online Fraud: Pronounce reserved judgment.',          'unread'),
-- Writer notifications
(1,  'writer', 'Case #1: Next hearing 16 Apr at 09:00. Ensure PW-3 is present.',                      'read'),
(15, 'writer', 'New case #15 registered successfully. Advocate assignment pending.',                   'unread'),
(13, 'writer', 'Case #13: Hearing today at 10:00. Accused transport confirmed.',                       'unread'),
-- Admin notifications
(11, 'admin',  'Case #11 has been CLOSED. Judgment: Conviction. Appeal pending at HC.',                'read'),
(12, 'admin',  'Case #12 has been CLOSED. Judgment: Conviction (guilty plea). Sentence served.',       'read'),
(3,  'admin',  'Case #3: Judgment date set for 24 Apr 2026. Prosecution reply args on hold.',          'read'),
(5,  'admin',  'POCSO Case #5 flagged: No judge assigned. Fast track court allocation needed.',        'unread'),
-- Overstay alerts
(1,  'admin',  'OVERSTAY ALERT – Case #1: Accused detained 1187 days vs expected 730. Review needed.','unread'),
(6,  'admin',  'OVERSTAY ALERT – Case #6: Accused detained 463 days vs expected 365 (498A).',         'unread'),
(9,  'admin',  'OVERSTAY ALERT – Case #9: Accused detained 361 days vs expected 180. Ratio 2.0.',     'unread');

-- ============================================================
-- BLOCKCHAIN LOGS  (immutable audit hashes)
-- ============================================================
INSERT IGNORE INTO blockchain_logs (case_id, case_hash, transaction_hash) VALUES
(1,  'a1b2c3d4e5f67890abcdef1234567890ab', 'tx_c01_20230115103000'),
(2,  'b2c3d4e5f6789012abcdef234567890abc', 'tx_c02_20230322141500'),
(3,  'c3d4e5f67890123abcdef34567890abcd',  'tx_c03_20230605090000'),
(4,  'd4e5f678901234abcdef456789012abcde', 'tx_c04_20230903113000'),
(5,  'e5f6789012345abcdef5678901234abcdef','tx_c05_20231118084500'),
(11, 'f6789012345678abcdef678901234abcde', 'tx_c11_20250820140000'),
(12, 'a789012345678eabcdef78901234abcdef0','tx_c12_20240315113000');

-- ============================================================
-- JUDGE DAILY LOAD
-- ============================================================
INSERT IGNORE INTO judge_daily_load (judge_id, date, total_hearings) VALUES
(1, '2026-04-10', 3), (1, '2026-04-11', 2), (1, '2026-04-12', 1),
(1, '2026-04-13', 2), (1, '2026-04-14', 3), (1, '2026-04-15', 2),
(1, '2026-04-16', 4),  -- Today: 4 hearings
(2, '2026-04-10', 2), (2, '2026-04-11', 3), (2, '2026-04-12', 3),
(2, '2026-04-13', 2), (2, '2026-04-14', 2), (2, '2026-04-15', 1),
(2, '2026-04-16', 3),  -- Today: 3 hearings
(3, '2026-04-10', 2), (3, '2026-04-11', 3), (3, '2026-04-12', 3),
(3, '2026-04-13', 1), (3, '2026-04-14', 2), (3, '2026-04-15', 2),
(3, '2026-04-16', 3);  -- Today: 3 hearings

-- ============================================================
-- CASE SCHEDULE  (simpler scheduling table)
-- ============================================================
INSERT IGNORE INTO case_schedule (case_id, hearing_date, priority_rank, status) VALUES
(1,  '2026-04-16', 1, 'scheduled'),
(13, '2026-04-16', 2, 'scheduled'),
(2,  '2026-04-16', 3, 'scheduled'),
(5,  '2026-04-16', 4, 'scheduled'),
(9,  '2026-04-16', 5, 'scheduled'),
(6,  '2026-04-16', 6, 'scheduled'),
(7,  '2026-04-16', 7, 'scheduled'),
(14, '2026-04-16', 8, 'scheduled'),
(4,  '2026-04-22', 1, 'scheduled'),
(3,  '2026-04-24', 2, 'scheduled'),
(8,  '2026-04-25', 3, 'scheduled'),
(10, '2026-04-28', 4, 'scheduled'),
(15, '2026-05-05', 5, 'scheduled');

-- ============================================================
-- USER ACTIONS  (full audit log)
-- ============================================================
INSERT IGNORE INTO user_actions
  (user_id, case_id, action_type, description)
VALUES
(3, 1,  'CASE_REGISTERED',     'Murder FIR registered at Karol Bagh PS'),
(3, 2,  'CASE_REGISTERED',     'Rape FIR registered; victim identity protected'),
(6, 3,  'CASE_REGISTERED',     'Attempt to murder FIR; weapon and CCTV seized'),
(3, 4,  'CASE_REGISTERED',     'Gang murder case; 3 accused listed'),
(7, 5,  'CASE_REGISTERED',     'POCSO case registered; minor victim in safe custody'),
(6, 6,  'CASE_REGISTERED',     'Domestic violence FIR with medical report'),
(7, 7,  'CASE_REGISTERED',     'Financial fraud EOW case registered'),
(7, 8,  'CASE_REGISTERED',     'CBT property fraud; 4 complainants registered'),
(6, 9,  'CASE_REGISTERED',     'Assault on woman; CCTV evidence attached'),
(6, 10, 'CASE_REGISTERED',     'Theft case; arrested same day; partial recovery'),
(2, 1,  'HEARING_CONDUCTED',   'PW-3 examined; defence cross ordered'),
(2, 2,  'BAIL_DENIED',         'Third bail denial; witness intimidation noted'),
(2, 4,  'NBW_ISSUED',          'NBW against absconding accused Mohan Singh'),
(4, 3,  'ADVOCATE_ASSIGNED',   'Defence advocate Adv. Anita Desai assigned'),
(4, 6,  'ORDER_ISSUED',        'Interim protection order to victim Ritu Gupta'),
(4, 9,  'BAIL_CONDITIONAL',    'Bail with no-contact condition granted'),
(5, 7,  'JUDGMENT_RESERVED',   'Fraud case; arguments done; judgment 16 Apr'),
(5, 14, 'JUDGMENT_RESERVED',   'Online fraud; judgment to be delivered 16 Apr'),
(2, 11, 'JUDGMENT_DELIVERED',  'Convicted; 2 yr RI + fine ₹50,000'),
(4, 12, 'JUDGMENT_DELIVERED',  'Guilty plea; 6 months + fine ₹10,000'),
(7, 15, 'CASE_REGISTERED',     'Corporate fraud; anticipatory bail noted; docs attached'),
(3, 13, 'CASE_UPGRADED',       'FIR upgraded from 323 to 304 IPC after victim death');

SET FOREIGN_KEY_CHECKS = 1;
-- ============================================================
-- END OF SEED DATA
-- ============================================================
