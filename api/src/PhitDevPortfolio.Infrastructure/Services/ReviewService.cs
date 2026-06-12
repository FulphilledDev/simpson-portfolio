using Microsoft.EntityFrameworkCore;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;
using PhitDevPortfolio.Domain.Entities;
using PhitDevPortfolio.Infrastructure.Persistence;

namespace PhitDevPortfolio.Infrastructure.Services;

public class ReviewService(AppDbContext db, IEmailService email) : IReviewService
{
    public async Task<IEnumerable<ReviewDto>> GetAllAsync(bool publishedOnly = false, CancellationToken ct = default)
    {
        var query = db.Reviews.AsNoTracking();
        if (publishedOnly) query = query.Where(r => r.IsPublished);
        var items = await query.OrderBy(r => r.SortOrder).ThenByDescending(r => r.SubmittedAt).ToListAsync(ct);
        return items.Select(ToDto);
    }

    public async Task<ReviewDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var item = await db.Reviews.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id, ct);
        return item is null ? null : ToDto(item);
    }

    public async Task<ReviewDto> RequestAsync(RequestReviewDto dto, CancellationToken ct = default)
    {
        var entity = new Review
        {
            ReviewerName    = dto.ReviewerName,
            ReviewerTitle   = dto.ReviewerTitle,
            ReviewerCompany = dto.ReviewerCompany,
            ReviewToken     = Guid.NewGuid().ToString(),
            Content         = string.Empty,
            Rating          = 0
        };
        db.Reviews.Add(entity);
        await db.SaveChangesAsync(ct);

        await email.SendReviewRequestAsync(dto.ReviewerEmail, dto.ReviewerName, entity.ReviewToken, ct);
        return ToDto(entity);
    }

    public async Task<ReviewSubmitFormDto?> GetSubmitFormAsync(string token, CancellationToken ct = default)
    {
        var review = await db.Reviews.AsNoTracking()
            .FirstOrDefaultAsync(r => r.ReviewToken == token, ct);

        if (review is null) return null;

        // Token is single-use; once submitted, return null to prevent re-submission
        var isValid = review.SubmittedAt is null;
        return new ReviewSubmitFormDto(review.ReviewerName, review.ReviewerTitle, review.ReviewerCompany, isValid);
    }

    public async Task<ReviewDto?> SubmitAsync(string token, SubmitReviewDto dto, CancellationToken ct = default)
    {
        var review = await db.Reviews.FirstOrDefaultAsync(r => r.ReviewToken == token, ct);

        // Return null if not found or already submitted (single-use token)
        if (review is null || review.SubmittedAt is not null) return null;

        if (dto.Rating < 1 || dto.Rating > 5) return null;

        review.ReviewerName    = dto.ReviewerName;
        review.ReviewerTitle   = dto.ReviewerTitle;
        review.ReviewerCompany = dto.ReviewerCompany;
        review.Content         = dto.Content;
        review.Rating          = dto.Rating;
        review.SubmittedAt     = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);
        return ToDto(review);
    }

    public async Task<ReviewDto?> ApproveAsync(int id, CancellationToken ct = default)
    {
        var review = await db.Reviews.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (review is null) return null;
        review.IsApproved  = true;
        review.IsPublished = true;
        await db.SaveChangesAsync(ct);
        return ToDto(review);
    }

    public async Task<ReviewDto?> UpdateAsync(int id, ReviewDto dto, CancellationToken ct = default)
    {
        var review = await db.Reviews.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (review is null) return null;
        review.ReviewerName    = dto.ReviewerName;
        review.ReviewerTitle   = dto.ReviewerTitle;
        review.ReviewerCompany = dto.ReviewerCompany;
        review.Content         = dto.Content;
        review.Rating          = dto.Rating;
        review.IsApproved      = dto.IsApproved;
        review.IsPublished     = dto.IsPublished;
        review.SortOrder       = dto.SortOrder;
        await db.SaveChangesAsync(ct);
        return ToDto(review);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var review = await db.Reviews.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (review is null) return false;
        db.Reviews.Remove(review);
        await db.SaveChangesAsync(ct);
        return true;
    }

    private static ReviewDto ToDto(Review r) => new(
        r.Id, r.ReviewerName, r.ReviewerTitle, r.ReviewerCompany,
        r.Content, r.Rating, r.RequestedAt, r.SubmittedAt,
        r.IsApproved, r.IsPublished, r.SortOrder);
}
