using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace AzureSample.Controllers.mvc
{
    public class AircraftController : Controller
    {
        // GET: Aircraft
        public ActionResult Index()
        {
            return View();
        }

        public PartialViewResult AddTemplate()
        {
            return PartialView();
        }

        public PartialViewResult EditTemplate()
        {
            return PartialView();
        }

        public PartialViewResult EditBodyTemplate()
        {
            return PartialView();
        }
    }
}