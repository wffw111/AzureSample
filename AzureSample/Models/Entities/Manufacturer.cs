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
    public class Manufacturer
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Address { get; set; }
        public string PostalCode { get; set; }
        public string Phone { get; set; }
        public string Contact { get; set; }
        public DateTime? EstablishDate { get; set; }

        public virtual ICollection<Aircraft> Aircrafts { get; set; }
    }

    public class ManufactureConfiguration : EntityTypeConfiguration<Manufacturer>
    {
        public ManufactureConfiguration()
        {
            this.HasKey<int>(m => m.Id);

            this.Property(m => m.Id)
                .HasColumnName("Id")
                .IsRequired()
                .HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);

            this.Property(m => m.Name)
                .HasColumnName("Name");

            this.Property(m => m.Address)
            .HasColumnName("Address");

            this.Property(m => m.PostalCode)
            .HasColumnName("PostalCode");

            this.Property(m => m.PostalCode)
            .HasColumnName("PostalCode");

            this.Property(m => m.Contact)
            .HasColumnName("Contact");

            this.Property(m => m.EstablishDate)
            .HasColumnName("EstablishDate");

            ToTable("Manufacturer");
        }
    }
}