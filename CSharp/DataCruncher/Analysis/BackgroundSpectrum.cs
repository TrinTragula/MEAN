using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataCruncher.Analysis
{
    public static class BackgroundSpectrum
    {
        public static void RemoveBackground(string fileName, Dictionary<long, int> data, Dictionary<long, int> bgData, long min, long max, int randomPoints = 100, int iterations = 10,
            long multiplier = 1)
        {
            if (!File.Exists(String.Format("{0}_bgt.txt", fileName)))
                PreviewBackground(fileName, data, bgData, min, max, randomPoints, iterations, multiplier: multiplier);
            File.Delete(String.Format("{0}.txt", fileName));
            File.Move(String.Format("{0}_bgt.txt", fileName), String.Format("{0}.txt", fileName));
            return;
        }

        public static void PreviewBackground(
            string fileName, Dictionary<long, int> trueData, Dictionary<long, int> bgData, long min, long max, int randomPoints = 100, int iterations = 10,
            long multiplier = 1)
        {
            // Il valore massimo sull'asse delle x
            var trueLength = trueData.Keys.Max();
            var minLength = trueData.Keys.Min();
            var points = GetBackground(bgData, (int)minLength, (int)trueLength, randomPoints, iterations, multiplier: multiplier);
            var cont = min;

            var previewData = trueData.ToDictionary(x => x.Key, x => 0);
            for (var i = 1; i < (points.Length); i++)
            {
                var bg = LinearInterpolation((int)points[i - 1], (int)points[i], bgData[points[i - 1]], bgData[points[i]]);

                var sectionData = trueData.Where(x => x.Key > points[i - 1] && x.Key <= points[i]).ToArray();
                foreach (var kp in sectionData)
                {
                    var lineBg = Math.Max(bg((int)kp.Key), 0);

                    previewData[kp.Key] = Math.Min(lineBg, trueData[kp.Key]);

                    var removedBg = trueData[kp.Key] - lineBg;

                    trueData[kp.Key] = removedBg > 0 ? removedBg : 0; //Se non si vuol che la linea vada sotto lo 0
                }
            }
            using (StreamWriter writetext = new StreamWriter(String.Format("{0}_bgpreview.txt", fileName)))
            {
                foreach (var kp in previewData)
                {
                    writetext.WriteLine("{0} {1}", (double)kp.Key / multiplier, kp.Value);
                }
            }
            using (StreamWriter writetext = new StreamWriter(String.Format("{0}_bgt.txt", fileName)))
            {
                foreach (var kp in trueData)
                {
                    writetext.WriteLine("{0} {1}", (double)kp.Key / multiplier, kp.Value);
                }
            }
            return;
        }

        private static long[] GetBackground(Dictionary<long, int> data, int min, int trueLength, int randomPoints, int iterations, long multiplier = 1)
        {
            var rnd = new Random();
            // I'll take n random points
            var points = Enumerable.Repeat(0, randomPoints).Select(x => (long)rnd.Next(min, trueLength)).ToArray();
            for (int i = 0; i < iterations; i++)
            {
                points = Iterate(data, min, trueLength, points);
            }
            Array.Sort(points);
            return points.Distinct().ToArray();
        }

        private static long[] Iterate(Dictionary<long, int> data, int min, int trueLength, long[] points)
        {
            var rnd = new Random();
            var movement = rnd.Next(1, Math.Max(1, (trueLength + Math.Abs(min)) / 100));
            var i = 0;
            foreach (var value in points)
            {
                var valueMinus = value - movement > min ? value - movement : min;
                var valuePlus = value + movement < trueLength ? value + movement : trueLength - 1;
                var minus = data[valueMinus];
                var plus = data[valuePlus];
                var old = data[value];
                if (minus < old || plus < old)
                {
                    if (minus <= plus)
                        points[i] = valueMinus;
                    else
                        points[i] = valuePlus;
                }
                i++;
            }
            return points;
        }

        /// <summary>
        /// Linear interpolation fot the x value given the extremes
        /// </summary>
        static public Func<int, int> LinearInterpolation(int x0, int x1, int y0, int y1)
        {
            if ((x1 - x0) == 0)
            {
                return (x => (y0 + y1) / 2);
            }
            return (x => y0 + (x - x0) * (y1 - y0) / (x1 - x0));
        }
    }
}
