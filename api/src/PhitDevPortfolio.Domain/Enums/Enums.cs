namespace PhitDevPortfolio.Domain.Enums;

public enum AppointmentStatus
{
    Pending = 0,
    Accepted = 1,
    Denied = 2
}

public enum MessageSender
{
    Owner = 0,
    Client = 1,
    System = 2
}

public enum ProjectType
{
    WebApp = 0,
    API = 1,
    MobileApp = 2,
    Consultation = 3,
    Other = 4
}

public enum AvailabilitySlotType
{
    Consultation = 0,
    FollowUp = 1,
    ProjectReview = 2,
    Other = 3
}
