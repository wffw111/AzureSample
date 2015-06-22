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
    public class CraftType
    {
        public int Id { get; set; }
        public string TypeName { get; set; }

        public virtual ICollection<Aircraft> Aircrafts { get; set; }
    }

    public class CraftTypeConfiguration : EntityTypeConfiguration<CraftType>
    {
        public CraftTypeConfiguration()
        {
            this.HasKey<int>(m => m.Id);

            this.Property(m => m.Id)
                .HasColumnName("Id")
                .IsRequired()
                .HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);

            this.Property(m => m.TypeName)
                .HasColumnName("TypeName");


            ToTable("CraftType");

        }
    }
}