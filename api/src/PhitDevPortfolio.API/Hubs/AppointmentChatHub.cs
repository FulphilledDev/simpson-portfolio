using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace PhitDevPortfolio.API.Hubs;

[Authorize]
public class AppointmentChatHub : Hub
{
    public static string GroupName(int appointmentId) => $"appointment-{appointmentId}";

    public async Task JoinAppointment(int appointmentId) =>
        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(appointmentId));

    public async Task LeaveAppointment(int appointmentId) =>
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(appointmentId));
}
