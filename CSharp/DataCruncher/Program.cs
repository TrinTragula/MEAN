using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataCruncher.Cruncher;
using System.Globalization;
using System.Threading;
using System.Diagnostics;

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
            var mode = args.Length < 1 ? "matrix" : args[0];
            if (mode == "matrix") Matrix(args);
            if (mode == "gate") Gate(args);
           
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
            var overwrite = args.Length < 10 ? false : Boolean.Parse(args[9]); ;


            //Creo o riutilizzo il database
            Database db = new Database("coincidenze_vere", overwrite);

            //Esporto i file se necessario
            if (overwrite && !String.IsNullOrEmpty(file1) && !String.IsNullOrEmpty(file2)) db.InsertIntoDB(file1, file2);

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
    }
}
