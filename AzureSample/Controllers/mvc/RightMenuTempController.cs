using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace AzureSample.Controllers.mvc
{
    public class RightMenuTempController : Controller
    {
        // GET: RightMenuTemp
        public PartialViewResult GridRowRightMenuTemp()
        {
            return PartialView();
        }
    }
}