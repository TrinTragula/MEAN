using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataCruncher.Cruncher
{
    class Cruncher
    {
        public static int[] BinCount(string path, int nCanali)
        {
            int max = 0, min = Int32.MaxValue;

            var list = getMaxMin(path);
            Console.WriteLine("Got max and min");
            min = list[0];
            max = list[1];
            double interval = (max - min) / (double)nCanali;
            var data = countAndAssign(path, nCanali, min, max, interval);
            Console.WriteLine("Got all");
            return data;
        }

        private static List<int> getMaxMin(string path)
        {
            int max = 0, min = Int32.MaxValue;
            List<int> result = new List<int>();
            if (!string.IsNullOrEmpty(path))
            {
                using (StreamReader sr = new StreamReader(path))
                {
                    String line;
                    while ((line = sr.ReadLine()) != null)
                    {
                        try
                        {
                            var value = Int32.Parse(line.Split(' ')[1]);
                            if (value > max) max = value;
                            if (value < min) min = value;
                        }
                        catch
                        {
                            continue;
                        }
                    }
                }
            }
            result.Add(max);
            result.Add(min);
            return result;
        }

        private static int getChannel(int energy, int nCanali, int minEnergy, int maxEnergy, double interval)
        {
            return (int)Math.Floor((energy - minEnergy) / interval);
        }
        private static int[] countAndAssign(string path, int nCanali, int minEnergy, int maxEnergy, double interval)
        {
            int[] result = new int[nCanali];
            Array.Clear(result, 0, nCanali);
            if (!string.IsNullOrEmpty(path))
            {
                using (StreamReader sr = new StreamReader(path))
                {
                    string line;
                    while ((line = sr.ReadLine()) != null)
                    {
                        try
                        {
                            var value = Int32.Parse(line.Split(' ')[1]);
                            if (value == -1) value = 0;
                            var channel = getChannel(value, nCanali, minEnergy, maxEnergy, interval);
                            result[channel] += 1;
                        }
                        catch
                        {
                            continue;
                        }
                    }
                }
            }

            return result;
        }

        public static int[] BufferBinCount(string path, int nCanali)
        {
            int max = 0, min = Int32.MaxValue;

            var list = BufferGetMaxMin(path);
            Console.WriteLine("Got max and min");
            min = list[0];
            max = list[1];
            double interval = (max - min) / (double)nCanali;
            var data = BufferCountAndAssign(path, nCanali, min, max, interval);
            Console.WriteLine("Got all");
            return data;
        }

        private static List<int> BufferGetMaxMin(string path)
        {
            int max = 0, min = Int32.MaxValue;
            List<int> result = new List<int>();
            if (!string.IsNullOrEmpty(path))
            {
                using (FileStream fs = File.Open(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                using (BufferedStream bs = new BufferedStream(fs))
                using (StreamReader sr = new StreamReader(bs))
                {
                    string line;
                    while ((line = sr.ReadLine()) != null)
                    {
                        try
                        {
                            var value = Int32.Parse(line.Split(' ')[1]);
                            if (value > max) max = value;
                            if (value < min) min = value;
                        }
                        catch
                        {
                            continue;
                        }
                    }
                }
            }
            result.Add(max);
            result.Add(min);
            return result;
        }


        private static int[] BufferCountAndAssign(string path, int nCanali, int minEnergy, int maxEnergy, double interval)
        {
            int[] result = new int[nCanali];
            Array.Clear(result, 0, nCanali);
            if (!string.IsNullOrEmpty(path))
            {
                using (FileStream fs = File.Open(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                using (BufferedStream bs = new BufferedStream(fs))
                using (StreamReader sr = new StreamReader(bs))
                {
                    string line;
                    while ((line = sr.ReadLine()) != null)
                    {
                        try
                        {
                            var value = Int32.Parse(line.Split(' ')[1]);
                            if (value == -1) value = 0;
                            var channel = getChannel(value, nCanali, minEnergy, maxEnergy, interval);
                            result[channel] += 1;
                        }
                        catch
                        {
                            continue;
                        }
                    }
                }
            }

            return result;
        }
        public static void BufferExport(string path, string inDB)
        {
            var db = new Database(inDB);
            if (!string.IsNullOrEmpty(path))
            {
                var i = 0;
                foreach (var line in File.ReadLines(path))
                {
                    try
                    {
                        var timeStamp = Decimal.Parse(line.Split(' ')[0]);
                        var value = Int32.Parse(line.Split(' ')[1]);
                        db.InsertIntoDB(timeStamp, value);
                        if (i % 1000 == 0)
                            Console.WriteLine("Scrivo valore numero:" + i + " --- " + line.Split(' ')[0] + ":" + line.Split(' ')[1]);
                        i++;
                    }
                    catch
                    {
                        continue;
                    }
                }
            }
        }
    }
}

