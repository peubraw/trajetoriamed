ALTER TABLE whatsapp_sessions 
MODIFY COLUMN status ENUM('disconnected','connecting','connected','qrcode') DEFAULT 'disconnected';
