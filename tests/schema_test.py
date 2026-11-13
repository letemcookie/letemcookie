import sqlite3,pathlib,unittest
class Schema(unittest.TestCase):
 def setUp(self):
  self.db=sqlite3.connect(':memory:');self.db.executescript(pathlib.Path('counter/schema.sql').read_text())
 def event(self,id,day='2026-10-15',hash='hash-a'):
  self.db.execute('INSERT OR IGNORE INTO events VALUES(?,?,?,?)',(id,day,hash,1))
 def test_dedup_and_uniques(self):
  self.event('a');self.event('a');self.event('b');self.event('c',hash='hash-b')
  self.assertEqual(self.db.execute('SELECT eaten FROM totals').fetchone()[0],3)
  self.assertEqual(self.db.execute('SELECT eaten,connections FROM daily').fetchone(),(3,2))
 def test_cap(self):
  for i in range(600):self.event(str(i))
  self.assertEqual(self.db.execute('SELECT eaten FROM totals').fetchone()[0],500)
 def miss(self,id,day='2026-10-15',hash='hash-a'):
  self.db.execute('INSERT OR IGNORE INTO missed_events VALUES(?,?,?,?)',(id,day,hash,1))
 def test_missed_dedup_and_totals(self):
  self.miss('a');self.miss('a');self.miss('b')
  self.assertEqual(self.db.execute('SELECT missed FROM totals').fetchone()[0],2)
  self.assertEqual(self.db.execute('SELECT eaten FROM totals').fetchone()[0],0)
 def test_missed_shares_daily_cap(self):
  for i in range(500):self.event(str(i))
  self.miss('over-cap')
  self.assertEqual(self.db.execute('SELECT missed FROM totals').fetchone()[0],0)
 def test_connections_counted_once_across_kinds(self):
  self.event('e1');self.miss('m1')
  self.assertEqual(self.db.execute('SELECT eaten,missed,connections FROM daily').fetchone(),(1,1,1))
 def test_missed_totals_survive_cleanup(self):
  self.miss('a');self.db.execute('DELETE FROM missed_events')
  self.assertEqual(self.db.execute('SELECT missed FROM totals').fetchone()[0],1)
 def test_totals_survive_cleanup(self):
  self.event('a');self.db.execute('DELETE FROM events');self.db.execute('DELETE FROM clients')
  self.assertEqual(self.db.execute('SELECT eaten FROM totals').fetchone()[0],1)
if __name__=='__main__':unittest.main()
