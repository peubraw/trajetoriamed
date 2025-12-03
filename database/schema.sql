CREATE DATABASE IF NOT EXISTS wppbot_saas;
USE wppbot_saas;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    trial_end_date DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    subscription_status ENUM('trial', 'active', 'expired', 'cancelled') DEFAULT 'trial'
);

-- Tabela de sessões do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_name VARCHAR(100) NOT NULL,
    qr_code TEXT,
    status ENUM('disconnected', 'connecting', 'connected') DEFAULT 'disconnected',
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_session (user_id)
);

-- Tabela de configuração do bot
CREATE TABLE IF NOT EXISTS bot_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    bot_name VARCHAR(255) DEFAULT 'Assistente',
    system_prompt TEXT NOT NULL,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INT DEFAULT 300,
    is_active BOOLEAN DEFAULT TRUE,
    vendor1_name VARCHAR(100) DEFAULT 'Nathalia',
    vendor1_phone VARCHAR(20) DEFAULT '5531971102701',
    vendor2_name VARCHAR(100) DEFAULT 'Vitória',
    vendor2_phone VARCHAR(20) DEFAULT '5531985757508',
    vendor3_name VARCHAR(100) DEFAULT 'João',
    vendor3_phone VARCHAR(20) DEFAULT '5531973088916',
    vendor4_name VARCHAR(100) DEFAULT 'Leandro',
    vendor4_phone VARCHAR(20) DEFAULT '553187369717',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_config (user_id)
);

-- Tabela de mensagens (log)
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    sender VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    response TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_timestamp (user_id, timestamp)
);

-- Tabela de estatísticas
CREATE TABLE IF NOT EXISTS statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    messages_received INT DEFAULT 0,
    messages_sent INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, date)
);
