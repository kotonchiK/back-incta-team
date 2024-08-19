-- CreateOrReplaceFunction
CREATE OR REPLACE FUNCTION prevent_last_provider_delete() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF NOT EXISTS (
      SELECT 1 FROM "UsersProvider" 
      WHERE "userLocalId" = OLD."userLocalId" 
      AND id != OLD.id
    ) THEN
      DELETE FROM "User" WHERE id = OLD."userLocalId";
      RETURN OLD;
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- DropTrigger
DROP TRIGGER IF EXISTS check_last_provider ON "UsersProvider";

-- CreateTrigger
CREATE TRIGGER check_last_provider
BEFORE DELETE ON "UsersProvider"
FOR EACH ROW
EXECUTE FUNCTION prevent_last_provider_delete();
