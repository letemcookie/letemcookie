-- One-time migration for the live D1 database created before missed-banner counting.
-- Fresh databases get all of this from schema.sql instead.
ALTER TABLE totals ADD COLUMN missed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE daily ADD COLUMN missed INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS missed_events (id TEXT PRIMARY KEY, day TEXT NOT NULL, hash TEXT NOT NULL, received INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS missed_events_received ON missed_events(received);
CREATE TRIGGER IF NOT EXISTS cap_missed_event BEFORE INSERT ON missed_events
WHEN COALESCE((SELECT eaten FROM clients WHERE day=NEW.day AND hash=NEW.hash),0)>=500
BEGIN SELECT RAISE(IGNORE); END;
CREATE TRIGGER IF NOT EXISTS count_missed_event AFTER INSERT ON missed_events BEGIN
  UPDATE totals SET missed=missed+1 WHERE id=1;
  INSERT INTO daily(day,eaten,connections,missed) VALUES(NEW.day,0,1,1)
  ON CONFLICT(day) DO UPDATE SET missed=missed+1,connections=connections+CASE WHEN EXISTS(SELECT 1 FROM clients WHERE day=NEW.day AND hash=NEW.hash) THEN 0 ELSE 1 END;
  INSERT INTO clients(day,hash,eaten) VALUES(NEW.day,NEW.hash,1)
  ON CONFLICT(day,hash) DO UPDATE SET eaten=eaten+1;
END;
