using System.Web;
using System.Web.Optimization;

namespace AzureSample
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/Scripts/libraries").Include(
                "~/Scripts/library/jquery-{version}.js",
                "~/Scripts/library/angular.js",
                "~/Scripts/library/angular-animate.js",
                "~/Scripts/library/angular-route.js",
                "~/Scripts/library/jasmine.js",
                "~/Scripts/library/jasmine-html.js",
                "~/Scripts/library/bootstrap.js"));


            bundles.Add(new ScriptBundle("~/Scripts/appMain").Include(
                "~/Scripts/angularjs/base/base.js",
                "~/Scripts/angularjs/main/main.js"
                ));

            bundles.Add(new ScriptBundle("~/Scripts/controls").Include(
                "~/Scripts/angularjs/controls/paginationModule.js",
                "~/Scripts/angularjs/controls/gridviewModule.js",
                "~/Scripts/angularjs/controls/filterModule.js",
                "~/Scripts/angularjs/controls/dateInputModule.js",
                "~/Scripts/angularjs/controls/richDropdownModule.js",
                "~/Scripts/angularjs/controls/innerLiteListModule.js",
                "~/Scripts/angularjs/controls/multiSelectionDropdownModule.js",
                "~/Scripts/angularjs/controls/angular-file-upload.js",
                "~/Scripts/angularjs/controls/carouselModule.js"
                ));

            bundles.Add(new ScriptBundle("~/Scripts/aircraftCtrl").Include(
                "~/Scripts/angularjs/gridview.aircraft/controller/aircraftGridCtrl.js"
                ));
        }
    }
}
