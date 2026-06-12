namespace PhitDevPortfolio.Application.DTOs;

public record ReviewDto(
    int Id,
    string ReviewerName,
    string? ReviewerTitle,
    string? ReviewerCompany,
    string Content,
    int Rating,
    DateTimeOffset RequestedAt,
    DateTimeOffset? SubmittedAt,
    bool IsApproved,
    bool IsPublished,
    int SortOrder
);

public record ReviewSubmitFormDto(
    string ReviewerName,
    string? ReviewerTitle,
    string? ReviewerCompany,
    bool IsTokenValid
);

public record SubmitReviewDto(
    string ReviewerName,
    string? ReviewerTitle,
    string? ReviewerCompany,
    string Content,
    int Rating
);

public record RequestReviewDto(
    string ReviewerEmail,
    string ReviewerName,
    string? ReviewerTitle,
    string? ReviewerCompany
);
