package vn.edu.fit.yitzone.iam.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.iam.domain.OrgUnit;
import vn.edu.fit.yitzone.iam.repository.OrgUnitRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Manages the 1 Faculty -> 4 Committees -> 9 Teams (+ dynamic Clubs/Subgroups) tree (UC-IAM-09).
 */
@Service
public class OrgUnitService {
    private final OrgUnitRepository orgUnitRepository;

    public OrgUnitService(OrgUnitRepository orgUnitRepository) {
        this.orgUnitRepository = orgUnitRepository;
    }

    public List<OrgUnit> listAll() {
        return orgUnitRepository.findAll();
    }

    public OrgUnit createUnit(
            String code,
            String name,
            OrgUnit.UnitType unitType,
            String parentId,
            List<String> defaultDeptModules,
            String termYear
    ) {
        String normalizedCode = code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
        if (normalizedCode.isEmpty() || name == null || name.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Mã đơn vị và Tên đơn vị không được để trống");
        }
        if (orgUnitRepository.findByCode(normalizedCode).isPresent()) {
            throw new BusinessException(ErrorCode.CONFLICT, HttpStatus.CONFLICT,
                    "Mã đơn vị '" + normalizedCode + "' đã tồn tại");
        }

        List<String> ancestors = computeAncestors(parentId);
        OrgUnit unit = new OrgUnit();
        unit.setId(normalizedCode);
        unit.setCode(normalizedCode);
        unit.setName(name.trim());
        unit.setUnitType(unitType == null ? OrgUnit.UnitType.SUBGROUP : unitType);
        unit.setParentId(parentId == null || parentId.isBlank() ? null : parentId.trim());
        unit.setAncestors(ancestors);
        unit.setDefaultDeptModules(defaultDeptModules == null ? List.of() : List.copyOf(defaultDeptModules));
        unit.setTermYear(termYear);
        unit.setActive(true);
        return orgUnitRepository.save(unit);
    }

    public OrgUnit updateUnit(
            String id,
            String name,
            String parentId,
            List<String> defaultDeptModules,
            Boolean active
    ) {
        OrgUnit existing = orgUnitRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy đơn vị tổ chức: " + id));
        if (name != null && !name.isBlank()) {
            existing.setName(name.trim());
        }
        if (parentId != null) {
            String trimmedParent = parentId.trim();
            if (trimmedParent.equals(existing.getId())) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                        "Đơn vị không thể là đơn vị cha của chính nó");
            }
            existing.setParentId(trimmedParent.isEmpty() ? null : trimmedParent);
            existing.setAncestors(computeAncestors(existing.getParentId()));
        }
        if (defaultDeptModules != null) {
            existing.setDefaultDeptModules(List.copyOf(defaultDeptModules));
        }
        if (active != null) {
            existing.setActive(active);
        }
        return orgUnitRepository.save(existing);
    }

    private List<String> computeAncestors(String parentId) {
        if (parentId == null || parentId.isBlank()) {
            return List.of();
        }
        OrgUnit parent = orgUnitRepository.findById(parentId.trim())
                .or(() -> orgUnitRepository.findByCode(parentId.trim()))
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy đơn vị cha: " + parentId));
        List<String> ancestors = new ArrayList<>();
        if (parent.getAncestors() != null) {
            ancestors.addAll(parent.getAncestors());
        }
        ancestors.add(parent.getId());
        return ancestors;
    }
}
