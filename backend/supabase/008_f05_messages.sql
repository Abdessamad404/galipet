-- ============================================================
-- Migration 008 — F05 Messagerie
-- ============================================================

-- Une conversation lie un owner et un pro (unique pair)
CREATE TABLE conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pro_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Une seule conversation par pair owner↔pro
  CONSTRAINT conversations_pair_unique UNIQUE (owner_id, pro_id)
);

CREATE INDEX idx_conversations_owner ON conversations(owner_id);
CREATE INDEX idx_conversations_pro   ON conversations(pro_id);

-- Messages d'une conversation
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content         TEXT NOT NULL CHECK (char_length(content) > 0),
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender       ON messages(sender_id);

-- Mise à jour auto de updated_at sur conversations à chaque nouveau message
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_message_update_conversation
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;

-- Conversations : seuls owner et pro peuvent voir/créer
CREATE POLICY "Participants voient leurs conversations" ON conversations
  FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = pro_id);

CREATE POLICY "Owner ou pro peut créer une conversation" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = owner_id OR auth.uid() = pro_id);

-- Messages : seuls les participants de la conversation peuvent lire/écrire
CREATE POLICY "Participants lisent les messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.owner_id = auth.uid() OR c.pro_id = auth.uid())
    )
  );

CREATE POLICY "Participant peut envoyer un message" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.owner_id = auth.uid() OR c.pro_id = auth.uid())
    )
  );

CREATE POLICY "Destinataire peut marquer lu" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.owner_id = auth.uid() OR c.pro_id = auth.uid())
    )
  );

-- Activer Realtime sur messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
