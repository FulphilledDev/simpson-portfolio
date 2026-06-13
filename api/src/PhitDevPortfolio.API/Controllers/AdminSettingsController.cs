using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;

namespace PhitDevPortfolio.API.Controllers;

[ApiController]
[Route("api/settings")]
public class AdminSettingsController(
    IAdminSettingsService settingsService,
    IResumeVersionService resumeService) : ControllerBase
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

    [Authorize]
    [HttpPost("logo")]
    [RequestSizeLimit(5 * 1024 * 1024)] // 5 MB
    public async Task<IActionResult> UploadLogo(IFormFile? logo, CancellationToken ct)
    {
        if (logo is null || logo.Length == 0) return BadRequest("No file provided.");
        var allowed = new[] { "image/jpeg", "image/png", "image/webp", "image/svg+xml" };
        if (!allowed.Contains(logo.ContentType)) return BadRequest("Only JPEG, PNG, WebP, or SVG accepted.");

        var result = await settingsService.UpdateCompanyLogoAsync(logo.OpenReadStream(), logo.FileName, logo.ContentType, ct);
        return Ok(result);
    }

    // ── Resume version endpoints ──────────────────────────────────────────────

    [Authorize]
    [HttpGet("resumes")]
    public async Task<IActionResult> GetResumes(CancellationToken ct) =>
        Ok(await resumeService.GetAllAsync(ct));

    [Authorize]
    [HttpPost("resumes")]
    [RequestSizeLimit(30 * 1024 * 1024)] // 30 MB
    public async Task<IActionResult> UploadResume(IFormFile? resume, CancellationToken ct)
    {
        if (resume is null || resume.Length == 0) return BadRequest("No file provided.");
        var allowed = new[]
        {
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        };
        if (!allowed.Contains(resume.ContentType))
            return BadRequest("Only PDF, DOC, or DOCX files are accepted.");

        var result = await resumeService.UploadAsync(resume.OpenReadStream(), resume.FileName, resume.ContentType, ct);
        return CreatedAtAction(nameof(GetResumes), result);
    }

    [Authorize]
    [HttpPut("resumes/{id:int}/activate")]
    public async Task<IActionResult> ActivateResume(int id, CancellationToken ct)
    {
        try
        {
            var result = await resumeService.SetActiveAsync(id, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [Authorize]
    [HttpDelete("resumes/{id:int}")]
    public async Task<IActionResult> DeleteResume(int id, CancellationToken ct)
    {
        try
        {
            await resumeService.DeleteAsync(id, ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [AllowAnonymous]
    [HttpGet("resumes/{id:int}/download")]
    public async Task<IActionResult> DownloadResume(int id, CancellationToken ct)
    {
        try
        {
            var (stream, fileName, contentType) = await resumeService.GetDownloadStreamAsync(id, ct);
            return File(stream, contentType, fileName);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [Authorize]
    [HttpPost("resumes/{id:int}/send")]
    public async Task<IActionResult> SendResume(int id, [FromBody] SendResumeDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.ToEmail))
            return BadRequest("Recipient email is required.");
        try
        {
            await resumeService.SendByEmailAsync(id, dto.ToEmail.Trim(), dto.ToName?.Trim() ?? string.Empty, ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }
}

