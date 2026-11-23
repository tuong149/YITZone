package vn.edu.fit.yitzone.office.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Office duty schedule cycle with geofence coordinates and holiday/exam suspension periods (UC-DUTY-01, UC-DUTY-05).
 */
@Document(collection = "OFFICE_DUTY_SCHEDULES")
public class OfficeDutySchedule {
    @Id
    private String id;

    private String title;
    private LocalDate weekStartDate;
    private LocalDate weekEndDate;
    private Instant registrationOpenAt;
    private Instant registrationCloseAt;
    private int minShiftsPerWeekPerCtv = 1;

    @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
    private GeoJsonPoint officeLocation;

    private int geofenceRadiusMeters = 30;
    private ScheduleStatus status = ScheduleStatus.REGISTRATION_OPEN;
    private List<SuspensionPeriod> examSuspensionPeriods = new ArrayList<>();

    public enum ScheduleStatus {
        REGISTRATION_OPEN, PUBLISHED, CLOSED
    }

    public record SuspensionPeriod(
            String title,
            String reason,
            LocalDate startDate,
            LocalDate endDate,
            String announcedBy,
            Instant announcedAt
    ) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public LocalDate getWeekStartDate() { return weekStartDate; }
    public void setWeekStartDate(LocalDate weekStartDate) { this.weekStartDate = weekStartDate; }
    public LocalDate getWeekEndDate() { return weekEndDate; }
    public void setWeekEndDate(LocalDate weekEndDate) { this.weekEndDate = weekEndDate; }
    public Instant getRegistrationOpenAt() { return registrationOpenAt; }
    public void setRegistrationOpenAt(Instant registrationOpenAt) { this.registrationOpenAt = registrationOpenAt; }
    public Instant getRegistrationCloseAt() { return registrationCloseAt; }
    public void setRegistrationCloseAt(Instant registrationCloseAt) { this.registrationCloseAt = registrationCloseAt; }
    public int getMinShiftsPerWeekPerCtv() { return minShiftsPerWeekPerCtv; }
    public void setMinShiftsPerWeekPerCtv(int minShiftsPerWeekPerCtv) { this.minShiftsPerWeekPerCtv = minShiftsPerWeekPerCtv; }
    public GeoJsonPoint getOfficeLocation() { return officeLocation; }
    public void setOfficeLocation(GeoJsonPoint officeLocation) { this.officeLocation = officeLocation; }
    public int getGeofenceRadiusMeters() { return geofenceRadiusMeters; }
    public void setGeofenceRadiusMeters(int geofenceRadiusMeters) { this.geofenceRadiusMeters = geofenceRadiusMeters; }
    public ScheduleStatus getStatus() { return status; }
    public void setStatus(ScheduleStatus status) { this.status = status; }
    public List<SuspensionPeriod> getExamSuspensionPeriods() { return examSuspensionPeriods; }
    public void setExamSuspensionPeriods(List<SuspensionPeriod> examSuspensionPeriods) { this.examSuspensionPeriods = examSuspensionPeriods; }
}
