namespace PhitDevPortfolio.Application.DTOs;

public record ReviewDto(
    int Id,
    int ContactId,
    string ContactName,
    string? ContactTitle,
    string? ContactCompany,
    int? ProjectId,
    string? ProjectTitle,
    string ProsContent,
    string ConsContent,
    decimal Rating,
    DateTimeOffset RequestedAt,
    DateTimeOffset? SubmittedAt,
    bool IsApproved,
    bool IsPublished,
    int SortOrder
);

/// <summary>Returned when the reviewer opens their tokenized submission link.</summary>
public record ReviewSubmitFormDto(
    string ContactName,
    string? ContactTitle,
    string? ContactCompany,
    string? ProjectTitle,
    bool IsTokenValid
);

/// <summary>Posted by the reviewer when submitting their review.</summary>
public record SubmitReviewDto(
    string ProsContent,
    string ConsContent,
    decimal Rating
);

/// <summary>Posted by the admin to request a review from a contact.</summary>
public record RequestReviewDto(
    int ContactId,
    int? ProjectId
);

