using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataCruncher.Cruncher;
using System.Globalization;
using System.Threading;
using System.Diagnostics;
using System.IO;
using DataCruncher.Analysis;

namespace DataCruncher
{
    class Program
    {
        static void Main(string[] args)
        {
            CultureInfo ci = new CultureInfo("en-US");
            Thread.CurrentThread.CurrentCulture = ci;
            Thread.CurrentThread.CurrentUICulture = ci;
            // Argomenti di input
            var mode = args.Length < 1 ? "peaksSpectrum" : args[0];
            if (mode == "matrix") Matrix(args);
            if (mode == "gate") Gate(args);
            if (mode == "previewBackground") RemoveBackground(args, true);
            if (mode == "background") RemoveBackground(args);
            if (mode == "peaks") GetPeaks(args);
            if (mode == "binning") BinCount(args);
            if (mode == "fit-peak") FitPeak(args);
            if (mode == "calibrate") Calibrate(args);
            if (mode == "substitute") SubstituteCalibration(args);
            if (mode == "previewBackgroundSpectrum") RemoveSpectrumBackground(args, true);
            if (mode == "backgroundSpectrum") RemoveSpectrumBackground(args);
            if (mode == "peaksSpectrum") GetPeaksSpectrum(args);



            Console.WriteLine("Done!");
#if DEBUG
            Console.ReadLine();
#endif
        }

        static void Matrix(string[] args)
        {
            var nCanaliX = args.Length < 2 ? 1000 : Int32.Parse(args[1]);
            var nCanaliY = args.Length < 3 ? 1000 : Int32.Parse(args[2]);
            var file1 = args.Length < 4 ? null : args[3];
            var file2 = args.Length < 5 ? null : args[4];
            var xMin = args.Length < 6 ? 0 : Int32.Parse(args[5]);
            var xMax = args.Length < 7 ? int.MaxValue : Int32.Parse(args[6]);
            var yMin = args.Length < 8 ? 0 : Int32.Parse(args[7]);
            var yMax = args.Length < 9 ? int.MaxValue : Int32.Parse(args[8]);
            var overwrite = args.Length < 10 ? false : Boolean.Parse(args[9]);
            var window = args.Length < 11 ? 5 : Int32.Parse(args[10]);


            //Creo o riutilizzo il database
            Database db = new Database("coincidenze_vere", overwrite);

            //Esporto i file se necessario
            if (overwrite && !String.IsNullOrEmpty(file1) && !String.IsNullOrEmpty(file2)) db.InsertIntoDB(file1, file2, window);

            //Salvo il risultato
            db.binCount(nCanaliX, nCanaliY, xMin, xMax, yMin, yMax);

            //Finito
            db.Close();
        }

        public static void Gate(string[] args)
        {
            var axis = args.Length < 2 ? "x" : args[1];
            var left = args.Length < 3 ? 0 : Int32.Parse(args[2]);
            var right = args.Length < 4 ? int.MaxValue : Int32.Parse(args[3]);
            var nCanali = args.Length < 5 ? 1000 : Int32.Parse(args[4]);

            //Creo o riutilizzo il database
            Database db = new Database("coincidenze_vere", false);

            //Salvo il risultato
            db.GateCount(axis, left, right, nCanali);

            //Finito
            db.Close();
        }

        public static void RemoveBackground(string[] args, bool preview = false)
        {
            var fileName = args.Length < 2 ? "data/xResult" : args[1];
            var randomPoints = args.Length < 3 ? 100 : Int32.Parse(args[2]);
            var iterations = args.Length < 4 ? 10 : Int32.Parse(args[3]);
            string[] lines = File.ReadAllLines(String.Format("{0}.txt", fileName));
            var data = lines.Aggregate(new List<int>(), (p, c) =>
            {
                var value = Int32.Parse(c.Split(' ')[1]);
                p.Add(value);
                return p;
            }).ToArray();

            if (preview)
                Background.PreviewBackground(fileName, data, randomPoints, iterations);
            else
                Background.RemoveBackground(fileName, data, randomPoints, iterations);

            return;
        }

        public static void RemoveSpectrumBackground(string[] args, bool preview = false)
        {
            var fileName = args.Length < 2 ? "data/spectrum" : args[1];
            var randomPoints = args.Length < 3 ? 1024 : Int32.Parse(args[2]);
            var iterations = args.Length < 4 ? 10 : Int32.Parse(args[3]);
            string[] lines = File.ReadAllLines(String.Format("{0}.txt", fileName));
            var maxDecimals = 0;
            var xData = lines.Select(x =>
               {
                   var splitted = x.Split(' ');
                   if (splitted != null && splitted[0] != null)
                   {
                       double value = 0;
                       var parti = splitted[0].Split('.');
                       if (parti != null && parti.Length == 2)
                       {
                           var mantissa = parti[1];
                           var lunghezza = mantissa.Length;
                           maxDecimals = Math.Max(lunghezza, maxDecimals);
                       }

                       if (Double.TryParse(splitted[0], out value))
                       {
                           return value;
                       }
                   }
                   return 0;
               }).ToList();

            var multiplier = (long)Math.Pow(10, maxDecimals);

            List<long> realXData = xData.Select(x =>
           {
               long value = (long)(x * multiplier);
               return value;
           }).ToList();

            var yDataDict = lines.Aggregate(new Dictionary<long, int>(), (p, c) =>
            {
                var x = (long)(Double.Parse(c.Split(' ')[0]) * multiplier);
                var value = Int32.Parse(c.Split(' ')[1]);
                p.Add(x, value);
                return p;
            });

            var min = realXData.Min();
            var max = realXData.Max();
            var bgData = new Dictionary<long, int>();
            int lastValue = 0;
            for (long i = min; i <= max; i++)
            {
                if (yDataDict.ContainsKey(i))
                {
                    lastValue = yDataDict[i];
                }
                bgData.Add(i, lastValue);
            }

            if (preview)
                BackgroundSpectrum.PreviewBackground(fileName, yDataDict, bgData, min, max, randomPoints, iterations, multiplier: multiplier);
            else
                BackgroundSpectrum.RemoveBackground(fileName, yDataDict, bgData, min, max, randomPoints, iterations, multiplier: multiplier);

            return;
        }

        public static void GetPeaks(string[] args)
        {
            var fileName = args.Length < 2 ? "data/xResult" : args[1];
            var epsilon = args.Length < 3 ? 50 : Int32.Parse(args[2]);
            var treshold = args.Length < 4 ? 300 : Int32.Parse(args[3]);

            string[] lines = File.ReadAllLines(String.Format("{0}.txt", fileName));
            var data = lines.Aggregate(new List<int>(), (p, c) =>
            {
                var value = Int32.Parse(c.Split(' ')[1]);
                p.Add(value);
                return p;
            }).ToArray();


            var peaksFile = String.Format("{0}_peaks", fileName);
            Peaks.GetPeaks(peaksFile, data, epsilon, treshold);

            return;
        }

        public static void GetPeaksSpectrum(string[] args)
        {
            var fileName = args.Length < 2 ? "D:\\Download\\60Co" : args[1];
            var epsilon = args.Length < 3 ? 50 : Int32.Parse(args[2]);
            var treshold = args.Length < 4 ? 300 : Int32.Parse(args[3]);

            string[] lines = File.ReadAllLines(String.Format("{0}.txt", fileName));
            var maxDecimals = 0;
            var xData = lines.Select(x =>
            {
                var splitted = x.Split(' ');
                if (splitted != null && splitted[0] != null)
                {
                    double value = 0;
                    var parti = splitted[0].Split('.');
                    if (parti != null && parti.Length == 2)
                    {
                        var mantissa = parti[1];
                        var lunghezza = mantissa.Length;
                        maxDecimals = Math.Max(lunghezza, maxDecimals);
                    }

                    if (Double.TryParse(splitted[0], out value))
                    {
                        return value;
                    }
                }
                return 0;
            }).ToList();

            var multiplier = Math.Pow(10, maxDecimals);

            int[] realXData = xData.Select(x =>
            {
                var value = (int)(x * multiplier);
                return value;
            }).ToArray();

            var yDataDict = lines.Aggregate(new Dictionary<int, int>(), (p, c) =>
            {
                var x = (int)(Double.Parse(c.Split(' ')[0]) * multiplier);
                var value = Int32.Parse(c.Split(' ')[1]);
                p.Add(x, value);
                return p;
            });

            var min = realXData.Min();
            var max = realXData.Max();
            var peaksData = new List<int>();
            for (int i = min; i <= max; i++)
            {
                if (yDataDict.ContainsKey(i))
                {
                    peaksData.Add(yDataDict[i]);
                }
                else
                {
                    peaksData.Add(0);
                }
            }

            var peaksFile = String.Format("{0}_peaks", fileName);
            PeaksSpectrum.GetPeaks(peaksFile, peaksData.ToArray(), epsilon, treshold, (int)multiplier);

            return;
        }

        public static void BinCount(string[] args)
        {
            var fileName = args.Length < 2 ? "data/xResult" : args[1];
            var binning = args.Length < 3 ? 2 : Int32.Parse(args[2]);

            string[] lines = File.ReadAllLines(String.Format("{0}.txt", fileName));
            var data = lines.Aggregate(new List<int>(), (p, c) =>
            {
                var value = Int32.Parse(c.Split(' ')[1]);
                p.Add(value);
                return p;
            }).ToArray();

            Binning.Count(data, fileName, binning);

            return;
        }


        /// <summary>
        /// Obsoleto, per fortuna
        /// </summary>
        /// <param name="args"></param>
        public static void FitPeak(string[] args)
        {
            var fileName = args.Length < 2 ? "data/calibrating" : args[1];
            var peaksFileName = args.Length < 3 ? "data/calibrating_peaks" : args[2];
            var index = args.Length < 4 ? 0 : Int32.Parse(args[3]);
            var window = args.Length < 5 ? 10 : Int32.Parse(args[4]);

            string[] lines = File.ReadAllLines(String.Format("{0}.txt", fileName));
            var data = lines.Aggregate(new List<int>(), (p, c) =>
            {
                var value = Int32.Parse(c.Split(' ')[1]);
                p.Add(value);
                return p;
            }).ToArray();

            string[] peakLines = File.ReadAllLines(String.Format("{0}.txt", peaksFileName));
            var peakData = peakLines.Aggregate(new List<int>(), (p, c) =>
            {
                var value = Int32.Parse(c.Split(' ')[0]);
                p.Add(value);
                return p;
            }).ToArray();

            GaussianFit.FitGaussian(data, peakData, index, window, fileName);
        }

        public static void Calibrate(string[] args)
        {
            var fileName = args.Length < 2 ? "data/calibration_dto" : args[1];
            var isSecondOrder = args.Length < 3 ? false : Boolean.Parse(args[2]);
            string[] lines = File.ReadAllLines(String.Format("{0}.txt", fileName));
            var data = lines.Aggregate(new List<CalibrationLine>(), (p, c) =>
            {
                var split = c.Split(' ');
                var result = new CalibrationLine
                {
                    Energy = Double.Parse(split[0]),
                    Area = Double.Parse(split[1]),
                    Centroid = Double.Parse(split[2])
                };
                p.Add(result);
                return p;
            });

            Calibration.Calibrate(data, isSecondOrder);
        }

        // Cambia valori della tabbela Matrix in SQLLite, non testato e probabilmente INUTILE
        public static void SubstituteCalibration(string[] args)
        {
            double q = args.Length < 2 ? 0 : Double.Parse(args[1]);
            double m = args.Length < 3 ? 0 : Double.Parse(args[2]);
            double m2 = args.Length < 4 ? 0 : Double.Parse(args[3]);

            Database db = new Database("coincidenze_vere", false);

            //Salvo il risultato
            db.SubstituteCalibration(q, m, m2);
        }
    }
}
