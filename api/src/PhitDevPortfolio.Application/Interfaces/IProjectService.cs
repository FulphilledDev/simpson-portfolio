using PhitDevPortfolio.Application.DTOs;

namespace PhitDevPortfolio.Application.Interfaces;

public interface IProjectService
{
    Task<IEnumerable<ProjectDto>> GetAllAsync(bool featuredOnly = false, CancellationToken ct = default);
    Task<ProjectDto?> GetBySlugAsync(string slug, CancellationToken ct = default);
    Task<ProjectDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<ProjectDto> CreateAsync(CreateProjectDto dto, Stream? thumbnailStream, string? thumbnailFileName, Stream? gifStream, string? gifFileName, IEnumerable<(Stream Stream, string FileName)>? screenshotFiles, CancellationToken ct = default);
    Task<ProjectDto?> UpdateAsync(int id, UpdateProjectDto dto, Stream? thumbnailStream, string? thumbnailFileName, Stream? gifStream, string? gifFileName, IEnumerable<(Stream Stream, string FileName)>? screenshotFiles, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task ReorderAsync(IEnumerable<ReorderProjectDto> items, CancellationToken ct = default);
}
