using System.Reflection;
using System.Text.Json;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace AlertaYA.Api.OpenApi;

// Swashbuckle 6.6.2 no marca como required las propiedades de records posicionales; sin esto el
// cliente TS generado las trata todas como opcionales (A12).
public sealed class RequeridosNoAnulables : ISchemaFilter
{
    private readonly NullabilityInfoContext _nulabilidad = new();

    public void Apply(OpenApiSchema schema, SchemaFilterContext context)
    {
        if (schema.Properties.Count == 0)
        {
            return;
        }

        foreach (var propiedad in context.Type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
        {
            var nombre = JsonNamingPolicy.CamelCase.ConvertName(propiedad.Name);
            if (schema.Properties.ContainsKey(nombre) && _nulabilidad.Create(propiedad).ReadState == NullabilityState.NotNull)
            {
                schema.Required.Add(nombre);
            }
        }
    }
}
