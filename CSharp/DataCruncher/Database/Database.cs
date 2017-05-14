using System;
using System.Collections.Generic;
using System.Data.SQLite;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataCruncher.Cruncher
{
    class Database
    {
        public string DatabaseName { get; set; }
        public SQLiteConnection DbConnection { get; set; }

        public Database(string inDatabaseName, bool reset)
        {
            if (reset) SQLiteConnection.CreateFile(inDatabaseName + ".sqlite");
            DatabaseName = inDatabaseName;
            DbConnection = new SQLiteConnection("Data Source=" + inDatabaseName + ".sqlite;Version=3;");
            DbConnection.Open();
            if (reset)
            {
                //Dropping and recreating the table seems to be the quickest way to get old data removed
                System.Data.SQLite.SQLiteCommand command = new System.Data.SQLite.SQLiteCommand(DbConnection);
                command.CommandText = "DROP TABLE data";
                try
                {
                    command.ExecuteNonQuery();
                }
                catch { }
                command.CommandText = "CREATE TABLE data (channel INT, channel2 INT)";
                command.ExecuteNonQuery();
                command.CommandText = "CREATE INDEX IDLookup ON data(channel, channel2)";
                command.ExecuteNonQuery();
            }
            //Same for the others table I need
            System.Data.SQLite.SQLiteCommand command1 = new System.Data.SQLite.SQLiteCommand(DbConnection);
            command1.CommandText = "DROP TABLE matrix";
            try
            {
                command1.ExecuteNonQuery();
            }
            catch { }
            command1.CommandText = "CREATE TABLE matrix (channel INT, channel2 INT, count INT)";
            command1.ExecuteNonQuery();
            command1.CommandText = "CREATE INDEX IDMLookup ON matrix(channel, channel2, count)";
            command1.ExecuteNonQuery();

        }

        public int GetXMax(int xMin, int xMax)
        {
            string sqlMax = String.Format("SELECT MAX(channel) FROM data WHERE channel >= {0} AND channel <= {1}", xMin, xMax);
            SQLiteCommand command = new SQLiteCommand(sqlMax, DbConnection);
            var item = command.ExecuteScalar();
            return Convert.ToInt32(item);
        }

        public int GetXMin(int xMin, int xMax)
        {
            string sqlMin = String.Format("SELECT MIN(channel) FROM data WHERE channel >= {0} AND channel <= {1}", xMin, xMax);
            SQLiteCommand command = new SQLiteCommand(sqlMin, DbConnection);
            var item = command.ExecuteScalar();
            return Convert.ToInt32(item);
        }

        public int GetYMax(int xMin, int xMax)
        {
            string sqlMax = String.Format("SELECT MAX(channel2) FROM data WHERE channel2 >= {0} AND channel2 <= {1}", xMin, xMax);
            SQLiteCommand command = new SQLiteCommand(sqlMax, DbConnection);
            var item = command.ExecuteScalar();
            return Convert.ToInt32(item);
        }

        public int GetYMin(int xMin, int xMax)
        {
            string sqlMin = String.Format("SELECT MIN(channel2) FROM data WHERE channel2 >= {0} AND channel2 <= {1}", xMin, xMax);
            SQLiteCommand command = new SQLiteCommand(sqlMin, DbConnection);
            var item = command.ExecuteScalar();
            return Convert.ToInt32(item);
        }

        public int GetCount(int xMin, int xMax, int yMin, int yMax)
        {
            string sqlCount = String.Format("SELECT COUNT(channel) FROM data WHERE channel >= {0} AND channel <= {1} AND channel2 >= {2} AND channel2 <= {3}", xMin, xMax, yMin, yMax);
            SQLiteCommand command = new SQLiteCommand(sqlCount, DbConnection);
            var item = command.ExecuteScalar();
            var count = Convert.ToInt32(item);
            return count;
        }

        public void binCount(int nCanali, int xMin, int xMax, int yMin, int yMax)
        {
            string sql = String.Format("SELECT * FROM data WHERE channel >= {0} AND channel <= {1} AND channel2 >= {2} AND channel2 <= {3}", xMin, xMax, yMin, yMax);
            SQLiteCommand command = new SQLiteCommand(sql, DbConnection);
            SQLiteDataReader reader = command.ExecuteReader();

            string insertText = "INSERT INTO matrix (channel,channel2, count) values (@P0,@P1,@P2)";
            System.Data.SQLite.SQLiteCommand commandCreate = new System.Data.SQLite.SQLiteCommand(DbConnection);
            SQLiteTransaction trans = DbConnection.BeginTransaction();
            commandCreate.Transaction = trans;
            commandCreate.CommandText = insertText;

            var xChanMax = GetXMax(xMin, xMax);
            var xChanMin = GetXMin(xMin, xMax);
            var yChanMax = GetYMax(yMin, yMax);
            var yChanMin = GetYMin(yMin, yMax);
            var xInterval = (xChanMax - xChanMin) / (double)nCanali;
            var yInterval = (yChanMax - yChanMin) / (double)nCanali;
            var i = 0;
            var result = new int[nCanali + 1, nCanali + 1];
            Array.Clear(result, 0, result.Length);
            Stopwatch sw = new Stopwatch();
            sw.Start();
            while (reader.Read())
            {
                if (i % 10000 == 0)
                    Console.WriteLine("Scrivo valore numero:" + i);
                i++;
                var channel = (int)reader["channel"];
                var channel2 = (int)reader["channel2"];
                channel = getChannel(channel, xChanMin, xInterval);
                channel2 = getChannel(channel2, yChanMin, yInterval);
                result[channel, channel2] += 1;
            }
            using (StreamWriter writetext = new StreamWriter("result.txt"))
            {
                writetext.WriteLine("{0} {1} {2} {3}", xInterval, xChanMin, yInterval, yChanMin);
                for (var j = 0; j < result.GetLength(0); j++)
                {
                    for (var k = 0; k < result.GetLength(1); k++)
                    {
                        if (result[j, k] != 0 && k != 0)
                        {
                            writetext.WriteLine("{0} {1} {2}", j, k, result[j, k]);
                            commandCreate.Parameters.AddWithValue("@P0", j);
                            commandCreate.Parameters.AddWithValue("@P1", k);
                            commandCreate.Parameters.AddWithValue("@P2", result[j, k]);
                            commandCreate.ExecuteNonQuery();
                        }
                    }
                }
            }
            trans.Commit();
            sw.Stop();
            Console.WriteLine(sw.Elapsed.Minutes + "Min(s) " + sw.Elapsed.Seconds + "Sec(s)");
        }


        private static int getChannel(int channel, int min, double interval)
        {
            return (int)Math.Floor((channel - min) / interval);
        }

        public void InsertIntoDB(string path, string path1)
        {
            string insertText = "INSERT INTO data (channel,channel2) values (@P0,@P1)";
            System.Data.SQLite.SQLiteCommand command = new System.Data.SQLite.SQLiteCommand(DbConnection);
            SQLiteTransaction trans = DbConnection.BeginTransaction();
            command.Transaction = trans;

            command.CommandText = insertText;
            Stopwatch sw = new Stopwatch();
            sw.Start();
            if (!string.IsNullOrEmpty(path) && !string.IsNullOrEmpty(path1))
            {
                var i = 0;

                using (StreamReader sr = new StreamReader(path))
                {
                    using (StreamReader sr1 = new StreamReader(path1))
                    {
                        var line = sr.ReadLine();
                        var line1 = sr1.ReadLine();
                        while (sr.Peek() >= 0 && sr1.Peek() >= 0)
                        {
                            var timeStamp = Decimal.Parse(line.Split(' ')[0]);
                            var value = Int32.Parse(line.Split(' ')[1]);
                            var timeStamp1 = Decimal.Parse(line1.Split(' ')[0]);
                            var value1 = Int32.Parse(line1.Split(' ')[1]);

                            // if there is a coincidence, I save it
                            if (Math.Abs(timeStamp - timeStamp1) <= 5)
                            {
                                //Console.WriteLine("Coincidence spotted: {timeStamp} - {value} : {timeStamp1}: {value1}");
                                if (value != -1 && value1 != -1 && (value != 0 || value1 != 0))
                                {
                                    command.Parameters.AddWithValue("@P0", value);
                                    command.Parameters.AddWithValue("@P1", value1);
                                    command.ExecuteNonQuery();
                                }
                            }
                            // I decide which file to progress
                            if (timeStamp == timeStamp1)
                            {
                                line = sr.ReadLine();
                                line1 = sr1.ReadLine();
                            }
                            else if (timeStamp < timeStamp1)
                            {
                                line = sr.ReadLine();
                            }
                            else if (timeStamp > timeStamp1)
                            {
                                line1 = sr1.ReadLine();
                            }
                            if (i % 1000000 == 0)
                                Console.WriteLine("Scrivo valore numero:" + i + " --- " + line.Split(' ')[0] + ":" + line.Split(' ')[1]);
                            i++;

                        }
                    }
                }
            }
            trans.Commit();
            sw.Stop();
            Console.WriteLine(sw.Elapsed.Minutes + "Min(s) " + sw.Elapsed.Seconds + "Sec(s)");
        }

        public void Close()
        {
            DbConnection.Close();
        }

    }
}
