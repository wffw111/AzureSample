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
    public class CraftTypesController : BaseOdataController
    {
        public CraftTypesController()
            : base() { }

        public IQueryable<CraftType> Get()
        {
            return ctx.CraftTypes;
        }

        [EnableQuery]
        public async Task<SingleResult<CraftType>> Get([FromODataUri] int key)
        {
            return await Task.Run(() =>
            {
                var result = ctx.CraftTypes.Where(b => b.Id == key);
                return SingleResult.Create(result);
            });
        }

        [HttpPost]
        public async Task<IHttpActionResult> Post(CraftType craftType)
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
                ctx.CraftTypes.Add(craftType);
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
