using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;

namespace PhitDevPortfolio.API.Controllers;

[ApiController]
[Route("api/projects")]
public class ProjectsController(IProjectService projects) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool featuredOnly = false, CancellationToken ct = default) =>
        Ok(await projects.GetAllAsync(featuredOnly, ct));

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken ct)
    {
        var result = await projects.GetBySlugAsync(slug, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [Authorize]
    [HttpGet("admin/{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var result = await projects.GetByIdAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [Authorize]
    [HttpPost]
    [RequestSizeLimit(50 * 1024 * 1024)] // 50 MB
    public async Task<IActionResult> Create([FromForm] CreateProjectDto dto,
        IFormFile? thumbnail, IFormFile? gifDemo, CancellationToken ct)
    {
        Stream? thumbStream = thumbnail?.OpenReadStream();
        Stream? gifStream   = gifDemo?.OpenReadStream();

        var result = await projects.CreateAsync(dto,
            thumbStream, thumbnail?.FileName,
            gifStream, gifDemo?.FileName, ct);

        return CreatedAtAction(nameof(GetBySlug), new { slug = result.Slug }, result);
    }

    [Authorize]
    [HttpPut("{id:int}")]
    [RequestSizeLimit(50 * 1024 * 1024)]
    public async Task<IActionResult> Update(int id, [FromForm] UpdateProjectDto dto,
        IFormFile? thumbnail, IFormFile? gifDemo, CancellationToken ct)
    {
        Stream? thumbStream = thumbnail?.OpenReadStream();
        Stream? gifStream   = gifDemo?.OpenReadStream();

        var result = await projects.UpdateAsync(id, dto,
            thumbStream, thumbnail?.FileName,
            gifStream, gifDemo?.FileName, ct);

        return result is null ? NotFound() : Ok(result);
    }

    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var deleted = await projects.DeleteAsync(id, ct);
        return deleted ? NoContent() : NotFound();
    }

    [Authorize]
    [HttpPut("reorder")]
    public async Task<IActionResult> Reorder([FromBody] IEnumerable<ReorderProjectDto> items, CancellationToken ct)
    {
        await projects.ReorderAsync(items, ct);
        return NoContent();
    }
}
