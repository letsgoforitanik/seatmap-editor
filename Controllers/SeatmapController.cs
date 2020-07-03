using SeatmapExperiment.Services;
using System;
using System.Collections.Generic;
using System.IO;
using System.Web;
using System.Web.Hosting;
using System.Web.Http;

namespace SeatmapExperiment.Controllers
{
    [RoutePrefix("api/seatmaps")]
    public class SeatmapController : ApiController
    {
        readonly SeatmapEditorDb db = new SeatmapEditorDb();

        [Route("{id:int}"), HttpGet]
        public IHttpActionResult GetInfo(int id)
        {
            var info = db.GetSeatmapInfo(id);
            return Ok(new { info.Id, info.Data, Background = (string.IsNullOrEmpty(info.Background)) ? "" : "background/" + info.Background });
        }

        [Route("{id:int}"), HttpPost]
        public IHttpActionResult SaveInfo(int id)
        {
            var request = HttpContext.Current.Request;

            string data = request.Form["data"];

            var sImage = request.Form["backgroundImage"];
            var fImage = request.Files["backgroundImage"];
            var backgroundImage = sImage ?? fImage as object;

            string fileName = string.Empty;

            if (backgroundImage is null || backgroundImage is HttpPostedFile)
            {
                var info = db.GetSeatmapInfo(id);
                var oldFileName = info.Background;

                string path = HostingEnvironment.MapPath("~/background");

                if (!string.IsNullOrEmpty(oldFileName))
                {
                    string filePath = path + "\\" + oldFileName;
                    File.Delete(filePath);
                }

                if (backgroundImage is HttpPostedFile file)
                {
                    var ext = file.FileName.Substring(file.FileName.LastIndexOf("."));
                    fileName = Guid.NewGuid().ToString() + ext;
                    file.SaveAs(path + "\\" + fileName);
                }
            }
            else
            {
                string pathName = backgroundImage as string;
                fileName = pathName.Substring(pathName.LastIndexOf("/"));
            }

            db.SaveSeatmapInfo(id, data, fileName);

            return Ok();
        }

        [Route("{id:int}/seat-price"), HttpGet]
        public IHttpActionResult GetSeatPriceInfo(int id)
        {
            var list = new List<SeatState>
            {
                 new SeatState { Name = "VIP", Price = 100, ColorCode ="#ff0000" },
                 new SeatState { Name = "Premium", Price = 150, ColorCode = "#008000" },
                 new SeatState { Name = "Super", Price = 200, ColorCode = "#0000ff" },
                 new SeatState { Name = "Ultra", Price = 250, ColorCode = "#ffa500"}
            };

            return Ok(list);
        }
    }
}