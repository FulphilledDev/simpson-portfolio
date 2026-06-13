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
        var query = db.Reviews
            .Include(r => r.Contact)
            .Include(r => r.Project)
            .AsNoTracking()
            .AsQueryable();
        if (publishedOnly) query = query.Where(r => r.IsPublished);
        var items = await query.OrderBy(r => r.SortOrder).ThenByDescending(r => r.SubmittedAt).ToListAsync(ct);
        return items.Select(ToDto);
    }

    public async Task<ReviewDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var item = await db.Reviews.AsNoTracking()
            .Include(r => r.Contact)
            .Include(r => r.Project)
            .FirstOrDefaultAsync(r => r.Id == id, ct);
        return item is null ? null : ToDto(item);
    }

    public async Task<ReviewDto> RequestAsync(RequestReviewDto dto, CancellationToken ct = default)
    {
        var contact = await db.Contacts.FirstOrDefaultAsync(c => c.Id == dto.ContactId, ct)
            ?? throw new InvalidOperationException($"Contact {dto.ContactId} not found.");

        var entity = new Review
        {
            ReviewToken  = Guid.NewGuid().ToString(),
            ProsContent  = string.Empty,
            ConsContent  = string.Empty,
            Rating       = 0,
            ContactId    = dto.ContactId,
            ProjectId    = dto.ProjectId
        };
        db.Reviews.Add(entity);
        await db.SaveChangesAsync(ct);

        await email.SendReviewRequestAsync(contact.Email, contact.Name, entity.ReviewToken, ct);

        // Reload with nav props for the DTO
        entity.Contact = contact;
        if (dto.ProjectId.HasValue)
            entity.Project = await db.Projects.FindAsync([dto.ProjectId.Value], ct);

        return ToDto(entity);
    }

    public async Task<ReviewSubmitFormDto?> GetSubmitFormAsync(string token, CancellationToken ct = default)
    {
        var review = await db.Reviews.AsNoTracking()
            .Include(r => r.Contact)
            .Include(r => r.Project)
            .FirstOrDefaultAsync(r => r.ReviewToken == token, ct);

        if (review is null) return null;

        var isValid = review.SubmittedAt is null;
        return new ReviewSubmitFormDto(
            review.Contact.Name, null, review.Contact.Company,
            review.Project?.Title, isValid);
    }

    public async Task<ReviewDto?> SubmitAsync(string token, SubmitReviewDto dto, CancellationToken ct = default)
    {
        var review = await db.Reviews
            .Include(r => r.Contact)
            .Include(r => r.Project)
            .FirstOrDefaultAsync(r => r.ReviewToken == token, ct);

        if (review is null || review.SubmittedAt is not null) return null;

        if (dto.Rating < 0.5m || dto.Rating > 10m || dto.Rating % 0.5m != 0) return null;

        review.ProsContent = dto.ProsContent;
        review.ConsContent = dto.ConsContent;
        review.Rating      = dto.Rating;
        review.SubmittedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);
        return ToDto(review);
    }

    public async Task<ReviewDto?> ApproveAsync(int id, CancellationToken ct = default)
    {
        var review = await db.Reviews
            .Include(r => r.Contact)
            .Include(r => r.Project)
            .FirstOrDefaultAsync(r => r.Id == id, ct);
        if (review is null) return null;
        review.IsApproved  = true;
        review.IsPublished = true;
        await db.SaveChangesAsync(ct);
        return ToDto(review);
    }

    public async Task<ReviewDto?> UpdateAsync(int id, ReviewDto dto, CancellationToken ct = default)
    {
        var review = await db.Reviews
            .Include(r => r.Contact)
            .Include(r => r.Project)
            .FirstOrDefaultAsync(r => r.Id == id, ct);
        if (review is null) return null;
        review.ProsContent = dto.ProsContent;
        review.ConsContent = dto.ConsContent;
        review.Rating      = dto.Rating;
        review.IsApproved  = dto.IsApproved;
        review.IsPublished = dto.IsPublished;
        review.SortOrder   = dto.SortOrder;
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
        r.Id,
        r.ContactId, r.Contact.Name, null, r.Contact.Company,
        r.ProjectId, r.Project?.Title,
        r.ProsContent, r.ConsContent, r.Rating,
        r.RequestedAt, r.SubmittedAt,
        r.IsApproved, r.IsPublished, r.SortOrder);
}
