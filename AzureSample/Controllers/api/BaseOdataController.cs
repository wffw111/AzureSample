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


namespace AzureSample.Controllers
{
    public class BaseOdataController : ODataController
    {
        protected SampleModelCTX ctx;
        public BaseOdataController()
        {
            ctx = new SampleModelCTX();
            ctx.Database.CommandTimeout = 180;
        }

        protected override void Dispose(bool disposing)
        {
            ctx.Dispose();
            base.Dispose(disposing);
        }
    }
}
