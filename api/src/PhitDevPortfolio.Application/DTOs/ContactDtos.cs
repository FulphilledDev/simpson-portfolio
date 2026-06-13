namespace PhitDevPortfolio.Application.DTOs;

public record ContactDto(
    int Id,
    string Name,
    string Email,
    string? Phone,
    string? Company,
    string? Notes,
    DateTimeOffset CreatedAt,
    int? AppointmentRequestId,
    int ProjectCount,
    int ReviewCount
);

public record ContactListItemDto(
    int Id,
    string Name,
    string Email,
    string? Company,
    DateTimeOffset CreatedAt,
    int? AppointmentRequestId,
    int ProjectCount,
    int ReviewCount
);

public record CreateContactDto(
    string Name,
    string Email,
    string? Phone,
    string? Company,
    string? Notes,
    int? AppointmentRequestId
);

public record UpdateContactDto(
    string Name,
    string Email,
    string? Phone,
    string? Company,
    string? Notes
);

public record AssignContactToProjectDto(int ContactId);
