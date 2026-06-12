using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;

namespace PhitDevPortfolio.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(ITokenService tokenService) : ControllerBase
{
    /// <summary>Exchange a Google ID token for a portfolio admin JWT.</summary>
    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleAuthDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.IdToken))
            return BadRequest("idToken is required.");

        var result = await tokenService.ValidateGoogleTokenAsync(dto.IdToken, ct);
        if (result is null) return Unauthorized();

        return Ok(result);
    }
}
