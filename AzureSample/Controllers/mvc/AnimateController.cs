using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace AzureSample.Controllers.mvc
{
    public class AnimateController : Controller
    {
        // GET: Animate
        public ActionResult Index()
        {
            return View();
        }

        public PartialViewResult Animate1()
        {
            return PartialView();
        }

        public PartialViewResult Animate2()
        {
            return PartialView();
        }
    }
}