package vn.edu.fit.yitzone.audit.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.audit.domain.AuditChainState;
import vn.edu.fit.yitzone.audit.domain.AuditLog;
import vn.edu.fit.yitzone.audit.repository.AuditLogRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Append-only, hash-chained audit logging service (UC-SYS-02, NFR-PRIV-03, A20).
 * Stores only minimal changedFields and links each entry via SHA-256 hash chain.
 */
@Service
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;
    private final MongoTemplate mongoTemplate;
    private final AtomicLong localSeq = new AtomicLong(0L);
    private volatile String localLastHash = "GENESIS";

    public AuditLogService(
            @Autowired(required = false) AuditLogRepository auditLogRepository,
            @Autowired(required = false) MongoTemplate mongoTemplate
    ) {
        this.auditLogRepository = auditLogRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public synchronized AuditLog record(
            String actorId,
            String actorEmail,
            String action,
            String targetType,
            String targetId,
            List<AuditLog.ChangedField> changedFields,
            String reason,
            String clientIp,
            String userAgent
    ) {
        Instant now = Instant.now();
        ChainSlot slot = allocateNextSlot();
        String currentHash = computeHash(
                slot.seq(),
                slot.prevHash(),
                actorId,
                action,
                targetType,
                targetId,
                reason,
                now
        );
        commitSlotHash(slot.seq(), currentHash);

        AuditLog entry = new AuditLog();
        entry.setSeq(slot.seq());
        entry.setActorId(actorId);
        entry.setActorEmail(actorEmail);
        entry.setAction(action);
        entry.setTargetType(targetType);
        entry.setTargetId(targetId);
        entry.setChangedFields(changedFields == null ? List.of() : List.copyOf(changedFields));
        entry.setReason(reason);
        entry.setClientIp(clientIp);
        entry.setUserAgent(userAgent);
        entry.setPrevHash(slot.prevHash());
        entry.setCurrentHash(currentHash);
        entry.setCreatedAt(now);

        if (auditLogRepository != null) {
            return auditLogRepository.save(entry);
        }
        return entry;
    }

    public String computeHash(
            long seq,
            String prevHash,
            String actorId,
            String action,
            String targetType,
            String targetId,
            String reason,
            Instant createdAt
    ) {
        String canonical = String.join("|",
                String.valueOf(seq),
                nullSafe(prevHash),
                nullSafe(actorId),
                nullSafe(action),
                nullSafe(targetType),
                nullSafe(targetId),
                nullSafe(reason),
                String.valueOf(createdAt.toEpochMilli())
        );
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(canonical.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot compute audit log hash", ex);
        }
    }

    private ChainSlot allocateNextSlot() {
        if (mongoTemplate != null) {
            Query query = Query.query(Criteria.where("_id").is(AuditChainState.MAIN_CHAIN_ID));
            Update update = new Update()
                    .inc("lastSeq", 1L)
                    .setOnInsert("lastHash", "GENESIS")
                    .setOnInsert("lastAnchoredSeq", 0L);
            AuditChainState previous = mongoTemplate.findAndModify(
                    query,
                    update,
                    FindAndModifyOptions.options().upsert(true).returnNew(false),
                    AuditChainState.class
            );
            long seq = previous == null ? 1L : previous.getLastSeq() + 1L;
            String prevHash = (previous == null || previous.getLastHash() == null)
                    ? "GENESIS"
                    : previous.getLastHash();
            return new ChainSlot(seq, prevHash);
        }
        long seq = localSeq.incrementAndGet();
        return new ChainSlot(seq, localLastHash);
    }

    private void commitSlotHash(long seq, String currentHash) {
        localLastHash = currentHash;
        if (mongoTemplate != null) {
            Query query = Query.query(Criteria.where("_id").is(AuditChainState.MAIN_CHAIN_ID).and("lastSeq").is(seq));
            Update update = new Update().set("lastHash", currentHash);
            mongoTemplate.updateFirst(query, update, AuditChainState.class);
        }
    }

    private String nullSafe(String s) {
        return s == null ? "" : s;
    }

    private record ChainSlot(long seq, String prevHash) {
    }
}
