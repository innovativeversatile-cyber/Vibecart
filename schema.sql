CREATE DATABASE IF NOT EXISTS vibecart
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE vibecart;

CREATE TABLE users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  role ENUM('buyer','seller','admin','super_admin') NOT NULL DEFAULT 'buyer',
  country_code CHAR(2) NOT NULL,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE owner_auth_profiles (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  security_phrase_hash VARCHAR(255) NOT NULL,
  mfa_required TINYINT(1) NOT NULL DEFAULT 1,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE owner_mfa_factors (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_auth_id BIGINT UNSIGNED NOT NULL,
  factor_type ENUM('totp','backup_code') NOT NULL DEFAULT 'totp',
  secret_encrypted TEXT NULL,
  backup_code_hash VARCHAR(255) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_auth_id) REFERENCES owner_auth_profiles(id),
  INDEX idx_owner_mfa_owner_active (owner_auth_id, active)
);

CREATE TABLE owner_auth_sessions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_auth_id BIGINT UNSIGNED NOT NULL,
  session_token_hash VARCHAR(255) NOT NULL UNIQUE,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  FOREIGN KEY (owner_auth_id) REFERENCES owner_auth_profiles(id),
  INDEX idx_owner_sessions_owner_expiry (owner_auth_id, expires_at)
);

CREATE TABLE owner_auth_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_auth_id BIGINT UNSIGNED NULL,
  event_type VARCHAR(80) NOT NULL,
  ip_address VARCHAR(45) NULL,
  details VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_auth_id) REFERENCES owner_auth_profiles(id),
  INDEX idx_owner_events_type_created (event_type, created_at)
);

CREATE TABLE device_push_tokens (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  platform ENUM('android','ios','web') NOT NULL,
  push_token VARCHAR(255) NOT NULL UNIQUE,
  app_version VARCHAR(50) NULL,
  locale VARCHAR(20) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_push_tokens_user_platform_active (user_id, platform, active)
);

CREATE TABLE notification_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  title VARCHAR(140) NOT NULL,
  message VARCHAR(255) NOT NULL,
  deep_link VARCHAR(255) NULL,
  delivery_status ENUM('queued','sent','failed') NOT NULL DEFAULT 'queued',
  provider_message_id VARCHAR(180) NULL,
  error_message VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_notification_user_status_created (user_id, delivery_status, created_at)
);

CREATE TABLE advertisers (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  company_name VARCHAR(160) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  website_url VARCHAR(255) NULL,
  legal_verified TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_advertiser_email (contact_email)
);

CREATE TABLE ad_campaigns (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  advertiser_id BIGINT UNSIGNED NOT NULL,
  campaign_name VARCHAR(180) NOT NULL,
  target_regions VARCHAR(255) NULL,
  budget_amount DECIMAL(12,2) NOT NULL,
  bid_type ENUM('cpm','cpc','fixed_slot') NOT NULL DEFAULT 'fixed_slot',
  status ENUM('draft','active','paused','rejected','completed') NOT NULL DEFAULT 'draft',
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (advertiser_id) REFERENCES advertisers(id),
  INDEX idx_campaign_status_dates (status, starts_at, ends_at)
);

CREATE TABLE ad_creatives (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  campaign_id BIGINT UNSIGNED NOT NULL,
  headline VARCHAR(140) NOT NULL,
  body_text VARCHAR(255) NOT NULL,
  cta_text VARCHAR(80) NOT NULL,
  click_url VARCHAR(255) NOT NULL,
  moderation_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES ad_campaigns(id),
  INDEX idx_creative_moderation_active (moderation_status, active)
);

CREATE TABLE ad_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  creative_id BIGINT UNSIGNED NOT NULL,
  event_type ENUM('impression','click') NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creative_id) REFERENCES ad_creatives(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_ad_events_creative_type_time (creative_id, event_type, created_at)
);

CREATE TABLE tax_rules (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  country_code CHAR(2) NOT NULL,
  state_region VARCHAR(120) NULL,
  tax_type ENUM('vat','sales_tax','withholding_tax','service_tax') NOT NULL,
  rate_percent DECIMAL(6,3) NOT NULL,
  applies_to ENUM('marketplace_order','service_booking','advertising_invoice','platform_fee') NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tax_rules_scope (country_code, tax_type, applies_to, active)
);

CREATE TABLE tax_ledger_entries (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  reference_type ENUM('order','booking','ad_invoice','payout') NOT NULL,
  reference_id BIGINT UNSIGNED NOT NULL,
  country_code CHAR(2) NOT NULL,
  tax_type VARCHAR(60) NOT NULL,
  taxable_amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  remittance_status ENUM('pending','scheduled','remitted') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tax_ledger_reference (reference_type, reference_id),
  INDEX idx_tax_ledger_remit (remittance_status, created_at)
);

CREATE TABLE advertiser_invoices (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  advertiser_id BIGINT UNSIGNED NOT NULL,
  campaign_id BIGINT UNSIGNED NOT NULL,
  subtotal_amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  invoice_status ENUM('draft','issued','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
  issued_at DATETIME NULL,
  paid_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (advertiser_id) REFERENCES advertisers(id),
  FOREIGN KEY (campaign_id) REFERENCES ad_campaigns(id),
  INDEX idx_ad_invoices_status_dates (invoice_status, issued_at, paid_at)
);

CREATE TABLE platform_revenue_entries (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  source_type ENUM('order_fee','ad_invoice','booking_fee','subscription_fee','boost_fee','affiliate_commission','insurance_commission') NOT NULL,
  source_id BIGINT UNSIGNED NOT NULL,
  gross_amount DECIMAL(12,2) NOT NULL,
  tax_withheld_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  net_amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  recognized_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_platform_revenue_source (source_type, source_id),
  INDEX idx_platform_revenue_time (recognized_at)
);

CREATE TABLE seller_subscription_plans (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  plan_code VARCHAR(80) NOT NULL UNIQUE,
  plan_name VARCHAR(120) NOT NULL,
  monthly_price DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  listing_limit INT NULL,
  boost_credits INT NOT NULL DEFAULT 0,
  analytics_enabled TINYINT(1) NOT NULL DEFAULT 1,
  priority_support TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seller_subscriptions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  shop_id BIGINT UNSIGNED NOT NULL,
  plan_id BIGINT UNSIGNED NOT NULL,
  start_at DATETIME NOT NULL,
  end_at DATETIME NOT NULL,
  status ENUM('active','paused','cancelled','expired') NOT NULL DEFAULT 'active',
  billing_cycle ENUM('monthly','quarterly','yearly') NOT NULL DEFAULT 'monthly',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(id),
  FOREIGN KEY (plan_id) REFERENCES seller_subscription_plans(id),
  INDEX idx_seller_subscriptions_shop_status (shop_id, status, end_at)
);

CREATE TABLE listing_boost_packages (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  package_code VARCHAR(80) NOT NULL UNIQUE,
  package_name VARCHAR(140) NOT NULL,
  duration_days INT NOT NULL,
  placement_zone ENUM('home_feed','search_top','category_featured','service_spotlight') NOT NULL,
  price_amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE listing_boost_purchases (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  shop_id BIGINT UNSIGNED NOT NULL,
  package_id BIGINT UNSIGNED NOT NULL,
  target_type ENUM('product','service') NOT NULL,
  target_id BIGINT UNSIGNED NOT NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  status ENUM('active','scheduled','expired','cancelled') NOT NULL DEFAULT 'scheduled',
  amount_paid DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(id),
  FOREIGN KEY (package_id) REFERENCES listing_boost_packages(id),
  INDEX idx_boost_purchase_target (target_type, target_id, status, ends_at)
);

CREATE TABLE order_monetization_charges (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  protection_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  convenience_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  escrow_priority_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  logistics_margin_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  INDEX idx_order_charges_order_created (order_id, created_at)
);

CREATE TABLE logistics_rate_cards (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  from_country CHAR(2) NOT NULL,
  to_country CHAR(2) NOT NULL,
  shipping_method VARCHAR(100) NOT NULL,
  provider_cost DECIMAL(12,2) NOT NULL,
  platform_price DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_logistics_rate_route (from_country, to_country, shipping_method, currency)
);

CREATE TABLE affiliate_partners (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  partner_name VARCHAR(160) NOT NULL,
  partner_type ENUM('wallet','telco','insurance','logistics','other') NOT NULL DEFAULT 'other',
  contact_email VARCHAR(255) NOT NULL,
  default_commission_percent DECIMAL(6,3) NOT NULL DEFAULT 0.000,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_affiliate_partner_email (contact_email)
);

CREATE TABLE affiliate_referrals (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  partner_id BIGINT UNSIGNED NOT NULL,
  referred_user_id BIGINT UNSIGNED NULL,
  reference_code VARCHAR(80) NOT NULL,
  conversion_type ENUM('signup','purchase','booking','ad_spend') NOT NULL DEFAULT 'signup',
  conversion_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  commission_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  status ENUM('pending','approved','paid','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES affiliate_partners(id),
  FOREIGN KEY (referred_user_id) REFERENCES users(id),
  INDEX idx_affiliate_referrals_partner_status (partner_id, status, created_at),
  INDEX idx_affiliate_referrals_code (reference_code)
);

CREATE TABLE insurance_providers (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  provider_name VARCHAR(160) NOT NULL,
  provider_type ENUM('life','health','funeral','student_cover','mixed') NOT NULL DEFAULT 'mixed',
  contact_email VARCHAR(255) NOT NULL,
  website_url VARCHAR(255) NULL,
  legal_verified TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_insurance_provider_email (contact_email)
);

CREATE TABLE insurance_plans (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  provider_id BIGINT UNSIGNED NOT NULL,
  plan_name VARCHAR(180) NOT NULL,
  plan_type ENUM('life','health','funeral','student_cover') NOT NULL DEFAULT 'student_cover',
  monthly_premium DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  waiting_period_days INT NOT NULL DEFAULT 0,
  renewal_cycle ENUM('monthly','quarterly','yearly') NOT NULL DEFAULT 'monthly',
  summary_text VARCHAR(255) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES insurance_providers(id),
  INDEX idx_insurance_plans_provider_active (provider_id, active, plan_type)
);

CREATE TABLE insurance_subscriptions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  plan_id BIGINT UNSIGNED NOT NULL,
  policy_number VARCHAR(120) NOT NULL UNIQUE,
  starts_at DATETIME NOT NULL,
  next_due_at DATETIME NOT NULL,
  status ENUM('active','paused','cancelled','expired') NOT NULL DEFAULT 'active',
  auto_renew TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES insurance_plans(id),
  INDEX idx_insurance_subscriptions_user_status (user_id, status, next_due_at)
);

CREATE TABLE insurance_payment_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  subscription_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  status ENUM('due','paid','failed','grace') NOT NULL DEFAULT 'due',
  due_at DATETIME NOT NULL,
  paid_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscription_id) REFERENCES insurance_subscriptions(id),
  INDEX idx_insurance_payment_due_status (due_at, status)
);

CREATE TABLE insurance_commission_rules (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  provider_id BIGINT UNSIGNED NULL,
  commission_percent DECIMAL(6,3) NOT NULL DEFAULT 4.000,
  max_commission_percent DECIMAL(6,3) NOT NULL DEFAULT 6.000,
  applies_to ENUM('new_subscription','renewal','all') NOT NULL DEFAULT 'all',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES insurance_providers(id),
  INDEX idx_insurance_commission_rules_active (provider_id, applies_to, active)
);

CREATE TABLE insurance_commission_entries (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  subscription_id BIGINT UNSIGNED NOT NULL,
  payment_event_id BIGINT UNSIGNED NOT NULL,
  provider_id BIGINT UNSIGNED NOT NULL,
  commission_percent DECIMAL(6,3) NOT NULL,
  premium_amount DECIMAL(12,2) NOT NULL,
  commission_amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  billing_type ENUM('new_subscription','renewal') NOT NULL DEFAULT 'new_subscription',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscription_id) REFERENCES insurance_subscriptions(id),
  FOREIGN KEY (payment_event_id) REFERENCES insurance_payment_events(id),
  FOREIGN KEY (provider_id) REFERENCES insurance_providers(id),
  INDEX idx_insurance_commission_entries_subscription (subscription_id, created_at)
);

CREATE TABLE insurance_policy_links (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  provider_id BIGINT UNSIGNED NOT NULL,
  external_policy_number VARCHAR(120) NOT NULL,
  policy_holder_name VARCHAR(160) NULL,
  policy_type ENUM('life','health','funeral','student_cover','other') NOT NULL DEFAULT 'other',
  status ENUM('active','paused','expired','cancelled') NOT NULL DEFAULT 'active',
  next_due_at DATETIME NULL,
  last_synced_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (provider_id) REFERENCES insurance_providers(id),
  UNIQUE KEY uniq_policy_link (provider_id, external_policy_number),
  INDEX idx_policy_links_user_status (user_id, status, next_due_at)
);

CREATE TABLE insurance_jurisdiction_controls (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  country_code CHAR(2) NOT NULL UNIQUE,
  distribution_enabled TINYINT(1) NOT NULL DEFAULT 0,
  risk_level ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  legal_reviewed_at DATETIME NULL,
  legal_notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_insurance_jurisdiction_enabled_risk (distribution_enabled, risk_level)
);

CREATE TABLE trust_profiles (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  entity_type ENUM('seller','provider','courier','insurer') NOT NULL,
  entity_id BIGINT UNSIGNED NOT NULL,
  trust_score DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  delivery_success_rate DECIMAL(5,2) NULL,
  dispute_rate DECIMAL(5,2) NULL,
  verification_score DECIMAL(5,2) NULL,
  response_speed_score DECIMAL(5,2) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_trust_profile_entity (entity_type, entity_id),
  INDEX idx_trust_profiles_score (entity_type, trust_score)
);

CREATE TABLE user_reward_profiles (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  points_balance INT NOT NULL DEFAULT 0,
  current_tier ENUM('starter','campus_smart','campus_pro_saver') NOT NULL DEFAULT 'starter',
  safe_action_streak_weeks INT NOT NULL DEFAULT 0,
  last_activity_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_reward_profiles_tier_points (current_tier, points_balance)
);

CREATE TABLE reward_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  event_type ENUM('safe_purchase','booking_completed','on_time_subscription','referral','redeem') NOT NULL,
  points_delta INT NOT NULL,
  reference_type VARCHAR(60) NULL,
  reference_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_reward_events_user_time (user_id, created_at)
);

CREATE TABLE disclaimer_acceptance_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  context_type ENUM('marketplace_checkout','insurance_subscription','general') NOT NULL DEFAULT 'general',
  accepted TINYINT(1) NOT NULL DEFAULT 1,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  acceptance_text VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_disclaimer_acceptance_context_time (context_type, created_at)
);

CREATE TABLE campus_identity_profiles (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  campus_name VARCHAR(180) NOT NULL,
  student_verified TINYINT(1) NOT NULL DEFAULT 0,
  verification_method ENUM('email_domain','student_id','manual_review') NOT NULL DEFAULT 'manual_review',
  verification_status ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_campus_verification (campus_name, verification_status, student_verified)
);

CREATE TABLE trust_score_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  trust_profile_id BIGINT UNSIGNED NOT NULL,
  delta_score DECIMAL(6,2) NOT NULL,
  reason_code VARCHAR(80) NOT NULL,
  reason_text VARCHAR(255) NOT NULL,
  actor_type ENUM('system','admin','review') NOT NULL DEFAULT 'system',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trust_profile_id) REFERENCES trust_profiles(id),
  INDEX idx_trust_score_events_profile_time (trust_profile_id, created_at)
);

CREATE TABLE user_finance_profiles (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  monthly_budget DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  budget_currency CHAR(3) NOT NULL DEFAULT 'EUR',
  alert_threshold_percent DECIMAL(5,2) NOT NULL DEFAULT 80.00,
  savings_goal_amount DECIMAL(12,2) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE finance_spend_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  source_type ENUM('order','booking','insurance') NOT NULL,
  source_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_finance_spend_user_time (user_id, created_at)
);

CREATE TABLE chat_safety_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  conversation_id BIGINT UNSIGNED NULL,
  sender_user_id BIGINT UNSIGNED NULL,
  risk_level ENUM('low','medium','high') NOT NULL DEFAULT 'low',
  risk_score DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  matched_rules VARCHAR(255) NULL,
  message_excerpt VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  FOREIGN KEY (sender_user_id) REFERENCES users(id),
  INDEX idx_chat_safety_risk_time (risk_level, created_at)
);

CREATE TABLE crisis_mode_rules (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  country_code CHAR(2) NULL,
  category_id BIGINT UNSIGNED NULL,
  rule_name VARCHAR(180) NOT NULL,
  action_type ENUM('block','manual_review','limit_volume') NOT NULL DEFAULT 'manual_review',
  active TINYINT(1) NOT NULL DEFAULT 1,
  reason_text VARCHAR(255) NULL,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX idx_crisis_mode_active_scope (active, country_code, category_id)
);

CREATE TABLE ai_coach_profiles (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  coach_focus ENUM('weight_loss','weight_gain','muscle_gain','medical_support','general_fitness') NOT NULL DEFAULT 'general_fitness',
  goal_notes VARCHAR(255) NULL,
  baseline_weight_kg DECIMAL(6,2) NULL,
  target_weight_kg DECIMAL(6,2) NULL,
  daily_activity_goal VARCHAR(180) NULL,
  medication_tracking_enabled TINYINT(1) NOT NULL DEFAULT 0,
  health_risk_notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE medication_schedules (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  medication_name VARCHAR(140) NOT NULL,
  dosage_text VARCHAR(120) NOT NULL,
  schedule_type ENUM('daily','weekly','custom') NOT NULL DEFAULT 'daily',
  schedule_time VARCHAR(30) NOT NULL,
  instructions VARCHAR(255) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_medication_schedule_user_active (user_id, active)
);

CREATE TABLE health_checkin_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  checkin_type ENUM('weight','activity','symptom','medication_taken','wellbeing') NOT NULL,
  metric_value VARCHAR(120) NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_health_checkin_user_type_time (user_id, checkin_type, created_at)
);

CREATE TABLE wellbeing_alerts (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  country_code CHAR(2) NULL,
  audience ENUM('student','all_users') NOT NULL DEFAULT 'all_users',
  title VARCHAR(140) NOT NULL,
  message VARCHAR(255) NOT NULL,
  info_url VARCHAR(255) NULL,
  severity ENUM('info','important','urgent') NOT NULL DEFAULT 'info',
  active TINYINT(1) NOT NULL DEFAULT 1,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_wellbeing_alerts_active_window (active, starts_at, ends_at, severity)
);

CREATE TABLE service_providers (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  business_name VARCHAR(160) NOT NULL,
  service_type ENUM('hair','nails','makeup','barber','spa','other') NOT NULL DEFAULT 'other',
  country_code CHAR(2) NOT NULL,
  city VARCHAR(120) NULL,
  base_currency CHAR(3) NOT NULL DEFAULT 'EUR',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_service_provider_location (country_code, city, service_type, active)
);

CREATE TABLE service_offerings (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  provider_id BIGINT UNSIGNED NOT NULL,
  service_name VARCHAR(160) NOT NULL,
  duration_minutes INT NOT NULL,
  price_amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES service_providers(id),
  INDEX idx_service_offerings_provider_active (provider_id, active)
);

CREATE TABLE provider_availability_slots (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  provider_id BIGINT UNSIGNED NOT NULL,
  slot_start DATETIME NOT NULL,
  slot_end DATETIME NOT NULL,
  status ENUM('available','booked','blocked') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES service_providers(id),
  INDEX idx_slots_provider_time_status (provider_id, slot_start, status)
);

CREATE TABLE service_bookings (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  provider_id BIGINT UNSIGNED NOT NULL,
  client_user_id BIGINT UNSIGNED NOT NULL,
  service_offering_id BIGINT UNSIGNED NOT NULL,
  slot_id BIGINT UNSIGNED NOT NULL,
  subtotal_amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  booking_status ENUM('pending','confirmed','completed','cancelled','refunded','no_show') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES service_providers(id),
  FOREIGN KEY (client_user_id) REFERENCES users(id),
  FOREIGN KEY (service_offering_id) REFERENCES service_offerings(id),
  FOREIGN KEY (slot_id) REFERENCES provider_availability_slots(id),
  INDEX idx_bookings_provider_status_time (provider_id, booking_status, created_at)
);

CREATE TABLE provider_payouts (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  provider_id BIGINT UNSIGNED NOT NULL,
  source_type ENUM('order_sale','service_booking') NOT NULL,
  source_id BIGINT UNSIGNED NOT NULL,
  gross_amount DECIMAL(12,2) NOT NULL,
  platform_fee_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_withheld_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  net_payout_amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  payout_status ENUM('pending','ready','paid','on_hold') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at DATETIME NULL,
  FOREIGN KEY (provider_id) REFERENCES service_providers(id),
  INDEX idx_provider_payouts_status_time (payout_status, created_at)
);

CREATE TABLE shops (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(140) NOT NULL,
  slug VARCHAR(160) NOT NULL UNIQUE,
  description TEXT,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

CREATE TABLE categories (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL UNIQUE,
  legal_only TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE jurisdiction_rules (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  country_code CHAR(2) NOT NULL,
  state_region VARCHAR(120) NULL,
  city VARCHAR(120) NULL,
  product_category VARCHAR(120) NOT NULL,
  action ENUM('allow','restrict','ban','review_required') NOT NULL DEFAULT 'review_required',
  notes TEXT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jurisdiction_lookup (country_code, product_category, action, active)
);

CREATE TABLE compliance_checks (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NULL,
  product_id BIGINT UNSIGNED NULL,
  buyer_country CHAR(2) NOT NULL,
  seller_country CHAR(2) NOT NULL,
  result ENUM('pass','blocked','manual_review') NOT NULL,
  reason VARCHAR(255) NOT NULL,
  checked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_compliance_result_checked (result, checked_at)
);

CREATE TABLE products (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  shop_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  base_price DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  stock INT NOT NULL DEFAULT 1,
  origin_country CHAR(2) NOT NULL,
  status ENUM('draft','active','suspended','sold_out') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(id),
  FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX idx_products_category_country_price (category_id, origin_country, base_price)
);

CREATE TABLE product_images (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE seller_promotions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  shop_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  promo_type ENUM('discount','bundle','flash_sale','featured') NOT NULL DEFAULT 'featured',
  discount_percent DECIMAL(5,2) NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(id),
  INDEX idx_promotions_shop_active_dates (shop_id, active, starts_at, ends_at)
);

CREATE TABLE product_launches (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  shop_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  launch_title VARCHAR(180) NOT NULL,
  launch_message TEXT,
  launch_date DATETIME NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_launches_shop_active_date (shop_id, active, launch_date)
);

CREATE TABLE orders (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  buyer_user_id BIGINT UNSIGNED NOT NULL,
  seller_shop_id BIGINT UNSIGNED NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  markup_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  buyer_country CHAR(2) NOT NULL,
  status ENUM('pending','paid','processing','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'pending',
  delivered_at DATETIME NULL,
  return_window_expires_at DATETIME NULL,
  buyer_delivery_decision ENUM('pending','accepted','return_requested','refused') NOT NULL DEFAULT 'pending',
  seller_return_response ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_user_id) REFERENCES users(id),
  FOREIGN KEY (seller_shop_id) REFERENCES shops(id),
  INDEX idx_orders_buyer_status_created (buyer_user_id, status, created_at)
);

CREATE TABLE order_status_updates (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  status_code VARCHAR(80) NOT NULL,
  status_message VARCHAR(255) NOT NULL,
  actor_role ENUM('system','buyer','seller','courier','admin') NOT NULL DEFAULT 'system',
  notify_buyer TINYINT(1) NOT NULL DEFAULT 1,
  notify_seller TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  INDEX idx_order_updates_order_created (order_id, created_at)
);

CREATE TABLE return_requests (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  requested_by_user_id BIGINT UNSIGNED NOT NULL,
  request_type ENUM('return','refuse') NOT NULL,
  reason TEXT,
  evidence_url VARCHAR(500) NULL,
  status ENUM('pending','approved','rejected','closed') NOT NULL DEFAULT 'pending',
  resolved_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (requested_by_user_id) REFERENCES users(id),
  INDEX idx_return_requests_order_status (order_id, status)
);

CREATE TABLE order_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE payments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  approved_provider_id BIGINT UNSIGNED NULL,
  provider VARCHAR(80) NOT NULL,
  payment_method VARCHAR(80) NOT NULL,
  provider_reference VARCHAR(180) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  status ENUM('initiated','authorized','captured','failed','refunded') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  INDEX idx_payments_order_status_provider (order_id, status, provider)
);

CREATE TABLE shipments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  approved_partner_id BIGINT UNSIGNED NULL,
  courier VARCHAR(100) NOT NULL,
  shipping_method VARCHAR(100) NOT NULL,
  from_country CHAR(2) NOT NULL,
  to_country CHAR(2) NOT NULL,
  tracking_number VARCHAR(160),
  status ENUM('pending','label_created','in_transit','delivered','failed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  INDEX idx_shipments_order_status_tracking (order_id, status, tracking_number)
);

CREATE TABLE markup_rules (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  scope ENUM('global','category','country_route') NOT NULL,
  category_id BIGINT UNSIGNED NULL,
  from_country CHAR(2) NULL,
  to_country CHAR(2) NULL,
  percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  fixed_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  actor_user_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(180) NOT NULL,
  target_type VARCHAR(80) NOT NULL,
  target_id BIGINT UNSIGNED NULL,
  ip_address VARCHAR(45),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_user_id) REFERENCES users(id),
  INDEX idx_audit_actor_created (actor_user_id, created_at)
);

CREATE TABLE platform_risk_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  risk_focus ENUM('liquidity','trust','bad_debt','compliance','scaling','cac','logistics') NOT NULL,
  risk_signal VARCHAR(255) NULL,
  plan_headline VARCHAR(255) NOT NULL,
  score_delta INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_platform_risk_focus_time (risk_focus, created_at)
);

CREATE TABLE conversations (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NULL,
  buyer_user_id BIGINT UNSIGNED NOT NULL,
  seller_user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('active','closed','blocked') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (buyer_user_id) REFERENCES users(id),
  FOREIGN KEY (seller_user_id) REFERENCES users(id),
  INDEX idx_conversations_participants_status (buyer_user_id, seller_user_id, status)
);

CREATE TABLE conversation_messages (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  conversation_id BIGINT UNSIGNED NOT NULL,
  sender_user_id BIGINT UNSIGNED NOT NULL,
  message_text TEXT NOT NULL,
  contains_blocked_content TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  FOREIGN KEY (sender_user_id) REFERENCES users(id),
  INDEX idx_messages_conversation_created (conversation_id, created_at)
);

CREATE TABLE approved_payment_providers (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  provider_code VARCHAR(80) NOT NULL UNIQUE,
  provider_name VARCHAR(120) NOT NULL,
  pci_dss_compliant TINYINT(1) NOT NULL DEFAULT 1,
  supports_3ds TINYINT(1) NOT NULL DEFAULT 1,
  supports_tokenization TINYINT(1) NOT NULL DEFAULT 1,
  risk_scoring_enabled TINYINT(1) NOT NULL DEFAULT 1,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE approved_payment_provider_routes (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  provider_id BIGINT UNSIGNED NOT NULL,
  buyer_country CHAR(2) NOT NULL,
  seller_country CHAR(2) NOT NULL,
  currency CHAR(3) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES approved_payment_providers(id),
  UNIQUE KEY uniq_payment_route (provider_id, buyer_country, seller_country, currency)
);

CREATE TABLE approved_delivery_partners (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  partner_code VARCHAR(80) NOT NULL UNIQUE,
  partner_name VARCHAR(140) NOT NULL,
  tracking_enabled TINYINT(1) NOT NULL DEFAULT 1,
  proof_of_delivery_enabled TINYINT(1) NOT NULL DEFAULT 1,
  security_screening_enabled TINYINT(1) NOT NULL DEFAULT 1,
  reliability_score DECIMAL(5,2) NOT NULL DEFAULT 95.00,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE approved_delivery_partner_routes (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  partner_id BIGINT UNSIGNED NOT NULL,
  from_country CHAR(2) NOT NULL,
  to_country CHAR(2) NOT NULL,
  shipping_method VARCHAR(100) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES approved_delivery_partners(id),
  UNIQUE KEY uniq_delivery_route (partner_id, from_country, to_country, shipping_method)
);

ALTER TABLE payments
  ADD CONSTRAINT fk_payments_approved_provider
  FOREIGN KEY (approved_provider_id) REFERENCES approved_payment_providers(id);

ALTER TABLE shipments
  ADD CONSTRAINT fk_shipments_approved_partner
  FOREIGN KEY (approved_partner_id) REFERENCES approved_delivery_partners(id);

ALTER TABLE compliance_checks
  ADD CONSTRAINT fk_compliance_order
  FOREIGN KEY (order_id) REFERENCES orders(id);

ALTER TABLE compliance_checks
  ADD CONSTRAINT fk_compliance_product
  FOREIGN KEY (product_id) REFERENCES products(id);

INSERT INTO categories (name) VALUES
('Electronics'),
('Fashion'),
('Books'),
('Gaming');

INSERT INTO markup_rules (scope, percentage, fixed_fee, is_active)
VALUES ('global', 8.00, 0.00, 1);

INSERT INTO seller_subscription_plans (
  plan_code, plan_name, monthly_price, currency, listing_limit, boost_credits, analytics_enabled, priority_support, active
) VALUES
('STARTER', 'Starter Seller', 9.99, 'EUR', 100, 2, 1, 0, 1),
('PRO', 'Pro Seller', 29.99, 'EUR', 500, 10, 1, 1, 1),
('PREMIUM', 'Premium Seller', 79.99, 'EUR', NULL, 30, 1, 1, 1);

INSERT INTO listing_boost_packages (
  package_code, package_name, duration_days, placement_zone, price_amount, currency, active
) VALUES
('BOOST_3D_TOP', '3-Day Search Top Boost', 3, 'search_top', 12.00, 'EUR', 1),
('BOOST_7D_HOME', '7-Day Home Feed Boost', 7, 'home_feed', 25.00, 'EUR', 1),
('BOOST_14D_CAT', '14-Day Category Featured', 14, 'category_featured', 40.00, 'EUR', 1);

INSERT INTO insurance_providers (
  provider_name, provider_type, contact_email, website_url, legal_verified, active
) VALUES
('CampusLife Assurance', 'mixed', 'partner@campuslife.example', 'https://campuslife.example', 1, 1),
('WellNest Health Cover', 'health', 'connect@wellnest.example', 'https://wellnest.example', 1, 1);

INSERT INTO insurance_plans (
  provider_id, plan_name, plan_type, monthly_premium, currency, waiting_period_days, renewal_cycle, summary_text, active
)
SELECT id, 'Student Life Basic', 'life', 4.99, 'EUR', 14, 'monthly', 'Affordable life cover for students and young professionals.', 1
FROM insurance_providers
WHERE provider_name = 'CampusLife Assurance'
LIMIT 1;

INSERT INTO insurance_plans (
  provider_id, plan_name, plan_type, monthly_premium, currency, waiting_period_days, renewal_cycle, summary_text, active
)
SELECT id, 'Student Health Shield', 'health', 6.99, 'EUR', 7, 'monthly', 'Entry-level health support and tele-consult benefits.', 1
FROM insurance_providers
WHERE provider_name = 'WellNest Health Cover'
LIMIT 1;

INSERT INTO wellbeing_alerts (
  country_code, audience, title, message, info_url, severity, active, starts_at
) VALUES
(NULL, 'student', 'Mental Health Check-In', 'Take regular breaks, hydrate, and reach out for support when stressed.', 'https://www.who.int/health-topics/mental-health', 'info', 1, NOW()),
(NULL, 'all_users', 'Policy Safety Reminder', 'Review your insurance policy terms before payment due dates to avoid lapses.', NULL, 'important', 1, NOW());

INSERT INTO insurance_commission_rules (
  provider_id, commission_percent, max_commission_percent, applies_to, active
) VALUES
(NULL, 4.000, 6.000, 'all', 1);

INSERT INTO insurance_jurisdiction_controls (
  country_code, distribution_enabled, risk_level, legal_reviewed_at, legal_notes
) VALUES
('PL', 1, 'low', NOW(), 'Initial low-risk launch market with reviewed insurer distribution terms.');

INSERT INTO owner_auth_profiles (
  owner_email, password_hash, security_phrase_hash, mfa_required, active
) VALUES
('moyok367@gmail.com', 'SET_FROM_BACKEND_AT_DEPLOY_TIME', 'SET_FROM_BACKEND_AT_DEPLOY_TIME', 1, 1);

INSERT INTO approved_payment_providers (
  provider_code, provider_name, pci_dss_compliant, supports_3ds, supports_tokenization, risk_scoring_enabled, active
) VALUES
('STRIPE', 'Stripe', 1, 1, 1, 1, 1),
('ADYEN', 'Adyen', 1, 1, 1, 1, 1);

INSERT INTO approved_delivery_partners (
  partner_code, partner_name, tracking_enabled, proof_of_delivery_enabled, security_screening_enabled, reliability_score, active
) VALUES
('DHL', 'DHL Express', 1, 1, 1, 97.00, 1),
('FEDEX', 'FedEx', 1, 1, 1, 96.00, 1);

INSERT INTO approved_payment_provider_routes (provider_id, buyer_country, seller_country, currency, active)
SELECT id, 'ZA', 'PL', 'EUR', 1 FROM approved_payment_providers WHERE provider_code = 'STRIPE';

INSERT INTO approved_payment_provider_routes (provider_id, buyer_country, seller_country, currency, active)
SELECT id, 'KE', 'PL', 'EUR', 1 FROM approved_payment_providers WHERE provider_code = 'ADYEN';

INSERT INTO approved_delivery_partner_routes (partner_id, from_country, to_country, shipping_method, active)
SELECT id, 'PL', 'ZA', 'express', 1 FROM approved_delivery_partners WHERE partner_code = 'DHL';

INSERT INTO approved_delivery_partner_routes (partner_id, from_country, to_country, shipping_method, active)
SELECT id, 'PL', 'KE', 'priority', 1 FROM approved_delivery_partners WHERE partner_code = 'FEDEX';

INSERT INTO seller_promotions (
  shop_id, title, description, promo_type, discount_percent, starts_at, ends_at, active
)
SELECT id, 'Back to Campus Tech Week', 'Special pricing on student devices and accessories.', 'discount', 10.00, '2026-05-01 00:00:00', '2026-05-14 23:59:59', 1
FROM shops
ORDER BY id
LIMIT 1;
