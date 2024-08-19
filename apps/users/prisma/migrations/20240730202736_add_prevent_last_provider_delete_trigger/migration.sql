-- CreateTrigger
CREATE OR REPLACE FUNCTION prevent_last_provider_delete() RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM "UsersProvider" WHERE "userLocalId" = OLD."userLocalId") = 1 THEN
    RAISE EXCEPTION 'Cannot delete last UsersProvider for a User';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_last_provider
BEFORE DELETE ON "UsersProvider"
FOR EACH ROW
EXECUTE FUNCTION prevent_last_provider_delete();
