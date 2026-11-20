-- Change privilegios-confianza (3c-2): promotions and role changes are recorded
-- in the moderation history.
ALTER TYPE "ModerationEventAction" ADD VALUE 'ROLE_CHANGED';
