using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;

namespace PhitDevPortfolio.API.Controllers;

[ApiController]
[Route("api/about")]
public class AboutController(
    IAboutSectionService aboutService,
    IAboutAssetService assetService) : ControllerBase
{
    // ── Public endpoints ──────────────────────────────────────────────────────

    /// <summary>Returns the About Me section content (public).</summary>
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct) =>
        Ok(await aboutService.GetAsync(ct));

    // ── Admin endpoints ───────────────────────────────────────────────────────

    /// <summary>Updates the About Me section header + principles.</summary>
    [HttpPut]
    [Authorize]
    public async Task<IActionResult> Update([FromBody] UpdateAboutSectionDto dto, CancellationToken ct) =>
        Ok(await aboutService.UpdateAsync(dto, ct));

    // ── Asset endpoints ───────────────────────────────────────────────────────

    /// <summary>Lists all uploaded about-me assets.</summary>
    [HttpGet("assets")]
    [Authorize]
    public async Task<IActionResult> GetAssets(CancellationToken ct) =>
        Ok(await assetService.GetAllAsync(ct));

    /// <summary>Uploads a new image asset to the about-me container.</summary>
    [HttpPost("assets")]
    [Authorize]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    public async Task<IActionResult> UploadAsset(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest("No file provided.");
        if (file.Length > 10 * 1024 * 1024)
            return BadRequest("File must be under 10 MB.");

        await using var stream = file.OpenReadStream();
        var asset = await assetService.UploadAsync(stream, file.FileName, file.ContentType, ct);
        return Ok(asset);
    }

    /// <summary>Deletes an asset and clears any assignments that reference it.</summary>
    [HttpDelete("assets/{id:int}")]
    [Authorize]
    public async Task<IActionResult> DeleteAsset(int id, CancellationToken ct)
    {
        await assetService.DeleteAsync(id, ct);
        return NoContent();
    }

    /// <summary>Sets this asset as the hero profile photo (updates AdminSettings.ProfilePhotoUrl).</summary>
    [HttpPut("assets/{id:int}/set-profile")]
    [Authorize]
    public async Task<IActionResult> SetAsProfile(int id, CancellationToken ct)
    {
        await assetService.SetAsProfilePhotoAsync(id, ct);
        return NoContent();
    }

    /// <summary>Sets this asset as the about-me section photo (updates AboutSection.AboutPhotoUrl).</summary>
    [HttpPut("assets/{id:int}/set-about")]
    [Authorize]
    public async Task<IActionResult> SetAsAbout(int id, CancellationToken ct)
    {
        await assetService.SetAsAboutPhotoAsync(id, ct);
        return NoContent();
    }
}
