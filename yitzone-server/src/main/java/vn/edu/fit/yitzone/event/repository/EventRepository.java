package vn.edu.fit.yitzone.event.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import vn.edu.fit.yitzone.event.domain.Event;

public interface EventRepository extends MongoRepository<Event, String> {
    Page<Event> findByVisibility(Event.EventVisibility visibility, Pageable pageable);

    @Query("{ '$or': [ { 'visibility': 'PUBLIC_FACULTY' }, { 'visibility': 'INTERNAL_CTV', 'organizerUnitId': ?0 } ] }")
    Page<Event> findVisibleForScope(String organizerUnitId, Pageable pageable);
}
