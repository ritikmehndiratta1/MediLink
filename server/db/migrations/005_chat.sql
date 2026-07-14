-- Contextual chat: a conversation is always anchored to a specific
-- (retailer, wholesaler, medicine) triple, started by the retailer from a
-- search result, so threads stay organized instead of becoming a generic
-- inbox. The unique constraint means re-contacting about the same medicine
-- reopens the existing thread rather than spawning a duplicate.

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    retailer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wholesaler_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE (retailer_id, wholesaler_id, medicine_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_retailer ON conversations(retailer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_wholesaler ON conversations(wholesaler_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
