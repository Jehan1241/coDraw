-- 1. Table for User Accounts (Authentication) - NO CHANGE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table for Whiteboard Metadata - UPDATED
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE, 
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table for Permissions (For explicit user invites) - NO CHANGE
CREATE TABLE IF NOT EXISTS board_permissions (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, board_id)
);

-- 4. Table for Hocuspocus/Y.js Document Storage - NO CHANGE
CREATE TABLE IF NOT EXISTS yjs_docs (
  name UUID PRIMARY KEY NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  data BYTEA NOT NULL
);