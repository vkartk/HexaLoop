using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Auth;
using HexaLoop.Api.Infrastructure.Ids;
using HexaLoop.Api.Infrastructure.Time;
using HexaLoop.Api.Modules.Courses.Entities;
using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Effectiveness.Entities;
using HexaLoop.Api.Modules.Enrollments.Entities;
using HexaLoop.Api.Modules.Feedback.Entities;
using HexaLoop.Api.Modules.Notifications.Entities;
using HexaLoop.Api.Modules.Sessions.Entities;
using HexaLoop.Api.Modules.Trainers.Entities;
using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Infrastructure.Persistence;

public sealed class Seeder(
    AppDbContext db,
    IPasswordHashService passwords,
    IClock clock,
    ILogger<Seeder> logger)
{
    public async Task RunAsync(CancellationToken ct = default)
    {
        if (await db.Users.AnyAsync(ct))
        {
            logger.LogInformation("Seed skipped — users table is not empty.");
            return;
        }

        var now = clock.UtcNow;
        logger.LogInformation("Seeding demo data at {Now}", now);

        // --- Users: 3 personas with the fixture-pinned ids ---
        var admin = new User
        {
            Id = Guid.Parse("0192e9a8-2c1d-7a30-9c91-1f6f3a47b001"),
            Email = "admin@hexaloop.dev",
            FullName = "Alex Director",
            Role = UserRole.Admin,
            EmployeeCode = "HX-0001",
            PasswordHash = passwords.Hash("demo"),
            IsActive = true,
            CreatedAt = now,
        };

        var supervisor = new User
        {
            Id = Guid.Parse("0192e9a8-2c1d-7a30-9c91-1f6f3a47b201"),
            Email = "supervisor@hexaloop.dev",
            FullName = "Marco Lima",
            Role = UserRole.Supervisor,
            EmployeeCode = "HX-0421",
            PasswordHash = passwords.Hash("demo"),
            IsActive = true,
            CreatedAt = now,
        };

        var maverick = new User
        {
            Id = Guid.Parse("0192e9a8-2c1d-7a30-9c91-1f6f3a47b101"),
            Email = "maverick@hexaloop.dev",
            FullName = "Priya Shah",
            Role = UserRole.Maverick,
            EmployeeCode = "HX-1204",
            ManagerId = supervisor.Id,
            PasswordHash = passwords.Hash("demo"),
            IsActive = true,
            CreatedAt = now,
        };

        db.Users.AddRange(admin, supervisor, maverick);

        // --- Two more supervisors and ~50 mavericks split across all three ---
        var supervisors = new List<User> { supervisor };
        foreach (var (name, code) in new[]
                 {
                     ("Dana Okafor", "HX-0422"),
                     ("Lin Wei", "HX-0423"),
                 })
        {
            var s = new User
            {
                Id = UuidV7.New(),
                Email = $"{code.ToLower()}@hexaloop.dev",
                FullName = name,
                Role = UserRole.Supervisor,
                EmployeeCode = code,
                PasswordHash = passwords.Hash("demo"),
                IsActive = true,
                CreatedAt = now,
            };
            supervisors.Add(s);
            db.Users.Add(s);
        }

        var mavericks = new List<User> { maverick };
        var rng = new Random(7);
        for (var i = 0; i < 49; i++)
        {
            var sup = supervisors[i % supervisors.Count];
            var m = new User
            {
                Id = UuidV7.New(),
                Email = $"mav{i:D2}@hexaloop.dev",
                FullName = MaverickName(i),
                Role = UserRole.Maverick,
                EmployeeCode = $"HX-{2000 + i:D4}",
                ManagerId = sup.Id,
                PasswordHash = passwords.Hash("demo"),
                IsActive = true,
                CreatedAt = now,
            };
            mavericks.Add(m);
            db.Users.Add(m);
        }

        // --- Trainers ---
        var trainers = new[]
            {
                ("Sara Kapoor", "Inceptia", "Cloud Architecture", TrainerSourcing.External),
                ("James Berger", null, "Leadership", TrainerSourcing.Internal),
                ("Mei-Lin Cho", "AcmeLearn", "Data Engineering", TrainerSourcing.External),
                ("Tariq Nasser", null, "Software Craftsmanship", TrainerSourcing.Internal),
                ("Helena Vargas", "AcmeLearn", "Product Management", TrainerSourcing.External),
            }
            .Select(t => new Trainer
            {
                Id = UuidV7.New(),
                Name = t.Item1,
                Organization = t.Item2,
                DomainExpertise = t.Item3,
                EngagementType = t.Item4,
                CreatedAt = now,
            })
            .ToList();

        db.Trainers.AddRange(trainers);

        // --- Courses ---
        var courses = new[]
            {
                ("CLD-101", "Cloud Foundations", CourseType.Technical, TrainerSourcing.External, "Cloud", 16),
                ("LDR-201", "Leading Through Change", CourseType.SoftSkills, TrainerSourcing.Internal, "Leadership", 8),
                ("DTA-301", "Modern Data Engineering", CourseType.Technical, TrainerSourcing.External, "Data", 24),
                ("SWE-205", "Pragmatic Refactoring", CourseType.Technical, TrainerSourcing.Internal, "Engineering", 12),
                ("PRD-110", "Product Discovery Sprint", CourseType.Blended, TrainerSourcing.External, "Product", 16),
                ("LDR-150", "Coaching Conversations", CourseType.SoftSkills, TrainerSourcing.Internal, "Leadership", 6),
                ("CLD-220", "Production Kubernetes", CourseType.Technical, TrainerSourcing.External, "Cloud", 20),
                ("DTA-120", "Storytelling with Data", CourseType.Blended, TrainerSourcing.External, "Data", 10),
            }
            .Select(c => new Course
            {
                Id = UuidV7.New(),
                Code = c.Item1,
                Name = c.Item2,
                Type = c.Item3,
                TrainerType = c.Item4,
                Domain = c.Item5,
                Objectives = "Demo objectives for " + c.Item2,
                DurationHours = c.Item6,
                IsActive = true,
                CreatedAt = now,
            })
            .ToList();

        db.Courses.AddRange(courses);

        // --- Sessions: 12 sessions spread across courses + trainers ---
        var sessions = new List<Session>();
        for (var i = 0; i < 12; i++)
        {
            var course = courses[i % courses.Count];
            var trainer = trainers[i % trainers.Count];
            var startsAt = now.AddDays(-21 + i * 2);
            sessions.Add(new Session
            {
                Id = UuidV7.New(),
                CourseId = course.Id,
                TrainerId = trainer.Id,
                StartDate = startsAt,
                EndDate = startsAt.AddHours(course.DurationHours),
                Location = i % 3 == 0 ? "HQ - Room A" : null,
                VirtualLink = i % 3 == 0 ? null : "https://meet.hexaloop.dev/" + course.Code.ToLower(),
                Capacity = 20,
                Status = startsAt.AddDays(2) < now ? SessionStatus.Completed : SessionStatus.Scheduled,
                CreatedAt = now,
            });
        }
        db.Sessions.AddRange(sessions);

        // --- Enrollments ~12 mavericks per session ---
        var enrollments = new List<Enrollment>();
        foreach (var s in sessions)
        {
            var attendees = mavericks.OrderBy(_ => rng.Next()).Take(12).ToList();
            foreach (var m in attendees)
            {
                enrollments.Add(new Enrollment
                {
                    Id = UuidV7.New(),
                    SessionId = s.Id,
                    MaverickId = m.Id,
                    Status = s.Status == SessionStatus.Completed
                        ? (rng.NextDouble() > 0.05 ? EnrollmentStatus.Completed : EnrollmentStatus.NoShow)
                        : EnrollmentStatus.Enrolled,
                    CompletedAt = s.Status == SessionStatus.Completed ? s.EndDate : null,
                    CreatedAt = now,
                });
            }
        }
        db.Enrollments.AddRange(enrollments);

        // --- The hero cycle: OPEN MaverickPostTraining on a completed session,
        //     partial submissions (~60% — below the 0.78 threshold) ---
        var heroSession = sessions.First(s => s.Status == SessionStatus.Completed);
        var heroCycle = new FeedbackCycle
        {
            Id = UuidV7.New(),
            SessionId = heroSession.Id,
            Type = CycleType.MaverickPostTraining,
            Threshold = 0.78,
            Status = CycleStatus.Open,
            OpensAt = heroSession.EndDate.AddHours(1),
            TriggerBasis = TriggerBasis.TrainingCompletion,
            CreatedAt = now,
        };
        db.FeedbackCycles.Add(heroCycle);

        var heroAttendees = enrollments
            .Where(e => e.SessionId == heroSession.Id && e.Status == EnrollmentStatus.Completed)
            .ToList();

        var targetSubmitted = (int)Math.Floor(heroAttendees.Count * 0.6);
        for (var i = 0; i < heroAttendees.Count; i++)
        {
            var att = heroAttendees[i];
            var submitted = i < targetSubmitted;
            db.FeedbackResponses.Add(new FeedbackResponse
            {
                Id = UuidV7.New(),
                CycleId = heroCycle.Id,
                MaverickId = att.MaverickId,
                OverallRating = submitted ? rng.Next(3, 6) : null,
                Highlights = submitted ? "Labs were the highlight." : null,
                Improvements = submitted ? "Pacing felt rushed in module 2." : null,
                Status = submitted ? FeedbackResponseStatus.Submitted : FeedbackResponseStatus.Draft,
                SubmittedAt = submitted ? now.AddMinutes(-i * 7) : null,
                UpdatedAt = submitted ? now.AddMinutes(-i * 7) : now,
                CreatedAt = now,
            });
        }

        // --- Open SupervisorEffectiveness cycle, also partial ---
        var supEffSession = sessions.First(s => s.Status == SessionStatus.Completed && s.Id != heroSession.Id);
        var supEffCycle = new FeedbackCycle
        {
            Id = UuidV7.New(),
            SessionId = supEffSession.Id,
            Type = CycleType.SupervisorEffectiveness,
            Threshold = 0.78,
            Status = CycleStatus.Open,
            OpensAt = supEffSession.EndDate.AddDays(90),
            TriggerBasis = TriggerBasis.Post3MonthProject,
            CreatedAt = now,
        };
        db.FeedbackCycles.Add(supEffCycle);

        var supEffAttendees = enrollments
            .Where(e => e.SessionId == supEffSession.Id && e.Status == EnrollmentStatus.Completed)
            .ToList();

        foreach (var att in supEffAttendees)
        {
            var mavUser = mavericks.First(m => m.Id == att.MaverickId);
            var supId = mavUser.ManagerId ?? supervisor.Id;
            db.EffectivenessResponses.Add(new EffectivenessResponse
            {
                Id = UuidV7.New(),
                CycleId = supEffCycle.Id,
                SupervisorId = supId,
                MaverickId = att.MaverickId,
                Status = EffectivenessResponseStatus.Draft,
                UpdatedAt = now,
                CreatedAt = now,
            });
        }

        // --- A handful of notifications so the bell shows unread ---
        db.Notifications.AddRange(
            new Notification
            {
                Id = UuidV7.New(),
                UserId = admin.Id,
                Channel = NotificationChannel.Portal,
                Severity = NotificationSeverity.Warn,
                Subject = "Cycle below threshold",
                Body = "Cycle for " + courses.First(c => c.Id == heroSession.CourseId).Name + " is at 60% completion.",
                Status = NotificationStatus.Sent,
                RelatedCycleId = heroCycle.Id,
                Href = "/admin/cycles/" + heroCycle.Id,
                CreatedAt = now.AddHours(-2),
                SentAt = now.AddHours(-2),
            },
            new Notification
            {
                Id = UuidV7.New(),
                UserId = maverick.Id,
                Channel = NotificationChannel.Portal,
                Severity = NotificationSeverity.Info,
                Subject = "Feedback pending",
                Body = "Your post-training feedback is waiting.",
                Status = NotificationStatus.Sent,
                RelatedCycleId = heroCycle.Id,
                Href = "/maverick/feedback/" + heroCycle.Id,
                CreatedAt = now.AddHours(-1),
                SentAt = now.AddHours(-1),
            });

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Seed complete. heroCycle={HeroCycleId} (~60% completion, below threshold).", heroCycle.Id);
    }

    private static string MaverickName(int i)
    {
        var first = new[] { "Priya", "Noah", "Aisha", "Diego", "Yuki", "Rohan", "Sofia", "Liam", "Wren", "Imani", "Theo", "Naomi" };
        var last = new[] { "Patel", "Singh", "Garcia", "Nakamura", "Hassan", "Okonkwo", "Mendez", "Chen", "Klein", "Park" };
        return $"{first[i % first.Length]} {last[(i * 3) % last.Length]}";
    }
}
