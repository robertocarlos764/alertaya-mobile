namespace AlertaYA.Application.Options;

public class PublicOptions
{
    public const string Seccion = "Public";

    public string ApiBaseUrl { get; set; } = string.Empty;

    public string WebBaseUrl { get; set; } = string.Empty;

    public string SecretoSeguimiento { get; set; } = string.Empty;

    public byte[] SecretoSeguimientoBytes()
    {
        byte[] bytes;
        try
        {
            bytes = Convert.FromBase64String(SecretoSeguimiento);
        }
        catch (FormatException)
        {
            throw new InvalidOperationException("Public:SecretoSeguimiento no es base64 valido.");
        }

        return bytes.Length >= 32
            ? bytes
            : throw new InvalidOperationException("Public:SecretoSeguimiento debe tener al menos 32 bytes.");
    }

    public string UrlSeguimiento(string token) => $"{WebBaseUrl.TrimEnd('/')}/t/{token}";
}
