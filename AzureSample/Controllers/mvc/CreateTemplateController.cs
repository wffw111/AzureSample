using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace AzureSample.Controllers.mvc
{
    public class CreateTemplateController : Controller
    {
        // GET: CreateTemplate
        public ActionResult Index()
        {
            return View();
        }

        public PartialViewResult CraftType()
        {
            return PartialView();
        }

        public PartialViewResult Manufacturer()
        {
            return PartialView();
        }
    }
}