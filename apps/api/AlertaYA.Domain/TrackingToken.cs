using System.Security.Cryptography;
using System.Text;

namespace AlertaYA.Domain;

// Derivado (no aleatorio) para que el API pueda volver a mostrar el enlace sin guardarlo en claro (D-07).
public static class TrackingToken
{
    public static string Derivar(byte[] secreto, Guid alertId)
    {
        var bytes = HMACSHA256.HashData(secreto, alertId.ToByteArray())[..16];
        return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    public static byte[] Hash(string token) => SHA256.HashData(Encoding.UTF8.GetBytes(token));
}
