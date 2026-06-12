using PhitDevPortfolio.Application.DTOs;

namespace PhitDevPortfolio.Application.Interfaces;

public interface IReviewService
{
    Task<IEnumerable<ReviewDto>> GetAllAsync(bool publishedOnly = false, CancellationToken ct = default);
    Task<ReviewDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<ReviewDto> RequestAsync(RequestReviewDto dto, CancellationToken ct = default);
    Task<ReviewSubmitFormDto?> GetSubmitFormAsync(string token, CancellationToken ct = default);
    Task<ReviewDto?> SubmitAsync(string token, SubmitReviewDto dto, CancellationToken ct = default);
    Task<ReviewDto?> ApproveAsync(int id, CancellationToken ct = default);
    Task<ReviewDto?> UpdateAsync(int id, ReviewDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}
