using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataCruncher.Analysis
{
    public static class Background
    {
        public static void RemoveBackground(string fileName, int[] data, int randomPoints = 100, int iterations = 10)
        {
            if (!File.Exists(String.Format("{0}_bgt.txt", fileName)))
                PreviewBackground(fileName, data, randomPoints, iterations);
            File.Delete(String.Format("{0}.txt", fileName));
            File.Move(String.Format("{0}_bgt.txt", fileName), String.Format("{0}.txt", fileName));
            return;
        }

        public static void PreviewBackground(string fileName, int[] data, int randomPoints = 100, int iterations = 10)
        {
            var points = GetBackground(data, randomPoints, iterations);
            var previewData = data.Select(x => 0).ToArray();
            for (var i = 1; i < (points.Length); i++)
            {
                var bg = LinearInterpolation(points[i - 1], points[i], data[points[i - 1]], data[points[i]]);
                for (var j = points[i - 1]; j < points[i]; j++)
                {
                    //var lineBg = Math.Abs(bg(j));
                    var lineBg = Math.Max(bg(j), 0);
                    previewData[j] = Math.Min(lineBg, data[j]);

                    //var removedBg = data[j] - Math.Abs(bg(j));
                    var removedBg = data[j] - Math.Max(bg(j), 0);
                    data[j] = removedBg > 0 ? removedBg : 0; //Se non si vuol che la linea vada sotto lo 0
                }
            }
            using (StreamWriter writetext = new StreamWriter(String.Format("{0}_bgpreview.txt", fileName)))
            {
                for (var j = 0; j < previewData.Length; j++)
                {
                    writetext.WriteLine("{0} {1}", j, previewData[j]);
                }
            }
            using (StreamWriter writetext = new StreamWriter(String.Format("{0}_bgt.txt", fileName)))
            {
                for (var j = 0; j < data.Length; j++)
                {
                    writetext.WriteLine("{0} {1}", j, data[j]);
                }
            }
            return;
        }

        private static int[] GetBackground(int[] data, int randomPoints, int iterations)
        {
            var rnd = new Random();
            // I'll take n random points
            var points = Enumerable.Repeat(0, randomPoints).Select(x => rnd.Next(data.Length)).ToArray();
            for (int i = 0; i < iterations; i++)
            {
                points = Iterate(data, points);
            }
            Array.Sort(points);
            return points.Distinct().ToArray();
        }

        private static int[] Iterate(int[] data, int[] points)
        {
            var rnd = new Random();
            var movement = rnd.Next(1, Math.Max(1, data.Length / 100));
            var i = 0;
            foreach (var value in points)
            {
                var valueMinus = value - movement > 0 ? value - movement : 0;
                var valuePlus = value + movement < data.Length ? value + movement : data.Length - 1;
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
