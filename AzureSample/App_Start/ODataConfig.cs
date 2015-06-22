using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Http.OData;
using System.Web.Http.OData.Builder;
using System.Web.Http.OData.Extensions;
using System.Web.Http.OData.Routing.Conventions;
using System.Web.Http.OData.Routing;
using AzureSample.Models.Entities;



namespace AzureSample
{
    public partial class ODataConfig
    {
        public static void Config(HttpConfiguration config)
        {
            var builder = new ODataConventionModelBuilder();

            var aircraftType = builder.EntitySet<Aircraft>("Aircrafts").EntityType;
            aircraftType.HasKey<int>(m => m.Id);

            var aircraftReportAction = aircraftType.Collection.Action("AircraftReport");
            aircraftReportAction.ReturnsCollectionFromEntitySet<Aircraft>("Aircrafts");

            var craftTypeType = builder.EntitySet<CraftType>("CraftTypes").EntityType;
            craftTypeType.HasKey<int>(m => m.Id);

            var manufacturerType = builder.EntitySet<Manufacturer>("Manufacturers").EntityType;
            manufacturerType.HasKey<int>(m => m.Id);

            var conventions = ODataRoutingConventions.CreateDefault();

            config.Routes.MapODataServiceRoute(
                routeName: "OdataRoute",
                routePrefix: "odata",
                model: builder.GetEdmModel(),
                pathHandler: new DefaultODataPathHandler(),
                routingConventions: conventions);

            var queryAttr = new EnableQueryAttribute()
            {
                MaxTop = 50,
                MaxNodeCount = 1000,
                MaxExpansionDepth = 3
            };

            config.AddODataQueryFilter(queryAttr);
        }
    }
}