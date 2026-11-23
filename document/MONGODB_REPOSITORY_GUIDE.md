# HƯỚNG DẪN TẠO `MongoRepository` & TRUY CẬP DỮ LIỆU THEO PHÂN HỆ (YITZone)

> **Mục đích:** Tài liệu lưu trữ quy chuẩn và danh sách các `MongoRepository` cần khởi tạo dần khi triển khai từng phân hệ dựa trên [USECASE_YITZone.md](./USECASE_YITZone.md).  
> **Trạng thái hiện tại:** Toàn bộ Entity (`@Document`) cho 20 phân hệ đã được tạo sẵn tại `yitzone-server/src/main/java/vn/edu/fit/yitzone/<module>/domain/`. Tuy nhiên, các `MongoRepository` **chưa được tạo hàng loạt** để tránh dư thừa code chết.

---

## 1. Quy tắc bắt buộc cho AI Agent / Developer khi triển khai Use Case

Khi triển khai bất kỳ phân hệ hoặc Use Case nào từ [USECASE_YITZone.md](./USECASE_YITZone.md):

1. **Tận dụng Entity đã có:** Không tạo trùng Entity mới nếu đã tồn tại trong `vn.edu.fit.yitzone.<module>.domain`.
2. **Tạo `MongoRepository` tương ứng cho phân hệ đang làm:**
   - Đặt tại package: `vn.edu.fit.yitzone.<module>.repository`
   - Đặt tên theo chuẩn: `<EntityName>Repository extends MongoRepository<EntityName, String>`
   - Chỉ khai báo các method truy vấn (`findBy...`, `existsBy...`, `countBy...`, `@Query`) thực sự cần cho nghiệp vụ của phân hệ đó, bám sát các index đã khai báo trong Entity và [LLD_YITZone.md](./LLD_YITZone.md) (Mục 4).
3. **Kết hợp `MongoTemplate` cho thao tác Atomic / Transaction:**
   - Các thao tác yêu cầu nguyên tử (`findAndModify`, `$inc` có điều kiện, chống race condition) phải dùng `MongoTemplate` thay vì `findById()` rồi `save()` trên `MongoRepository`:
     - Cấp phát `seq` & `prevHash` trên `AUDIT_CHAIN_STATE` (`MAIN_CHAIN`).
     - Trừ tồn kho `STORE_PRODUCTS.variants[].stockQuantity` và tăng `STORE_VOUCHERS.usedCount` có kiểm tra ngưỡng `usageLimit`.
     - Khóa cạnh tranh khi cán bộ bấm **"Tiếp nhận"** trên `QA_CONVERSATIONS` (`assignedBchUserId == null`).
     - Chốt 1 phiếu / 1 cử tri và ghi đồng thời `VOTING_VOTER_LOGS` + `VOTING_BALLOT_OUTBOX` trong cùng MongoDB ACID Transaction (`MongoTransactionManager`).
     - Ghi nhận `EVENT_REGISTRATIONS` theo `maxAttendees` / đôn `Waitlist` (`PROMOTED_HOLD`).
4. **Cập nhật bảng tiến độ bên dưới:** Sau khi tạo xong `Repository` cho entity nào, đánh dấu `[x]` vào cột **Đã tạo**.

---

## 2. Danh sách `MongoRepository` theo từng phân hệ

### 4.1. IAM, Phân quyền & Quyền riêng tư (`iam.repository`, `privacy.repository`)
| Repository | Entity (`Collection`) | Đã tạo | Ghi chú truy vấn chính |
| :--- | :--- | :---: | :--- |
| `UserRepository` | `User` (`USERS`) | `[x]` | Đã có (`findByEmail`, `findByStudentCode`) |
| `OrgUnitRepository` | `OrgUnit` (`ORG_UNITS`) | `[x]` | Đã có |
| `DeviceTokenRepository` | `DeviceToken` (`DEVICE_TOKENS`) | `[x]` | Đã có |
| `FacultyMajorCatalogRepository` | `FacultyMajorCatalog` (`FACULTY_MAJOR_CATALOG`) | `[x]` | Đã có |
| `OfficialDirectoryRosterRepository` | `OfficialDirectoryRoster` (`OFFICIAL_DIRECTORY_ROSTER`) | `[x]` | Đã có |
| `UserAuthIdentityRepository` | `UserAuthIdentity` (`USER_AUTH_IDENTITIES`) | `[x]` | `findByGoogleSub`, `findByEmail`, `findByUserId` |
| `PermissionModuleRepository` | `PermissionModule` (`PERMISSION_MODULES`) | `[x]` | `findByModuleCode`, `findByModuleCodeIn` |
| `RoleRepository` | `Role` (`ROLES`) | `[x]` | `findByCode` |
| `RestructuringBatchRepository` | `RestructuringBatch` (`RESTRUCTURING_BATCHES`) | `[x]` | `findByStatusAndEffectiveAtLessThanEqual` |
| `HrProposalRepository` | `HrProposal` (`HR_PROPOSALS`) | `[x]` | `findByUnitIdAndStatusOrderByCreatedAtDesc` |
| `ConsentRecordRepository` | `ConsentRecord` (`CONSENT_RECORDS`) | `[x]` | `findByUserIdAndConsentTypeAndPolicyVersion` |
| `DataPrivacyRequestRepository` | `DataPrivacyRequest` (`DATA_PRIVACY_REQUESTS`) | `[x]` | `findByUserIdOrderByRequestedAtDesc`, `findByStatus` |

### 4.2. Tổ chức Sự kiện (`event.repository`)
| Repository | Entity (`Collection`) | Đã tạo | Ghi chú truy vấn chính |
| :--- | :--- | :---: | :--- |
| `EventRepository` | `Event` (`EVENTS`) | `[x]` | Đã có |
| `EventRegistrationRepository` | `EventRegistration` (`EVENT_REGISTRATIONS`) | `[ ]` | `findByEventIdAndUserId`, `findByEventIdAndStatusOrderByRegisteredAtAsc`, `findByStatusAndHoldExpiresAtBefore` |
| `NoShowPenaltyRepository` | `NoShowPenalty` (`NO_SHOW_PENALTIES`) | `[ ]` | `findByUserIdAndAcademicYearAndSemester` |

### 4.3. Điểm danh Đa lớp & Quét Mã vạch (`attendance.repository`)
| Repository | Entity (`Collection`) | Đã tạo | Ghi chú truy vấn chính |
| :--- | :--- | :---: | :--- |
| `EventAttendanceRepository` | `EventAttendance` (`EVENT_ATTENDANCES`) | `[x]` | `findByEventIdAndSessionIdAndAttendeeKey`, `findByStudentCodeSnapshotAndSsoLinkStatus`, `findByEventIdAndSessionIdAndCheckinDeviceTokenId` |
| `AttendanceReviewQueueRepository` | `AttendanceReviewQueue` (`ATTENDANCE_REVIEW_QUEUE`) | `[ ]` | `findByAttendanceId`, `findByEventIdAndStatusOrderByReviewDeadlineAtAsc` |
| `OfflineScanBatchRepository` | `OfflineScanBatch` (`OFFLINE_SCAN_BATCHES`) | `[ ]` | `findByBatchId`, `findByEventIdOrderByUploadedAtDesc` |

### 4.4. Lịch sử Tham gia & E-Certificate (`certificate.repository`)
| Repository | Entity (`Collection`) | Đã tạo | Ghi chú truy vấn chính |
| :--- | :--- | :---: | :--- |
| `ParticipationHistoryRepository` | `ParticipationHistory` (`PARTICIPATION_HISTORIES`) | `[ ]` | `findByUserIdAndEventId`, `findByCertificateCode`, `findByUserIdAndAcademicYearAndSemester` |

### 4.5. Bản tin Blog & Truyền thông (`cms.repository`)
| Repository | Entity (`Collection`) | Đã tạo | Ghi chú truy vấn chính |
| :--- | :--- | :---: | :--- |
| `BlogPostRepository` | `BlogPost` (`BLOG_POSTS`) | `[ ]` | `findBySlug`, `findByStatusAndScheduledPublishAtLessThanEqual` |

### 4.6. Minigame & Thi Trắc nghiệm (`minigame.repository`, `exam.repository`)
| Repository | Entity (`Collection`) | Đã tạo | Ghi chú truy vấn chính |
| :--- | :--- | :---: | :--- |
| `QuizRepository` | `Quiz` (`QUIZZES`) | `[ ]` | `findByCreatedBy` |
| `MinigameRoomRepository` | `MinigameRoom` (`MINIGAME_ROOMS`) | `[ ]` | `findByPinCode`, `findByEventId` |
| `EventExamRepository` | `EventExam` (`EVENT_EXAMS`) | `[ ]` | `findByEventId`, `findByStatus` |
| `ExamAttemptRepository` | `ExamAttempt` (`EXAM_ATTEMPTS`) | `[ ]` | `findByExamIdAndUserId`, `findByExamIdOrderByFinalScoreDescTimeSpentSecondsAscViolationCountAsc` |

### 4.7. Xét duyệt Danh hiệu & SV5T (`award.repository`)
| Repository | Entity (`Collection`) | Đã tạo | Ghi chú truy vấn chính |
| :--- | :--- | :---: | :--- |
| `AwardCampaignRepository` | `AwardCampaign` (`AWARD_CAMPAIGNS`) | `[ ]` | `findByAcademicYear`, `findByStatus` |
| `AwardApplicationRepository` | `AwardApplication` (`AWARD_APPLICATIONS`) | `[ ]` | `findByCampaignIdAndUserId`, `findByCampaignIdAndStatus` |
| `Sv5tProgressTrackingRepository` | `Sv5tProgressTracking` (`SV5T_PROGRESS_TRACKING`) | `[ ]` | `findByUserIdAndAcademicYear` |

### 4.8. Online Judge (`oj.repository`)
| Repository | Entity (`Collection`) | Đã tạo | Ghi chú truy vấn chính |
| :--- | :--- | :---: | :--- |
| `OjProblemRepository` | `OjProblem` (`OJ_PROBLEMS`) | `[ ]` | `findByCode`, `findByStatus` |
| `OjContestRepository` | `OjContest` (`OJ_CONTESTS`) | `[ ]` | `findByStatus` |
| `OjSubmissionRepository` | `OjSubmission` (`OJ_SUBMISSIONS`) | `[ ]` | `findByContestIdAndUserIdAndProblemId`, `findByUserIdOrderBySubmittedAtDesc` |

### 4.9. Cửa hàng & Gây quỹ (`store.repository`)
| Repository | Entity (`Collection`) | Đã tạo | Ghi chú truy vấn chính |
| :--- | :--- | :---: | :--- |
| `FundraisingCampaignRepository` | `FundraisingCampaign` (`FUNDRAISING_CAMPAIGNS`) | `[ ]` | `findByStatus` |
| `StoreCategoryRepository` | `StoreCategory` (`STORE_CATEGORIES`) | `[ ]` | `findByCode`, `findByActiveTrue` |
| `StoreProductRepository` | `StoreProduct` (`STORE_PRODUCTS`) | `[ ]` | `findByCategoryIdAndStatus`, `findByCampaignId` |
| `StoreVoucherRepository` | `StoreVoucher` (`STORE_VOUCHERS`) | `[ ]` | `findByVoucherCode` *(cập nhật `usedCount` dùng `MongoTemplate` atomic)* |
| `StoreOrderRepository` | `StoreOrder` (`STORE_ORDERS`) | `[ ]` | `findByOrderCode`, `findByPickupQrToken`, `countByBuyerIdAndStatus`, `findByStatusAndCodDueAtBefore` |
| `PaymentTransactionRepository` | `PaymentTransaction` (`PAYMENT_TRANSACTIONS`) | `[ ]` | `findByBankTransactionId`, `findByOrderId` |
| `CodCashHandoverRepository` | `CodCashHandover` (`COD_CASH_HANDOVERS`) | `[ ]` | `findByHandoverCode`, `findByCollectorUserIdAndStatusOrderByCreatedAtAsc` |
| `OrderSupportRequestRepository` | `OrderSupportRequest` (`ORDER_SUPPORT_REQUESTS`) | `[ ]` | `findByRequestCode`, `findByOrderIdAndStatus` |

### 4.10. Trợ lý Ảo AI `YITBot` (`chatbot.repository`)
| Repository | Entity (`Collection`) | Đã tạo | Ghi chú truy vấn chính |
| :--- | :--- | :---: | :--- |
| `KnowledgeDocumentRepository` | `KnowledgeDocument` (`KNOWLEDGE_DOCUMENTS`) | `[ ]` | `findByStatus`, `findByCategoryAndStatus` |
| `ChatSessionRepository` | `ChatSession` (`CHAT_SESSIONS`) | `[ ]` | `findByUserIdOrderByUpdatedAtDesc` |
| `AiUsageLedgerRepository` | `AiUsageLedger` (`AI_USAGE_LEDGER`) | `[ ]` | `findByMonthKeyAndUserIdOrderByCreatedAtDesc` |

### 4.11. Trực Văn phòng & Kiểm kê `OFIT` (`office.repository`)
| Repository | Entity (`Collection`) | Đã tạo | Ghi chú truy vấn chính |
| :--- | :--- | :---: | :--- |
| `OfficeDutyScheduleRepository` | `OfficeDutySchedule` (`OFFICE_DUTY_SCHEDULES`) | `[ ]` | `findByStatus` |
| `OfficeDutyShiftRepository` | `OfficeDutyShift` (`OFFICE_DUTY_SHIFTS`) | `[x]` | `findByScheduleIdAndShiftDateAndShiftCode`, `findByScheduleIdAndShiftDateBetween` |
| `OfficeAssetRepository` | `OfficeAsset` (`OFFICE_ASSETS`) | `[x]` | `findByAssetCode`, `findByCategory` |
| `OfficeInventoryAuditRepository` | `OfficeInventoryAudit` (`OFFICE_INVENTORY_AUDITS`) | `[ ]` | `findByStatusOrderByAuditedAtDesc` |

### 4.12. Quản lý Văn nghệ `ARTIT` (`arts.repository`)
| Repository | Entity (`Collection`) | Đã tạo | Ghi chú truy vấn chính |
| :--- | :--- | :---: | :--- |
| `PerformanceActRepository` | `PerformanceAct` (`PERFORMANCE_ACTS`) | `[ ]` | `findByEventIdOrderByStageOrderIndexAsc` |

### 4.14. Thông báo & Audit Log (`audit.repository`)
| Repository | Entity (`Collection`) | Đã tạo | Ghi chú truy vấn chính |
| :--- | :--- | :---: | :--- |
| `AuditLogRepository` | `AuditLog` (`AUDIT_LOGS`) | `[x]` | `findBySeq`, `findAllByOrderBySeqDesc` |
| `AuditChainStateRepository` | `AuditChainState` (`AUDIT_CHAIN_STATE`) | `[ ]` | Ưu tiên dùng `MongoTemplate.findAndModify` trên `id = "MAIN_CHAIN"` |
| `NotificationRepository` | `Notification` (`NOTIFICATIONS`) | `[x]` | `findByRecipientUserIdOrderByCreatedAtDesc`, `countByRecipientUserIdAndReadFalse` |

### 4.15. Khảo sát Sinh viên (`survey.repository`)
| Repository | Entity (`Collection`) | Đã tạo | Ghi chú truy vấn chính |
| :--- | :--- | :---: | :--- |
| `SurveyRepository` | `Survey` (`SURVEYS`) | `[ ]` | `findBySurveyTypeAndStatus`, `findByEventId` |
| `SurveyParticipationRepository` | `SurveyParticipation` (`SURVEY_PARTICIPATIONS`) | `[ ]` | `existsBySurveyIdAndUserId` |
| `SurveyResponseRepository` | `SurveyResponse` (`SURVEY_RESPONSES`) | `[ ]` | `findBySurveyId`, `countBySurveyId` |

### 4.16. Hồ sơ Năng lực Số `E-Portfolio` (`portfolio.repository`)
| Repository | Entity (`Collection`) | Đã tạo | Ghi chú truy vấn chính |
| :--- | :--- | :---: | :--- |
| `StudentPortfolioRepository` | `StudentPortfolio` (`STUDENT_PORTFOLIOS`) | `[ ]` | `findByUserId`, `findByStudentCode`, `findByCustomSlug`, `findByVerificationToken` |

### 4.17. Bức tường `Live Q&A` (`liveqa.repository`)
| Repository | Entity (`Collection`) | Đã tạo | Ghi chú truy vấn chính |
| :--- | :--- | :---: | :--- |
| `LiveQaSessionRepository` | `LiveQaSession` (`LIVE_QA_SESSIONS`) | `[ ]` | `findByPinCode`, `findByEventIdAndStatus` |
| `LiveQaQuestionRepository` | `LiveQaQuestion` (`LIVE_QA_QUESTIONS`) | `[ ]` | `findBySessionIdAndStatusOrderByPinnedDescUpvoteCountDesc` |

### 4.18. PWA & Web Push (`pwa.repository`)
| Repository | Entity (`Collection`) | Đã tạo | Ghi chú truy vấn chính |
| :--- | :--- | :---: | :--- |
| `PushSubscriptionRepository` | `PushSubscription` (`PUSH_SUBSCRIPTIONS`) | `[ ]` | `findByUserIdAndActiveTrue`, `findByEndpoint` |

### 4.19. Hộp thư `Q&A Messenger` (`qachat.repository`)
| Repository | Entity (`Collection`) | Đã tạo | Ghi chú truy vấn chính |
| :--- | :--- | :---: | :--- |
| `QaConversationRepository` | `QaConversation` (`QA_CONVERSATIONS`) | `[ ]` | `findByConversationCode`, `findByStudentIdOrderByUpdatedAtDesc`, `findByStatusAndSlaBreachedAtIsNullAndSlaDeadlineAtBefore` |
| `QaMessageRepository` | `QaMessage` (`QA_MESSAGES`) | `[ ]` | `findByConversationIdAndInternalNoteFalseOrderByCreatedAtDesc`, `findByConversationIdOrderByCreatedAtDesc` |

### 4.20. Bình chọn, Biểu quyết & Bầu cử `Live Voting` (`voting.repository`)
| Repository | Entity (`Collection`) | Đã tạo | Ghi chú truy vấn chính |
| :--- | :--- | :---: | :--- |
| `VotingCampaignRepository` | `VotingCampaign` (`VOTING_CAMPAIGNS`) | `[x]` | Đã có |
| `VotingVoterLogRepository` | `VotingVoterLog` (`VOTING_VOTER_LOGS`) | `[ ]` | `existsByCampaignIdAndUserId`, `countByCampaignIdAndVerifiedDeviceTokenId` |
| `VotingBallotOutboxRepository` | `VotingBallotOutbox` (`VOTING_BALLOT_OUTBOX`) | `[ ]` | `findByCampaignId`, `countByCampaignId` |
| `VotingBallotRepository` | `VotingBallot` (`VOTING_BALLOTS`) | `[ ]` | `findByBallotReceiptHash`, `findByCampaignIdAndVoterUserId` |
| `VotingJudgeScoreRepository` | `VotingJudgeScore` (`VOTING_JUDGE_SCORES`) | `[ ]` | `findByCampaignIdAndJudgeUserId`, `findByCampaignId` |
