-- Support ticket system backing the "Query" page.
-- Open to guests as well as logged-in users, so account-verification issues
-- can be reported before someone even has a working login.

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,

    category TEXT NOT NULL CHECK (category IN ('TECHNICAL', 'VERIFICATION', 'ABUSE', 'OTHER')),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
