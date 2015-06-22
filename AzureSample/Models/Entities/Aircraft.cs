using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.Entity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity.ModelConfiguration;
using System.Data.Entity.ModelConfiguration.Configuration;

namespace AzureSample.Models.Entities
{
    public class Aircraft
    {
        [Key]
        public int Id { get; set; }

        public int? TypeNo { get; set; }
        public int? ManufacturerNo { get; set; }
        public string Name { get; set; }
        public string CraftCode { get; set; }
        public string Color { get; set; }
        public decimal? length { get; set; }
        public decimal? Cost { get; set; }
        public decimal? Width { get; set; }
        public decimal? Height { get; set; }
        public decimal? Weight { get; set; }
        public decimal? Voyage { get; set; }

        public virtual Manufacturer Manufacturer { get; set; }
        public virtual CraftType CraftType { get; set; }

    }

    public class AircraftConfiguration : EntityTypeConfiguration<Aircraft>
    {
        public AircraftConfiguration()
        {
            this.HasKey<int>(m => m.Id);

            this.Property(m => m.Id)
                .HasColumnName("Id")
                .IsRequired()
                .HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);

            this.Property(m => m.TypeNo)
                .HasColumnName("TypeNo");

            this.Property(m => m.ManufacturerNo)
            .HasColumnName("ManufacturerNo");

            this.Property(m => m.Name)
            .HasColumnName("Name");

            this.Property(m => m.CraftCode)
            .HasColumnName("CraftCode");

            this.Property(m => m.Color)
            .HasColumnName("Color");

            this.Property(m => m.length)
            .HasColumnName("length");

            this.Property(m => m.Cost)
                .HasColumnName("Cost");

            this.Property(m => m.Width)
                .HasColumnName("Width");

            this.Property(m => m.Height)
                .HasColumnName("Height");

            this.Property(m => m.Weight)
                .HasColumnName("Weight");

            this.Property(m => m.Voyage)
                .HasColumnName("Voyage");

            this.HasOptional(m => m.CraftType)
                .WithMany(c => c.Aircrafts)
                .HasForeignKey(m => m.TypeNo);

            this.HasOptional(m => m.Manufacturer)
                .WithMany(t => t.Aircrafts)
                .HasForeignKey(m => m.ManufacturerNo);

            ToTable("Aircraft");
        }
    }
}