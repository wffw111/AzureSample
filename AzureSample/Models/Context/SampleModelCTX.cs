namespace AzureSample
{
    using AzureSample.Models.Entities;
    using System;
    using System.Data.Entity;
    using System.Linq;

    public class SampleModelCTX : DbContext
    {
        // Your context has been configured to use a 'SampleModel' connection string from your application's 
        // configuration file (App.config or Web.config). By default, this connection string targets the 
        // 'AzureSample.SampleModel' database on your LocalDb instance. 
        // 
        // If you wish to target a different database and/or database provider, modify the 'SampleModel' 
        // connection string in the application configuration file.
        public SampleModelCTX()
            : base("name=SampleModel")
        {
        }

        // Add a DbSet for each entity type that you want to include in your model. For more information 
        // on configuring and using a Code First model, see http://go.microsoft.com/fwlink/?LinkId=390109.

        // public virtual DbSet<MyEntity> MyEntities { get; set; }
        public virtual DbSet<Manufacturer> Manufacturers { get; set; }
        public virtual DbSet<Aircraft> Aircrafts { get; set; }
        public virtual DbSet<CraftType> CraftTypes { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {

            modelBuilder.Configurations.Add(new AircraftConfiguration());
            modelBuilder.Configurations.Add(new CraftTypeConfiguration());
            modelBuilder.Configurations.Add(new ManufactureConfiguration());
            base.OnModelCreating(modelBuilder);
        }

        public static SampleModelCTX CreateCTX()
        {
            var ctx = new SampleModelCTX();
            return ctx;
        }

    }

    //public class MyEntity
    //{
    //    public int Id { get; set; }
    //    public string Name { get; set; }
    //}
}