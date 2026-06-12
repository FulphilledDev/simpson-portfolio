using Google.Apis.Auth;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;
using PhitDevPortfolio.Application.Options;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace PhitDevPortfolio.Infrastructure.Services;

public class TokenService(IOptions<JwtOptions> jwtOptions, IOptions<GoogleOptions> googleOptions, ILogger<TokenService> logger) : ITokenService
{
    private readonly JwtOptions    _jwt    = jwtOptions.Value;
    private readonly GoogleOptions _google = googleOptions.Value;

    public async Task<AuthResultDto?> ValidateGoogleTokenAsync(string idToken, CancellationToken ct = default)
    {
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [_google.ClientId]
            };
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);

            // Only the configured owner email is permitted to log in
            if (!string.Equals(payload.Email, _google.OwnerEmail, StringComparison.OrdinalIgnoreCase))
            {
                logger.LogWarning("Login attempt by unauthorised email: {Email}", payload.Email);
                return null;
            }

            var token = GenerateJwt(payload.Email, payload.Name ?? payload.Email);
            return new AuthResultDto(token, payload.Email, payload.Name ?? payload.Email);
        }
        catch (InvalidJwtException ex)
        {
            logger.LogWarning(ex, "Invalid Google ID token");
            return null;
        }
    }

    private string GenerateJwt(string email, string name)
    {
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   email),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(JwtRegisteredClaimNames.Name,  name),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role, "Admin")
        };

        var token = new JwtSecurityToken(
            issuer:   _jwt.Issuer,
            audience: _jwt.Audience,
            claims:   claims,
            expires:  DateTime.UtcNow.AddHours(_jwt.ExpiresHours),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
