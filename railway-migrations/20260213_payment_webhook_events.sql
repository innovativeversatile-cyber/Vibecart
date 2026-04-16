-- Run in Railway MySQL if you already applied an older schema.sql without this table.
CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  provider VARCHAR(80) NOT NULL,
  event_id VARCHAR(180) NOT NULL,
  event_type VARCHAR(120) NOT NULL,
  payload_json JSON NOT NULL,
  processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_payment_webhook_provider_event (provider, event_id),
  INDEX idx_payment_webhook_provider_type_time (provider, event_type, processed_at)
);
