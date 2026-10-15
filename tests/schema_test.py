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
 def test_totals_survive_cleanup(self):
  self.event('a');self.db.execute('DELETE FROM events');self.db.execute('DELETE FROM clients')
  self.assertEqual(self.db.execute('SELECT eaten FROM totals').fetchone()[0],1)
if __name__=='__main__':unittest.main()
