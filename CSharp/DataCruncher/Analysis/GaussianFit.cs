using MathNet.Numerics;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataCruncher.Analysis
{
    public class GaussianFit
    {
        public static void FitGaussian(int[] data, int[] peakData, int index, int window, string fileName)
        {
            var logData = data.Where((x, i) => i > peakData[index] - window && i < peakData[index] + window).Select(x => x != 0 ? Math.Log(x) : 0).ToArray();
            var xData = Enumerable.Range(peakData[index] - window, logData.Length).Select( x => (double) x).ToArray();
            double[] p = Fit.Polynomial(xData, logData, 2);
            var sigma = Math.Sqrt(-(1 / (p[2])));
            var centroid = -(p[1] / (2*p[2]));
            var area = Math.Pow(Math.E, (p[0] + (p[1] * p[1]) / 2.0));
            // Write them to a file
            using (StreamWriter writetext = new StreamWriter(String.Format("{0}_{1}_fitData.txt", fileName, index)))
            {
                writetext.WriteLine("{0}:{1}:{2}", area, centroid, sigma);
            }
            return;
        }
    }
}
