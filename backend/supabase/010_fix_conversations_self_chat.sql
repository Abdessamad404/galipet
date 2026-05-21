-- Remove any existing self-chat rows before adding the constraint
DELETE FROM conversations WHERE owner_id = pro_id;

-- Prevent a user from creating a conversation with themselves
ALTER TABLE conversations
  ADD CONSTRAINT conversations_no_self_chat CHECK (owner_id <> pro_id);
