using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace AzureSample.Controllers.api
{
    public class ConfigController : ApiController
    {
        [HttpGet]
        public object Get()
        {
            var path = System.Web.Hosting.HostingEnvironment.MapPath("~/JsonConfiguration/Configuration");
            path += "/columns.json";
            string allText = System.IO.File.ReadAllText(path);
            object jsonObject = JsonConvert.DeserializeObject(allText);
            return jsonObject;
        }

        [HttpGet]
        public object Get(string id)
        {
            var path = System.Web.Hosting.HostingEnvironment.MapPath("~/JsonConfiguration/Configuration");
            path += '/' + id + ".json";
            string allText = System.IO.File.ReadAllText(path);
            object jsonObject = JsonConvert.DeserializeObject(allText);
            return jsonObject;
        }

        [HttpPost]
        public IHttpActionResult Post(configStr str)
        {
            var path = System.Web.Hosting.HostingEnvironment.MapPath("~/JsonConfiguration/Configuration");
            path = path + "/testConfig.json";
            if (!File.Exists(path))
            {
                var fileStream = File.Create(path);
                fileStream.Close();
            }
            if (!string.IsNullOrEmpty(str.Json))
                File.WriteAllText(path, str.Json);
            return Ok("OK");
        }
    }

    public class configStr
    {
        public string Json { get; set; }
    }
}
