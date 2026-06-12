namespace PhitDevPortfolio.Application.Options;

public class JwtOptions
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpiresHours { get; set; } = 12;
}

public class EmailOptions
{
    public string SmtpServer { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string FromAddress { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public string AppBaseUrl { get; set; } = string.Empty;
}

public class AzureOptions
{
    public string BlobStorageConnectionString { get; set; } = string.Empty;
    public string ProjectsContainerName { get; set; } = "projects";
    public string ProfileContainerName { get; set; } = "profile";
    public string LocalDevBaseUrl { get; set; } = "http://localhost:5000";
}

public class GoogleOptions
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = string.Empty;
    /// <summary>The Google account email that is permitted to log in as admin.</summary>
    public string OwnerEmail { get; set; } = string.Empty;
    /// <summary>AES-256 key (32 bytes, base64 encoded) for encrypting OAuth tokens at rest.</summary>
    public string TokenEncryptionKey { get; set; } = string.Empty;
}
