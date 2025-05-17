## [2025-05-16] Decision: Documentation Structure

**Context**:
We needed a consistent way to document architectural decisions and system knowledge that would be easily accessible to both human developers and AI assistants.

**Decision**:
Implement a structured documentation system with:
1. `ARCHITECTURE.md` - High-level system architecture
2. `docs/decisions/` - Architectural Decision Records (ADRs)
   - One file per decision
   - Dated filenames (YYYY-MM-DD-decision-title.md)
   - Standardized format
3. Automated scripts:
   - `new-decision.ps1` - Create new decision files
   - `update-architecture.ps1` - Keep ARCHITECTURE.md in sync
4. `.cascade/instructions.md` - Project-specific instructions for AI assistants

**Status**: Implemented

**Impact**:
- Better knowledge sharing
- Easier onboarding for new team members (human and AI)
- Consistent documentation practices
- Automated updates to keep documentation current

**Example**:
```powershell
# Create a new decision
.\scripts\new-decision.ps1 "Use React Hooks for State Management"

# Update architecture docs
.\scripts\update-architecture.ps1
```

**Related**:
- [LLM Preference Hierarchy](./2025-05-16-llm-preference-hierarchy.md)
