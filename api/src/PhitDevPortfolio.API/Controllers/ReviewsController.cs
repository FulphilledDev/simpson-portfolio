using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;

namespace PhitDevPortfolio.API.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewsController(IReviewService reviews) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetPublished(CancellationToken ct) =>
        Ok(await reviews.GetAllAsync(publishedOnly: true, ct));

    [Authorize]
    [HttpGet("admin")]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await reviews.GetAllAsync(publishedOnly: false, ct));

    [Authorize]
    [HttpGet("admin/{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var result = await reviews.GetByIdAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [Authorize]
    [HttpPost("request")]
    public async Task<IActionResult> RequestReview([FromBody] RequestReviewDto dto, CancellationToken ct)
    {
        try
        {
            var result = await reviews.RequestAsync(dto, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // ── Public tokenized submission ───────────────────────────────────────────

    [HttpGet("submit/{token}")]
    public async Task<IActionResult> GetSubmitForm(string token, CancellationToken ct)
    {
        var form = await reviews.GetSubmitFormAsync(token, ct);
        if (form is null) return NotFound();
        if (!form.IsTokenValid) return StatusCode(410, new { message = "This review link has already been used." });
        return Ok(form);
    }

    [HttpPost("submit/{token}")]
    public async Task<IActionResult> Submit(string token, [FromBody] SubmitReviewDto dto, CancellationToken ct)
    {
        if (dto.Rating < 0.5m || dto.Rating > 10m || dto.Rating % 0.5m != 0)
            return BadRequest("Rating must be between 0.5 and 10 in 0.5 increments.");

        var result = await reviews.SubmitAsync(token, dto, ct);
        if (result is null) return StatusCode(410, new { message = "This review link has already been used or is invalid." });
        return Ok(result);
    }

    [Authorize]
    [HttpPut("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, CancellationToken ct)
    {
        var result = await reviews.ApproveAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [Authorize]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] ReviewDto dto, CancellationToken ct)
    {
        var result = await reviews.UpdateAsync(id, dto, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var deleted = await reviews.DeleteAsync(id, ct);
        return deleted ? NoContent() : NotFound();
    }
}
