package vn.edu.fit.yitzone.audit.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import vn.edu.fit.yitzone.audit.domain.Notification;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    Page<Notification> findByRecipientUserIdOrderByCreatedAtDesc(String recipientUserId, Pageable pageable);
    long countByRecipientUserIdAndReadFalse(String recipientUserId);
}
