using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataCruncher.Analysis
{
    public static class Peaks
    {
        public static void GetPeaks(string fileName, int[] data, int epsilon, int treshold)
        {
            // Get points
            var maxPoint = LocalMaxima(data.Skip(2).ToArray(), epsilon, treshold).ToArray();
            // Write them to a file
            using (StreamWriter writetext = new StreamWriter(String.Format("{0}.txt", fileName)))
            {
                for (var j = 2; j < maxPoint.Length; j++)
                {
                    writetext.WriteLine("{0} {1}", maxPoint[j].Item1, maxPoint[j].Item2);
                }
            }
            return;
        }

        /// <summary>
        /// A function to get the peaks from a set of data
        /// </summary>
        /// <param name="source"> Data </param>
        /// <param name="windowSize"> Width of the peak window </param>
        /// <param name="treshold"> Minimum value for the peak not to be considered noise </param>
        public static IEnumerable<Tuple<int, int>> LocalMaxima(IEnumerable<int> source, int windowSize, int treshold)
        {
            // Round up to nearest odd value
            windowSize = windowSize - windowSize % 2 + 1;
            int halfWindow = windowSize / 2;

            int index = 0;
            var before = new Queue<int>(Enumerable.Repeat(int.MinValue, halfWindow));
            var after = new Queue<int>(source.Take(halfWindow + 1));

            foreach (int d in source.Skip(halfWindow + 1).Concat(Enumerable.Repeat(int.MinValue, halfWindow + 1)))
            {
                int curVal = after.Dequeue();
                if (before.All(x => curVal > x) && after.All(x => curVal >= x) && curVal > treshold)
                {
                    yield return Tuple.Create(index, curVal);
                }

                before.Dequeue();
                before.Enqueue(curVal);
                after.Enqueue(d);
                index++;
            }
        }
    }
}
