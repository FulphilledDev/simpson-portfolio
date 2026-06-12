using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;

namespace PhitDevPortfolio.API.Controllers;

[ApiController]
[Route("api/settings")]
public class AdminSettingsController(IAdminSettingsService settingsService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct) =>
        Ok(await settingsService.GetAsync(ct));

    [Authorize]
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateAdminSettingsDto dto, CancellationToken ct) =>
        Ok(await settingsService.UpdateAsync(dto, ct));

    [Authorize]
    [HttpPost("photo")]
    [RequestSizeLimit(5 * 1024 * 1024)] // 5 MB
    public async Task<IActionResult> UploadPhoto(IFormFile? photo, CancellationToken ct)
    {
        if (photo is null || photo.Length == 0) return BadRequest("No file provided.");
        var allowed = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowed.Contains(photo.ContentType)) return BadRequest("Only JPEG, PNG, or WebP accepted.");

        var result = await settingsService.UpdateProfilePhotoAsync(photo.OpenReadStream(), photo.FileName, photo.ContentType, ct);
        return Ok(result);
    }
}
