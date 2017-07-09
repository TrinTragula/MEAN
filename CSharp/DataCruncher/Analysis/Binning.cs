using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataCruncher.Analysis
{
    public static class Binning
    {
        public static void Count(int[] data, string fileName, int binning)
        {
            var nCanali = data.Length / binning;
            var interval = data.Length / (double)nCanali;
            var i = 0;
            var result = new int[nCanali + 1];
            Array.Clear(result, 0, result.Length);
            foreach (var line in data)
            {
                if (i % 10000 == 0)
                    Console.WriteLine("Scrivo valore numero:" + i);
                var index = getChannel(i, 0, interval);
                result[index] += line;
                i++;
            }

            using (StreamWriter writetext = new StreamWriter(String.Format("{0}.txt", fileName)))
            {
                for (var j = 0; j < result.Length; j++)
                {
                    writetext.WriteLine("{0} {1}", j, result[j]);
                }
            }
        }

        private static int getChannel(int channel, int min, double interval)
        {
            return (int)Math.Floor((channel - min) / interval);
        }
    }
}
