package vn.edu.fit.yitzone.common.security;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.repository.query.FluentQuery;
import org.springframework.http.MediaType;
import org.springframework.http.converter.ByteArrayHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import vn.edu.fit.yitzone.common.exception.GlobalExceptionHandler;
import vn.edu.fit.yitzone.event.controller.EventController;
import vn.edu.fit.yitzone.event.domain.Event;
import vn.edu.fit.yitzone.event.repository.EventRepository;
import vn.edu.fit.yitzone.event.service.EventService;
import vn.edu.fit.yitzone.iam.service.RbacCacheInvalidationService;
import vn.edu.fit.yitzone.portfolio.controller.PortfolioController;
import vn.edu.fit.yitzone.store.controller.StoreController;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class WebMvcSecurityAndExceptionIntegrationTest {

    private static final String TEST_JWT_SECRET =
            "test-jwt-secret-key-min-64-characters-for-hmac-sha256-verification-2026";
    private static final String TEST_WEBHOOK_SECRET = "test-webhook-hmac-secret";

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private JwtTokenService jwtTokenService;
    private RbacCacheInvalidationService rbacCacheService;
    private JwtAuthenticationFilter jwtAuthenticationFilter;
    private ActiveScopeFilter activeScopeFilter;
    private ScopedPermissionEvaluator permissionEvaluator;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, true);

        jwtTokenService = new JwtTokenService(TEST_JWT_SECRET, 900L);
        rbacCacheService = new RbacCacheInvalidationService(null);
        jwtAuthenticationFilter = new JwtAuthenticationFilter(jwtTokenService, rbacCacheService);
        activeScopeFilter = new ActiveScopeFilter(objectMapper, rbacCacheService);
        permissionEvaluator = new ScopedPermissionEvaluator();

        EventRepository eventRepository = new InMemoryEventRepository();
        EventService eventService = new EventService(eventRepository);

        MappingJackson2HttpMessageConverter jacksonConverter = new MappingJackson2HttpMessageConverter(objectMapper);
        mockMvc = MockMvcBuilders.standaloneSetup(
                        new EventController(eventService),
                        new StoreController(TEST_WEBHOOK_SECRET, null, objectMapper),
                        new PortfolioController()
                )
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new ByteArrayHttpMessageConverter(), jacksonConverter)
                .addFilters(jwtAuthenticationFilter, activeScopeFilter)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        ScopeContextHolder.clear();
    }

    @Test
    @DisplayName("Report #1: ScopedPermissionEvaluator matches domain:action ('event:create') and rejects bare 'create'")
    void shouldAllowCreateEventWithDomainColonActionAuthority() {
        var cadreAuth = new UsernamePasswordAuthenticationToken(
                "cadre-01",
                null,
                List.of(new SimpleGrantedAuthority("event:create"))
        );
        var bareCreateAuth = new UsernamePasswordAuthenticationToken(
                "student-01",
                null,
                List.of(new SimpleGrantedAuthority("create"))
        );

        assertTrue(permissionEvaluator.hasPermission(cadreAuth, "event", "create"));
        assertFalse(permissionEvaluator.hasPermission(bareCreateAuth, "event", "create"));
        assertFalse(permissionEvaluator.hasPermission(cadreAuth, "store", "fulfill"));
    }

    @Test
    @DisplayName("Report #3: Forged X-Active-Scope-Id header not belonging to user's scopes is rejected with 403")
    void shouldRejectUnauthorizedActiveScopeHeader() throws Exception {
        String token = jwtTokenService.generateAccessToken(
                "student-02",
                "sv2@fit.edu.vn",
                1L,
                List.of("event:view"),
                List.of("FACULTY")
        );

        mockMvc.perform(get("/api/v1/events")
                        .header("Authorization", "Bearer " + token)
                        .header("X-Active-Scope-Id", "EMFIT"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("Report #3 & 3.3: Revoked permissionVersion (permVer) invalidates JWT immediately within filter")
    void shouldRejectRevokedPermissionVersionInJwtFilter() throws Exception {
        String token = jwtTokenService.generateAccessToken(
                "cadre-revoked",
                "cadre@fit.edu.vn",
                1L,
                List.of("event:create"),
                List.of("FACULTY", "EMFIT")
        );
        rbacCacheService.invalidateUserPermissions("cadre-revoked", 2L);

        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/v1/iam/me");
        req.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse res = new MockHttpServletResponse();

        jwtAuthenticationFilter.doFilter(req, res, (request, response) -> {});
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertNotNull(req.getAttribute(JwtAuthenticationFilter.JWT_ERROR_ATTRIBUTE));
    }

    @Test
    @DisplayName("Report #8: Missing Idempotency-Key header returns 400 Bad Request instead of 500 Internal Server Error")
    void shouldReturn400WhenMissingRequiredHeader() throws Exception {
        mockMvc.perform(post("/api/v1/store/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "items": [{"sku": "LANYARD-FIT", "qty": 1}],
                                  "deliveryMethod": "BOOTH_PICKUP",
                                  "paymentMethod": "COD"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"));
    }

    @Test
    @DisplayName("Report #8: Unknown JSON field returns 400 Bad Request instead of 500")
    void shouldReturn400OnUnknownJsonProperty() throws Exception {
        mockMvc.perform(post("/api/v1/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Sự kiện test",
                                  "hackedAdminField": true
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"));
    }

    @Test
    @DisplayName("Report #5: Public portfolio verification returns valid=false for unknown token")
    void shouldReturnValidFalseForUnverifiedPortfolioToken() throws Exception {
        mockMvc.perform(get("/api/v1/portfolio/verify/fake-token-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid").value(false));
    }

    static class InMemoryEventRepository implements EventRepository {
        private final Map<String, Event> store = new ConcurrentHashMap<>();

        @Override
        public Page<Event> findByVisibility(Event.EventVisibility visibility, Pageable pageable) {
            return new PageImpl<>(store.values().stream().filter(e -> e.getVisibility() == visibility).toList());
        }

        @Override
        public Page<Event> findVisibleForScope(String organizerUnitId, Pageable pageable) {
            return new PageImpl<>(store.values().stream()
                    .filter(e -> e.getVisibility() == Event.EventVisibility.PUBLIC_FACULTY
                            || organizerUnitId.equals(e.getOrganizerUnitId()))
                    .toList());
        }

        @Override
        public <S extends Event> S save(S entity) {
            if (entity.getId() == null) {
                entity.setId("evt-100");
            }
            if (entity.getVersion() == null) {
                entity.setVersion(1L);
            }
            store.put(entity.getId(), entity);
            return entity;
        }

        @Override
        public Optional<Event> findById(String s) {
            return Optional.ofNullable(store.get(s));
        }

        @Override
        public Page<Event> findAll(Pageable pageable) {
            return new PageImpl<>(List.copyOf(store.values()));
        }

        @Override public <S extends Event> List<S> saveAll(Iterable<S> entities) { return List.of(); }
        @Override public boolean existsById(String s) { return store.containsKey(s); }
        @Override public List<Event> findAll() { return List.copyOf(store.values()); }
        @Override public List<Event> findAllById(Iterable<String> strings) { return List.of(); }
        @Override public long count() { return store.size(); }
        @Override public void deleteById(String s) { store.remove(s); }
        @Override public void delete(Event entity) { store.remove(entity.getId()); }
        @Override public void deleteAllById(Iterable<? extends String> strings) {}
        @Override public void deleteAll(Iterable<? extends Event> entities) {}
        @Override public void deleteAll() { store.clear(); }
        @Override public List<Event> findAll(Sort sort) { return List.copyOf(store.values()); }
        @Override public <S extends Event> S insert(S entity) { return save(entity); }
        @Override public <S extends Event> List<S> insert(Iterable<S> entities) { return List.of(); }
        @Override public <S extends Event> Optional<S> findOne(org.springframework.data.domain.Example<S> example) { return Optional.empty(); }
        @Override public <S extends Event> List<S> findAll(org.springframework.data.domain.Example<S> example) { return List.of(); }
        @Override public <S extends Event> List<S> findAll(org.springframework.data.domain.Example<S> example, Sort sort) { return List.of(); }
        @Override public <S extends Event> Page<S> findAll(org.springframework.data.domain.Example<S> example, Pageable pageable) { return Page.empty(); }
        @Override public <S extends Event> long count(org.springframework.data.domain.Example<S> example) { return 0; }
        @Override public <S extends Event> boolean exists(org.springframework.data.domain.Example<S> example) { return false; }
        @Override public <S extends Event, R> R findBy(org.springframework.data.domain.Example<S> example, Function<FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { return null; }
    }
}