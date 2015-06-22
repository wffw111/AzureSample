namespace AzureSample.Migrations
{
    using AzureSample.Models.Entities;
    using System;
    using System.Data.Entity;
    using System.Data.Entity.Migrations;
    using System.Linq;

    internal sealed class Configuration : DbMigrationsConfiguration<AzureSample.SampleModelCTX>
    {
        public Configuration()
        {
            AutomaticMigrationsEnabled = true;
        }

        protected override void Seed(AzureSample.SampleModelCTX context)
        {

            //context.CraftTypes.AddOrUpdate(
            //   new CraftType { TypeName = "Super Sonic Jet" },
            //   new CraftType { TypeName = "Helicopter" },
            //   new CraftType { TypeName = "Air Bus" }
            // );

            //context.Aircrafts.AddOrUpdate(
            //    new Aircraft { Name = "Air Bus 320" },
            //    new Aircraft { Name = "Boei 747" },
            //    new Aircraft { Name = "black Hawk" }
            //    );

        }
    }
}
