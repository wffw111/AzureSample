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
    public class AirCraftsController : BaseOdataController
    {
        public AirCraftsController()
            : base()
        {
            
        }

        public IQueryable<Aircraft> Get()
        {
            return ctx.Aircrafts;
        }

        [EnableQuery]
        public async Task<SingleResult<Aircraft>> Get([FromODataUri] int key)
        {
            return await Task.Run(() =>
            {
                var result = ctx.Aircrafts.Where(b => b.Id == key);
                return SingleResult.Create(result);
            });
        }

        [HttpPost]
        public async Task<IHttpActionResult> Post(Aircraft aircraft)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            if (aircraft == null)
            {
                return BadRequest("barcode is null");
            }

            try
            {
                ctx.Aircrafts.Add(aircraft);
                await ctx.SaveChangesAsync();
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }

            return Ok(aircraft);
        }

        [HttpPatch]
        public async Task<IHttpActionResult> Patch([FromODataUri] int key, Delta<Aircraft> aircraft)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var entity = await ctx.Aircrafts.FindAsync(key);
            if (entity == null)
            {
                return NotFound();
            }
            try
            {
                aircraft.Patch(entity);
                await ctx.SaveChangesAsync();
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
            return Ok(entity);
        }
    }
}
