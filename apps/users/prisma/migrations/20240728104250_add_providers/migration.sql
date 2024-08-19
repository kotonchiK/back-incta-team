INSERT INTO "Provider" (id, name, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'local', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'google', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'github', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
