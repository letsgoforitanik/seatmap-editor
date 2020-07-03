using System;
using System.Collections.Generic;
using System.Data;
using System.Dynamic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;

namespace SeatmapExperiment.Services
{
    public static class DbConnection
    {

        public static TDbConnection Get<TDbConnection>(string connectionString) where TDbConnection : IDbConnection, new()
        {
            var connection = new TDbConnection { ConnectionString = connectionString };
            connection.Open();
            return connection;
        }

        public static void RunNonQuery(this IDbConnection conn, string commandText, object parameters = null, CommandType commandType = CommandType.Text, IDbTransaction transaction = null)
        {
            using (var command = conn.CreateCommand())
            {
                command.CommandType = commandType;
                command.Transaction = transaction;

                if (parameters != null)
                {
                    var type = parameters.GetType();
                    var properties = type.GetProperties();

                    foreach (var p in properties)
                    {
                        var parameter = command.CreateParameter();
                        parameter.ParameterName = "@" + p.Name;
                        parameter.Value = p.GetValue(parameters);
                        command.Parameters.Add(parameter);

                        if (commandType == CommandType.Text)
                        {
                            int index = commandText.IndexOf('?');
                            commandText = commandText.Insert(index, parameter.ParameterName);
                        }
                    }
                }

                command.CommandText = commandText;
                command.ExecuteNonQuery();
            }
        }

        public static DataSet ExecuteDataSet(this IDbConnection conn, string commandText, object parameters = null, CommandType commandType = CommandType.Text, IDbTransaction transaction = null)
        {
            using (var reader = conn.ExecuteReader(commandText, parameters, commandType, transaction))
            {
                var dataSet = new DataSet();
                dataSet.Tables.Add("First");
                dataSet.Tables[0].Load(reader);
                return dataSet;
            }
        }

        public static IDataReader ExecuteReader(this IDbConnection conn, string commandText, object parameters, CommandType commandType = CommandType.Text, IDbTransaction transaction = null)
        {

            var command = conn.CreateCommand();
            command.CommandType = commandType;
            command.CommandText = commandText;
            command.Transaction = transaction;

            if (parameters != null)
            {
                var type = parameters.GetType();
                var properties = type.GetProperties();

                foreach (var p in properties)
                {
                    var parameter = command.CreateParameter();
                    parameter.ParameterName = "@" + p.Name;
                    parameter.Value = p.GetValue(parameters);
                    command.Parameters.Add(parameter);

                    if (commandType == CommandType.Text)
                    {
                        int index = commandText.IndexOf('?');
                        commandText = commandText.Insert(index, parameter.ParameterName);
                    }
                }
            }

            command.CommandText = commandText;
            return command.ExecuteReader();

        }

        public static List<dynamic> RunQuery(this IDbConnection conn, string commandText, object parameters = null, CommandType commandType = CommandType.Text, IDbTransaction transaction = null)
        {
            var result = new List<dynamic>();

            using (var reader = conn.ExecuteReader(commandText, parameters, commandType, transaction))
            {
                while (reader.Read())
                {
                    IDictionary<string, object> item = new ExpandoObject();

                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        item[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader[i];
                    }

                    result.Add(item);
                }
            }

            return result;
        }

        public static List<List<dynamic>> RunQueries(this IDbConnection conn, string commandText, CommandType commandType = CommandType.Text, IDbTransaction transaction = null)
        {
            var result = new List<List<dynamic>>();

            using (var reader = conn.ExecuteReader(commandText, null, commandType, transaction))
            {
                do
                {
                    var set = new List<dynamic>();

                    while (reader.Read())
                    {
                        IDictionary<string, object> row = new ExpandoObject();

                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            if (!reader.IsDBNull(i)) row[reader.GetName(i)] = reader[i];
                        }

                        set.Add(row);
                    }

                    result.Add(set);
                }
                while (reader.NextResult());
            }

            return result;
        }

        public static List<TRequest> RunQuery<TRequest>(this IDbConnection conn, string commandText, object parameters = null, CommandType commandType = CommandType.Text, IDbTransaction transaction = null)
        {
            var result = new List<TRequest>();
            var requestType = typeof(TRequest);

            using (var reader = conn.ExecuteReader(commandText, parameters, commandType, transaction))
            {
                while (reader.Read())
                {
                    var item = Activator.CreateInstance<TRequest>();

                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        if (!reader.IsDBNull(i))
                        {
                            var columnName = reader.GetName(i);
                            var columnValue = reader[i];
                            requestType.GetProperty(columnName)?.SetValue(item, columnValue);
                        }
                    }

                    result.Add(item);
                }
            }

            return result;
        }

        public static TRequest RunQuerySingle<TRequest>(this IDbConnection conn, string commandText, object parameters = null, CommandType commandType = CommandType.Text, IDbTransaction transaction = null)
        {
            using (var reader = conn.ExecuteReader(commandText, parameters, commandType, transaction))
            {
                return (reader.Read()) ? (TRequest)Convert.ChangeType(reader.GetValue(0), typeof(TRequest)) : default(TRequest);
            }
        }

        public static void InsertTo<TModel>(this IDbConnection conn, TModel item, IDbTransaction transaction = null)
        {
            var sourceType = typeof(TModel);
            var properties = sourceType.GetProperties();

            var propertyList = string.Empty;
            var valueList = string.Empty;

            foreach (var property in properties)
            {
                if (Attribute.IsDefined(property, typeof(AutoGeneratedAttribute))) continue;
                propertyList += $"{property.Name},";
                var value = property.GetValue(item);
                valueList += value != null ? $"'{value}'," : "NULL,";
            }

            propertyList = propertyList.Substring(0, propertyList.Length - 1);
            valueList = valueList.Substring(0, valueList.Length - 1);

            string commandText = $"insert into {sourceType.Name.ToLower()} ({propertyList}) values ({valueList})";
            conn.RunNonQuery(commandText, transaction: transaction);
        }

        public static void SaveChangesTo<TModel>(this IDbConnection conn, TModel item, IDbTransaction transaction = null)
        {
            var sourceType = typeof(TModel);
            var properties = sourceType.GetProperties();
            var primaryKey = properties.FirstOrDefault(p => Attribute.IsDefined(p, typeof(PrimaryKeyAttribute)));

            if (primaryKey == null) throw new Exception("Primary key not defined");

            string keyValuePairs = string.Empty;

            foreach (var property in properties)
            {
                if (property == primaryKey) continue;
                keyValuePairs += $"{property.Name}='{property.GetValue(item)}',";
            }

            keyValuePairs = keyValuePairs.Substring(0, keyValuePairs.Length - 1);

            string commandText = $"update {sourceType.Name.ToLower()} set {keyValuePairs} where {primaryKey.Name}='{primaryKey.GetValue(item)}'";
            conn.RunNonQuery(commandText, transaction: transaction);

        }

        public static void RemoveFrom<TModel>(this IDbConnection conn, TModel item, IDbTransaction transaction = null)
        {

            var sourceType = typeof(TModel);
            var properties = sourceType.GetProperties();
            var primaryKey = properties.FirstOrDefault(p => Attribute.IsDefined(p, typeof(PrimaryKeyAttribute)));

            if (primaryKey == null) throw new Exception("Primary key not defined");

            string commandText = $"delete from {sourceType.Name.ToLower()} where {primaryKey.Name} = '{primaryKey.GetValue(item)}'";
            conn.RunNonQuery(commandText, transaction: transaction);
        }

        public static void RemoveFrom<TModel>(this IDbConnection conn, string primaryKeyValue, IDbTransaction transaction = null)
        {
            var sourceType = typeof(TModel);
            var properties = sourceType.GetProperties();
            var primaryKey = properties.FirstOrDefault(p => Attribute.IsDefined(p, typeof(PrimaryKeyAttribute)));

            if (primaryKey == null) throw new Exception("Primary key not defined");

            string commandText = $"delete from {sourceType.Name.ToLower()} where {primaryKey.Name} = '{primaryKeyValue}'";
            conn.RunNonQuery(commandText, transaction: transaction);
        }

        public static TModel FindFirstFrom<TModel>(this IDbConnection conn, object primaryKeyValue, IDbTransaction transaction = null)
        {
            var sourceType = typeof(TModel);
            var properties = sourceType.GetProperties();
            var primaryKey = properties.FirstOrDefault(p => Attribute.IsDefined(p, typeof(PrimaryKeyAttribute)));

            if (primaryKey == null) throw new Exception("Primary key not defined");

            string commandText = $"select * from {sourceType.Name.ToLower()} where {primaryKey.Name} = '{primaryKeyValue}'";
            return conn.RunQuery<TModel>(commandText, transaction: transaction).FirstOrDefault();
        }

        public static List<TModel> FindFrom<TModel>(this IDbConnection conn, IDbTransaction transaction = null)
        {
            var sourceType = typeof(TModel);
            string commandText = $"select * from {sourceType.Name.ToLower()}";
            return conn.RunQuery<TModel>(commandText, transaction: transaction);
        }

        public static List<TModel> FindFrom<TModel>(this IDbConnection conn, Expression<Func<TModel, bool>> condition, IDbTransaction transaction = null)
        {
            var sourceType = typeof(TModel);
            string commandText = $"select * from {sourceType.Name.ToLower()} where {ParseExpression(condition)}";
            return conn.RunQuery<TModel>(commandText, transaction: transaction);
        }

        private static object ParseExpression(Expression expr)
        {
            object holder;
            string left, middle, right;

            var map = new Dictionary<ExpressionType, string>
            {
                { ExpressionType.Equal," = " },
                { ExpressionType.NotEqual, " <> " },
                { ExpressionType.GreaterThan, " > " },
                { ExpressionType.GreaterThanOrEqual, " >= " },
                { ExpressionType.LessThan, " < " },
                { ExpressionType.LessThanOrEqual, " <= " },
                { ExpressionType.AndAlso, " and " },
                { ExpressionType.OrElse, " or " }
            };

            switch (expr.NodeType)
            {
                case ExpressionType.Lambda:
                    var lambdaExpr = expr as LambdaExpression;
                    var lambdaBody = lambdaExpr.Body;
                    return ParseExpression(lambdaBody);

                case ExpressionType.Equal:
                case ExpressionType.NotEqual:
                case ExpressionType.GreaterThan:
                case ExpressionType.GreaterThanOrEqual:
                case ExpressionType.LessThan:
                case ExpressionType.LessThanOrEqual:
                    var binaryExpr = expr as BinaryExpression;
                    left = (string)ParseExpression(binaryExpr.Left);
                    middle = map[expr.NodeType];
                    right = (string)ParseExpression(binaryExpr.Right);
                    return left + middle + $"'{right}'";

                case ExpressionType.AndAlso:
                case ExpressionType.OrElse:
                    var elseExpr = expr as BinaryExpression;
                    left = (string)ParseExpression(elseExpr.Left);
                    middle = map[elseExpr.NodeType];
                    right = (string)ParseExpression(elseExpr.Right);
                    return left + middle + right;

                case ExpressionType.MemberAccess:
                    var memberExpr = expr as MemberExpression;
                    var member = memberExpr.Member;
                    var expression = memberExpr.Expression;

                    holder = ParseExpression(expression);

                    if (holder is string) return member.Name;

                    else
                    {
                        switch (member)
                        {
                            case PropertyInfo propertyInfo:
                                return propertyInfo.GetValue(holder);
                            case FieldInfo fieldInfo:
                                return fieldInfo.GetValue(holder);
                            default: throw new Exception("not yet decided");
                        }
                    }

                case ExpressionType.Call:
                    var methodExpr = expr as MethodCallExpression;
                    MethodInfo method = methodExpr.Method;
                    var callArguments = methodExpr.Arguments;
                    var parameters = new object[callArguments.Count];

                    for (int i = 0; i < callArguments.Count; i++)
                    {
                        parameters[i] = ParseExpression(callArguments[i]);
                    }

                    holder = ParseExpression(methodExpr.Object);

                    if (holder is string)
                    {
                        switch (method.Name)
                        {
                            case "Contains":
                                return $"{holder} like '%{parameters[0]}%'";
                            case "StartsWith":
                                return $"{holder} like '{parameters[0]}%'";
                            case "EndsWith":
                                return $"{holder} like '%{parameters[0]}'";
                            default:
                                return string.Empty;
                        }
                    }
                    else
                    {
                        return method.Invoke(holder, parameters);
                    }

                case ExpressionType.Parameter:
                    return string.Empty;

                case ExpressionType.Constant:
                    return (expr as ConstantExpression).Value;

                default: return string.Empty;
            }
        }
    }

    public class PrimaryKeyAttribute : Attribute { }

    public class AutoGeneratedAttribute : Attribute { }

}

