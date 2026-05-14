-- YegnaFarm AI — PostgreSQL schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('farmer', 'expert', 'admin');
CREATE TYPE question_status AS ENUM ('pending', 'answered', 'closed');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'farmer',
  region VARCHAR(100),
  verified_expert BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE guide_families (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE guide_keyword_qa (
  id SERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  response TEXT NOT NULL
);

CREATE TABLE guide_details (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE guide_keyword_routes (
  id SERIAL PRIMARY KEY,
  keyword TEXT NOT NULL UNIQUE,
  guide_slug TEXT NOT NULL REFERENCES guide_details (slug) ON DELETE CASCADE
);

CREATE TABLE farmer_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES users (id) ON DELETE SET NULL,
  guest_name VARCHAR(255),
  body TEXT NOT NULL,
  crop_hint VARCHAR(100),
  status question_status NOT NULL DEFAULT 'pending',
  assigned_expert_id UUID REFERENCES users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  answered_at TIMESTAMPTZ
);

CREATE TABLE expert_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES farmer_questions (id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES users (id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE answer_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID NOT NULL REFERENCES expert_answers (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  stars SMALLINT NOT NULL CHECK (stars >= 1 AND stars <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (answer_id, user_id)
);

CREATE TABLE market_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES users (id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'ETB',
  location TEXT NOT NULL,
  region VARCHAR(100),
  type VARCHAR(32) NOT NULL DEFAULT 'crops',
  image_url TEXT,
  phone TEXT,
  whatsapp TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_response_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  response TEXT NOT NULL,
  model VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_prompt_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  prompt_version VARCHAR(16) NOT NULL DEFAULT 'v2.1',
  event_ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  region VARCHAR(100),
  season VARCHAR(32),
  source VARCHAR(64),
  used_openai BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_farmer_questions_status ON farmer_questions (status);
CREATE INDEX idx_farmer_questions_created ON farmer_questions (created_at DESC);
CREATE INDEX idx_market_products_active ON market_products (active);
CREATE INDEX idx_market_products_region ON market_products (region);
CREATE INDEX idx_market_products_location ON market_products (location);
CREATE INDEX idx_market_products_type ON market_products (type);
CREATE INDEX idx_ai_prompt_logs_event_ts ON ai_prompt_logs (event_ts DESC);
