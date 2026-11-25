-- Creates DealPlus service databases on the shared MySQL instance (local Docker only).
CREATE DATABASE IF NOT EXISTS lead_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS opportunity_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS approval_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS assignment_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS compliance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS document_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS rfp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'dealplus'@'%' IDENTIFIED BY 'change_me';
GRANT ALL PRIVILEGES ON lead_db.* TO 'dealplus'@'%';
GRANT ALL PRIVILEGES ON opportunity_db.* TO 'dealplus'@'%';
GRANT ALL PRIVILEGES ON approval_db.* TO 'dealplus'@'%';
GRANT ALL PRIVILEGES ON assignment_db.* TO 'dealplus'@'%';
GRANT ALL PRIVILEGES ON compliance_db.* TO 'dealplus'@'%';
GRANT ALL PRIVILEGES ON document_db.* TO 'dealplus'@'%';
GRANT ALL PRIVILEGES ON rfp_db.* TO 'dealplus'@'%';
FLUSH PRIVILEGES;