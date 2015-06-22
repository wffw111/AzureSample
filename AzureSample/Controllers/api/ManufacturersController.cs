using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.OData.Query;
using System.Web.Http.OData;
using System.Threading.Tasks;
using System.Reflection;
using System.Linq.Expressions;
using AzureSample.Models.Entities;

namespace AzureSample.Controllers
{
    public class ManufacturersController : BaseOdataController
    {
        public ManufacturersController()
            : base() { }

        public IQueryable<Manufacturer> Get()
        {
            return ctx.Manufacturers;
        }

        [EnableQuery]
        public async Task<SingleResult<Manufacturer>> Get([FromODataUri] int key)
        {
            return await Task.Run(() =>
            {
                var result = ctx.Manufacturers.Where(b => b.Id == key);
                return SingleResult.Create(result);
            });
        }

        [HttpPost]
        public async Task<IHttpActionResult> Post(Manufacturer craftType)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            if (craftType == null)
            {
                return BadRequest("craft type is null");
            }

            try
            {
                ctx.Manufacturers.Add(craftType);
                await ctx.SaveChangesAsync();
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }

            return Ok(craftType);
        }
    }
}
