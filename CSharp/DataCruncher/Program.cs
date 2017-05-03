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
            var nCanali = args.Length < 1 ? 1000 : Int32.Parse(args[0]);
            var file1 = args.Length < 2 ? "C:\\Users\\Daniele\\Desktop\\Tesi Magistrale\\Dati\\Matrice152Eu_ch000.txt" : args[1];
            var file2 = args.Length < 3 ? "C:\\Users\\Daniele\\Desktop\\Tesi Magistrale\\Dati\\Matrice152Eu_ch001.txt" : args[2];
            var xMin = args.Length < 4 ? 0 : Int32.Parse(args[3]);
            var xMax = args.Length < 5 ? int.MaxValue : Int32.Parse(args[4]);
            var yMin = args.Length < 6 ? 0 : Int32.Parse(args[5]);
            var yMax = args.Length < 7 ? int.MaxValue : Int32.Parse(args[6]);
            var overwrite = args.Length < 8 ? false : Boolean.Parse(args[7]); ;

            //Creo o riutilizzo il database
            Database db = new Database("coincidenze_vere", overwrite);

            //Esporto i file se necessario
            if (overwrite) db.InsertIntoDB(file1, file2);

            //Salvo il risultato
            db.binCount(nCanali, xMin, xMax, yMin, yMax);

            //Finito
            db.Close();
            Console.WriteLine("Done!");
            #if DEBUG
                Console.ReadLine();
            #endif
        }
    }
}
