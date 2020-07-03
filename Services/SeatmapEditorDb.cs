using MySql.Data.MySqlClient;
using System.Data;
using System.Linq;

namespace SeatmapExperiment.Services
{
    public class SeatmapEditorDb
    {
        const string ConnectionString = "server=localhost;database=seatmapeditor;uid=root;password=root;charset=utf8;";
        //const string ConnectionString = "server=localhost;database=treedoco_seatmapeditor;uid=seatmapdbuser;password=Hydrogen2@$;charset=utf8;";

        private IDbConnection GetConnection()
        {
            return DbConnection.Get<MySqlConnection>(ConnectionString);
        }

        public void SaveSeatmapInfo(int id, string data, string fileName)
        {
            using (var con = GetConnection())
            {
                string sql = $"update seatmap set Data='{data}',Background='{fileName}' where Id={id}";
                con.RunNonQuery(sql);
            }
        }

        public Seatmap GetSeatmapInfo(int id)
        {
            using (var con = GetConnection())
            {
                string sql = $"select * from Seatmap where Id={id}";
                return con.RunQuery<Seatmap>(sql).FirstOrDefault();
            }
        }
    }
}