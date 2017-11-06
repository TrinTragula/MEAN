using MathNet.Numerics;
using MathNet.Numerics.LinearRegression;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataCruncher.Analysis
{
    public class CalibrationLine
    {
        public double Energy { get; set; }
        public double Area { get; set; }
        public double Centroid { get; set; }
    }

    public static class Calibration
    {
        public static void Calibrate (List<CalibrationLine> points)
        {
            double m = 0;
            double q = 0;

            var centroids = points.Select(x => x.Centroid).ToArray();
            var energies = points.Select(x => x.Energy).ToArray();
            var areas = points.Select(x => x.Area);
            var totalWeight = areas.Sum();
            var weights = areas.Select(x => x / totalWeight).ToArray();

            var fittedModel = Fit.PolynomialWeighted(centroids, energies, weights, 1);
            q = fittedModel[0];
            m = fittedModel[1];
            using (StreamWriter writetext = new StreamWriter(String.Format("data/{0}.calibration", "last")))
            {
                writetext.WriteLine("{0} {1}", q, m);
            }
        }
    }
}
